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
const pendingRequests = new Map();
let requestIdCounter = 0;

const generateRequestId = () => {
  return ++requestIdCounter;
};

worker.onmessage = (event) => {
  const { requestId, results, error } = event.data;
  if (pendingRequests.has(requestId)) {
    const { resolve, reject } = pendingRequests.get(requestId);
    pendingRequests.delete(requestId);

    if (error) {
      console.error('Worker reported error:', error);
      reject(new Error(error));
    } else if (Array.isArray(results)) {
      resolve(results);
    } else {
      console.error('Worker results are invalid:', results);
      reject(new Error('Invalid results from worker'));
    }
  }
};

worker.onerror = (error) => {
  console.error('Worker encountered an error:', error);
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests.clear();
};

const loadCell = (
  cellKeysToLoad,
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
  setGasPositions,
  setRedMoonPositions,
  setGasMoonPositions,
  setBrownMoonPositions,
  setLoadedCells,
  swapBuffers,
  setPlanetNames
) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(cellKeysToLoad)) {
      cellKeysToLoad = cellKeysToLoad !== undefined ? [cellKeysToLoad] : [];
    }

    if (!(loadedCells instanceof Set)) {
      loadedCells = new Set(loadedCells || []);
    }

    const filteredCellKeys = cellKeysToLoad.filter(
      (cellKey) =>
        cellKey !== undefined &&
        !loadedCells.has(cellKey) &&
        !loadingCells.has(cellKey)
    );

    if (filteredCellKeys.length === 0) {
      resolve();
      return;
    }

    setLoadingCells((prev) => {
      const newSet = new Set(prev);
      filteredCellKeys.forEach((cellKey) => newSet.add(cellKey));
      return newSet;
    });

    const requestId = generateRequestId();
    pendingRequests.set(requestId, { resolve, reject });

    worker.postMessage({
      requestId,
      cellKeysToLoad: filteredCellKeys,
      loadDetail,
    });
  })
    .then((results) => {
      if (!Array.isArray(results)) {
        console.error('Worker results should be an array:', results);
        return;
      }
      results.forEach((result) => {
        const {
          cellKey,
          newPositions = [],
          newRedPositions = [],
          newGreenPositions = [],
          newBluePositions = [],
          newPurplePositions = [],
          newBrownPositions = [],
          newGreenMoonPositions = [],
          newPurpleMoonPositions = [],
          newGasPositions = [],
          newRedMoonPositions = [],
          newGasMoonPositions = [],
          newBrownMoonPositions = [],
          loadDetail,
        } = result;

        cellCache[cellKey] = newPositions;
        updatePositions(setPositions, newPositions);

        if (loadDetail) {
          // Update all other positions
          updatePositions(setRedPositions, newRedPositions);
          updatePositions(setGreenPositions, newGreenPositions);
          updatePositions(setBluePositions, newBluePositions);
          updatePositions(setPurplePositions, newPurplePositions);
          updatePositions(setBrownPositions, newBrownPositions);
          updatePositions(setGreenMoonPositions, newGreenMoonPositions);
          updatePositions(setPurpleMoonPositions, newPurpleMoonPositions);
          updatePositions(setGasPositions, newGasPositions);
          updatePositions(setRedMoonPositions, newRedMoonPositions);
          updatePositions(setGasMoonPositions, newGasMoonPositions);
          updatePositions(setBrownMoonPositions, newBrownMoonPositions);

          const planetNames = {};
          if (Array.isArray(newGreenPositions)) {
            newGreenPositions.forEach((position) => {
              if (position.planetName) {
                const key = `${position.x},${position.y},${position.z}`;
                planetNames[key] = position.planetName;
              }
            });
          }

          if (typeof setPlanetNames === 'function') {
            setPlanetNames(planetNames);
          } else {
            console.warn('setPlanetNames is not a function');
          }
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

        if (typeof swapBuffers === 'function') {
          swapBuffers();
        } else {
          console.warn('swapBuffers is not a function');
        }
      });
    })
    .catch((error) => {
      console.error('Worker error:', error);
    });
};

export default loadCell;
