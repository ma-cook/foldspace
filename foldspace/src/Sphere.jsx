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

        const quaternion = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(...rotation)
        );

        positions.forEach((position, index) => {
          const matrix = new THREE.Matrix4().compose(
            position instanceof THREE.Vector3
              ? position
              : new THREE.Vector3(...position),
            quaternion,
            new THREE.Vector3(...scale)
          );
          mesh.setMatrixAt(index, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    }, [positions, scale, rotation, material]);

    return (
      <>
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
        {positions.map((position, index) => {
          const planetName = planetNames[index];
          if (planetName) {
            return (
              <Html
                key={index}
                position={
                  position instanceof THREE.Vector3
                    ? [position.x, position.y + 1, position.z]
                    : [position[0], position[1] + 1, position[2]]
                }
                center
              >
                <div className="planet-name">{planetName}</div>
              </Html>
            );
          }
          return null;
        })}
      </>
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
