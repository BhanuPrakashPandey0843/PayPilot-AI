"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Icosahedron, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

interface OrbProps {
  activeIndex: number;
}

/** Distort/speed ramp up slightly per step to hint at growing complexity. */
const DISTORT_BY_STEP = [0.4, 0.55, 0.7];
const SPEED_BY_STEP = [1.1, 1.5, 1.9];

function Orb({ activeIndex }: OrbProps) {
  const meshRef = useRef<Mesh>(null);
  const distortTarget = DISTORT_BY_STEP[activeIndex] ?? DISTORT_BY_STEP[0];
  const speedTarget = SPEED_BY_STEP[activeIndex] ?? SPEED_BY_STEP[0];

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.rotation.y += delta * 0.18;
    mesh.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.15;
    mesh.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.12;

    // Gentle pointer-follow tilt — reacts to cursor, settles back on its own.
    const targetTiltZ = -state.pointer.x * 0.25;
    mesh.rotation.z += (targetTiltZ - mesh.rotation.z) * 0.04;
  });

  return (
    <Icosahedron ref={meshRef} args={[1.3, 4]}>
      <MeshDistortMaterial
        color="#3b82f6"
        roughness={0.15}
        metalness={0.25}
        clearcoat={1}
        clearcoatRoughness={0.1}
        distort={distortTarget}
        speed={speedTarget}
      />
    </Icosahedron>
  );
}

/**
 * The "How we work" 3D centerpiece — a glossy, distorted icosahedron that
 * idles, floats, and gently tilts toward the cursor. Mount is deferred to
 * the client (see HowWeWork.tsx) so there's never a server/client mismatch
 * around the WebGL canvas.
 */
export function HowWeWorkOrb({ activeIndex }: OrbProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 4]} intensity={40} color="#60a5fa" />
      <pointLight position={[-3, -2, -3]} intensity={20} color="#93c5fd" />
      <directionalLight position={[2, 4, 3]} intensity={0.6} />
      <Orb activeIndex={activeIndex} />
    </Canvas>
  );
}
