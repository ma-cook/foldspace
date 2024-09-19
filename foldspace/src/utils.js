import * as THREE from 'three';

export const createInstancedMesh = (geometry, material, count = 100) => {
  return new THREE.InstancedMesh(geometry, material, count);
};
