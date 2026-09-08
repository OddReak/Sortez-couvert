import { Canvas } from '@react-three/fiber';

import type { TimeStep } from '@/shared/types/domain';

import { GlobeScene } from './GlobeScene';
import { useHighResTextures } from './webglSupport';

export type GlobeCanvasProps = {
  lat: number;
  lon: number;
  hourly: TimeStep[];
  reducedMotion: boolean;
  onContextLost: () => void;
};

/**
 * Le `<Canvas>` R3F isolé dans son propre module : c'est CE fichier qui tire le
 * chunk `three`, chargé en import dynamique après le premier paint (brief §7.4).
 */
export default function GlobeCanvas({
  lat,
  lon,
  hourly,
  reducedMotion,
  onContextLost,
}: GlobeCanvasProps) {
  const highRes = useHighResTextures();

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8.4], fov: 21 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault();
            onContextLost();
          },
          { once: true },
        );
      }}
      style={{ background: 'transparent' }}
    >
      <GlobeScene
        lat={lat}
        lon={lon}
        hourly={hourly}
        highRes={highRes}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
