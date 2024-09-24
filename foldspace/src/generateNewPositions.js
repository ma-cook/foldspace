import * as THREE from 'three';

const GRID_SIZE = 100000;

const generateNewPositions = (x, z) => {
  const newPositions = [];
  const newRedPositions = [];
  const newGreenPositions = [];
  const newBluePositions = [];
  const newPurplePositions = [];
  const newGreenMoonPositions = [];
  const newPurpleMoonPositions = []; // New array for orbit positions around green positions

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

  const positions = generateRandomPositions(225, x, z);

  positions.forEach((position) => {
    newPositions.push(position);
    newRedPositions.push(calculateRandomOrbitPosition(position, 300, 400));
    newGreenPositions.push(calculateRandomOrbitPosition(position, 500, 600));
    newBluePositions.push(calculateRandomOrbitPosition(position, 600, 700));
    newPurplePositions.push(calculateRandomOrbitPosition(position, 800, 1000));
  });

  // Generate new orbit positions around each green position at a distance of 50 units
  newGreenPositions.forEach((greenPosition) => {
    newGreenMoonPositions.push(
      calculateRandomOrbitPosition(greenPosition, 50, 50)
    );
  });

  newPurplePositions.forEach((purplePosition) => {
    newPurpleMoonPositions.push(
      calculateRandomOrbitPosition(purplePosition, 50, 50)
    );
  });

  return {
    newPositions,
    newRedPositions,
    newGreenPositions,
    newBluePositions,
    newPurplePositions,
    newGreenMoonPositions,
    newPurpleMoonPositions, // Include the new array in the return object
  };
};

export default generateNewPositions;
