import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PIECE_OFFSET = 1.5; // How far pieces move outward

function BrokenCubePieces({ position, rotation, color, onAnimationEnd }: any) {
  // 8 pieces in a 2x2x2 grid
  const pieces = [];
  const offsets = [-0.5, 0.5];
  const [startTime] = useState(() => Date.now());
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    if (groupRef.current) {
      groupRef.current.children.forEach((piece, idx) => {
        // Animate outward
        const ox = offsets[(idx >> 2) & 1];
        const oy = offsets[(idx >> 1) & 1];
        const oz = offsets[idx & 1];
        // Animate position
        (piece as THREE.Mesh).position.set(
          ox * (1 + elapsed * PIECE_OFFSET),
          oy * (1 + elapsed * PIECE_OFFSET),
          oz * (1 + elapsed * PIECE_OFFSET)
        );
        // Animate rotation
        (piece as THREE.Mesh).rotation.x += 0.02 + 0.01 * idx;
        (piece as THREE.Mesh).rotation.y += 0.02 + 0.01 * idx;
        // Animate fade out
        const mat = (piece as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(1 - elapsed, 0);
        mat.transparent = true;
      });
      // Remove after 1s
      if (elapsed > 1 && onAnimationEnd) onAnimationEnd();
    }
  });

  for (let x of offsets)
    for (let y of offsets)
      for (let z of offsets)
        pieces.push(
          <mesh
            key={`${x}${y}${z}`}
            position={[x, y, z]}
            rotation={rotation}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );

  return (
    <group ref={groupRef} position={position}>
      {pieces}
    </group>
  );
}

export function BreakableCube({ position = [0, 0, 0], color = 'orange' }) {
  const [broken, setBroken] = useState(false);

  return broken ? (
    <BrokenCubePieces
      position={position}
      rotation={[0, 0, 0]}
      color={color}
      onAnimationEnd={() => setBroken(false)}
    />
  ) : (
    <mesh
      position={position}
      castShadow
      receiveShadow
      onPointerOver={() => setBroken(true)}
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
} 