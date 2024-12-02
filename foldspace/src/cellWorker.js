importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
);

const cellCache = {};

const createVector3Array = (positions) => {
  if (!Array.isArray(positions)) {
    return [];
  }
  return positions
    .map((pos) => {
      if (pos && 'x' in pos && 'y' in pos && 'z' in pos) {
        return new THREE.Vector3(pos.x, pos.y, pos.z);
      } else {
        console.warn('Invalid position:', pos);
        return null;
      }
    })
    .filter(Boolean);
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
  const newRedMoonPositions = [];
  const newGasMoonPositions = [];
  const newBrownMoonPositions = [];

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
      calculateRandomOrbitPosition(greenPosition, 90, 90)
    );
  });

  newPurplePositions.forEach((purplePosition) => {
    newPurpleMoonPositions.push(
      calculateRandomOrbitPosition(purplePosition, 90, 90)
    );
  });

  newRedPositions.forEach((redPosition) => {
    newRedMoonPositions.push(calculateRandomOrbitPosition(redPosition, 90, 90));
  });

  newGasPositions.forEach((gasPosition) => {
    newGasMoonPositions.push(
      calculateRandomOrbitPosition(gasPosition, 110, 110)
    );
  });

  newBrownPositions.forEach((brownPosition) => {
    newBrownMoonPositions.push(
      calculateRandomOrbitPosition(brownPosition, 110, 110)
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
  const { requestId, cellKeysToLoad, loadDetail } = event.data;

  try {
    const cellData = await fetchCellDataInBatches(cellKeysToLoad);

    const results = cellKeysToLoad.map((cellKey) => {
      let newPositions = [];
      let newRedPositions = [];
      let newGreenPositions = [];
      let newBluePositions = [];
      let newPurplePositions = [];
      let newBrownPositions = [];
      let newGreenMoonPositions = [];
      let newPurpleMoonPositions = [];
      let newGasPositions = [];
      let newRedMoonPositions = [];
      let newGasMoonPositions = [];
      let newBrownMoonPositions = [];

      if (cellData[cellKey]) {
        const savedPositions = cellData[cellKey];

        newPositions = createVector3Array(savedPositions.positions || []);
        newRedPositions = createVector3Array(savedPositions.redPositions || []);
        newGreenPositions = createVector3Array(
          savedPositions.greenPositions || []
        );
        newBluePositions = createVector3Array(
          savedPositions.bluePositions || []
        );
        newPurplePositions = createVector3Array(
          savedPositions.purplePositions || []
        );
        newBrownPositions = createVector3Array(
          savedPositions.brownPositions || []
        );
        newGreenMoonPositions = createVector3Array(
          savedPositions.greenMoonPositions || []
        );
        newPurpleMoonPositions = createVector3Array(
          savedPositions.purpleMoonPositions || []
        );
        newGasPositions = createVector3Array(savedPositions.gasPositions || []);
        newRedMoonPositions = createVector3Array(
          savedPositions.redMoonPositions || []
        );
        newGasMoonPositions = createVector3Array(
          savedPositions.gasMoonPositions || []
        );
        newBrownMoonPositions = createVector3Array(
          savedPositions.brownMoonPositions || []
        );
      } else {
        // Parse cellKey into x and z coordinates
        const [x, z] = cellKey.split(',').map(Number);

        ({
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
        } = generateNewPositions(x, z));

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
          redMoonPositions: newRedMoonPositions,
          gasMoonPositions: newGasMoonPositions,
          brownMoonPositions: newBrownMoonPositions,
        });
      }

      // Now, all arrays are initialized, and you can safely process them
      // e.g., generate moons for planets if needed

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
        newRedMoonPositions,
        newGasMoonPositions,
        newBrownMoonPositions,
        loadDetail,
      };
    });

    self.postMessage({
      requestId,
      results,
    });
  } catch (error) {
    console.error('Error loading cell data:', error);
    self.postMessage({
      requestId,
      error: error.message,
    });
  }
};
