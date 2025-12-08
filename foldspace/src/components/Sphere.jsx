// Sphere.jsx
import React, { useEffect, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { Sprite, SpriteMaterial, TextureLoader } from 'three';
import { createTextTexture } from '../utils/textTexture';

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
    const spriteGroupRef = useRef();

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

    // Create sprites for planet names
    useEffect(() => {
      const spriteGroup = spriteGroupRef.current;
      if (!spriteGroup) return;

      // Clear existing sprites
      while (spriteGroup.children.length) {
        spriteGroup.remove(spriteGroup.children[0]);
      }

      Object.entries(planetNames).forEach(([key, name]) => {
        const [x, y, z] = key.split(',').map(Number);
        const texture = createTextTexture(name);
        const spriteMaterial = new SpriteMaterial({
          map: texture,
          transparent: true,
        });
        const sprite = new Sprite(spriteMaterial);
        sprite.position.set(x, y + 50, z);
        sprite.scale.set(50, 25, 1); // Adjust size as needed
        spriteGroup.add(sprite);
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
          args={[geometry, material, positions.length]}
          frustumCulled={false}
        />
        <group ref={spriteGroupRef} />
      </>
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
