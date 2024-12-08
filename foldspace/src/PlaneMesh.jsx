import React, { useEffect, useRef, memo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from './store';
import { throttle } from 'lodash';
import { useAuth } from './hooks/useAuth';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

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
    const { raycaster, mouse, camera, size, gl } = useThree();
    const meshRefs = useRef([]); // Array of references for each plane mesh
    const circleRef = useRef(); // Reference to the circle mesh
    const setTarget = useStore((state) => state.setTarget);
    const setLookAt = useStore((state) => state.setLookAt);
    const colonizeMode = useStore((state) => state.colonizeMode);
    const setColonizeMode = useStore((state) => state.setColonizeMode); // Add this line
    const isMouseDown = useRef(false);
    const lastMoveTimestamp = useRef(Date.now());
    const GRID_SIZE = 200000;
    const isSelectingDestination = useStore(
      (state) => state.isSelectingDestination
    );
    const shipToMove = useStore((state) => state.shipToMove);
    const setIsSelectingDestination = useStore(
      (state) => state.setIsSelectingDestination
    );
    const setShipToMove = useStore((state) => state.setShipToMove);
    const { user } = useAuth();
    // Function to update the ship's destination in Firestore
    const updateShipDestination = async (shipKey, destination) => {
      try {
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        const userId = user.uid;
        const shipRef = doc(db, 'users', userId);
        await updateDoc(shipRef, {
          [`ships.${shipKey}.destination`]: destination,
        });
        console.log(`Destination for ship ${shipKey} set to:`, destination);
      } catch (error) {
        console.error('Error updating ship destination:', error);
      }
    };

    // Ensure cellKey is defined before calling updateShipDestination
    if (cellKey) {
      const destination = {
        x,
        y,
        z,
        instanceId,
        cellKey,
      };
      updateShipDestination(shipToMove, destination);
    } else {
      console.warn('cellKey is undefined');
    }

    const isDragging = useRef(false);
    const mouseMoved = useRef(false);

    const moveThreshold = 1; // Adjust based on sensitivity to movement

    const calculateCellKey = (x, z) => {
      const cellX = Math.floor(x / GRID_SIZE);
      const cellZ = Math.floor(z / GRID_SIZE);
      return `${cellX},${cellZ}`;
    };

    const onMouseDown = useCallback(
      (event) => {
        if (event.target !== gl.domElement) return;
        isMouseDown.current = true;
        isDragging.current = false;
        mouseMoved.current = false;
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
        gl.domElement,
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
        if (event.target !== gl.domElement) return;
        isMouseDown.current = false;

        if (!mouseMoved.current && !isDragging.current) {
          const mouseDownDuration = Date.now() - lastMoveTimestamp.current;
          const currentTime = Date.now();
          if (currentTime - lastMoveTimestamp.current < 30) {
            return;
          } else if (mouseDownDuration > 100) {
            isMouseDown.current = false;
            return;
          }

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(
            [
              ...meshRefs.current,
              instancedMeshRef?.current,
              lessDetailedMeshRef?.current,
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

          if (isSelectingDestination && shipToMove) {
            if (colonizeMode && intersects.length > 0) {
              const { point, object } = intersects[0];
              const { x, y, z } = point;

              // Calculate cellKey based on clicked sphere's position
              const clickedCellKey = calculateCellKey(x, z);

              if (clickedCellKey) {
                const destination = {
                  x: x + 100,
                  y: y + 280,
                  z: z + 380,
                  cellKey: clickedCellKey,
                };
                updateShipDestination(shipToMove, destination);

                // Reset selection modes
                setIsSelectingDestination(false);
                setShipToMove(null);
                setColonizeMode(false);
              } else {
                console.warn('Clicked cellKey is undefined');
              }
            } else {
              // Handle normal movement mode
              console.log('no target');
            }
          }

          if (intersects.length > 0 && isSelectingDestination === false) {
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
              console.log('no target');
            }
          }
        }
        isDragging.current = false;
        setIsSelectingDestination(false);
      },
      [
        gl.domElement,
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
        colonizeMode,
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
            mouseMoved.current = true;
            isDragging.current = true;
          }

          // Change the rotation based on the mouse movement
          const rotation = useStore.getState().rotation;
          rotation.y -= movementX * 0.002;
          rotation.x -= movementY * 0.002;

          // Store the updated rotation back in the state
          useStore.getState().setRotation(rotation);
        }
      }, 16); // Throttle to 60fps

      const canvas = gl.domElement;

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mousemove', onMouseMove);

      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mousemove', onMouseMove);
        onMouseMove.cancel();
      };
    }, [
      raycaster,
      mouse,
      camera,
      setTarget,
      setLookAt,
      size,
      sphereRefs,
      gl.domElement,
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
