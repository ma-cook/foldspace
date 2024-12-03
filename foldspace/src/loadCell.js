import * as THREE from 'three';
import cellCache from './cellCache';

// Add deserialization function
const deserializeVector3Array = (positions) => {
  if (!Array.isArray(positions)) {
    return [];
  }

  return positions
    .map((pos) => {
      if (
        pos &&
        typeof pos === 'object' &&
        'x' in pos &&
        'y' in pos &&
        'z' in pos
      ) {
        return new THREE.Vector3(pos.x, pos.y, pos.z);
      } else {
        console.warn('Invalid position:', pos);
        return null;
      }
    })
    .filter(Boolean);
};

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
  console.log('Received message from worker:', event.data); // Added log

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

        // Deserialize the positions
        const deserializedNewPositions = deserializeVector3Array(newPositions);
        const deserializedNewRedPositions =
          deserializeVector3Array(newRedPositions);
        const deserializedNewGreenPositions =
          deserializeVector3Array(newGreenPositions);
        const deserializedNewBluePositions =
          deserializeVector3Array(newBluePositions);
        const deserializedNewPurplePositions =
          deserializeVector3Array(newPurplePositions);
        const deserializedNewBrownPositions =
          deserializeVector3Array(newBrownPositions);
        const deserializedNewGreenMoonPositions = deserializeVector3Array(
          newGreenMoonPositions
        );
        const deserializedNewPurpleMoonPositions = deserializeVector3Array(
          newPurpleMoonPositions
        );
        const deserializedNewGasPositions =
          deserializeVector3Array(newGasPositions);
        const deserializedNewRedMoonPositions =
          deserializeVector3Array(newRedMoonPositions);
        const deserializedNewGasMoonPositions =
          deserializeVector3Array(newGasMoonPositions);
        const deserializedNewBrownMoonPositions = deserializeVector3Array(
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
