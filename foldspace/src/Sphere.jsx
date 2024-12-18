import React, { useEffect, useRef, forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { Sprite, SpriteMaterial } from 'three';
import { createTextTexture } from './utils/textTexture';

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

    // Convert positions map to array for Three.js
    const positionsArray = useMemo(
      () => Object.values(positions || {}),
      [positions]
    );

    useEffect(() => {
      const mesh = meshRef.current;
      if (!mesh) return;

      const quat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...rotation)
      );
      const scaleVector = new THREE.Vector3(...scale);

      positionsArray.forEach((position, index) => {
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
    }, [positionsArray, scale, rotation]);

    // Rest of sprite handling code remains the same
    useEffect(() => {
      const spriteGroup = spriteGroupRef.current;
      if (!spriteGroup) return;

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
        sprite.scale.set(50, 25, 1);
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
          args={[geometry, material, positionsArray.length]}
          frustumCulled={false}
        />
        <group ref={spriteGroupRef} />
      </>
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
