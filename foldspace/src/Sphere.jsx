import React, { useEffect, useRef, forwardRef } from 'react';
import * as THREE from 'three';

const Sphere = forwardRef(
  ({ positions, material, geometry, scale = [1, 1, 1] }, ref) => {
    const meshRef = useRef();

    useEffect(() => {
      const mesh = meshRef.current;
      if (mesh) {
        positions.forEach((position, index) => {
          const matrix = new THREE.Matrix4().compose(
            position instanceof THREE.Vector3
              ? position
              : new THREE.Vector3(...position),
            new THREE.Quaternion(),
            new THREE.Vector3(...scale)
          );
          mesh.setMatrixAt(index, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    }, [positions, scale]);

    return (
      <instancedMesh
        ref={(node) => {
          meshRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        args={[geometry, material, positions.length]}
        frustumCulled={false}
      />
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
