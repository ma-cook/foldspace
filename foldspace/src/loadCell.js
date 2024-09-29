import * as THREE from 'three';
import cellCache from './cellCache';
import generateNewPositions from './generateNewPositions';
import saveCellData from './saveCellData';

const createVector3Array = (positions) => {
  if (positions && positions.positions) {
    positions = positions.positions; // Access the nested positions array
  }
  return Array.isArray(positions)
    ? positions.map((pos) => new THREE.Vector3(pos.x, pos.y, pos.z))
    : [];
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

      const newPositions = createVector3Array(savedPositions.positions);

      cellCache[cellKey] = newPositions;
      updatePositions(setPositions, newPositions);

      if (loadDetail) {
        const newRedPositions = createVector3Array(savedPositions.redPositions);
        const newGreenPositions = createVector3Array(
          savedPositions.greenPositions
        );
        const newBluePositions = createVector3Array(
          savedPositions.bluePositions
        );
        const newPurplePositions = createVector3Array(
          savedPositions.purplePositions
        );
        const newGreenMoonPositions = createVector3Array(
          savedPositions.greenMoonPositions
        );
        const newPurpleMoonPositions = createVector3Array(
          savedPositions.purpleMoonPositions
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
      console.log(
        `No data found for cell ${cellKey}, generating new positions.`
      );
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
