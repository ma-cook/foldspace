import * as THREE from 'three';
import cellCache from './cellCache';
import generateNewPositions from './generateNewPositions';
import saveCellData from './saveCellData';

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

const updatePositions = (setPositions, newPositions) => {
  setPositions((prevPositions) => [...prevPositions, ...newPositions]);
};

const loadCell = async (
  x,
  z,
  loadDetail,
  loadedCells,
  loadingCells,
  setLoadingCells,
  setPositions,
  setRedPositions,
  setGreenPositions,
  setBluePositions,
  setPurplePositions,
  setGreenMoonPositions,
  setPurpleMoonPositions,
  setLoadedCells,
  swapBuffers
) => {
  const cellKey = `${x},${z}`;
  if (loadedCells.has(cellKey) || loadingCells.has(cellKey)) {
    return;
  }

  // Update loadingCells state synchronously
  setLoadingCells((prev) => {
    const newSet = new Set(prev);
    newSet.add(cellKey);
    return newSet;
  });

  try {
    const response = await fetch(
      `http://localhost:5000/get-sphere-data/${cellKey}`
    );

    if (response.ok) {
      const savedPositions = await response.json();

      // Ensure the data structure is valid
      const validPositions = savedPositions.positions || {};
      const newPositions = createVector3Array(validPositions.positions);

      cellCache[cellKey] = newPositions;
      updatePositions(setPositions, newPositions);

      if (loadDetail) {
        const newRedPositions = createVector3Array(validPositions.redPositions);
        const newGreenPositions = createVector3Array(
          validPositions.greenPositions
        );
        const newBluePositions = createVector3Array(
          validPositions.bluePositions
        );
        const newPurplePositions = createVector3Array(
          validPositions.purplePositions
        );
        const newGreenMoonPositions = createVector3Array(
          validPositions.greenMoonPositions
        );
        const newPurpleMoonPositions = createVector3Array(
          validPositions.purpleMoonPositions
        );

        updatePositions(setRedPositions, newRedPositions);
        updatePositions(setGreenPositions, newGreenPositions);
        updatePositions(setBluePositions, newBluePositions);
        updatePositions(setPurplePositions, newPurplePositions);
        updatePositions(setGreenMoonPositions, newGreenMoonPositions);
        updatePositions(setPurpleMoonPositions, newPurpleMoonPositions);
      }

      setLoadedCells((prevLoadedCells) => {
        const updatedLoadedCells = new Set(prevLoadedCells);
        updatedLoadedCells.add(cellKey);
        return updatedLoadedCells;
      });
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

      cellCache[cellKey] = newPositions;
      updatePositions(setPositions, newPositions);

      if (loadDetail) {
        updatePositions(setRedPositions, newRedPositions);
        updatePositions(setGreenPositions, newGreenPositions);
        updatePositions(setBluePositions, newBluePositions);
        updatePositions(setPurplePositions, newPurplePositions);
        updatePositions(setGreenMoonPositions, newGreenMoonPositions);
        updatePositions(setPurpleMoonPositions, newPurpleMoonPositions);
      }

      setLoadedCells((prevLoadedCells) => {
        const updatedLoadedCells = new Set(prevLoadedCells);
        updatedLoadedCells.add(cellKey);
        return updatedLoadedCells;
      });

      await saveCellData(cellKey, {
        positions: newPositions,
        redPositions: newRedPositions,
        greenPositions: newGreenPositions,
        bluePositions: newBluePositions,
        purplePositions: newPurplePositions,
        greenMoonPositions: newGreenMoonPositions,
        purpleMoonPositions: newPurpleMoonPositions,
      });

      // Update the state with the newly generated positions
      updatePositions(setPositions, newPositions);
      if (loadDetail) {
        updatePositions(setRedPositions, newRedPositions);
        updatePositions(setGreenPositions, newGreenPositions);
        updatePositions(setBluePositions, newBluePositions);
        updatePositions(setPurplePositions, newPurplePositions);
        updatePositions(setGreenMoonPositions, newGreenMoonPositions);
        updatePositions(setPurpleMoonPositions, newPurpleMoonPositions);
      }
    } else {
      console.error(
        `Error loading cell data from Firestore for ${cellKey}:`,
        response.statusText
      );
    }
  } catch (error) {
    console.error(
      `Error loading cell data from Firestore for ${cellKey}:`,
      error
    );
  } finally {
    setLoadingCells((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cellKey);
      return newSet;
    });
    swapBuffers();
  }
};

export default loadCell;
