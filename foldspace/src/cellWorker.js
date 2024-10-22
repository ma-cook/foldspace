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
      'https://foldspace-6483c.cloudFunctions.net/get-sphere-data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://foldspace-6483c.web.app',
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
  const GRID_SIZE = 100000;
  const newPositions = [];
  const newRedPositions = [];
  const newGreenPositions = [];
  const newBluePositions = [];
  const newPurplePositions = [];
  const newBrownPositions = [];
  const newGreenMoonPositions = [];
  const newPurpleMoonPositions = [];

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
      const posY = Math.floor(Math.random() * 15) * 5000;
      const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
      positions[i] = new THREE.Vector3(posX, posY, posZ);
    }
    return positions;
  };

  const positions = generateRandomPositions(300, x, z);

  positions.forEach((position) => {
    newPositions.push(position);
    newRedPositions.push(calculateRandomOrbitPosition(position, 400, 500));
    newGreenPositions.push(calculateRandomOrbitPosition(position, 700, 850));
    newBluePositions.push(calculateRandomOrbitPosition(position, 1000, 1100));
    newPurplePositions.push(calculateRandomOrbitPosition(position, 1250, 1300));
    newBrownPositions.push(calculateRandomOrbitPosition(position, 1450, 1600));
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
  };
};

const saveCellData = async (cellKey, positions) => {
  try {
    const response = await fetch(
      'https://foldspace-6483c.cloudFunctions.net/save-sphere-data',
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
  const { cellKey, cellKeysToLoad, loadDetail } = event.data;

  try {
    const cellData = await fetchCellDataInBatches(cellKeysToLoad);

    if (cellData[cellKey]) {
      const savedPositions = cellData[cellKey];
      const validPositions = savedPositions.positions || {};
      const newPositions = createVector3Array(validPositions.positions);

      const result = { cellKey, newPositions, loadDetail, savedPositions };
      self.postMessage(result);
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
      } = generateNewPositions(x, z);

      // Save the newly generated positions
      await saveCellData(cellKey, {
        positions: newPositions,
        redPositions: newRedPositions,
        greenPositions: newGreenPositions,
        bluePositions: newBluePositions,
        purplePositions: newPurplePositions,
        brownPositions: newBrownPositions,
        greenMoonPositions: newGreenMoonPositions,
        purpleMoonPositions: newPurpleMoonPositions,
      });

      const result = {
        cellKey,
        newPositions,
        newRedPositions,
        newGreenPositions,
        newBluePositions,
        newPurplePositions,
        newBrownPositions,
        newGreenMoonPositions,
        newPurpleMoonPositions,
        loadDetail,
      };
      self.postMessage(result);
    }
  } catch (error) {
    console.error(`Error loading cell data for ${cellKey}:`, error);
  }
};
