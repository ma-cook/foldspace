import * as THREE from 'three';

export const sphereGeometry = new THREE.SphereGeometry(60, 40, 40);
export const lessDetailedSphereGeometry = new THREE.SphereGeometry(60, 5, 5);

export const sphereMaterial = new THREE.MeshStandardMaterial({
  color: '#efb843',
});

export const moonMaterial = new THREE.MeshStandardMaterial({
  color: 'grey',
});

export const atmosMaterial = new THREE.MeshStandardMaterial({
  color: '#f2e5c0',
  transparent: true,
  opacity: 0.1,
  depthWrite: false, // Ensure it doesn't affect the depth buffer
});

export const atmosMaterial2 = new THREE.MeshStandardMaterial({
  color: 'white',
  transparent: true,
  opacity: 0.7,
  depthWrite: false, // Ensure it doesn't affect the depth buffer
});

export const redSphereMaterial = new THREE.MeshStandardMaterial({
  color: '#ff4d00',
});

export const greenSphereMaterial = new THREE.MeshStandardMaterial({
  color: 'green',
});

export const blueSphereMaterial = new THREE.MeshStandardMaterial({
  color: 'blue',
});

export const purpleSphereMaterial = new THREE.MeshStandardMaterial({
  color: 'purple',
});

export const brownSphereMaterial = new THREE.MeshStandardMaterial({
  color: '#B99F4A',
});

export const getSpherePositions = (flattenedPositions) => {
  const redSpherePositions = flattenedPositions.map((position) => {
    const offset = 70 + Math.random() * 50; // Random offset between 100 and 150
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  const greenSpherePositions = flattenedPositions.map((position) => {
    const offset = 140 + Math.random() * 50; // Random offset between 200 and 250
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  const blueSpherePositions = flattenedPositions.map((position) => {
    const offset = 210 + Math.random() * 50; // Random offset between 300 and 350
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  const purpleSpherePositions = flattenedPositions.map((position) => {
    const offset = 300 + Math.random() * 50; // Random offset between 300 and 350
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  const brownSpherePositions = flattenedPositions.map((position) => {
    const offset = 400 + Math.random() * 50; // Random offset between 300 and 350
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  return {
    redSpherePositions,
    greenSpherePositions,
    blueSpherePositions,
    purpleSpherePositions,
    brownSpherePositions,
  };
};
