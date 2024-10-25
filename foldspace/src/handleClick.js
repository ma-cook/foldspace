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
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  lastMoveTimestamp.current = Date.now();
  console.log('handleMouseDown');
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

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Adjust raycaster precision
    raycaster.params.Points.threshold = 10; // Adjust this value as needed

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

    console.log('objectsToIntersect:', objectsToIntersect);

    const intersects = raycaster.intersectObjects(objectsToIntersect);

    console.log('handleMouseUp intersects:', intersects);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const instanceId = intersects[0].instanceId;
      const instanceMatrix = new THREE.Matrix4();
      const instancePosition = new THREE.Vector3();

      if (intersectedObject.isInstancedMesh && instanceId !== undefined) {
        intersectedObject.getMatrixAt(instanceId, instanceMatrix);
        instancePosition.setFromMatrixPosition(instanceMatrix);
      } else {
        instancePosition.copy(intersectedObject.position);
      }

      console.log('Moving to position:', instancePosition);

      setTarget({
        x: instancePosition.x + 100,
        y: instancePosition.y + 280,
        z: instancePosition.z + 380,
      });
      setLookAt(instancePosition);
    } else {
      console.log('No intersections found');
    }
  }
  isDragging.current = false;
  mouseMoved.current = false;
};
