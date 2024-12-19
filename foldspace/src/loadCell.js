import * as THREE from 'three';
import cellCache from './cellCache';

// Add deserialization function
const deserializeVector3Map = (positions) => {
  if (typeof positions !== 'object' || positions === null) {
    return [];
  }

  return Object.values(positions)
    .map((pos) => {
      if (
        pos &&
        typeof pos === 'object' &&
        'x' in pos &&
        'y' in pos &&
        'z' in pos
      ) {
        return new THREE.Vector3(pos.x, pos.y, pos.z);
      }
      console.warn('Invalid position:', pos);
      return null;
    })
    .filter(Boolean);
};

const updatePositions = (setPositions, newPositions) => {
  if (typeof setPositions !== 'function') {
    console.error('setPositions must be a function');
    return;
  }

  // Convert array to map if needed
  const positionsMap = Array.isArray(newPositions)
    ? newPositions.reduce((acc, pos, i) => {
        acc[i] = pos;
        return acc;
      }, {})
    : newPositions;

  setPositions(positionsMap);
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

    const newCellKeys = cellKeysToLoad.filter(
      (cellKey) => !loadedCells.has(cellKey) && !loadingCells.has(cellKey)
    );

    if (newCellKeys.length === 0) {
      resolve([]);
      return;
    }

    setLoadingCells((prev) => {
      const newSet = new Set(prev);
      newCellKeys.forEach((cellKey) => newSet.add(cellKey));
      return newSet;
    });

    const requestId = generateRequestId();
    pendingRequests.set(requestId, { resolve, reject });

    worker.postMessage({
      requestId,
      cellKeysToLoad: newCellKeys,
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
          newPositions = {},
          newRedPositions = {},
          newGreenPositions = {},
          newBluePositions = {},
          newPurplePositions = {},
          newBrownPositions = {},
          newGreenMoonPositions = {},
          newPurpleMoonPositions = {},
          newGasPositions = {},
          newRedMoonPositions = {},
          newGasMoonPositions = {},
          newBrownMoonPositions = {},
          loadDetail,
        } = result;

        // Deserialize the positions
        const deserializedNewPositions = deserializeVector3Map(newPositions);
        const deserializedNewRedPositions =
          deserializeVector3Map(newRedPositions);
        const deserializedNewGreenPositions =
          deserializeVector3Map(newGreenPositions);
        const deserializedNewBluePositions =
          deserializeVector3Map(newBluePositions);
        const deserializedNewPurplePositions =
          deserializeVector3Map(newPurplePositions);
        const deserializedNewBrownPositions =
          deserializeVector3Map(newBrownPositions);
        const deserializedNewGreenMoonPositions = deserializeVector3Map(
          newGreenMoonPositions
        );
        const deserializedNewPurpleMoonPositions = deserializeVector3Map(
          newPurpleMoonPositions
        );
        const deserializedNewGasPositions =
          deserializeVector3Map(newGasPositions);
        const deserializedNewRedMoonPositions =
          deserializeVector3Map(newRedMoonPositions);
        const deserializedNewGasMoonPositions =
          deserializeVector3Map(newGasMoonPositions);
        const deserializedNewBrownMoonPositions = deserializeVector3Map(
          newBrownMoonPositions
        );

        cellCache[cellKey] = deserializedNewPositions;
        updatePositions(setPositions, deserializedNewPositions);

        if (loadDetail) {
          updatePositions(setRedPositions, deserializedNewRedPositions);
          updatePositions(setGreenPositions, deserializedNewGreenPositions);
          updatePositions(setBluePositions, deserializedNewBluePositions);
          updatePositions(setPurplePositions, deserializedNewPurplePositions);
          updatePositions(setBrownPositions, deserializedNewBrownPositions);
          updatePositions(
            setGreenMoonPositions,
            deserializedNewGreenMoonPositions
          );
          updatePositions(
            setPurpleMoonPositions,
            deserializedNewPurpleMoonPositions
          );
          updatePositions(setGasPositions, deserializedNewGasPositions);
          updatePositions(setRedMoonPositions, deserializedNewRedMoonPositions);
          updatePositions(setGasMoonPositions, deserializedNewGasMoonPositions);
          updatePositions(
            setBrownMoonPositions,
            deserializedNewBrownMoonPositions
          );

          const planetNames = {};
          if (typeof newGreenPositions === 'object') {
            Object.values(newGreenPositions).forEach((position) => {
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
