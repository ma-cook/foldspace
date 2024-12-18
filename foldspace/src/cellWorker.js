importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
);

const cellCache = {};

const createVector3Map = (positions) => {
  if (typeof positions !== 'object' || positions === null) {
    return {};
  }
  const result = {};
  for (const key in positions) {
    const pos = positions[key];
    if (pos && 'x' in pos && 'y' in pos && 'z' in pos) {
      result[key] = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        planetName: pos.planetName || null,
      };
    } else {
      console.warn('Invalid position:', pos);
    }
  }
  return result;
};

const serializeVector3Map = (vectorMap) => {
  const result = {};
  for (const key in vectorMap) {
    const vector = vectorMap[key];
    result[key] = {
      x: vector.x,
      y: vector.y,
      z: vector.z,
      planetName: vector.planetName || null,
    };
  }
  return result;
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
      'https://us-central1-foldspace-6483c.cloudfunctions.net/api/get-sphere-data',
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
const GRID_SIZE = 200000;
const generateRandomPositions = (count, x, z, idCounterRef) => {
  const positions = {};
  for (let i = 0; i < count; i++) {
    const posX = x * GRID_SIZE + Math.random() * GRID_SIZE;
    const posY = Math.floor(Math.random() * 20) * 5000;
    const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
    positions[idCounterRef.current++] = new THREE.Vector3(posX, posY, posZ);
  }
  return positions;
};

const generateNewPositions = (x, z) => {
  const idCounterRef = { current: 0 };

  const newPositions = {};
  const newRedPositions = {};
  const newGreenPositions = {};
  const newBluePositions = {};
  const newPurplePositions = {};
  const newBrownPositions = {};
  const newGreenMoonPositions = {};
  const newPurpleMoonPositions = {};
  const newGasPositions = {};
  const newRedMoonPositions = {};
  const newGasMoonPositions = {};
  const newBrownMoonPositions = {};

  const positions = generateRandomPositions(600, x, z, idCounterRef);

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

  for (const key in positions) {
    const position = positions[key];

    newPositions[key] = position;

    // Generate orbiting positions
    const redPos = calculateRandomOrbitPosition(position, 600, 650);
    newRedPositions[idCounterRef.current++] = redPos;

    const greenPos = calculateRandomOrbitPosition(position, 900, 1000);
    newGreenPositions[idCounterRef.current++] = greenPos;

    const bluePos = calculateRandomOrbitPosition(position, 1400, 1450);
    newBluePositions[idCounterRef.current++] = bluePos;

    const purplePos = calculateRandomOrbitPosition(position, 1750, 1800);
    newPurplePositions[idCounterRef.current++] = purplePos;

    const brownPos = calculateRandomOrbitPosition(position, 2100, 2150);
    newBrownPositions[idCounterRef.current++] = brownPos;

    const gasPos = calculateRandomOrbitPosition(position, 2500, 2600);
    newGasPositions[idCounterRef.current++] = gasPos;

    // Generate moons
    newGreenMoonPositions[idCounterRef.current++] =
      calculateRandomOrbitPosition(greenPos, 90, 90);
    newPurpleMoonPositions[idCounterRef.current++] =
      calculateRandomOrbitPosition(purplePos, 90, 90);
    newRedMoonPositions[idCounterRef.current++] = calculateRandomOrbitPosition(
      redPos,
      90,
      90
    );
    newGasMoonPositions[idCounterRef.current++] = calculateRandomOrbitPosition(
      gasPos,
      110,
      110
    );
    newBrownMoonPositions[idCounterRef.current++] =
      calculateRandomOrbitPosition(brownPos, 110, 110);
  }

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
    newRedMoonPositions,
    newGasMoonPositions,
    newBrownMoonPositions,
  };
};

const saveCellData = async (cellKey, positions) => {
  try {
    const response = await fetch(
      'https://us-central1-foldspace-6483c.cloudfunctions.net/api/save-sphere-data',
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
  const { requestId, cellKeysToLoad = [], loadDetail } = event.data;

  if (
    !Array.isArray(cellKeysToLoad) ||
    cellKeysToLoad.some((key) => key === undefined)
  ) {
    self.postMessage({
      requestId,
      error: 'Invalid cellKeysToLoad',
    });
    return;
  }

  try {
    const cellData = await fetchCellDataInBatches(cellKeysToLoad);
    const results = [];

    for (const cellKey of cellKeysToLoad) {
      try {
        let newPositions = {};
        let newRedPositions = {};
        let newGreenPositions = {};
        let newBluePositions = {};
        let newPurplePositions = {};
        let newBrownPositions = {};
        let newGreenMoonPositions = {};
        let newPurpleMoonPositions = {};
        let newGasPositions = {};
        let newRedMoonPositions = {};
        let newGasMoonPositions = {};
        let newBrownMoonPositions = {};

        if (cellData[cellKey]) {
          const savedPositions = cellData[cellKey];

          // Process positions as maps
          if (typeof savedPositions.positions === 'object') {
            newPositions = createVector3Map(
              savedPositions.positions.positions || {}
            );
            newRedPositions = createVector3Map(
              savedPositions.positions.redPositions || {}
            );
            newGreenPositions = createVector3Map(
              savedPositions.positions.greenPositions || {}
            );
            newBluePositions = createVector3Map(
              savedPositions.positions.bluePositions || {}
            );
            newPurplePositions = createVector3Map(
              savedPositions.positions.purplePositions || {}
            );
            newBrownPositions = createVector3Map(
              savedPositions.positions.brownPositions || {}
            );
            newGreenMoonPositions = createVector3Map(
              savedPositions.positions.greenMoonPositions || {}
            );
            newPurpleMoonPositions = createVector3Map(
              savedPositions.positions.purpleMoonPositions || {}
            );
            newGasPositions = createVector3Map(
              savedPositions.positions.gasPositions || {}
            );
            newRedMoonPositions = createVector3Map(
              savedPositions.positions.redMoonPositions || {}
            );
            newGasMoonPositions = createVector3Map(
              savedPositions.positions.gasMoonPositions || {}
            );
            newBrownMoonPositions = createVector3Map(
              savedPositions.positions.brownMoonPositions || {}
            );
          } else {
            console.warn(`Invalid positions data in cell ${cellKey}`);
          }
        } else {
          // Parse cellKey into x and z coordinates
          const [x, z] = cellKey.split(',').map(Number);

          const generated = generateNewPositions(x, z);
          newPositions = generated.newPositions;
          newRedPositions = generated.newRedPositions;
          newGreenPositions = generated.newGreenPositions;
          newBluePositions = generated.newBluePositions;
          newPurplePositions = generated.newPurplePositions;
          newBrownPositions = generated.newBrownPositions;
          newGreenMoonPositions = generated.newGreenMoonPositions;
          newPurpleMoonPositions = generated.newPurpleMoonPositions;
          newGasPositions = generated.newGasPositions;
          newRedMoonPositions = generated.newRedMoonPositions;
          newGasMoonPositions = generated.newGasMoonPositions;
          newBrownMoonPositions = generated.newBrownMoonPositions;

          // Save the newly generated positions
          await saveCellData(cellKey, {
            positions: serializeVector3Map(newPositions),
            redPositions: serializeVector3Map(newRedPositions),
            greenPositions: serializeVector3Map(newGreenPositions),
            bluePositions: serializeVector3Map(newBluePositions),
            purplePositions: serializeVector3Map(newPurplePositions),
            brownPositions: serializeVector3Map(newBrownPositions),
            greenMoonPositions: serializeVector3Map(newGreenMoonPositions),
            purpleMoonPositions: serializeVector3Map(newPurpleMoonPositions),
            gasPositions: serializeVector3Map(newGasPositions),
            redMoonPositions: serializeVector3Map(newRedMoonPositions),
            gasMoonPositions: serializeVector3Map(newGasMoonPositions),
            brownMoonPositions: serializeVector3Map(newBrownMoonPositions),
          });
        }

        results.push({
          cellKey,
          newPositions: serializeVector3Map(newPositions),
          newRedPositions: serializeVector3Map(newRedPositions),
          newGreenPositions: serializeVector3Map(newGreenPositions),
          newBluePositions: serializeVector3Map(newBluePositions),
          newPurplePositions: serializeVector3Map(newPurplePositions),
          newBrownPositions: serializeVector3Map(newBrownPositions),
          newGreenMoonPositions: serializeVector3Map(newGreenMoonPositions),
          newPurpleMoonPositions: serializeVector3Map(newPurpleMoonPositions),
          newGasPositions: serializeVector3Map(newGasPositions),
          newRedMoonPositions: serializeVector3Map(newRedMoonPositions),
          newGasMoonPositions: serializeVector3Map(newGasMoonPositions),
          newBrownMoonPositions: serializeVector3Map(newBrownMoonPositions),
          loadDetail,
        });
      } catch (error) {
        console.error(`Error processing cellKey ${cellKey}:`, error);
      }
    }

    self.postMessage({
      requestId,
      results,
    });
  } catch (error) {
    console.error('Error in worker:', error);
    self.postMessage({
      requestId,
      error: error.message,
    });
  }
};
