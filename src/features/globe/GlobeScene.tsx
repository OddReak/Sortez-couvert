import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BackSide,
  Color,
  type Group,
  Matrix4,
  type MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  ShaderMaterial,
  Vector3,
} from 'three';

import { getCursorEpoch, subscribeFast } from '@/features/time-ring/cursor';
import { interpolateValue } from '@/shared/lib/interpolate';
import { subsolarPoint } from '@/shared/lib/sun';
import type { TimeStep } from '@/shared/types/domain';

import {
  atmosphereFragmentShader,
  atmosphereVertexShader,
  earthFragmentShader,
  earthVertexShader,
} from './shaders';

const SLERP_PER_SECOND = 2.4; // ~900 ms pour un demi-tour (brief §7.3)

/**
 * Direction monde d'un point (lat, lon) sur une SphereGeometry three.js NON
 * tournée, avec une texture équirectangulaire dont le méridien 0 est au centre.
 * (lon 0 → +X · lon 90° E → −Z · Nord → +Y.)
 */
function textureDirection(latDeg: number, lonDeg: number): Vector3 {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return new Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    -Math.cos(lat) * Math.sin(lon),
  );
}

const WORLD_UP = new Vector3(0, 1, 0);

/**
 * Oriente le globe pour que (lat, lon) fasse face à la caméra (+Z) AVEC le
 * nord vers le haut (pas de roulis, contrairement à `setFromUnitVectors`).
 */
function cityQuaternion(lat: number, lon: number): Quaternion {
  const z = textureDirection(lat, lon).normalize();
  const ref =
    Math.abs(z.dot(WORLD_UP)) > 0.98 ? new Vector3(0, 0, 1) : WORLD_UP;
  const x = new Vector3().crossVectors(ref, z).normalize();
  const y = new Vector3().crossVectors(z, x);
  return new Quaternion()
    .setFromRotationMatrix(new Matrix4().makeBasis(x, y, z))
    .invert();
}

export type GlobeSceneProps = {
  lat: number;
  lon: number;
  /** Pas horaires (−24 h → +72 h) pour interpoler la nébulosité au curseur. */
  hourly: TimeStep[];
  highRes: boolean;
  reducedMotion: boolean;
};

export function GlobeScene({
  lat,
  lon,
  hourly,
  highRes,
  reducedMotion,
}: GlobeSceneProps) {
  const size = highRes ? 4096 : 2048;
  const { dayMap, nightMap, specMap, cloudsMap } = useTexture({
    dayMap: `/textures/earth-day-${String(size)}.webp`,
    nightMap: `/textures/earth-night-${String(size)}.webp`,
    specMap: '/textures/earth-spec-2048.webp',
    cloudsMap: '/textures/earth-clouds-2048.webp',
  });

  const { camera, invalidate } = useThree();
  const groupRef = useRef<Group>(null);
  const cloudsRef = useRef<Group>(null);
  const targetQuat = useMemo(() => cityQuaternion(lat, lon), [lat, lon]);

  const earthUniforms = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      specMap: { value: specMap },
      sunDirection: { value: new Vector3(1, 0, 0) },
      cameraPositionW: { value: new Vector3() },
      nightIntensity: { value: 1.6 },
    }),
    [dayMap, nightMap, specMap],
  );
  const atmosphereUniforms = useMemo(
    () => ({
      glowColor: { value: new Color('#bfdbfe') },
      cameraPositionW: { value: new Vector3() },
      sunDirection: { value: new Vector3(1, 0, 0) },
    }),
    [],
  );

  useEffect(() => {
    dayMap.colorSpace = SRGBColorSpace;
    nightMap.colorSpace = SRGBColorSpace;
    for (const t of [dayMap, nightMap, specMap, cloudsMap]) {
      // Atténue le smear au pôle (singularité UV de la sphère).
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
  }, [dayMap, nightMap, specMap, cloudsMap]);

  const earthMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
        uniforms: earthUniforms,
      }),
    [earthUniforms],
  );

  const atmosphereMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
        uniforms: atmosphereUniforms,
      }),
    [atmosphereUniforms],
  );

  const snappedRef = useRef(false);
  const cloudMatRef = useRef<MeshBasicMaterial>(null);

  useEffect(() => {
    snappedRef.current = false;
    invalidate();
  }, [targetQuat, invalidate]);

  // Le globe suit le curseur temporel (brief §8.4) : lecture directe dans
  // useFrame + invalidate à chaque changement, jamais de state React.
  useEffect(() => subscribeFast(invalidate), [invalidate]);

  useEffect(
    () => () => {
      earthMaterial.dispose();
      atmosphereMaterial.dispose();
    },
    [earthMaterial, atmosphereMaterial],
  );

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (!snappedRef.current) {
      if (reducedMotion) group.quaternion.copy(targetQuat);
      snappedRef.current = true;
    }

    const angle = group.quaternion.angleTo(targetQuat);
    if (angle > 0.002) {
      const step = reducedMotion ? 1 : Math.min(1, SLERP_PER_SECOND * delta);
      group.quaternion.slerp(targetQuat, step);
      invalidate();
    } else {
      group.quaternion.copy(targetQuat);
    }

    const epoch = getCursorEpoch();
    const sub = subsolarPoint(new Date(epoch * 1000));
    const worldSun = textureDirection(sub.lat, sub.lon).applyQuaternion(
      group.quaternion,
    );
    earthUniforms.sunDirection.value.copy(worldSun);
    atmosphereUniforms.sunDirection.value.copy(worldSun);
    earthUniforms.cameraPositionW.value.copy(camera.position);
    atmosphereUniforms.cameraPositionW.value.copy(camera.position);

    // Nébulosité interpolée au curseur (brief §7.1).
    const cloud = interpolateValue(hourly, epoch, (s) => s.cloudiness) ?? 0;
    const targetOpacity = cloud < 20 ? 0 : Math.min(0.55, (cloud / 100) * 0.7);
    if (cloudMatRef.current) {
      cloudMatRef.current.opacity +=
        (targetOpacity - cloudMatRef.current.opacity) * 0.1;
    }

    if (!reducedMotion && cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.006;
      invalidate();
    }
  });

  const cityPos = useMemo(() => textureDirection(lat, lon), [lat, lon]);

  return (
    <>
      <ambientLight intensity={0.05} />
      <group ref={groupRef}>
        <mesh material={earthMaterial}>
          <sphereGeometry args={[1, 96, 96]} />
        </mesh>

        <mesh
          position={[cityPos.x * 1.012, cityPos.y * 1.012, cityPos.z * 1.012]}
        >
          <sphereGeometry args={[0.018, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>

        <group ref={cloudsRef}>
          <mesh>
            <sphereGeometry args={[1.006, 64, 64]} />
            <meshBasicMaterial
              ref={cloudMatRef}
              map={cloudsMap}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </group>

        <mesh material={atmosphereMaterial} scale={1.05}>
          <sphereGeometry args={[1, 64, 64]} />
        </mesh>
      </group>
    </>
  );
}
