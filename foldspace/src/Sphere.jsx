// Sphere.jsx
import React, { useEffect, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import { Sprite, SpriteMaterial, TextureLoader } from 'three';
import { createTextTexture } from './utils/textTexture';
import { useStore } from './store'; // Ensure you have access to the store
import { useAuth } from './hooks/useAuth'; // Assuming you have an auth hook
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase'; // Ensure Firebase is properly initialized

const Sphere = forwardRef(
  (
    {
      positions,
      material,
      geometry,
      scale = [1, 1, 1],
      rotation = [0, 0, 0],
      planetNames = {},
      cellKey, // Accept cellKey prop
    },
    ref
  ) => {
    const meshRef = useRef();
    const spriteGroupRef = useRef();
    const { user } = useAuth(); // Get the authenticated user

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

    const handleClick = async (event) => {
      const instanceId = event.instanceId;
      const shipToMove = useStore.getState().shipToMove; // Get the ship to move from the store

      if (!shipToMove) {
        console.warn('No ship selected to move');
        return;
      }

      const destination = {
        x: event.point.x,
        y: event.point.y,
        z: event.point.z,
        instanceId,
        cellKey, // Include cellKey
      };

      try {
        const userId = user.uid;
        const shipRef = doc(db, 'users', userId);
        await updateDoc(shipRef, {
          [`ships.${shipToMove}.destination`]: destination,
        });
        console.log(`Destination for ship ${shipToMove} set to:`, destination);
      } catch (error) {
        console.error('Error updating ship destination:', error);
      }
    };

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
          onClick={handleClick} // Add click handler
        />
        <group ref={spriteGroupRef} />
      </>
    );
  }
);

export const MemoizedSphere = React.memo(Sphere);
