import * as THREE from 'three';
import generateNewPositions from './generateNewPositions';

const createVector3Array = (positions) => {
  if (!positions) {
    console.warn('createVector3Array received undefined input');
    return [];
  }
  if (!Array.isArray(positions)) {
    console.warn('createVector3Array received non-array input');
    return [];
  }
  positions.forEach((pos, index) => {
    if (typeof pos !== 'object' || pos === null) {
      console.warn(`Element at index ${index} is not an object:`, pos);
    } else if (!('x' in pos) || !('y' in pos) || !('z' in pos)) {
      console.warn(
        `Element at index ${index} is missing x, y, or z properties:`,
        pos
      );
    }
  });
  const result = positions.map((pos) => new THREE.Vector3(pos.x, pos.y, pos.z));

  return result;
};

self.onmessage = async function (e) {
  const { cellKey, x, z, loadDetail } = e.data;
  console.log(
    `Worker received: cellKey=${cellKey}, x=${x}, z=${z}, loadDetail=${loadDetail}`
  ); // Debugging statement

  try {
    const response = await fetch(
      `http://localhost:5000/get-sphere-data/${cellKey}`
    );

    if (response.ok) {
      const savedPositions = await response.json();

      // Ensure the data structure is valid
      const validPositions = savedPositions.positions || {};
      const newPositions = createVector3Array(validPositions.positions);

      const result = { cellKey, newPositions };

      if (loadDetail) {
        result.newRedPositions = createVector3Array(
          validPositions.redPositions
        );
        result.newGreenPositions = createVector3Array(
          validPositions.greenPositions
        );
        result.newBluePositions = createVector3Array(
          validPositions.bluePositions
        );
        result.newPurplePositions = createVector3Array(
          validPositions.purplePositions
        );
        result.newGreenMoonPositions = createVector3Array(
          validPositions.greenMoonPositions
        );
        result.newPurpleMoonPositions = createVector3Array(
          validPositions.purpleMoonPositions
        );
      }

      self.postMessage(result);
    } else if (response.status === 404) {
      const {
        newPositions,
        newRedPositions,
        newGreenPositions,
        newBluePositions,
        newPurplePositions,
        newGreenMoonPositions,
        newPurpleMoonPositions,
      } = generateNewPositions(x, z);

      const result = { cellKey, newPositions };

      if (loadDetail) {
        result.newRedPositions = newRedPositions;
        result.newGreenPositions = newGreenPositions;
        result.newBluePositions = newBluePositions;
        result.newPurplePositions = newPurplePositions;
        result.newGreenMoonPositions = newGreenMoonPositions;
        result.newPurpleMoonPositions = newPurpleMoonPositions;
      }

      self.postMessage(result);
    } else {
      self.postMessage({
        error: `Error loading cell data: ${response.statusText}`,
      });
    }
  } catch (error) {
    self.postMessage({ error: `Error loading cell data: ${error.message}` });
  }
};
