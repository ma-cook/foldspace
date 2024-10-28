import React, { useEffect, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import FakeGlowMaterial from './FakeGlowMaterial'; // Import the FakeGlowMaterial

const Sphere = forwardRef(
  ({ positions, material, geometry, scale = [1, 1, 1] }, ref) => {
    const meshRef = useRef();

    useEffect(() => {
      const mesh = meshRef.current;
      if (mesh) {
        const customInstancePositions = new Float32Array(positions.length * 3);
        positions.forEach((position, index) => {
          customInstancePositions.set(
            position instanceof THREE.Vector3
              ? [position.x, position.y, position.z]
              : [position[0], position[1], position[2]],
            index * 3
          );
        });

        mesh.geometry.setAttribute(
          'customInstancePosition',
          new THREE.InstancedBufferAttribute(customInstancePositions, 3)
        );

        if (material instanceof THREE.ShaderMaterial) {
          material.customInstancePositions = customInstancePositions;
        }

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
    }, [positions, scale, material]);

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
        args={[geometry, null, positions.length]} // Set material to null initially
        frustumCulled={false}
      >
        <primitive attach="material" object={material} />
      </instancedMesh>
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
