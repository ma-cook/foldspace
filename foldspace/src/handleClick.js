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
  if (intersects.length > 0) {
    console.log('Intersection detected');
  }
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
  console.log('Mouse up event triggered');
  isMouseDown.current = false;

  if (!mouseMoved.current && !isDragging.current) {
    console.log('Mouse did not move and is not dragging');
    const mouseDownDuration = Date.now() - lastMoveTimestamp.current;
    const currentTime = Date.now();
    console.log('Mouse down duration:', mouseDownDuration);
    console.log('Current time:', currentTime);

    if (
      currentTime - lastMoveTimestamp.current < 0 ||
      mouseDownDuration > 200
    ) {
      console.log('Mouse down duration too short or too long');
      isMouseDown.current = false;
      return;
    }

    raycaster.setFromCamera(mouse, camera);
    console.log('Raycaster set from camera:', raycaster.ray);

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

    console.log('Objects to intersect:', objectsToIntersect);

    const intersects = raycaster.intersectObjects(objectsToIntersect);

    console.log('Intersections:', intersects);

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

      console.log('Intersected object:', intersects[0].object);
      console.log('Instance ID:', instanceId);
      console.log('Instanced Mesh Ref:', instancedMeshRef?.current);

      if (instanceId !== undefined) {
        const instanceMatrix = new THREE.Matrix4();

        if (intersects[0].object === instancedMeshRef?.current) {
          instancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('A yellow sphere was clicked');
        } else if (intersects[0].object === lessDetailedMeshRef?.current) {
          lessDetailedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('A less detailed yellow sphere was clicked');
        } else if (intersects[0].object === redInstancedMeshRef?.current) {
          redInstancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('A red sphere was clicked');
        } else if (intersects[0].object === greenInstancedMeshRef?.current) {
          greenInstancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('A green sphere was clicked');
        } else if (intersects[0].object === blueInstancedMeshRef?.current) {
          blueInstancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('A blue sphere was clicked');
        } else if (intersects[0].object === purpleInstancedMeshRef?.current) {
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
        } else if (intersects[0].object === atmosRef?.current) {
          atmosRef.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('An atmos sphere was clicked');
        } else if (intersects[0].object === atmos2Ref?.current) {
          atmos2Ref.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('An atmos2 sphere was clicked');
        } else if (intersects[0].object === atmos3Ref?.current) {
          atmos3Ref.current.getMatrixAt(instanceId, instanceMatrix);
          console.log('An atmos3 sphere was clicked');
        }

        const instancePosition = new THREE.Vector3().setFromMatrixPosition(
          instanceMatrix
        );

        console.log(
          'Setting target and lookAt for instance position:',
          instancePosition
        );
        setTarget({
          x: instancePosition.x + 100,
          y: instancePosition.y + 280,
          z: instancePosition.z + 380,
        });
        setLookAt(instancePosition);
      } else {
        console.log('Setting target and lookAt for intersection point:', {
          x,
          y,
          z,
        });
        setTarget({ x: x + 50, y: y + 120, z: z + 90 });
        setLookAt({ x: x, y: y, z: z });
      }
    } else {
      console.log('No intersections found');
    }
  } else {
    console.log('Mouse moved or is dragging');
  }
  isDragging.current = false;
  mouseMoved.current = false;
};
