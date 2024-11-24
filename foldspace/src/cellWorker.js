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
        // Log planetName if it exists in greenPositions
        if (
          data[key] &&
          data[key].positions &&
          data[key].positions.greenPositions
        ) {
          data[key].positions.greenPositions.forEach((position) => {
            if (position.planetName) {
              console.log('planetName:', position.planetName);
            }
          });
        }
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
      const planetName = `Planet_${posX.toFixed(0)}_${posY.toFixed(
        0
      )}_${posZ.toFixed(0)}`;
      positions[i] = { x: posX, y: posY, z: posZ, planetName };
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
  const { cellKeysToLoad, loadDetail } = event.data;

  try {
    const cellData = await fetchCellDataInBatches(cellKeysToLoad);

    const results = cellKeysToLoad.map((cellKey) => {
      if (cellData[cellKey]) {
        const savedPositions = cellData[cellKey];
        const validPositions = savedPositions.positions || {};
        const newPositions = createVector3Array(validPositions.greenPositions);

        // Log planetName if it exists
        if (Array.isArray(validPositions.greenPositions)) {
          validPositions.greenPositions.forEach((position) => {
            if (position.planetName) {
              console.log('planetName:', position.planetName);
            }
          });
        }

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
          newRedMoonPositions,
          newGasMoonPositions,
          newBrownMoonPositions,
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
          redMoonPositions: newRedMoonPositions,
          gasMoonPositions: newGasMoonPositions,
          brownMoonPositions: newBrownMoonPositions,
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
          newRedMoonPositions,
          newGasMoonPositions,
          newBrownMoonPositions,
          loadDetail,
        };
      }
    });

    self.postMessage(results);
  } catch (error) {
    console.error('Error loading cell data:', error);
  }
};
