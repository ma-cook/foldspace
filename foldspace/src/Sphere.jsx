// Sphere.jsx
import React, { useMemo, useRef, forwardRef } from 'react';
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

    const customInstancePositions = useMemo(() => {
      const positionsArray = new Float32Array(positions.length * 3);
      positions.forEach((position, index) => {
        positionsArray.set(
          position instanceof THREE.Vector3
            ? [position.x, position.y, position.z]
            : [position[0], position[1], position[2]],
          index * 3
        );
      });
      return positionsArray;
    }, [positions]);

    const instanceMatrices = useMemo(() => {
      const matrices = new Float32Array(positions.length * 16);
      const quaternion = new THREE.Quaternion().setFromEuler(
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
          quaternion,
          scaleVector
        );
        matrix.toArray(matrices, index * 16);
      });
      return matrices;
    }, [positions, scale, rotation]);

    useMemo(() => {
      const mesh = meshRef.current;
      if (mesh) {
        mesh.geometry.setAttribute(
          'customInstancePosition',
          new THREE.InstancedBufferAttribute(customInstancePositions, 3)
        );

        if (material instanceof THREE.ShaderMaterial) {
          material.customInstancePositions = customInstancePositions;
        }

        for (let i = 0; i < positions.length; i++) {
          const matrix = new THREE.Matrix4().fromArray(
            instanceMatrices,
            i * 16
          );
          mesh.setMatrixAt(i, matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    }, [customInstancePositions, instanceMatrices, material, positions.length]);

    // Optimize planet names rendering
    const planetNameElements = useMemo(() => {
      return Object.keys(planetNames).map((key) => {
        const position = key.split(',').map(Number);
        const planetName = planetNames[key];
        return (
          <Html
            key={key}
            position={[position[0], position[1] + 1, position[2]]}
            center
          >
            <div className="planet-name">{planetName}</div>
          </Html>
        );
      });
    }, [planetNames]);

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
          args={[geometry, null, positions.length]}
          frustumCulled={false}
        >
          <primitive attach="material" object={material} />
        </instancedMesh>
        {planetNameElements}
      </>
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
