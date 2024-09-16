import React, { useMemo } from 'react';
import * as THREE from 'three';

const Particles = () => {
  const particlesCount = 100;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particlesCount * 300);
    const radius = 100; // Radius of the ring

    for (let i = 0; i < particlesCount; i++) {
      const angle = (i / particlesCount) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const z = 0; // Keep the points in the XY plane

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          itemSize={3}
          array={particlePositions}
        />
      </bufferGeometry>
      <pointsMaterial size={5} color={0xffffff} transparent />
    </points>
  );
};

export default Particles;
