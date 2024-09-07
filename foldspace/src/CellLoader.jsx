import React, { useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { throttle } from 'lodash';
import { useStore } from './store';

const GRID_SIZE = 20000;
const LOAD_DISTANCE = 40000;
const UNLOAD_DISTANCE = 40000;

const CellLoader = React.memo(({ cameraRef, loadCell, unloadCell }) => {
  const [currentCell, setCurrentCell] = useState({ x: null, z: null });

  const throttledFrame = useMemo(
    () =>
      throttle(() => {
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

            if (distanceX < LOAD_DISTANCE && distanceZ < LOAD_DISTANCE) {
              loadCell(newX, newZ);
            }
          }
        }

        const loadedCells = new Set(useStore.getState().loadedCells);

        loadedCells.forEach((cellKey) => {
          const [x, z] = cellKey.split(',').map(Number);
          const distanceX = Math.abs(cameraPosition.x - x * GRID_SIZE);
          const distanceZ = Math.abs(cameraPosition.z - z * GRID_SIZE);

          if (distanceX > UNLOAD_DISTANCE || distanceZ > UNLOAD_DISTANCE) {
            unloadCell(x, z);
          }
        });
      }, 60),
    [cameraRef, currentCell, loadCell, unloadCell]
  );

  useFrame(throttledFrame);

  useEffect(() => {
    return () => {
      throttledFrame.cancel();
    };
  }, [throttledFrame]);

  return null;
});

export default CellLoader;
