import React, {
  useRef,
  useEffect,
  useMemo,
  Suspense,
  useState,
  useCallback,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from './store';
import { Stats, useProgress, Html } from '@react-three/drei';
import CustomCamera from './CustomCamera';
import SphereRenderer from './sphereRenderer'; // Assuming SphereRenderer is in the same directory
import PlaneMesh from './PlaneMesh'; // Import PlaneMesh
import { throttle } from 'lodash';

const GRID_SIZE = 20000; // Size of each grid cell
const LOAD_DISTANCE = 20000; // Distance from the edge to trigger loading new cells
const UNLOAD_DISTANCE = 40000; // Distance to trigger unloading cells (increased for better performance)

const cellCache = {};

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}

const CellLoader = React.memo(({ cameraRef, loadCell, unloadCell }) => {
  const [currentCell, setCurrentCell] = useState({ x: null, z: null });

  useFrame(
    throttle(() => {
      if (!cameraRef.current) return;

      const cameraPosition = cameraRef.current.position;
      if (!cameraPosition) return; // Add this null check

      const cellX = Math.floor(cameraPosition.x / GRID_SIZE);
      const cellZ = Math.floor(cameraPosition.z / GRID_SIZE);

      if (currentCell.x === cellX && currentCell.z === cellZ) {
        // Current cell is already loaded, no need to reload
        return;
      }

      setCurrentCell({ x: cellX, z: cellZ });

      // Load adjacent cells if the camera is close to the edge
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

      // Unload cells that are too far away
      const loadedCells = new Set(useStore.getState().loadedCells);

      loadedCells.forEach((cellKey) => {
        const [x, z] = cellKey.split(',').map(Number);
        const distanceX = Math.abs(cameraPosition.x - x * GRID_SIZE);
        const distanceZ = Math.abs(cameraPosition.z - z * GRID_SIZE);

        if (distanceX > UNLOAD_DISTANCE || distanceZ > UNLOAD_DISTANCE) {
          unloadCell(x, z);
        }
      });
    }, 16)
  );

  return null;
});

const App = React.memo(() => {
  const defaultPosition = useStore((state) => state.defaultPosition);
  const loadedCells = useStore((state) => state.loadedCells);
  const positions = useStore((state) => state.positions);
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const setPositions = useStore((state) => state.setPositions);
  const removePositions = useStore((state) => state.removePositions);
  const cameraRef = useRef();
  const [loadingCells, setLoadingCells] = useState(new Set());

  const saveCellData = useCallback(async (cellKey, positions) => {
    try {
      await fetch('http://localhost:5000/save-sphere-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cellKey, positions }),
      });
    } catch (error) {
      console.error('Error saving cell data to Firestore:', error);
    }
  }, []);

  const loadCell = useCallback(
    async (x, z) => {
      const cellKey = `${x},${z}`;
      if (loadedCells.includes(cellKey) || loadingCells.has(cellKey)) {
        return;
      }

      setLoadingCells((prev) => new Set(prev).add(cellKey));

      try {
        const response = await fetch(
          `http://localhost:5000/get-sphere-data/${cellKey}`
        );

        if (response.ok) {
          const { positions: savedPositions } = await response.json();
          const newPositions = savedPositions.map(
            (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
          );
          cellCache[cellKey] = newPositions;
          setPositions((prevPositions) => [...prevPositions, ...newPositions]);
          setLoadedCells((prevLoadedCells) => {
            const updatedLoadedCells = [...prevLoadedCells, cellKey];

            return updatedLoadedCells;
          });
        } else if (response.status === 404) {
          // Generate positions for the new cell
          const newPositions = [];
          for (let i = 0; i < 200; i++) {
            const posX = x * GRID_SIZE + Math.random() * GRID_SIZE;
            const posY = Math.floor(Math.random() * 6) * 500; // Constrain posY to multiples of 300
            const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
            newPositions.push(new THREE.Vector3(posX, posY, posZ));
          }

          // Cache the positions for the cell
          cellCache[cellKey] = newPositions;

          setPositions((prevPositions) => [...prevPositions, ...newPositions]);
          setLoadedCells((prevLoadedCells) => {
            const updatedLoadedCells = [...prevLoadedCells, cellKey];

            return updatedLoadedCells;
          });

          // Save the new cell data to Firestore
          await saveCellData(cellKey, newPositions);
        } else {
          console.error(
            'Error loading cell data from Firestore:',
            response.statusText
          );
        }
      } catch (error) {
        console.error('Error loading cell data from Firestore:', error);
      } finally {
        setLoadingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }
    },
    [loadedCells, loadingCells, saveCellData, setLoadedCells, setPositions]
  );

  const unloadCell = useCallback(
    (x, z) => {
      const cellKey = `${x},${z}`;
      if (!loadedCells.includes(cellKey)) return;

      // Remove positions of the cell from the state
      const cellPositions = cellCache[cellKey];
      if (cellPositions) {
        removePositions(cellPositions);
      }
      setLoadedCells((prevLoadedCells) =>
        prevLoadedCells.filter((key) => key !== cellKey)
      );

      // Clean up the cache
      delete cellCache[cellKey];
    },
    [loadedCells, setLoadedCells, removePositions]
  );

  useEffect(() => {
    // Load the initial cell
    loadCell(0, 0);
  }, [loadCell]);

  const flattenedPositions = useMemo(() => {
    if (
      Array.isArray(positions) &&
      positions.length > 0 &&
      Array.isArray(positions[0])
    ) {
      return positions.flat();
    }
    return positions;
  }, [positions]);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <Canvas>
        <Suspense fallback={<Loader />}>
          <Stats />
          <ambientLight />
          <SphereRenderer
            flattenedPositions={
              Array.isArray(flattenedPositions) ? flattenedPositions : []
            }
          />
          <CustomCamera ref={cameraRef} />
          <CellLoader
            cameraRef={cameraRef}
            loadCell={loadCell}
            unloadCell={unloadCell}
          />
          {loadedCells.map((cellKey, index) => {
            const [x, z] = cellKey.split(',').map(Number);

            const positions = Array(6)
              .fill()
              .map((_, i) => [x * GRID_SIZE, i * 500, z * GRID_SIZE]); // Create positions for 6 planes at different heights
            return (
              <PlaneMesh
                key={`${cellKey}-${index}`}
                positions={positions} // Pass positions array
                sphereRefs={{}} // Pass necessary refs
                instancedMeshRef={{}} // Pass necessary refs
                redInstancedMeshRef={{}} // Pass necessary refs
                greenInstancedMeshRef={{}} // Pass necessary refs
                blueInstancedMeshRef={{}} // Pass necessary refs
                purpleInstancedMeshRef={{}} // Pass necessary refs
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
});

export default App;
