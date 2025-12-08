import * as THREE from 'three';

export const createInstancedMesh = (geometry, material, count = 1000) => {
  return new THREE.InstancedMesh(geometry, material, count);
};
