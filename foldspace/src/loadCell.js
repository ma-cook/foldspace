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
  setPlanetNames // Add this parameter to set planet names
) => {
  return new Promise((resolve, reject) => {
    // Ensure cellKeysToLoad is an array
    if (!Array.isArray(cellKeysToLoad)) {
      cellKeysToLoad = [cellKeysToLoad];
    }

    // Ensure loadedCells is a Set
    if (!(loadedCells instanceof Set)) {
      if (Array.isArray(loadedCells)) {
        loadedCells = new Set(loadedCells);
      } else {
        loadedCells = new Set();
      }
    }

    const newCellKeys = cellKeysToLoad.filter(
      (cellKey) => !loadedCells.has(cellKey) && !loadingCells.has(cellKey)
    );

    if (newCellKeys.length === 0) {
      resolve();
      return;
    }

    // Update loadingCells state synchronously
    setLoadingCells((prev) => {
      const newSet = new Set(prev);
      newCellKeys.forEach((cellKey) => newSet.add(cellKey));
      return newSet;
    });

    worker.postMessage({
      cellKeysToLoad: newCellKeys,
      loadDetail,
    });

    worker.onmessage = async (event) => {
      const results = event.data;

      results.forEach((result) => {
        const { cellKey, newPositions, loadDetail, savedPositions } = result;

        cellCache[cellKey] = newPositions;
        updatePositions(setPositions, newPositions);

        if (loadDetail && savedPositions) {
          const positions = savedPositions.positions || {};
          const newRedPositions = createVector3Array(positions.redPositions);
          const newGreenPositions = createVector3Array(
            positions.greenPositions
          );
          const newBluePositions = createVector3Array(positions.bluePositions);
          const newPurplePositions = createVector3Array(
            positions.purplePositions
          );
          const newBrownPositions = createVector3Array(
            positions.brownPositions
          );
          const newGreenMoonPositions = createVector3Array(
            positions.greenMoonPositions
          );
          const newPurpleMoonPositions = createVector3Array(
            positions.purpleMoonPositions
          );
          const newGasPositions = createVector3Array(positions.gasPositions);
          const newRedMoonPositions = createVector3Array(
            positions.redMoonPositions
          );
          const newGasMoonPositions = createVector3Array(
            positions.gasMoonPositions
          );
          const newBrownMoonPositions = createVector3Array(
            positions.brownMoonPositions
          );

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

          // Create a mapping of coordinates to planetName
          const planetNames = {};
          if (Array.isArray(positions.greenPositions)) {
            positions.greenPositions.forEach((position) => {
              if (position.planetName) {
                const key = `${position.x},${position.y},${position.z}`;
                planetNames[key] = position.planetName;
              }
            });
          }

          // Update planet names state
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

        // Swap buffers if defined
        if (typeof swapBuffers === 'function') {
          swapBuffers();
        } else {
          console.warn('swapBuffers is not a function');
        }
      });

      resolve();
    };

    worker.onerror = (error) => {
      reject(error);
    };
  });
};

export default loadCell;
