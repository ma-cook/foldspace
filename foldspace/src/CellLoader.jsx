import React, { useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { throttle } from 'lodash';
import { useStore } from './store';

const GRID_SIZE = 80000;
const LOAD_DISTANCE = 120000;
const UNLOAD_DISTANCE = 120000;
const DETAIL_DISTANCE = 60000;
const UNLOAD_DETAIL_DISTANCE = 60000; // Add UNLOAD_DETAIL_DISTANCE

const CellLoader = React.memo(({ cameraRef, loadCell, unloadCell }) => {
  const [currentCell, setCurrentCell] = useState({ x: null, z: null });
  const [loadingCells, setLoadingCells] = useState(new Set());

  const loadCellsAroundCamera = () => {
    if (!cameraRef.current) return;

    const cameraPosition = cameraRef.current.position;
    if (!cameraPosition) return;

    const cellX = Math.floor(cameraPosition.x / GRID_SIZE);
    const cellZ = Math.floor(cameraPosition.z / GRID_SIZE);

    if (currentCell.x === cellX && currentCell.z === cellZ) {
      return;
    }

    setCurrentCell({ x: cellX, z: cellZ });

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const newX = cellX + dx;
        const newZ = cellZ + dz;
        const distanceX = Math.abs(cameraPosition.x - newX * GRID_SIZE);
        const distanceZ = Math.abs(cameraPosition.z - newZ * GRID_SIZE);
        const distance = Math.sqrt(distanceX ** 2 + distanceZ ** 2);

        if (distance < LOAD_DISTANCE) {
          const cellKey = `${newX},${newZ}`;
          if (!loadingCells.has(cellKey)) {
            setLoadingCells((prev) => new Set(prev).add(cellKey));
            loadCell(
              newX,
              newZ,
              distance < DETAIL_DISTANCE, // Pass loadDetail based on distance
              new Set(useStore.getState().loadedCells), // Ensure loadedCells is a Set
              new Set(loadingCells), // Ensure loadingCells is a Set
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
                const newSet = new Set(prev);
                newSet.delete(cellKey);
                return newSet;
              });
            });
          }
        }
      }
    }

    const loadedCells = new Set(useStore.getState().loadedCells);

    loadedCells.forEach((cellKey) => {
      const [x, z] = cellKey.split(',').map(Number);
      const distanceX = Math.abs(cameraPosition.x - x * GRID_SIZE);
      const distanceZ = Math.abs(cameraPosition.z - z * GRID_SIZE);
      const distance = Math.sqrt(distanceX ** 2 + distanceZ ** 2);

      if (distanceX > UNLOAD_DISTANCE || distanceZ > UNLOAD_DISTANCE) {
        unloadCell(x, z);
      } else if (distance > UNLOAD_DETAIL_DISTANCE) {
        // Unload detailed spheres if beyond UNLOAD_DETAIL_DISTANCE
        useStore.getState().unloadDetailedSpheres(cellKey);
      }
    });
  };

  const throttledFrame = useMemo(
    () => throttle(loadCellsAroundCamera, 100), // Increase throttle delay to 100ms
    [cameraRef, currentCell, loadCell, unloadCell, loadingCells]
  );

  useFrame(throttledFrame);

  useEffect(() => {
    loadCellsAroundCamera(); // Trigger loading on mount and camera position change
    return () => {
      throttledFrame.cancel();
    };
  }, [cameraRef.current?.position]);

  return null;
});

export default CellLoader;
