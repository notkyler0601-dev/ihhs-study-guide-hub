// R3FScene React component, mounted via <R3FScene client:only="react" />.
// Declarative 3D scene built on React Three Fiber + drei.
// Supports loading a glTF/GLB model from a URL or rendering a quick demo
// primitive for testing.

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stage, Bounds, useGLTF, Center, Float } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import type * as THREE from 'three';

interface Props {
  /** Optional URL to a glTF/GLB model. If omitted, a primitive demo is shown. */
  gltf?: string;
  /** Demo primitive when no gltf is supplied. */
  demo?: 'cube' | 'sphere' | 'torus' | 'knot';
  /** Background color (hex). Defaults to a subtle gray. */
  background?: string;
  /** Disable auto-rotate on the camera. */
  noAutoRotate?: boolean;
  /** Container height in CSS units. */
  height?: number | string;
}

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function DemoPrimitive({ kind }: { kind: NonNullable<Props['demo']> }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.4;
      ref.current.rotation.y += dt * 0.6;
    }
  });
  const geometry = (() => {
    switch (kind) {
      case 'sphere': return <sphereGeometry args={[1, 64, 64]} />;
      case 'torus': return <torusGeometry args={[1, 0.35, 16, 100]} />;
      case 'knot': return <torusKnotGeometry args={[0.8, 0.3, 200, 32]} />;
      default: return <boxGeometry args={[1.4, 1.4, 1.4]} />;
    }
  })();
  return (
    <mesh ref={ref} castShadow receiveShadow>
      {geometry}
      <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.5} />
    </mesh>
  );
}

export default function R3FScene({
  gltf,
  demo = 'knot',
  background,
  noAutoRotate = false,
  height = 360,
}: Props) {
  return (
    <div
      className="not-prose my-8 surface rounded-2xl overflow-hidden shadow-soft"
      style={{ height: typeof height === 'number' ? `${height}px` : height, background }}
    >
      <Canvas shadows camera={{ position: [3, 2, 4], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={[background ?? '#fafafa']} />
        <Suspense fallback={null}>
          <Stage intensity={0.4} environment="city" adjustCamera={false} shadows="contact">
            <Bounds fit clip observe margin={1.2}>
              <Center>
                {gltf ? (
                  <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
                    <GLTFModel url={gltf} />
                  </Float>
                ) : (
                  <DemoPrimitive kind={demo} />
                )}
              </Center>
            </Bounds>
          </Stage>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls makeDefault enablePan enableZoom autoRotate={!noAutoRotate} autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}

// Cache GLTFs across remounts.
useGLTF.preload = (url: string) => useGLTF(url);
