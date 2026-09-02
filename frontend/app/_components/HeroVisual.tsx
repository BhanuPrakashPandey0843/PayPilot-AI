"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type { Group } from "three";

/**
 * Hero's 3D centerpiece — third attempt. The first version (a glossy
 * MeshDistortMaterial icosahedron) was called out, correctly, as the most
 * reused shape in AI-product marketing: a solid, filled, organically
 * distorted blob. This is deliberately the opposite construction:
 *  - A plain, undistorted wireframe icosahedron (structure, not a blob) —
 *    reads as a network topology rather than a lava-lamp shape.
 *  - drei's Sparkles filling the volume around it — individual glinting
 *    points rather than one continuous surface, standing in for the
 *    individual transactions the agent is watching.
 *  - Two small pulsing nodes on the wireframe's vertices, tying back to
 *    "the agent is watching specific points," not decoration for its own
 *    sake.
 * Rotation is slow and constant; pointer parallax nudges it further,
 * exactly like the tilt language already established elsewhere on the
 * page (HowWeWorkOrb), so the two 3D moments on the site feel related.
 */

function Mesh() {
  const groupRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Constant slow spin plus a gentle idle bob on the x-axis.
    group.rotation.y += delta * 0.12;
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;

    // Pointer parallax: nudge rotation toward the cursor, ease back on
    // release — same "settles on its own" language as HowWeWorkOrb.
    const targetTiltY = state.pointer.x * 0.3;
    const targetTiltX = -state.pointer.y * 0.15;
    group.rotation.y += (targetTiltY - group.rotation.y) * 0.02;
    group.rotation.x += (targetTiltX - group.rotation.x) * 0.02;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.4} />
      </mesh>
      {/* Emerald node — ties to the "AI proposes" status dot in the copy
          beside it, not decoration for its own sake. */}
      <mesh scale={0.04} position={[1.32, 0.5, 0.3]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
      {/* Second node stays cyan, matching the wireframe and the glow ring
          around the canvas so the whole visual reads as one light source. */}
      <mesh scale={0.035} position={[-0.9, -0.7, 0.8]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#67e8f9" />
      </mesh>
      {/* Single gold node — the brief's "gold only for premium highlights,
          very subtle" rule taken literally: one point, not a palette. */}
      <mesh scale={0.03} position={[0.15, 1.25, -0.6]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#e8c88a" />
      </mesh>
      <Sparkles
        count={70}
        scale={3.2}
        size={2.2}
        speed={0.25}
        color="#22d3ee"
        opacity={0.7}
      />
    </group>
  );
}

/**
 * Deferred to client mount, same pattern as HowWeWorkOrb — avoids any
 * server/client mismatch around the WebGL canvas.
 */
export function HeroVisual() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) return null;

  return (
    <div
      data-hero-visual
      className="relative mx-auto h-72 w-72 sm:h-96 sm:w-96 lg:h-[420px] lg:w-[420px]"
    >
      <div
        aria-hidden="true"
        className="glow-blob pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20"
      />
      <Canvas
        camera={{ position: [0, 0, 4.4], fov: 40 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <Mesh />
      </Canvas>
    </div>
  );
}
