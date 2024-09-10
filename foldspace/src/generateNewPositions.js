import * as THREE from 'three';

const GRID_SIZE = 80000;

const generateNewPositions = (x, z) => {
  const newPositions = [];
  const newRedPositions = [];
  const newGreenPositions = [];
  const newBluePositions = [];
  const newPurplePositions = [];

  const calculateRandomOrbitPosition = (
    centralPosition,
    minRadius,
    maxRadius
  ) => {
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
    const angle = Math.random() * 2 * Math.PI;
    const offsetX = radius * Math.cos(angle);
    const offsetZ = radius * Math.sin(angle);
    return centralPosition.clone().add(new THREE.Vector3(offsetX, 0, offsetZ));
  };

  for (let i = 0; i < 150; i++) {
    const posX = x * GRID_SIZE + Math.random() * GRID_SIZE;
    const posY = Math.floor(Math.random() * 6) * 1000;
    const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
    const position = new THREE.Vector3(posX, posY, posZ);

    newPositions.push(position);

    newRedPositions.push(calculateRandomOrbitPosition(position, 300, 1000));
    newGreenPositions.push(calculateRandomOrbitPosition(position, 300, 1000));
    newBluePositions.push(calculateRandomOrbitPosition(position, 300, 1000));
    newPurplePositions.push(calculateRandomOrbitPosition(position, 300, 1000));
  }

  return {
    newPositions,
    newRedPositions,
    newGreenPositions,
    newBluePositions,
    newPurplePositions,
  };
};

export default generateNewPositions;
