importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
);

const cellCache = {};

const createVector3Array = (positions) => {
  if (!positions) {
    return [];
  }
  if (!Array.isArray(positions)) {
    return [];
  }
  return positions.map((pos) => new THREE.Vector3(pos.x, pos.y, pos.z));
};

const fetchCellDataInBatches = async (cellKeys) => {
  const cachedData = {};
  const keysToFetch = [];

  cellKeys.forEach((key) => {
    if (cellCache[key]) {
      cachedData[key] = cellCache[key];
    } else {
      keysToFetch.push(key);
    }
  });

  if (keysToFetch.length === 0) {
    return cachedData;
  }

  try {
    const response = await fetch(
      'http://127.0.0.1:5001/foldspace-6483c/us-central1/api/get-sphere-data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cellKeys: keysToFetch }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      keysToFetch.forEach((key) => {
        cellCache[key] = data[key];
      });
      return { ...cachedData, ...data };
    } else {
      console.error('Error fetching cell data:', response.statusText);
      return cachedData;
    }
  } catch (error) {
    console.error('Error fetching cell data:', error);
    return cachedData;
  }
};

const generateNewPositions = (x, z) => {
  const GRID_SIZE = 200000;
  const newPositions = [];
  const newRedPositions = [];
  const newGreenPositions = [];
  const newBluePositions = [];
  const newPurplePositions = [];
  const newBrownPositions = [];
  const newGreenMoonPositions = [];
  const newPurpleMoonPositions = [];
  const newGasPositions = [];

  const calculateRandomOrbitPosition = (
    centralPosition,
    minRadius,
    maxRadius
  ) => {
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
    const angle = Math.random() * 2 * Math.PI;
    const offsetX = radius * Math.cos(angle);
    const offsetZ = radius * Math.sin(angle);
    return new THREE.Vector3(
      centralPosition.x + offsetX,
      centralPosition.y,
      centralPosition.z + offsetZ
    );
  };

  const generateRandomPositions = (count, x, z) => {
    const positions = new Array(count);
    for (let i = 0; i < count; i++) {
      const posX = x * GRID_SIZE + Math.random() * GRID_SIZE;
      const posY = Math.floor(Math.random() * 20) * 5000;
      const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
      positions[i] = new THREE.Vector3(posX, posY, posZ);
    }
    return positions;
  };

  const positions = generateRandomPositions(600, x, z);

  positions.forEach((position) => {
    newPositions.push(position);
    newRedPositions.push(calculateRandomOrbitPosition(position, 600, 650));
    newGreenPositions.push(calculateRandomOrbitPosition(position, 900, 1000));
    newBluePositions.push(calculateRandomOrbitPosition(position, 1400, 1450));
    newPurplePositions.push(calculateRandomOrbitPosition(position, 1750, 1800));
    newBrownPositions.push(calculateRandomOrbitPosition(position, 2100, 2150));
    newGasPositions.push(calculateRandomOrbitPosition(position, 2500, 2600));
  });

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
    newBrownPositions,
    newGreenMoonPositions,
    newPurpleMoonPositions,
    newGasPositions,
  };
};

const saveCellData = async (cellKey, positions) => {
  try {
    const response = await fetch(
      'http://127.0.0.1:5001/foldspace-6483c/us-central1/api/save-sphere-data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cellKey, positions }),
      }
    );

    if (!response.ok) {
      console.error('Error saving cell data:', response.statusText);
    } else {
      console.log('Saved cell data:', { cellKey, positions });
    }
  } catch (error) {
    console.error('Error saving cell data:', error);
  }
};

self.onmessage = async (event) => {
  const { cellKeysToLoad, loadDetail } = event.data;

  try {
    const cellData = await fetchCellDataInBatches(cellKeysToLoad);

    const results = cellKeysToLoad.map((cellKey) => {
      if (cellData[cellKey]) {
        const savedPositions = cellData[cellKey];
        const validPositions = savedPositions.positions || {};
        const newPositions = createVector3Array(validPositions.positions);

        return { cellKey, newPositions, loadDetail, savedPositions };
      } else {
        // Parse cellKey into x and z coordinates
        const [x, z] = cellKey.split(',').map(Number);

        const {
          newPositions,
          newRedPositions,
          newGreenPositions,
          newBluePositions,
          newPurplePositions,
          newBrownPositions,
          newGreenMoonPositions,
          newPurpleMoonPositions,
          newGasPositions,
        } = generateNewPositions(x, z);

        // Save the newly generated positions
        saveCellData(cellKey, {
          positions: newPositions,
          redPositions: newRedPositions,
          greenPositions: newGreenPositions,
          bluePositions: newBluePositions,
          purplePositions: newPurplePositions,
          brownPositions: newBrownPositions,
          greenMoonPositions: newGreenMoonPositions,
          purpleMoonPositions: newPurpleMoonPositions,
          gasPositions: newGasPositions,
        });

        return {
          cellKey,
          newPositions,
          newRedPositions,
          newGreenPositions,
          newBluePositions,
          newPurplePositions,
          newBrownPositions,
          newGreenMoonPositions,
          newPurpleMoonPositions,
          newGasPositions,
          loadDetail,
        };
      }
    });

    self.postMessage(results);
  } catch (error) {
    console.error('Error loading cell data:', error);
  }
};
