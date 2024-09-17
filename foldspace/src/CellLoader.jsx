import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { throttle } from 'lodash';
import { useStore } from './store';

const GRID_SIZE = 80000;
const LOAD_DISTANCE = 120000;
const UNLOAD_DISTANCE = 240000;
const DETAIL_DISTANCE = 40000;
const UNLOAD_DETAIL_DISTANCE = 60000;
const SIGNIFICANT_MOVE_DISTANCE = 50000; // Define the threshold distance

const CellLoader = React.memo(({ cameraRef, loadCell, unloadCell }) => {
  const [loadingCells, setLoadingCells] = useState(new Set());
  const previousCameraPosition = useRef({ x: null, z: null });

  const loadCellsAroundCamera = useMemo(() => {
    return throttle(() => {
      if (!cameraRef.current) return;

      const cameraPosition = cameraRef.current.position;
      if (!cameraPosition) return;

      const cellX = Math.floor(cameraPosition.x / GRID_SIZE);
      const cellZ = Math.floor(cameraPosition.z / GRID_SIZE);

      const loadedCells = useStore.getState().loadedCells;

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
                useStore.getState().setPositions,
                useStore.getState().setRedPositions,
                useStore.getState().setGreenPositions,
                useStore.getState().setBluePositions,
                useStore.getState().setPurplePositions,
                useStore.getState().setLoadedCells,
                useStore.getState().swapBuffers
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
          useStore.getState().unloadDetailedSpheres(cellKey);
        }
      });
    }, 10); // Adjust the throttle delay as needed
  }, [cameraRef, loadCell, unloadCell, loadingCells]);

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
