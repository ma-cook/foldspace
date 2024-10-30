import * as THREE from 'three';

export const sphereGeometry = new THREE.SphereGeometry(60, 40, 40);
export const lessDetailedSphereGeometry = new THREE.SphereGeometry(60, 10, 10);
export const torusGeometry = new THREE.RingGeometry(70, 50, 40);

// Remove redundant material definitions as you are now using shader materials
