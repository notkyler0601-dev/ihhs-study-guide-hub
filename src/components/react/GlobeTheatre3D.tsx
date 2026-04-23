// 3D model of an Elizabethan playhouse, built declaratively with React Three Fiber.
// Geometry uses primitives only (no glTF), so the whole scene streams with the JS bundle.
// Hotspots are clickable spheres with floating labels via drei's <Html>.

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

export interface GlobeHotspot {
  id: string;
  label: string;
  description: string;
  position: [number, number, number];
}

interface Props {
  height?: number;
  hotspots: GlobeHotspot[];
}

// Three named camera positions players can jump between.
const VIEWS = {
  audience: { pos: [0, 1.6, 5.5] as [number, number, number], target: [0, 1.4, -1] as [number, number, number] },
  stage:    { pos: [0, 1.8, -1.4] as [number, number, number], target: [0, 1.4, 4] as [number, number, number] },
  bird:     { pos: [0, 11, 6] as [number, number, number],     target: [0, 0.5, -0.5] as [number, number, number] },
} as const;
type ViewName = keyof typeof VIEWS;

// ----- Building -----------------------------------------------------------

// Cutaway angles: leave the front 90 degrees of the building open so
// the camera (positioned at +Z) has an unobstructed view of the stage.
// Cylinder theta CCW from +X: opening centered on +Z (theta = pi/2).
const WALL_THETA_START = Math.PI * 0.75;   // 135 deg
const WALL_THETA_LENGTH = Math.PI * 1.5;   // 270 deg of wall, 90 deg open
// Ring direction is opposite (after -pi/2 X-rotation), so the start angle flips.
const RING_THETA_START = Math.PI * 1.75;   // 315 deg
const RING_THETA_LENGTH = Math.PI * 1.5;
// Torus arc starts at theta=0 (no offset), and after the same X-rotation
// the front of the world ends up at the unrendered tail of the arc.
const ROOF_ARC = Math.PI * 1.5;

// The outer "wooden O": a cutaway polygonal cylinder. Front is open.
function OuterWall() {
  return (
    <mesh position={[0, 2.5, 0]} receiveShadow>
      <cylinderGeometry args={[6, 6, 5, 24, 1, true, WALL_THETA_START, WALL_THETA_LENGTH]} />
      <meshStandardMaterial color="#a16207" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Three horizontal accents marking the gallery floors. Cut to match the wall.
function GalleryBands() {
  return (
    <>
      {[1.25, 2.5, 3.75].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.4, 6.02, 40, 1, RING_THETA_START, RING_THETA_LENGTH]} />
          <meshStandardMaterial color="#451a03" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

// The yard floor (open-air pit where groundlings stood). Tinted dirt brown.
function Yard() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
      <circleGeometry args={[6, 32]} />
      <meshStandardMaterial color="#92400e" roughness={1} />
    </mesh>
  );
}

// Thatched roof over the galleries. Laid flat (rotated -pi/2 around X)
// and arc-cut so the front matches the open wall.
function ThatchedRoof() {
  return (
    <mesh position={[0, 5.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
      <torusGeometry args={[5.7, 0.45, 10, 36, ROOF_ARC]} />
      <meshStandardMaterial color="#713f12" roughness={1} />
    </mesh>
  );
}

// ----- Stage --------------------------------------------------------------

// Tiring house: tall back wall with two stage doors and an upper acting space.
function TiringHouse() {
  return (
    <group position={[0, 0, -3.2]}>
      {/* Back wall */}
      <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 4.8, 0.3]} />
        <meshStandardMaterial color="#451a03" roughness={0.85} />
      </mesh>
      {/* Decorative columns */}
      {[-2.7, -0.15, 0.15, 2.7].map((x, i) => (
        <mesh key={i} position={[x, 2.4, 0.18]}>
          <boxGeometry args={[0.18, 4.7, 0.08]} />
          <meshStandardMaterial color="#1c1917" />
        </mesh>
      ))}
      {/* Stage doors */}
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 0.95, 0.18]}>
          <boxGeometry args={[0.78, 1.85, 0.04]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      ))}
      {/* Upper acting space (the famous "balcony") */}
      <mesh position={[0, 2.55, 0.18]}>
        <boxGeometry args={[2.6, 1.3, 0.05]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      {/* Balcony rail balusters */}
      {[-1.1, -0.7, -0.3, 0.3, 0.7, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.95, 0.45]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
      ))}
      {/* Lord's room above the upper acting space */}
      <mesh position={[0, 3.6, 0.18]}>
        <boxGeometry args={[3.4, 0.7, 0.05]} />
        <meshStandardMaterial color="#7f1d1d" transparent opacity={0.92} />
      </mesh>
    </group>
  );
}

// Thrust stage projecting from the tiring house into the yard.
function ThrustStage() {
  return (
    <group>
      {/* Stage platform */}
      <mesh position={[0, 0.4, -1.4]} castShadow receiveShadow>
        <boxGeometry args={[5, 0.8, 3.5]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Trap door inset */}
      <mesh position={[0, 0.81, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.95]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      {/* Two oak pillars (Hercules + Atlas) holding up the heavens */}
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 2.2, -0.3]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 4.4, 14]} />
          <meshStandardMaterial color="#451a03" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Heavens canopy with a painted underside (sun on left, moon on right).
function Heavens() {
  return (
    <group position={[0, 4.45, -1]}>
      {/* Roof */}
      <mesh castShadow>
        <boxGeometry args={[5.2, 0.3, 4]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
      {/* Painted underside */}
      <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.1, 3.95]} />
        <meshStandardMaterial color="#0c0a09" />
      </mesh>
      {/* Sun */}
      <mesh position={[-1.1, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4} />
      </mesh>
      {/* Moon */}
      <mesh position={[1.1, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 24]} />
        <meshStandardMaterial color="#e7e5e4" emissive="#a8a29e" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// Flag pole + tragedy flag (black flag flew on tragedy days).
function Flag() {
  const flagRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flagRef.current) {
      // Gentle wave by warping rotation.
      flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.2) * 0.08;
    }
  });
  return (
    <group position={[0, 6.5, -1]}>
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh ref={flagRef} position={[0.45, 0.6, 0]}>
        <boxGeometry args={[0.85, 0.55, 0.02]} />
        <meshStandardMaterial color="#0a0a0a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// A handful of low-poly figures suggesting the standing groundling crowd.
function Groundlings() {
  const positions = useMemo<[number, number, number][]>(
    () => [
      [-1.8, 0, 0.6], [-0.6, 0, 1.2], [0.4, 0, 0.8], [1.6, 0, 0.5],
      [-2.4, 0, 1.6], [-0.2, 0, 2.1], [1.2, 0, 1.7],
      [-1.2, 0, 2.6], [0.8, 0, 2.8], [-0.4, 0, 3.2],
    ],
    []
  );
  return (
    <group>
      {positions.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.18, 0.7, 8]} />
            <meshStandardMaterial color="#3f3f46" />
          </mesh>
          <mesh position={[0, 1.0, 0]} castShadow>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="#92400e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ----- Hotspots -----------------------------------------------------------

interface HotspotPinProps {
  data: GlobeHotspot;
  active: boolean;
  onSelect: (id: string) => void;
}

function HotspotPin({ data, active, onSelect }: HotspotPinProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    if (ref.current) {
      // Pulsing scale on the active or hovered pin.
      const t = clock.getElapsedTime();
      const base = active || hover ? 1.5 : 1;
      ref.current.scale.setScalar(base + Math.sin(t * 3) * 0.08);
    }
  });
  return (
    <group position={data.position}>
      <mesh
        ref={ref}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}
        onClick={(e) => { e.stopPropagation(); onSelect(data.id); }}
      >
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial
          color={active ? '#fef2f2' : '#b91c1c'}
          emissive={active ? '#fca5a5' : '#7f1d1d'}
          emissiveIntensity={active ? 0.8 : 0.4}
        />
      </mesh>
      <Html
        center
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            background: active || hover ? 'rgba(185,28,28,0.95)' : 'rgba(10,10,10,0.85)',
            color: 'white',
            padding: '3px 8px',
            borderRadius: 6,
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            transform: 'translateY(-22px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            transition: 'background 200ms ease',
          }}
        >
          {data.label}
        </div>
      </Html>
    </group>
  );
}

// ----- Camera control -----------------------------------------------------

interface CameraRigProps {
  view: ViewName | null;
  onArrived: () => void;
}

function CameraRig({ view, onArrived }: CameraRigProps) {
  const { camera, controls } = useThree() as any;
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const animating = useRef(false);

  useEffect(() => {
    if (!view) return;
    const v = VIEWS[view];
    targetPos.current.set(...v.pos);
    targetLook.current.set(...v.target);
    animating.current = true;
  }, [view]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(targetPos.current, 0.08);
    if (controls?.target) {
      controls.target.lerp(targetLook.current, 0.08);
      controls.update();
    }
    if (camera.position.distanceTo(targetPos.current) < 0.05) {
      animating.current = false;
      onArrived();
    }
  });

  return null;
}

// ----- Main component -----------------------------------------------------

export default function GlobeTheatre3D({ height = 540, hotspots }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<ViewName | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  const active = hotspots.find((h) => h.id === activeId);

  return (
    <div className="relative" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      <Canvas
        shadows
        camera={{ position: VIEWS.audience.pos, fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#fef3c7']} />
        <fog attach="fog" args={['#fef3c7', 22, 38]} />

        {/* Sun */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[8, 14, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <hemisphereLight args={['#fde68a', '#7c2d12', 0.4]} />

        <Suspense fallback={null}>
          <Yard />
          <OuterWall />
          <GalleryBands />
          <ThatchedRoof />
          <TiringHouse />
          <ThrustStage />
          <Heavens />
          <Flag />
          <Groundlings />

          {hotspots.map((h) => (
            <HotspotPin
              key={h.id}
              data={h}
              active={activeId === h.id}
              onSelect={(id) => { setActiveId(id); setAutoRotate(false); }}
            />
          ))}
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={3}
          maxDistance={18}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.5}
          target={VIEWS.audience.target}
          autoRotate={autoRotate && !view}
          autoRotateSpeed={0.4}
          onStart={() => setAutoRotate(false)}
        />
        <CameraRig view={view} onArrived={() => setView(null)} />
      </Canvas>

      {/* Camera preset toolbar */}
      <div
        className="absolute top-3 left-3 flex flex-wrap gap-1.5 backdrop-blur-md bg-white/70 dark:bg-ink-900/70 rounded-lg p-1 border border-ink-200/60 dark:border-ink-800/60 shadow-soft"
        style={{ pointerEvents: 'auto' }}
      >
        {(['audience', 'stage', 'bird'] as ViewName[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-ink-700 dark:text-ink-200 hover:bg-accent-700 hover:text-white dark:hover:bg-accent-600 transition-colors capitalize"
          >
            {v === 'bird' ? "Bird's eye" : v}
          </button>
        ))}
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-3 left-3 text-[11px] text-ink-700 dark:text-ink-300 backdrop-blur-md bg-white/70 dark:bg-ink-900/70 rounded-md px-2 py-1 border border-ink-200/60 dark:border-ink-800/60 pointer-events-none">
        Drag to rotate, scroll to zoom, click a pin
      </div>

      {/* Active hotspot info panel */}
      {active && (
        <div
          className="absolute top-3 right-3 max-w-xs surface rounded-lg shadow-lift p-4 animate-fade-up"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="font-serif text-base font-semibold text-ink-900 dark:text-ink-50">{active.label}</h4>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setActiveId(null)}
              className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 -mt-0.5 -mr-1"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{active.description}</p>
        </div>
      )}
    </div>
  );
}
