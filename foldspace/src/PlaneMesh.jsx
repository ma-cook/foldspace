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
      lessDetailedMeshRef,
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
      positions = [],
    },
    ref
  ) => {
    const ringRef = useRef();
    const orbitRingRef = useRef();
    const { raycaster, mouse, camera, gl } = useThree();
    const meshRefs = useRef([]);
    const circleRef = useRef();
    const setTarget = useStore((state) => state.setTarget);
    const setLookAt = useStore((state) => state.setLookAt);
    const colonizeMode = useStore((state) => state.colonizeMode);
    const setColonizeMode = useStore((state) => state.setColonizeMode);
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

    const isDragging = useRef(false);
    const mouseMoved = useRef(false);
    const moveThreshold = 1;

    const calculateCellKey = (x, z) => {
      const cellX = Math.floor(x / GRID_SIZE);
      const cellZ = Math.floor(z / GRID_SIZE);

      if (cellX === 0 && cellZ === 0) {
        return '0,0,true';
      }

      return `${cellX},${cellZ},false`;
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
        if (intersects.length > 0) {
          const { point, object, instanceId } = intersects[0];
          let spherePosition = point;

          if (instanceId !== undefined) {
            const instanceMatrix = new THREE.Matrix4();
            object.getMatrixAt(instanceId, instanceMatrix);
            spherePosition = new THREE.Vector3().setFromMatrixPosition(
              instanceMatrix
            );

            if (
              object !== instancedMeshRef?.current &&
              instancedMeshRef?.current
            ) {
              let closestDistance = 10000;
              let closestPosition = null;

              // Search all yellow sphere instances
              for (let i = 0; i < instancedMeshRef.current.count; i++) {
                const centralMatrix = new THREE.Matrix4();
                instancedMeshRef.current.getMatrixAt(i, centralMatrix);
                const centralPos = new THREE.Vector3().setFromMatrixPosition(
                  centralMatrix
                );

                const distance = spherePosition.distanceTo(centralPos);

                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestPosition = centralPos.clone();
                }
              }

              // Position orbit ring at closest yellow sphere
              if (closestPosition && orbitRingRef.current) {
                const radius = spherePosition.distanceTo(closestPosition);
                orbitRingRef.current.position.copy(closestPosition);
                orbitRingRef.current.scale.setScalar(radius);
                orbitRingRef.current.visible = true;
              }
            }
          }

          if (circleRef.current) {
            circleRef.current.position.copy(intersects[0].point);
            circleRef.current.position.y += 0.01;
            circleRef.current.visible = true;
          }
          if (ringRef.current) {
            ringRef.current.position.copy(spherePosition);
            ringRef.current.rotation.x = Math.PI / 2;
            ringRef.current.visible = true;
          }
          if (orbitRingRef.current && centralRef) {
            const radius = spherePosition.distanceTo(centralSpherePosition);
            orbitRingRef.current.position.copy(centralSpherePosition);
            orbitRingRef.current.scale.setScalar(radius);
            orbitRingRef.current.visible = true;
          }
        } else {
          // Hide all indicators if no intersection
          if (circleRef.current) circleRef.current.visible = false;
          if (ringRef.current) ringRef.current.visible = false;
          if (orbitRingRef.current) orbitRingRef.current.visible = false;
        }
      },
      [
        gl.domElement,
        raycaster,
        mouse,
        camera,
        sphereRefs,
        instancedMeshRef,
        lessDetailedMeshRef,
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
            if (intersects.length > 0) {
              const { point, instanceId } = intersects[0];
              const { x, y, z } = point;

              // Calculate cellId (cellKey)
              const cellId = calculateCellKey(x, z);

              if (cellId) {
                const destination = {
                  x,
                  y,
                  z,
                  cellId,
                  instanceId,
                };
                updateShipDestination(shipToMove, destination);

                // Reset selection modes
                setIsSelectingDestination(false);
                setShipToMove(null);
                if (colonizeMode) {
                  setColonizeMode(false);
                }
              } else {
                console.warn('cellId is undefined');
              }
            } else {
              console.log('no target');
            }
          }

          if (intersects.length > 0 && !isSelectingDestination) {
            const { point, instanceId } = intersects[0];
            const { x, y, z } = point;

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
                greenInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A green sphere was clicked');
              } else if (
                intersects[0].object === blueInstancedMeshRef?.current
              ) {
                blueInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A blue sphere was clicked');
              } else if (
                intersects[0].object === purpleInstancedMeshRef?.current
              ) {
                purpleInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A purple sphere was clicked');
              } else if (
                intersects[0].object === greenMoonInstancedMeshRef?.current
              ) {
                greenMoonInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A green moon sphere was clicked');
              } else if (
                intersects[0].object === purpleMoonInstancedMeshRef?.current
              ) {
                purpleMoonInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A purple moon sphere was clicked');
              } else if (
                intersects[0].object === gasInstancedMeshRef?.current
              ) {
                gasInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A gas sphere was clicked');
              } else if (
                intersects[0].object === brownInstancedMeshRef?.current
              ) {
                brownInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A brown sphere was clicked');
              } else if (
                intersects[0].object === brownRingInstancedMeshRef?.current
              ) {
                brownRingInstancedMeshRef.current.getMatrixAt(
                  instanceId,
                  instanceMatrix
                );
                console.log('A brown ring was clicked');
              } else if (
                intersects[0].object === systemRingInstancedMeshRef?.current
              ) {
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
        lessDetailedMeshRef,
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

          const rotation = useStore.getState().rotation;
          rotation.y -= movementX * 0.002;
          rotation.x -= movementY * 0.002;

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
      sphereRefs,
      gl.domElement,
      onMouseDown,
      onMouseUp,
    ]);

    const vertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 1.0, 0.0)), 2.0);
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0) * intensity;
      }
    `;

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
        <mesh ref={ringRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry attach="geometry" args={[79.5, 80, 64]} />
          <shaderMaterial
            attach="material"
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            side={THREE.DoubleSide}
            transparent={true}
          />
        </mesh>
        <mesh ref={orbitRingRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry attach="geometry" args={[1, 1.01, 64]} />
          <shaderMaterial
            attach="material"
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            side={THREE.DoubleSide}
            transparent={true}
          />
        </mesh>
      </>
    );
  }
);

export default memo(PlaneMesh);
