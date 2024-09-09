import * as THREE from 'three';

const GRID_SIZE = 20000;

export const generateNewPositions = (x, z) => {
  const newPositions = [];
  const newRedPositions = [];
  const newGreenPositions = [];
  const newBluePositions = [];
  const newPurplePositions = [];

  for (let i = 0; i < 50; i++) {
    const posX = x * GRID_SIZE + Math.random() * GRID_SIZE;
    const posY = Math.floor(Math.random() * 6) * 1000;
    const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
    const position = new THREE.Vector3(posX, posY, posZ);

    newPositions.push(position);

    if (i % 4 === 0) newRedPositions.push(position.clone());
    if (i % 4 === 1) newGreenPositions.push(position.clone());
    if (i % 4 === 2) newBluePositions.push(position.clone());
    if (i % 4 === 3) newPurplePositions.push(position.clone());
  }

  return {
    newPositions,
    newRedPositions,
    newGreenPositions,
    newBluePositions,
    newPurplePositions,
  };
};
