// handleClick.js
import * as THREE from 'three';

export const handleClick = (
  event,
  camera,
  mouse,
  meshRefs,
  instancedMeshRef,
  redInstancedMeshRef,
  greenInstancedMeshRef,
  blueInstancedMeshRef,
  purpleInstancedMeshRef,
  greenMoonInstancedMeshRef,
  purpleMoonInstancedMeshRef,
  sphereRefs,
  setTarget,
  setLookAt,
  circleRef
) => {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(
    [
      ...meshRefs.current,
      instancedMeshRef?.current,
      redInstancedMeshRef?.current,
      greenInstancedMeshRef?.current,
      blueInstancedMeshRef?.current,
      purpleInstancedMeshRef?.current,
      greenMoonInstancedMeshRef?.current,
      purpleMoonInstancedMeshRef?.current,
      ...Object.values(sphereRefs).map((ref) => ref?.current),
    ].filter(Boolean)
  );

  if (intersects.length > 0) {
    if (circleRef.current) {
      circleRef.current.position.copy(intersects[0].point);
      circleRef.current.position.y += 0.01;
      circleRef.current.visible = true;
    }

    const { x, y, z } = intersects[0].point;
    const instanceId = intersects[0].instanceId;

    if (instanceId !== undefined) {
      const instanceMatrix = new THREE.Matrix4();

      if (intersects[0].object === instancedMeshRef?.current) {
        instancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
        console.log('A yellow sphere was clicked');
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
        purpleInstancedMeshRef.current.getMatrixAt(instanceId, instanceMatrix);
        console.log('A purple sphere was clicked');
      } else if (intersects[0].object === greenMoonInstancedMeshRef?.current) {
        greenMoonInstancedMeshRef.current.getMatrixAt(
          instanceId,
          instanceMatrix
        );
        console.log('A green moon sphere was clicked');
      } else if (intersects[0].object === purpleMoonInstancedMeshRef?.current) {
        purpleMoonInstancedMeshRef.current.getMatrixAt(
          instanceId,
          instanceMatrix
        );
        console.log('A purple moon sphere was clicked');
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
    } else {
      setTarget({ x: x + 50, y: y + 120, z: z + 90 });
      setLookAt({ x: x, y: y, z: z });
    }
  } else {
    if (circleRef.current) {
      circleRef.current.visible = false;
    }
  }
};
