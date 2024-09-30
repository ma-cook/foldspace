import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const CellLoader = React.memo(({ cameraRef, loadCell, unloadCell }) => {
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [currentLoadDistance, setCurrentLoadDistance] = useState(LOAD_DISTANCE);
  const previousCameraPosition = useRef({ x: null, z: null });

  const loadedCells = useStore((state) => state.loadedCells);
  const setPositions = useStore((state) => state.setPositions);
  const setRedPositions = useStore((state) => state.setRedPositions);
  const setGreenPositions = useStore((state) => state.setGreenPositions);
  const setBluePositions = useStore((state) => state.setBluePositions);
  const setPurplePositions = useStore((state) => state.setPurplePositions);
  const setGreenMoonPositions = useStore(
    (state) => state.setGreenMoonPositions
  );
  const setPurpleMoonPositions = useStore(
    (state) => state.setPurpleMoonPositions
  );
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const swapBuffers = useStore((state) => state.swapBuffers);
  const unloadDetailedSpheres = useStore(
    (state) => state.unloadDetailedSpheres
  );

  const cameraPosition = useStore((state) => state.cameraPosition);

  const loadCellsAroundCamera = useCallback(
    debounce(() => {
      if (!cameraPosition) return;

      const cellX = Math.floor(cameraPosition[0] / GRID_SIZE);
      const cellZ = Math.floor(cameraPosition[2] / GRID_SIZE);

      const newLoadingQueue = [];

      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const newX = cellX + dx;
          const newZ = cellZ + dz;
          const cellMinX = newX * GRID_SIZE - GRID_SIZE / 2;
          const cellMaxX = newX * GRID_SIZE + GRID_SIZE / 2;
          const cellMinZ = newZ * GRID_SIZE - GRID_SIZE / 2;
          const cellMaxZ = newZ * GRID_SIZE + GRID_SIZE / 2;

          const distanceX = Math.max(
            0,
            Math.abs(cameraPosition[0] - newX * GRID_SIZE) - GRID_SIZE / 2
          );
          const distanceZ = Math.max(
            0,
            Math.abs(cameraPosition[2] - newZ * GRID_SIZE) - GRID_SIZE / 2
          );
          const distance = Math.sqrt(distanceX ** 2 + distanceZ ** 2);

          if (distance < currentLoadDistance) {
            const cellKey = `${newX},${newZ}`;
            if (!loadedCells.has(cellKey)) {
              newLoadingQueue.push({
                cellKey,
                newX,
                newZ,
                distance,
                loadDetail: distance < DETAIL_DISTANCE,
              });
            }
          }
        }
      }

      // Sort the queue by distance to prioritize closer cells
      newLoadingQueue.sort((a, b) => a.distance - b.distance);

      setLoadingQueue((prevQueue) => [...prevQueue, ...newLoadingQueue]);

      loadedCells.forEach((cellKey) => {
        const [x, z] = cellKey.split(',').map(Number);
        const cellMinX = x * GRID_SIZE - GRID_SIZE / 2;
        const cellMaxX = x * GRID_SIZE + GRID_SIZE / 2;
        const cellMinZ = z * GRID_SIZE - GRID_SIZE / 2;
        const cellMaxZ = z * GRID_SIZE + GRID_SIZE / 2;

        const distanceX = Math.max(
          0,
          Math.abs(cameraPosition[0] - x * GRID_SIZE) - GRID_SIZE / 2
        );
        const distanceZ = Math.max(
          0,
          Math.abs(cameraPosition[2] - z * GRID_SIZE) - GRID_SIZE / 2
        );
        const distance = Math.sqrt(distanceX ** 2 + distanceZ ** 2);

        if (distance > UNLOAD_DISTANCE) {
          console.log(`Unloading cell at (${x}, ${z})`);
          unloadCell(x, z);
        } else if (distance > UNLOAD_DETAIL_DISTANCE) {
          unloadDetailedSpheres(cellKey);
        }
      });
    }, 100), // Adjust the debounce delay as needed
    [
      cameraPosition,
      loadCell,
      unloadCell,
      loadedCells,
      setPositions,
      setRedPositions,
      setGreenPositions,
      setBluePositions,
      setPurplePositions,
      setGreenMoonPositions,
      setPurpleMoonPositions,
      setLoadedCells,
      swapBuffers,
      unloadDetailedSpheres,
      currentLoadDistance,
    ]
  );

  useFrame(() => {
    if (loadingQueue.length > 0) {
      const batchSize = 5; // Number of cells to load in parallel
      const batch = loadingQueue.splice(0, batchSize);

      batch.forEach(({ cellKey, newX, newZ, loadDetail }) => {
        loadCell(
          newX,
          newZ,
          loadDetail,
          loadedCells,
          new Set(loadingQueue.map((item) => item.cellKey)),
          setLoadingQueue,
          setPositions,
          setRedPositions,
          setGreenPositions,
          setBluePositions,
          setPurplePositions,
          setGreenMoonPositions,
          setPurpleMoonPositions,
          setLoadedCells,
          swapBuffers
        ).finally(() => {
          setLoadingQueue((prevQueue) =>
            prevQueue.filter((item) => item.cellKey !== cellKey)
          );
        });
      });
    }
  });

  useEffect(() => {
    loadCellsAroundCamera();
    return () => {
      loadCellsAroundCamera.cancel();
    };
  }, [cameraPosition]);

  useEffect(() => {
    // Change the load distance after initial cells are loaded
    if (loadingQueue.length === 0) {
      setCurrentLoadDistance(100000);
    }
  }, [loadingQueue]);

  return null;
});

export default CellLoader;
