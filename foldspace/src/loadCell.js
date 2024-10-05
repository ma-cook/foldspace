import * as THREE from 'three';
import cellCache from './cellCache';
import saveCellData from './saveCellData';

const createVector3Array = (positions) => {
  if (!positions) {
    return [];
  }
  if (!Array.isArray(positions)) {
    return [];
  }
  positions.forEach((pos, index) => {
    if (typeof pos !== 'object' || pos === null) {
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

const worker = new Worker(new URL('./cellWorker.js', import.meta.url));

const loadCell = (
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

  worker.postMessage({
    cellKey,
    cellKeysToLoad: [cellKey],
    loadDetail,
  });

  worker.onmessage = async (event) => {
    const { cellKey, newPositions, loadDetail, savedPositions } = event.data;

    cellCache[cellKey] = newPositions;
    updatePositions(setPositions, newPositions);

    if (loadDetail && savedPositions) {
      const positions = savedPositions.positions || {};
      const newRedPositions = createVector3Array(positions.redPositions);
      const newGreenPositions = createVector3Array(positions.greenPositions);
      const newBluePositions = createVector3Array(positions.bluePositions);
      const newPurplePositions = createVector3Array(positions.purplePositions);
      const newGreenMoonPositions = createVector3Array(
        positions.greenMoonPositions
      );
      const newPurpleMoonPositions = createVector3Array(
        positions.purpleMoonPositions
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

    setLoadingCells((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cellKey);
      return newSet;
    });

    swapBuffers();
  };
};

export default loadCell;
