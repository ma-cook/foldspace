importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
);

const createVector3Array = (positions) => {
  if (!positions) {
    return [];
  }
  if (!Array.isArray(positions)) {
    return [];
  }
  const result = positions.map((pos) => new THREE.Vector3(pos.x, pos.y, pos.z));
  return result;
};

const fetchCellDataInBatches = async (cellKeys) => {
  try {
    const response = await fetch('http://localhost:5000/get-sphere-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cellKeys }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Error fetching cell data:', response.statusText);
      return {};
    }
  } catch (error) {
    console.error('Error fetching cell data:', error);
    return {};
  }
};

const generateNewPositions = (x, z) => {
  const GRID_SIZE = 100000;
  const newPositions = [];
  const newRedPositions = [];
  const newGreenPositions = [];
  const newBluePositions = [];
  const newPurplePositions = [];
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
    newRedPositions.push(calculateRandomOrbitPosition(position, 300, 400));
    newGreenPositions.push(calculateRandomOrbitPosition(position, 500, 600));
    newBluePositions.push(calculateRandomOrbitPosition(position, 600, 700));
    newPurplePositions.push(calculateRandomOrbitPosition(position, 800, 1000));
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
    newGreenMoonPositions,
    newPurpleMoonPositions,
  };
};

const saveCellData = async (cellKey, positions) => {
  try {
    const response = await fetch('http://localhost:5000/save-sphere-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cellKey, positions }),
    });

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
