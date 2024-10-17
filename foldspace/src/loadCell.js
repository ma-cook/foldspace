import * as THREE from 'three';
import cellCache from './cellCache';

const createVector3Array = (positions) => {
  if (!Array.isArray(positions)) {
    return [];
  }

  return positions.reduce((acc, pos, index) => {
    if (
      pos &&
      typeof pos === 'object' &&
      'x' in pos &&
      'y' in pos &&
      'z' in pos
    ) {
      acc.push(new THREE.Vector3(pos.x, pos.y, pos.z));
    } else {
      console.warn(`Element at index ${index} is invalid:`, pos);
    }
    return acc;
  }, []);
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
  setBrownPositions,
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
      const newBrownPositions = createVector3Array(positions.brownPositions);
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
      updatePositions(setBrownPositions, newBrownPositions);
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
