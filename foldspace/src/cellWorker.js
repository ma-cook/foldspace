importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
);

const cellCache = {};

const chunkPositions = (positions, chunkSize = 100) => {
  const chunks = [];
  const keys = Object.keys(positions);

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = {};
    const chunkKeys = keys.slice(i, i + chunkSize);
    chunkKeys.forEach((key) => {
      chunk[key] = positions[key];
    });
    chunks.push(chunk);
  }

  return chunks;
};

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

const validateCellKey = (cellKey) => {
  if (typeof cellKey !== 'string') return false;
  const [x, z] = cellKey.split(',').map(Number);
  return !isNaN(x) && !isNaN(z);
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
  if (!validateCellKey(cellKey)) {
    throw new Error('Invalid cell key format');
  }

  try {
    // Sanitize cell key and create valid document path
    const sanitizedKey = cellKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const baseDocPath = `spheres/${sanitizedKey}`;

    // Ensure baseDocPath is valid
    if (!baseDocPath) {
      throw new Error('Invalid baseDocPath');
    }

    const chunks = [];
    const CHUNK_SIZE = 25;
    let chunkCounter = 0;

    Object.entries(positions).forEach(([posType, posData]) => {
      const positionChunks = chunkPositions(posData, CHUNK_SIZE);
      positionChunks.forEach((chunk, index) => {
        const chunkDocPath = `${baseDocPath}/${posType}/chunk_${index}`;

        // Ensure chunkDocPath is valid
        if (!chunkDocPath) {
          console.error('Invalid chunkDocPath:', chunkDocPath);
          return;
        }

        chunks.push({
          docPath: chunkDocPath,
          data: {
            id: `${sanitizedKey}_${posType}_${index}`,
            type: posType,
            index: index,
            total: positionChunks.length,
            positions: serializeVector3Map(chunk),
          },
        });
        chunkCounter++;
      });
    });

    // Save chunks with exponential backoff retry
    const MAX_RETRIES = 3;
    const saveChunk = async (chunk, attempt = 0) => {
      try {
        if (!chunk.docPath) {
          throw new Error('Invalid docPath');
        }

        const response = await fetch(
          'https://us-central1-foldspace-6483c.cloudfunctions.net/api/save-sphere-data',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              docPath: chunk.docPath,
              data: chunk.data,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return saveChunk(chunk, attempt + 1);
        }
        throw error;
      }
    };

    // Save metadata first
    await saveChunk({
      docPath: baseDocPath,
      data: {
        id: sanitizedKey,
        totalChunks: chunkCounter,
        timestamp: Date.now(),
      },
    });

    // Save chunks in batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((chunk) => saveChunk(chunk)));
    }
  } catch (error) {
    console.error('Error saving cell data:', error);
    throw error;
  }
};

const serializeAllPositions = (positions) => ({
  newPositions: serializeVector3Map(positions.newPositions),
  newRedPositions: serializeVector3Map(positions.newRedPositions),
  newGreenPositions: serializeVector3Map(positions.newGreenPositions),
  newBluePositions: serializeVector3Map(positions.newBluePositions),
  newPurplePositions: serializeVector3Map(positions.newPurplePositions),
  newBrownPositions: serializeVector3Map(positions.newBrownPositions),
  newGreenMoonPositions: serializeVector3Map(positions.newGreenMoonPositions),
  newPurpleMoonPositions: serializeVector3Map(positions.newPurpleMoonPositions),
  newGasPositions: serializeVector3Map(positions.newGasPositions),
  newRedMoonPositions: serializeVector3Map(positions.newRedMoonPositions),
  newGasMoonPositions: serializeVector3Map(positions.newGasMoonPositions),
  newBrownMoonPositions: serializeVector3Map(positions.newBrownMoonPositions),
});

const processCellData = (cellKey, savedData) => {
  if (!savedData?.positions || typeof savedData.positions !== 'object') {
    return null;
  }

  return {
    newPositions: createVector3Map(savedData.positions.positions || {}),
    newRedPositions: createVector3Map(savedData.positions.redPositions || {}),
    newGreenPositions: createVector3Map(
      savedData.positions.greenPositions || {}
    ),
    newBluePositions: createVector3Map(savedData.positions.bluePositions || {}),
    newPurplePositions: createVector3Map(
      savedData.positions.purplePositions || {}
    ),
    newBrownPositions: createVector3Map(
      savedData.positions.brownPositions || {}
    ),
    newGreenMoonPositions: createVector3Map(
      savedData.positions.greenMoonPositions || {}
    ),
    newPurpleMoonPositions: createVector3Map(
      savedData.positions.purpleMoonPositions || {}
    ),
    newGasPositions: createVector3Map(savedData.positions.gasPositions || {}),
    newRedMoonPositions: createVector3Map(
      savedData.positions.redMoonPositions || {}
    ),
    newGasMoonPositions: createVector3Map(
      savedData.positions.gasMoonPositions || {}
    ),
    newBrownMoonPositions: createVector3Map(
      savedData.positions.brownMoonPositions || {}
    ),
  };
};

self.onmessage = async (event) => {
  const { requestId, cellKeysToLoad = [], loadDetail } = event.data;

  try {
    if (!Array.isArray(cellKeysToLoad) || cellKeysToLoad.some((key) => !key)) {
      throw new Error('Invalid cellKeysToLoad');
    }

    const results = [];
    const cellData = await fetchCellDataInBatches(cellKeysToLoad);

    for (const cellKey of cellKeysToLoad) {
      try {
        const processedData = processCellData(cellKey, cellData[cellKey]);

        if (!processedData) {
          const [x, z] = cellKey.split(',').map(Number);
          const generated = generateNewPositions(x, z);

          await saveCellData(cellKey, {
            positions: serializeAllPositions(generated),
          });

          results.push({
            cellKey,
            ...serializeAllPositions(generated),
            loadDetail,
          });
        } else {
          results.push({
            cellKey,
            ...processedData,
            loadDetail,
          });
        }
      } catch (error) {
        console.error(`Error processing cell ${cellKey}:`, error);
      }
    }

    self.postMessage({ requestId, results });
  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({
      requestId,
      error: error.message,
    });
  }
};
