import * as THREE from 'three';

export const sphereGeometry = new THREE.SphereGeometry(30, 20, 40);
export const sphereMaterial = new THREE.MeshPhongMaterial({
  color: 'yellow',
});
export const redSphereMaterial = new THREE.MeshStandardMaterial({
  color: 'red',
});
export const greenSphereMaterial = new THREE.MeshStandardMaterial({
  color: 'green',
});
export const blueSphereMaterial = new THREE.MeshStandardMaterial({
  color: 'blue',
});

export const getSpherePositions = (flattenedPositions) => {
  const redSpherePositions = flattenedPositions.map((position) => {
    const offset = 150 + Math.random() * 50; // Random offset between 100 and 150
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  const greenSpherePositions = flattenedPositions.map((position) => {
    const offset = 200 + Math.random() * 50; // Random offset between 200 and 250
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  const blueSpherePositions = flattenedPositions.map((position) => {
    const offset = 300 + Math.random() * 50; // Random offset between 300 and 350
    const angle = Math.random() * 2 * Math.PI; // Random angle
    return new THREE.Vector3(
      position.x + offset * Math.cos(angle),
      position.y,
      position.z + offset * Math.sin(angle)
    );
  });

  return { redSpherePositions, greenSpherePositions, blueSpherePositions };
};
