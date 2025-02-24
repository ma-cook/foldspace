import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
  useMemo,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { throttle } from 'lodash';
import { useStore } from '../store';
import {
  GRID_SIZE,
  LOAD_DISTANCE,
  UNLOAD_DISTANCE,
  DETAIL_DISTANCE,
  UNLOAD_DETAIL_DISTANCE,
} from '../config';

import { buildBVH, queryBVH } from '../BVH';

// Utility Functions
const calculateDistance = (x1, z1, x2, z2) => {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dz * dz);
};

const requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    return setTimeout(cb, 1);
  };

// Custom Hook for Managing Cells
const useCells = (cameraRef, currentLoadDistance) => {
  const [cells, setCells] = useState([]);
  const bvhRootRef = useRef(null);

  const updateCells = useCallback(
    (cameraPosition) => {
      const newCells = [];
      const cellX = Math.floor(cameraPosition.x / GRID_SIZE);
      const cellZ = Math.floor(cameraPosition.z / GRID_SIZE);

      for (let x = cellX - 10; x <= cellX + 10; x++) {
        for (let z = cellZ - 10; z <= cellZ + 10; z++) {
          const distance = calculateDistance(
            cameraPosition.x,
            cameraPosition.z,
            x * GRID_SIZE,
            z * GRID_SIZE
          );
          if (distance < currentLoadDistance) {
            newCells.push({ x, z, cellKey: `${x},${z}` });
          }
        }
      }

      setCells(newCells);
    },
    [currentLoadDistance]
  );

  useEffect(() => {
    if (cameraRef.current) {
      updateCells(cameraRef.current.position);
    }
  }, [cameraRef, updateCells]);

  useEffect(() => {
    if (cells.length > 0) {
      bvhRootRef.current = buildBVH(cells);
    }
  }, [cells]);

  return { cells, bvhRootRef, updateCells };
};

// Custom Hook for Managing Loading Queue
const useLoadingQueue = (
  loadCell,
  loadedCells,
  setLoadedCells,
  unloadCell,
  unloadDetailedSpheres
) => {
  const initialState = {
    items: [],
    cellKeys: new Set(),
  };

  const [loadingQueue, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'ADD_TO_QUEUE':
        const newItems = action.payload.filter(
          (item) => !state.cellKeys.has(item.cellKey)
        );

        if (newItems.length === 0) return state;

        const updatedItems = [...state.items, ...newItems];
        const updatedCellKeys = new Set(state.cellKeys);
        newItems.forEach((item) => updatedCellKeys.add(item.cellKey));

        return {
          items: updatedItems,
          cellKeys: updatedCellKeys,
        };

      case 'REMOVE_FROM_QUEUE':
        const itemsToRemove = new Set(action.payload);
        const remainingItems = state.items.filter(
          (item) => !itemsToRemove.has(item.cellKey)
        );
        const remainingCellKeys = new Set(
          remainingItems.map((item) => item.cellKey)
        );
        return {
          items: remainingItems,
          cellKeys: remainingCellKeys,
        };

      default:
        return state;
    }
  }, initialState);

  const {
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
    setPlanetNames,
    swapBuffers,
    setLoadingCells,
  } = useStore();

  const processLoadingQueue = useCallback(() => {
    if (loadingQueue.items.length > 0) {
      const batchSize = 10;
      const batch = loadingQueue.items.slice(0, batchSize);

      batch.forEach(({ cellKey, newX, newZ, loadDetail }) => {
        requestIdleCallback(() => {
          loadCell(
            [cellKey], // cellKeysToLoad as an array
            loadDetail,
            loadedCells,
            loadingQueue.cellKeys,
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
            swapBuffers, // Pass the swapBuffers function
            setPlanetNames // Pass the setPlanetNames function
          );

          setLoadedCells((prevLoadedCells) => {
            const updatedLoadedCells = new Set(prevLoadedCells);
            updatedLoadedCells.add(cellKey);
            return updatedLoadedCells;
          });
        });
      });

      dispatch({
        type: 'REMOVE_FROM_QUEUE',
        payload: batch.map((item) => item.cellKey),
      });
    }
  }, [
    loadingQueue.items,
    loadingQueue.cellKeys,
    loadCell,
    loadedCells,
    setLoadedCells,
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
    swapBuffers,
    setPlanetNames,
  ]);

  return { loadingQueue, dispatch, processLoadingQueue };
};

const CellLoader = React.memo(({ cameraRef, loadCell, unloadCell }) => {
  const [currentLoadDistance, setCurrentLoadDistance] = useState(LOAD_DISTANCE);
  const { cells, bvhRootRef, updateCells } = useCells(
    cameraRef,
    currentLoadDistance
  );
  const loadedCells = useStore((state) => state.loadedCells);
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const unloadDetailedSpheres = useStore(
    (state) => state.unloadDetailedSpheres
  );
  const { loadingQueue, dispatch, processLoadingQueue } = useLoadingQueue(
    loadCell,
    loadedCells,
    setLoadedCells,
    unloadCell,
    unloadDetailedSpheres
  );

  const checkCellsAroundCamera = useCallback(() => {
    if (!cameraRef.current) return;

    const cameraPosition = cameraRef.current.position;
    updateCells(cameraPosition);

    const newLoadingQueue = [];
    let allCellsLoaded = true;

    // Query the BVH to find nearby cells
    const nearbyCells = queryBVH(
      bvhRootRef.current,
      cameraPosition,
      currentLoadDistance
    );

    nearbyCells.forEach((cellKey) => {
      if (!loadedCells.has(cellKey) && !loadingQueue.cellKeys.has(cellKey)) {
        const [newX, newZ] = cellKey.split(',').map(Number);
        const distance = calculateDistance(
          cameraPosition.x,
          cameraPosition.z,
          newX * GRID_SIZE,
          newZ * GRID_SIZE
        );
        if (distance < currentLoadDistance) {
          newLoadingQueue.push({
            cellKey,
            newX,
            newZ,
            distance,
            loadDetail: distance < DETAIL_DISTANCE,
          });
          allCellsLoaded = false;
        }
      }
    });

    if (allCellsLoaded) return;

    newLoadingQueue.sort((a, b) => a.distance - b.distance);
    dispatch({ type: 'ADD_TO_QUEUE', payload: newLoadingQueue });

    loadedCells.forEach((cellKey) => {
      const [x, z] = cellKey.split(',').map(Number);
      const distance = calculateDistance(
        cameraPosition.x,
        cameraPosition.z,
        x * GRID_SIZE,
        z * GRID_SIZE
      );

      if (distance > UNLOAD_DISTANCE) {
        unloadCell(x, z);
        setLoadedCells((prevLoadedCells) => {
          const updatedLoadedCells = new Set(prevLoadedCells);
          updatedLoadedCells.delete(cellKey);
          return updatedLoadedCells;
        });
      } else if (distance > UNLOAD_DETAIL_DISTANCE) {
        unloadDetailedSpheres(cellKey);
      }
    });
  }, [
    cameraRef,
    loadedCells,
    loadingQueue.cellKeys,
    currentLoadDistance,
    unloadCell,
    unloadDetailedSpheres,
    setLoadedCells,
    updateCells,
    dispatch,
  ]);

  const throttledCheckCellsAroundCamera = useMemo(
    () => throttle(checkCellsAroundCamera, 100),
    [checkCellsAroundCamera]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      processLoadingQueue();
    }, 100);
    return () => clearInterval(interval);
  }, [processLoadingQueue]);

  useFrame(() => {
    throttledCheckCellsAroundCamera();
  });

  useEffect(() => {
    if (loadingQueue.items.length === 0) {
      setCurrentLoadDistance(200000);
    }
  }, [loadingQueue.items]);

  return null;
});

export default CellLoader;
