const loadCell = (
  cellKeysToLoad,
  loadDetail,
  loadedCells,
  loadingCells,
  setLoadingCells,
  setPositions,
  setPlanetNames, // Ensure this is passed
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
  swapBuffers
) => {
  // Validate required callbacks
  if (typeof setPlanetNames !== 'function') {
    console.error('setPlanetNames must be a function');
    return;
  }

  // Rest of the initialization code...

  worker.onmessage = async (event) => {
    const results = event.data;

    if (!Array.isArray(results)) {
      console.error('Expected array of results from worker');
      return;
    }

    results.forEach((result) => {
      try {
        const {
          cellKey,
          newPositions,
          loadDetail,
          savedPositions,
          planetName, // Ensure planetName is included in result
        } = result;

        if (!cellKey) {
          console.error('Missing cellKey in result');
          return;
        }

        cellCache[cellKey] = newPositions;

        if (typeof setPositions === 'function') {
          updatePositions(setPositions, newPositions);
        }

        if (loadDetail && savedPositions) {
          const positions = savedPositions.positions || {};

          // Update all position types
          const positionUpdates = {
            setRedPositions: positions.redPositions,
            setGreenPositions: positions.greenPositions,
            setBluePositions: positions.bluePositions,
            setPurplePositions: positions.purplePositions,
            setBrownPositions: positions.brownPositions,
            setGreenMoonPositions: positions.greenMoonPositions,
            setPurpleMoonPositions: positions.purpleMoonPositions,
            setGasPositions: positions.gasPositions,
            setRedMoonPositions: positions.redMoonPositions,
            setGasMoonPositions: positions.gasMoonPositions,
            setBrownMoonPositions: positions.brownMoonPositions,
          };

          // Safely update each position type
          Object.entries(positionUpdates).forEach(([setter, positions]) => {
            const setterFn = eval(setter);
            if (typeof setterFn === 'function' && Array.isArray(positions)) {
              updatePositions(setterFn, createVector3Array(positions));
            }
          });

          // Update planet names
          if (planetName) {
            setPlanetNames((prev) => ({
              ...prev,
              [cellKey]: planetName,
            }));
          }
        }

        if (typeof setLoadedCells === 'function') {
          setLoadedCells((prev) => {
            const newSet = new Set(prev);
            newSet.add(cellKey);
            return newSet;
          });
        }

        if (typeof setLoadingCells === 'function') {
          setLoadingCells((prev) => {
            const newSet = new Set(prev);
            newSet.delete(cellKey);
            return newSet;
          });
        }

        if (typeof swapBuffers === 'function') {
          swapBuffers();
        }
      } catch (error) {
        console.error('Error processing result:', error);
      }
    });
  };

  worker.onerror = (error) => {
    console.error('Worker error:', error);
  };
};

export default loadCell;
