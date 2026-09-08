import { Canvas } from '@react-three/fiber';

import { GlobeScene } from './GlobeScene';
import { useHighResTextures } from './webglSupport';

export type GlobeCanvasProps = {
  lat: number;
  lon: number;
  atEpoch: number;
  cloudiness: number | null;
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
  atEpoch,
  cloudiness,
  reducedMotion,
  onContextLost,
}: GlobeCanvasProps) {
  const highRes = useHighResTextures();

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 24 }}
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
        atEpoch={atEpoch}
        cloudiness={(cloudiness ?? 0) / 100}
        highRes={highRes}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
