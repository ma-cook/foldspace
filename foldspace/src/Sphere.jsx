import React, { useEffect } from 'react';
import * as THREE from 'three';

const sphereGeometry = new THREE.SphereGeometry(30, 20, 20);

const Sphere = React.forwardRef(
  ({ positions, material, scale = [1, 1, 1] }, ref) => {
    useEffect(() => {
      const mesh = ref.current;
      positions.forEach((position, index) => {
        const matrix = new THREE.Matrix4().compose(
          position, // position
          new THREE.Quaternion(), // orientation
          new THREE.Vector3(...scale) // scale
        );
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.count = positions.length; // Set the count to the total number of instances
    }, [positions, scale]);

    return (
      <instancedMesh
        ref={ref}
        args={[sphereGeometry, material, positions.length]}
      />
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
