import React, { useEffect, useRef, memo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from './store';
import { throttle } from 'lodash';
import { useAuth } from './hooks/useAuth';

const PlaneMesh = React.forwardRef(
  (
    {
      sphereRefs,
      instancedMeshRef,
      lessDetailedMeshRef, // Add lessDetailedMeshRef prop
      redInstancedMeshRef,
      greenInstancedMeshRef,
      blueInstancedMeshRef,
      purpleInstancedMeshRef,
      brownInstancedMeshRef,
      greenMoonInstancedMeshRef,
      purpleMoonInstancedMeshRef,
      gasInstancedMeshRef,
      brownRingInstancedMeshRef,
      systemRingInstancedMeshRef,
      positions = [], // Provide a default value for positions
      cellKey, // Add cellKey prop to identify the cell
    },
    ref
  ) => {
    const { raycaster, mouse, camera, size } = useThree();
    const meshRefs = useRef([]); // Array of references for each plane mesh
    const circleRef = useRef(); // Reference to the circle mesh
    const setTarget = useStore((state) => state.setTarget);
    const setLookAt = useStore((state) => state.setLookAt);

    const isMouseDown = useRef(false);
    const lastMoveTimestamp = useRef(Date.now());
    const isSelectingDestination = useStore(
      (state) => state.isSelectingDestination
    );
    const shipToMove = useStore((state) => state.shipToMove);
    const setIsSelectingDestination = useStore(
      (state) => state.setIsSelectingDestination
    );
    const setShipToMove = useStore((state) => state.setShipToMove);
    const { user } = useAuth();
    const updateShipDestination = async (shipKey, destination) => {
      // Implement the logic to update the ship's destination in your database
      // For example, using Firestore:
      const userId = user.uid;
      const shipRef = doc(db, 'users', userId);
      await updateDoc(shipRef, {
        [`ships.${shipKey}.destination`]: destination,
      });
    };

    let isDragging = false;
    let mouseMoved = false;

    const moveThreshold = 1; // Adjust based on sensitivity to movement

    const onMouseDown = useCallback(
      (event) => {
        isMouseDown.current = true;
        isDragging = false;
        mouseMoved = false;
        raycaster.setFromCamera(mouse, camera);
        lastMoveTimestamp.current = Date.now();
        const intersects = raycaster.intersectObjects(
          [
            ...meshRefs.current,
            instancedMeshRef?.current,
            lessDetailedMeshRef?.current, // Include lessDetailedMeshRef
            redInstancedMeshRef?.current,
            greenInstancedMeshRef?.current,
            blueInstancedMeshRef?.current,
            purpleInstancedMeshRef?.current,
            brownInstancedMeshRef?.current,
            greenMoonInstancedMeshRef?.current,
            purpleMoonInstancedMeshRef?.current,
            gasInstancedMeshRef?.current,
            brownRingInstancedMeshRef?.current,
            systemRingInstancedMeshRef?.current,
            ...Object.values(sphereRefs).map((ref) => ref?.current),
          ].filter(Boolean)
        );
        if (intersects.length > 0) {
          // Set the position of the circleRef to the intersection point
          if (circleRef.current) {
            circleRef.current.position.copy(intersects[0].point);
            // Raise the circle slightly above the plane
            circleRef.current.position.y += 0.01;
            // Make the circle visible
            circleRef.current.visible = true;
          }
        } else {
          // Hide the circle when the mouse is not over the plane
          if (circleRef.current) {
            circleRef.current.visible = false;
          }
        }
      },
      [
        raycaster,
        mouse,
        camera,
        sphereRefs,
        instancedMeshRef,
        lessDetailedMeshRef, // Include lessDetailedMeshRef in dependencies
        redInstancedMeshRef,
        greenInstancedMeshRef,
        blueInstancedMeshRef,
        purpleInstancedMeshRef,
        brownInstancedMeshRef,
        greenMoonInstancedMeshRef,
        purpleMoonInstancedMeshRef,
        gasInstancedMeshRef,
        brownRingInstancedMeshRef,
        systemRingInstancedMeshRef,
      ]
    );

    const onMouseUp = useCallback(
      (event) => {
        isMouseDown.current = false;
        if (!mouseMoved && !isDragging) {
          const mouseDownDuration = Date.now() - lastMoveTimestamp.current; // Calculate how long the mouse was held down
          const currentTime = Date.now();
          if (currentTime - lastMoveTimestamp.current < 30) {
            // Check if the mouse was held down for more than 1 second
            return; // Do not execute the rest of the onMouseUp logic
          } else if (mouseDownDuration > 100) {
            // Check if the mouse was held down for more than 1 second
            isMouseDown.current = false;
            return; // Do not execute the rest of the onMouseUp logic
          }

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(
            [
              ...meshRefs.current,
              instancedMeshRef?.current,
              lessDetailedMeshRef?.current, // Include lessDetailedMeshRef
              redInstancedMeshRef?.current,
              greenInstancedMeshRef?.current, // Include greenInstancedMeshRef
              blueInstancedMeshRef?.current, // Include redInstancedMeshRef
              purpleInstancedMeshRef?.current,
              gasInstancedMeshRef?.current,
              greenMoonInstancedMeshRef?.current,
              purpleMoonInstancedMeshRef?.current,
              brownInstancedMeshRef?.current,
              brownRingInstancedMeshRef?.current,
              systemRingInstancedMeshRef?.current,
              ...Object.values(sphereRefs).map((ref) => ref?.current),
            ].filter(Boolean)
          );

          // Sort the intersects array so that any intersected sphere comes first
          intersects.sort((a, b) => {
            if (a.object === instancedMeshRef?.current) {
              return -1;
            } else if (b.object === instancedMeshRef?.current) {
              return 1;
            } else {
              return 0;
            }
          });

          if (intersects.length > 0) {
            const { point } = intersects[0];
            const { x, y, z } = point;

            if (isSelectingDestination && shipToMove) {
              // User is selecting a destination for a ship
              // Update the ship's destination in the database
              updateShipDestination(shipToMove, { x, y, z });

              // Reset the selection mode
              setIsSelectingDestination(false);
              setShipToMove(null);

              console.log(
                `Ship ${shipToMove} destination set to (${x}, ${y}, ${z})`
              );
            } else {
              // Existing logic to move the camera (only if not in selection mode)
              setTarget({ x: x + 50, y: y + 120, z: z + 90 });
              setLookAt({ x, y, z });
            }
          }

          if (intersects.length > 0) {
            const { x, y, z } = intersects[0].point;
            const instanceId = intersects[0].instanceId;

            if (instanceId !== undefined) {
              const instanceMatrix = new THREE.Matrix4();

              if (intersects[0].object === instancedMeshRef?.current) {
                instancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A yellow sphere was clicked');
              } else if (
                intersects[0].object === lessDetailedMeshRef?.current
              ) {
                lessDetailedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A less detailed yellow sphere was clicked');
              } else if (
                intersects[0].object === redInstancedMeshRef?.current
              ) {
                redInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A red sphere was clicked');
              } else if (
                intersects[0].object === greenInstancedMeshRef?.current
              ) {
                // Check if the green sphere was clicked
                greenInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A green sphere was clicked');
              } else if (
                intersects[0].object === blueInstancedMeshRef?.current
              ) {
                // Check if the blue sphere was clicked
                blueInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A blue sphere was clicked');
              } else if (
                intersects[0].object === purpleInstancedMeshRef?.current
              ) {
                // Check if the purple sphere was clicked
                purpleInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A purple sphere was clicked');
              } else if (
                intersects[0].object === greenMoonInstancedMeshRef?.current
              ) {
                // Check if the green moon sphere was clicked
                greenMoonInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A green moon sphere was clicked');
              } else if (
                intersects[0].object === purpleMoonInstancedMeshRef?.current
              ) {
                // Check if the purple moon sphere was clicked
                purpleMoonInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A purple moon sphere was clicked');
              } else if (
                intersects[0].object === gasInstancedMeshRef?.current
              ) {
                // Check if the gas sphere was clicked
                gasInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A gas sphere was clicked');
              } else if (
                intersects[0].object === brownInstancedMeshRef?.current
              ) {
                // Check if the brown sphere was clicked
                brownInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A brown sphere was clicked');
              } else if (
                intersects[0].object === brownRingInstancedMeshRef?.current
              ) {
                // Check if the brown ring was clicked
                brownRingInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A brown ring was clicked');
              } else if (
                intersects[0].object === systemRingInstancedMeshRef?.current
              ) {
                // Check if the system ring was clicked
                systemRingInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A system ring was clicked');
              }

              const instancePosition =
                new THREE.Vector3().setFromMatrixPosition(instanceMatrix);

              setTarget({
                x: instancePosition.x + 100,
                y: instancePosition.y + 280,
                z: instancePosition.z + 380,
              });
              setLookAt(instancePosition);
            } else {
              setTarget({ x: x + 50, y: y + 120, z: z + 90 });
              setLookAt({ x: x, y: y, z: z });
            }
          }
        }
        isDragging = false;
      },
      [
        raycaster,
        mouse,
        camera,
        setTarget,
        setLookAt,
        sphereRefs,
        instancedMeshRef,
        lessDetailedMeshRef, // Include lessDetailedMeshRef in dependencies
        redInstancedMeshRef,
        greenInstancedMeshRef,
        blueInstancedMeshRef,
        purpleInstancedMeshRef,
        brownInstancedMeshRef,
        greenMoonInstancedMeshRef,
        purpleMoonInstancedMeshRef,
        gasInstancedMeshRef,
        brownRingInstancedMeshRef,
        systemRingInstancedMeshRef,
        isSelectingDestination,
        shipToMove,
        setIsSelectingDestination,
        setShipToMove,
      ]
    );

    useEffect(() => {
      const onMouseMove = throttle((event) => {
        // The following code will only execute when the mouse button is down
        if (isMouseDown.current) {
          const currentTime = Date.now();
          lastMoveTimestamp.current = currentTime;
          const movementX =
            event.movementX || event.mozMovementX || event.webkitMovementX || 0;
          const movementY =
            event.movementY || event.mozMovementY || event.webkitMovementY || 0;
          if (
            Math.abs(movementX) > moveThreshold ||
            Math.abs(movementY) > moveThreshold
          ) {
            mouseMoved = true;
            isDragging = true;
          }

          // Change the rotation based on the mouse movement
          const rotation = useStore.getState().rotation;
          rotation.y -= movementX * 0.002;
          rotation.x -= movementY * 0.002;

          // Store the updated rotation back in the state
          useStore.getState().setRotation(rotation);
        }
      }, 16); // Throttle to 60fps

      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('mousemove', onMouseMove);

      return () => {
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousemove', onMouseMove);
        onMouseMove.cancel(); // Cancel the throttled function
      };
    }, [
      raycaster,
      mouse,
      camera,
      setTarget,
      setLookAt,
      size,
      sphereRefs,
      onMouseDown,
      onMouseUp,
    ]);

    return (
      <>
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
);

export default memo(PlaneMesh);
