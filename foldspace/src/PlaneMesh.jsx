import React, { useEffect, useRef, memo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from './store';

function PlaneMesh({
  sphereRefs,
  positionY,
  instancedMeshRef,
  redInstancedMeshRef,
  greenInstancedMeshRef,
  blueInstancedMeshRef,
  purpleInstancedMeshRef,
}) {
  const { raycaster, mouse, camera, size } = useThree();
  const meshRef = useRef();
  const circleRef = useRef(); // Reference to the circle mesh
  const setTarget = useStore((state) => state.setTarget);
  const setLookAt = useStore((state) => state.setLookAt);
  let isMouseDown = false;

  let isDragging = false;
  let mouseMoved = false;

  const onMouseDown = useCallback(
    (event) => {
      isMouseDown = true;
      isDragging = false;
      mouseMoved = false;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        [
          meshRef.current,
          instancedMeshRef.current,
          redInstancedMeshRef.current,
          greenInstancedMeshRef.current, // Include greenInstancedMeshRef
          blueInstancedMeshRef.current, // Include redInstancedMeshRef
          purpleInstancedMeshRef.current,
          ...sphereRefs.current,
        ].filter(Boolean)
      );
      if (intersects.length > 0) {
        // Set the position of the circleRef to the intersection point
        circleRef.current.position.copy(intersects[0].point);
        // Raise the circle slightly above the plane
        circleRef.current.position.y += 0.01;
        // Make the circle visible
        circleRef.current.visible = true;
      } else {
        // Hide the circle when the mouse is not over the plane
        circleRef.current.visible = false;
      }
    },
    [raycaster, mouse, camera]
  );

  const onMouseUp = useCallback(
    (event) => {
      isMouseDown = false;
      if (!mouseMoved) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(
          [
            meshRef.current,
            instancedMeshRef.current,
            redInstancedMeshRef.current,
            greenInstancedMeshRef.current, // Include greenInstancedMeshRef
            blueInstancedMeshRef.current, // Include redInstancedMeshRef
            purpleInstancedMeshRef.current,
            ...sphereRefs.current,
          ].filter(Boolean)
        );

        // Sort the intersects array so that any intersected sphere comes first
        intersects.sort((a, b) => {
          if (a.object === instancedMeshRef.current) {
            return -1;
          } else if (b.object === instancedMeshRef.current) {
            return 1;
          } else {
            return 0;
          }
        });

        if (intersects.length > 0) {
          const { x, y, z } = intersects[0].point;
          const instanceId = intersects[0].instanceId;

          if (instanceId !== undefined) {
            const instanceMatrix = new THREE.Matrix4();

            if (intersects[0].object === instancedMeshRef.current) {
              instancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
              console.log('A yellow sphere was clicked');
            } else if (intersects[0].object === redInstancedMeshRef.current) {
              redInstancedMeshRef.current.getMatrixAt(
                instanceId,
                instanceMatrix
              );
              console.log('A red sphere was clicked');
            } else if (intersects[0].object === greenInstancedMeshRef.current) {
              // Check if the green sphere was clicked
              greenInstancedMeshRef.current.getMatrixAt(
                instanceId,
                instanceMatrix
              );
              console.log('A green sphere was clicked');
            } else if (intersects[0].object === blueInstancedMeshRef.current) {
              // Check if the blue sphere was clicked
              blueInstancedMeshRef.current.getMatrixAt(
                instanceId,
                instanceMatrix
              );
              console.log('A blue sphere was clicked');
            }

            const instancePosition = new THREE.Vector3().setFromMatrixPosition(
              instanceMatrix
            );

            setTarget({
              x: instancePosition.x + 50,
              y: instancePosition.y + 150,
              z: instancePosition.z + 50,
            });
            setLookAt(instancePosition);
          } else {
            setTarget({ x: x + 50, y: y + 100, z: z + 50 });
            setLookAt({ x: x, y: y, z: z });
          }
        }
      }
      isDragging = false;
    },
    [raycaster, mouse, camera, setTarget, setLookAt]
  );

  useEffect(() => {
    const onMouseMove = (event) => {
      // The following code will only execute when the mouse button is down
      if (isMouseDown) {
        mouseMoved = true;
        isDragging = true;
        const movementX =
          event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY =
          event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // Change the rotation based on the mouse movement
        const rotation = useStore.getState().rotation;
        rotation.y -= movementX * 0.002;
        rotation.x -= movementY * 0.002;

        // Store the updated rotation back in the state
        useStore.getState().setRotation(rotation);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [raycaster, mouse, camera, setTarget, setLookAt, size, sphereRefs]);

  const meshes = Array(5)
    .fill()
    .map((_, i) => (
      <mesh
        key={i}
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, positionY, 0]}
      >
        <planeGeometry attach="geometry" args={[10000, 10000]} />
        <meshStandardMaterial
          attach="material"
          color="red"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    ));

  return (
    <>
      {meshes}
      {/* Add a new mesh for the circle */}
      <mesh ref={circleRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry attach="geometry" args={[2, 64]} />
        <meshBasicMaterial
          attach="material"
          color="red"
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

export default memo(PlaneMesh);
