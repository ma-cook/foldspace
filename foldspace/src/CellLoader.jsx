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
  const [loadingCells, setLoadingCells] = useState(new Set());
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

          if (distance < LOAD_DISTANCE) {
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

      const newLoadingCells = new Set(loadingCells);

      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const newX = cellX + dx;
          const newZ = cellZ + dz;
          const distanceX = Math.abs(cameraPosition.x - newX * GRID_SIZE);
          const distanceZ = Math.abs(cameraPosition.z - newZ * GRID_SIZE);
          const distance = Math.sqrt(distanceX ** 2 + distanceZ ** 2);

          if (distance < LOAD_DISTANCE) {
            const cellKey = `${newX},${newZ}`;
            if (!loadedCells.has(cellKey) && !newLoadingCells.has(cellKey)) {
              newLoadingCells.add(cellKey);
              loadCell(
                newX,
                newZ,
                distance < DETAIL_DISTANCE,
                loadedCells,
                newLoadingCells,
                setLoadingCells,
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
                setLoadingCells((prev) => {
                  const updatedSet = new Set(prev);
                  updatedSet.delete(cellKey);
                  return updatedSet;
                });
              });
            }
          }
        }
      }

      setLoadingCells(newLoadingCells);

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
      loadingCells,
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
    ]
  );

  useFrame(loadCellsAroundCamera);

  useEffect(() => {
    loadCellsAroundCamera();
    return () => {
      loadCellsAroundCamera.cancel();
    };
  }, [cameraRef.current?.position]);

  return null;
});

export default CellLoader;
