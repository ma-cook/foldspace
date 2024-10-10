import * as THREE from 'three';
import { useStore } from './store';

export const handleMouseDown = (
  event,
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
  greenMoonInstancedMeshRef,
  purpleMoonInstancedMeshRef,
  atmosRef,
  atmos2Ref,
  atmos3Ref,
  isMouseDown,
  lastMoveTimestamp
) => {
  isMouseDown.current = true;
  raycaster.setFromCamera(mouse, camera);
  lastMoveTimestamp.current = Date.now();
  const intersects = raycaster.intersectObjects(
    [
      instancedMeshRef?.current,
      lessDetailedMeshRef?.current,
      redInstancedMeshRef?.current,
      greenInstancedMeshRef?.current,
      blueInstancedMeshRef?.current,
      purpleInstancedMeshRef?.current,
      greenMoonInstancedMeshRef?.current,
      purpleMoonInstancedMeshRef?.current,
      atmosRef?.current,
      atmos2Ref?.current,
      atmos3Ref?.current,
      ...Object.values(sphereRefs).map((ref) => ref?.current),
    ].filter(Boolean)
  );
};

export const handleMouseUp = (
  event,
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
  greenMoonInstancedMeshRef,
  purpleMoonInstancedMeshRef,
  atmosRef,
  atmos2Ref,
  atmos3Ref,
  isMouseDown,
  lastMoveTimestamp,
  isDragging,
  mouseMoved
) => {
  isMouseDown.current = false;

  if (!mouseMoved.current && !isDragging.current) {
    const mouseDownDuration = Date.now() - lastMoveTimestamp.current;
    const currentTime = Date.now();

    if (
      currentTime - lastMoveTimestamp.current < 0 ||
      mouseDownDuration > 200
    ) {
      isMouseDown.current = false;
      return;
    }

    raycaster.setFromCamera(mouse, camera);

    const objectsToIntersect = [
      instancedMeshRef?.current,
      lessDetailedMeshRef?.current,
      redInstancedMeshRef?.current,
      greenInstancedMeshRef?.current,
      blueInstancedMeshRef?.current,
      purpleInstancedMeshRef?.current,
      greenMoonInstancedMeshRef?.current,
      purpleMoonInstancedMeshRef?.current,
      atmosRef?.current,
      atmos2Ref?.current,
      atmos3Ref?.current,
      ...Object.values(sphereRefs).map((ref) => ref?.current),
    ].filter(Boolean);

    const intersects = raycaster.intersectObjects(objectsToIntersect);

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
      const { x, y, z } = intersects[0].point;
      const instanceId = intersects[0].instanceId;

      if (instanceId !== undefined) {
        const instanceMatrix = new THREE.Matrix4();

        if (intersects[0].object === instancedMeshRef?.current) {
          instancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
        } else if (intersects[0].object === lessDetailedMeshRef?.current) {
          lessDetailedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
        } else if (intersects[0].object === redInstancedMeshRef?.current) {
          redInstancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
        } else if (intersects[0].object === greenInstancedMeshRef?.current) {
          greenInstancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
        } else if (intersects[0].object === blueInstancedMeshRef?.current) {
          blueInstancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
        } else if (intersects[0].object === purpleInstancedMeshRef?.current) {
          purpleInstancedMeshRef.current.getMatrixAt(
            instanceId,
            instanceMatrix
          );
        } else if (
          intersects[0].object === greenMoonInstancedMeshRef?.current
        ) {
          greenMoonInstancedMeshRef.current.getMatrixAt(
            instanceId,
            instanceMatrix
          );
        } else if (
          intersects[0].object === purpleMoonInstancedMeshRef?.current
        ) {
          purpleMoonInstancedMeshRef.current.getMatrixAt(
            instanceId,
            instanceMatrix
          );
        } else if (intersects[0].object === atmosRef?.current) {
          atmosRef.current.getMatrixAt(instanceId, instanceMatrix);
        } else if (intersects[0].object === atmos2Ref?.current) {
          atmos2Ref.current.getMatrixAt(instanceId, instanceMatrix);
        } else if (intersects[0].object === atmos3Ref?.current) {
          atmos3Ref.current.getMatrixAt(instanceId, instanceMatrix);
        }

        const instancePosition = new THREE.Vector3().setFromMatrixPosition(
          instanceMatrix
        );

        setTarget({
          x: instancePosition.x + 100,
          y: instancePosition.y + 280,
          z: instancePosition.z + 380,
        });
        setLookAt(instancePosition);
      }
    }
  }
  isDragging.current = false;
  mouseMoved.current = false;
};
