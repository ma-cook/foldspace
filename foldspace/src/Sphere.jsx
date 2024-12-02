// Sphere.jsx
import React, { useEffect, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

const Sphere = forwardRef(
  (
    {
      positions,
      material,
      geometry,
      scale = [1, 1, 1],
      rotation = [0, 0, 0],
      planetNames = {},
    },
    ref
  ) => {
    const meshRef = useRef();

    // Update instance matrices whenever positions, scale, or rotation change
    useEffect(() => {
      const mesh = meshRef.current;
      if (!mesh) return;

      const quat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...rotation)
      );
      const scaleVector = new THREE.Vector3(...scale);

      positions.forEach((position, index) => {
        const posVector =
          position instanceof THREE.Vector3
            ? position
            : new THREE.Vector3(...position);
        const matrix = new THREE.Matrix4().compose(
          posVector,
          quat,
          scaleVector
        );
        mesh.setMatrixAt(index, matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    }, [positions, scale, rotation]);

    // Render planet names using Html
    const planetNameElements = React.useMemo(() => {
      return Object.entries(planetNames).map(([key, name]) => {
        const [x, y, z] = key.split(',').map(Number);
        return (
          <Html
            key={key}
            position={[x, y + 1, z]} // Slightly offset to prevent z-fighting
            center
          >
            <div className="planet-name">{name}</div>
          </Html>
        );
      });
    }, [planetNames]);

    return (
      <>
        <instancedMesh
          ref={(node) => {
            meshRef.current = node;
            // Forward ref if provided
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          args={[geometry, material, positions.length]}
          frustumCulled={false}
        />
        {planetNameElements}
      </>
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
