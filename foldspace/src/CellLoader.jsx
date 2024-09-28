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
  SIGNIFICANT_MOVE_DISTANCE,
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

  const loadCellsAroundCamera = useCallback(
    debounce(() => {
      if (!cameraRef.current) return;

      const cameraPosition = cameraRef.current.position;
      if (!cameraPosition) return;

      const cellX = Math.floor(cameraPosition.x / GRID_SIZE);
      const cellZ = Math.floor(cameraPosition.z / GRID_SIZE);

      // Check if any cells within the load distance have been loaded
      let cellsLoadedWithinDistance = false;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const newX = cellX + dx;
          const newZ = cellZ + dz;
          const distanceX = Math.abs(cameraPosition.x - newX * GRID_SIZE);
          const distanceZ = Math.abs(cameraPosition.z - newZ * GRID_SIZE);
          const distance = Math.sqrt(distanceX ** 2 + distanceZ ** 2);

          if (distance < currentLoadDistance) {
            const cellKey = `${newX},${newZ}`;
            if (loadedCells.has(cellKey)) {
              cellsLoadedWithinDistance = true;
              break;
            }
          }
        }
        if (cellsLoadedWithinDistance) break;
      }

      // Check if the camera has moved significantly or if no cells within the load distance have been loaded
      const prevPos = previousCameraPosition.current;
      const distanceMoved = Math.sqrt(
        (cameraPosition.x - prevPos.x) ** 2 +
          (cameraPosition.z - prevPos.z) ** 2
      );

      if (
        distanceMoved < SIGNIFICANT_MOVE_DISTANCE &&
        cellsLoadedWithinDistance
      ) {
        return;
      }

      // Update the previous camera position
      previousCameraPosition.current = {
        x: cameraPosition.x,
        z: cameraPosition.z,
      };

      const newLoadingQueue = [];

      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const newX = cellX + dx;
          const newZ = cellZ + dz;
          const distanceX = Math.abs(cameraPosition.x - newX * GRID_SIZE);
          const distanceZ = Math.abs(cameraPosition.z - newZ * GRID_SIZE);
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
        const distanceX = Math.abs(cameraPosition.x - x * GRID_SIZE);
        const distanceZ = Math.abs(cameraPosition.z - z * GRID_SIZE);
        const distance = Math.sqrt(distanceX ** 2 + distanceZ ** 2);

        if (distance > UNLOAD_DISTANCE) {
          console.log(`Unloading cell at (${x}, ${z})`);
          unloadCell(x, z);
        } else if (distance > UNLOAD_DETAIL_DISTANCE) {
          unloadDetailedSpheres(cellKey);
        }
      });
    }, 1), // Adjust the debounce delay as needed
    [
      cameraRef,
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
  }, [cameraRef.current?.position]);

  useEffect(() => {
    const handleCameraMove = () => {
      loadCellsAroundCamera();
    };

    const interval = setInterval(handleCameraMove, 1); // Check every 100ms

    return () => clearInterval(interval);
  }, [loadCellsAroundCamera]);

  useEffect(() => {
    // Change the load distance after initial cells are loaded
    if (loadingQueue.length === 0) {
      setCurrentLoadDistance(150000);
    }
  }, [loadingQueue]);

  return null;
});

export default CellLoader;
