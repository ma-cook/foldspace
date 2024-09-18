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

  const generateRandomPositions = (count, x, z) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const posX = x * GRID_SIZE + Math.random() * GRID_SIZE;
      const posY = Math.floor(Math.random() * 10) * 5000;
      const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
      positions.push(new THREE.Vector3(posX, posY, posZ));
    }
    return positions;
  };

  const positions = generateRandomPositions(200, x, z);

  positions.forEach((position) => {
    newPositions.push(position);
    newRedPositions.push(calculateRandomOrbitPosition(position, 300, 400));
    newGreenPositions.push(calculateRandomOrbitPosition(position, 500, 600));
    newBluePositions.push(calculateRandomOrbitPosition(position, 600, 700));
    newPurplePositions.push(calculateRandomOrbitPosition(position, 800, 1000));
  });

  return {
    newPositions,
    newRedPositions,
    newGreenPositions,
    newBluePositions,
    newPurplePositions,
  };
};

export default generateNewPositions;
