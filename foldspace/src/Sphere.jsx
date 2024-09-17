import React, { useEffect } from 'react';
import * as THREE from 'three';

const Sphere = React.forwardRef(
  ({ positions, material, geometry, scale = [1, 1, 1] }, ref) => {
    useEffect(() => {
      const mesh = ref.current;
      if (mesh) {
        positions.forEach((position, index) => {
          const matrix = new THREE.Matrix4().compose(
            position,
            new THREE.Quaternion(),
            new THREE.Vector3(...scale)
          );
          mesh.setMatrixAt(index, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.count = positions.length;
      }
    }, [positions, scale]);

    return (
      <instancedMesh
        ref={ref}
        args={[geometry, material, positions.length]}
        frustumCulled={false}
      />
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
