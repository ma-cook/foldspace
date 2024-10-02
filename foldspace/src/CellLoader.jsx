import React, { useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { debounce } from 'lodash';
import { useStore } from './store';
import {
  GRID_SIZE,
  LOAD_DISTANCE,
  UNLOAD_DISTANCE,
  DETAIL_DISTANCE,
  UNLOAD_DETAIL_DISTANCE,
} from './config';

const calculateDistance = (x1, z1, x2, z2) => {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dz * dz);
};

const CellLoader = React.memo(({ cameraRef, loadCell, unloadCell }) => {
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [currentLoadDistance, setCurrentLoadDistance] = useState(LOAD_DISTANCE);

  const loadedCells = useStore((state) => state.loadedCells);
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const unloadDetailedSpheres = useStore(
    (state) => state.unloadDetailedSpheres
  );

  const checkCellsAroundCamera = useCallback(() => {
    if (!cameraRef.current) return;

    const cameraPosition = cameraRef.current.position;
    const cellX = Math.floor(cameraPosition.x / GRID_SIZE);
    const cellZ = Math.floor(cameraPosition.z / GRID_SIZE);

    const newLoadingQueue = [];
    let allCellsLoaded = true;

    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const newX = cellX + dx;
        const newZ = cellZ + dz;
        const cellKey = `${newX},${newZ}`;

        if (!loadedCells.has(cellKey)) {
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
      }
    }

    // If all cells within the load distance are already loaded, return early
    if (allCellsLoaded) return;

    newLoadingQueue.sort((a, b) => a.distance - b.distance);
    setLoadingQueue((prevQueue) => [...prevQueue, ...newLoadingQueue]);

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
      } else if (distance > UNLOAD_DETAIL_DISTANCE) {
        unloadDetailedSpheres(cellKey);
      }
    });
  }, [
    cameraRef,
    loadedCells,
    currentLoadDistance,
    unloadCell,
    unloadDetailedSpheres,
  ]);

  const processLoadingQueue = useCallback(() => {
    if (loadingQueue.length > 0) {
      const batchSize = 5;
      const batch = loadingQueue.splice(0, batchSize);

      batch.forEach(({ cellKey, newX, newZ, loadDetail }) => {
        requestIdleCallback(() => {
          loadCell(
            newX,
            newZ,
            loadDetail,
            loadedCells,
            new Set(loadingQueue.map((item) => item.cellKey)),
            setLoadingQueue
          ).finally(() => {
            setLoadingQueue((prevQueue) =>
              prevQueue.filter((item) => item.cellKey !== cellKey)
            );
          });
        });
      });
    }
  }, [loadingQueue, loadCell, loadedCells, setLoadingQueue]);

  useFrame(() => {
    processLoadingQueue();
  });

  useEffect(() => {
    const debouncedCheckCells = debounce(checkCellsAroundCamera, 20);
    debouncedCheckCells();
    return () => {
      debouncedCheckCells.cancel();
    };
  }, [cameraRef, checkCellsAroundCamera]);

  useEffect(() => {
    if (loadingQueue.length === 0) {
      setCurrentLoadDistance(200000);
    }
  }, [loadingQueue]);

  return null;
});

export default CellLoader;
