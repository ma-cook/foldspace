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
import SphereRenderer from './sphereRenderer';
import PlaneMesh from './PlaneMesh';
import { throttle } from 'lodash';
import cellCache from './cellCache';
import {
  sphereMaterial,
  redSphereMaterial,
  greenSphereMaterial,
  blueSphereMaterial,
  purpleSphereMaterial,
} from './SphereData';
import CellLoader from './CellLoader'; // Import the CellLoader component

const GRID_SIZE = 20000;
const LOAD_DISTANCE = 40000;
const UNLOAD_DISTANCE = 40000;

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}

const App = React.memo(() => {
  const loadedCells = useStore((state) => state.loadedCells);
  const positions = useStore((state) => state.positions);
  const redPositions = useStore((state) => state.redPositions);
  const greenPositions = useStore((state) => state.greenPositions);
  const bluePositions = useStore((state) => state.bluePositions);
  const purplePositions = useStore((state) => state.purplePositions);
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const setPositions = useStore((state) => state.setPositions);
  const setRedPositions = useStore((state) => state.setRedPositions);
  const setGreenPositions = useStore((state) => state.setGreenPositions);
  const setBluePositions = useStore((state) => state.setBluePositions);
  const setPurplePositions = useStore((state) => state.setPurplePositions);
  const removeAllPositions = useStore((state) => state.removeAllPositions);
  const removeSphereRefs = useStore((state) => state.removeSphereRefs);
  const swapBuffers = useStore((state) => state.swapBuffers);
  const cameraRef = useRef();
  const sphereRendererRef = useRef();
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

  const generateNewPositions = (x, z) => {
    const newPositions = [];
    const newRedPositions = [];
    const newGreenPositions = [];
    const newBluePositions = [];
    const newPurplePositions = [];

    for (let i = 0; i < 50; i++) {
      const posX = x * GRID_SIZE + Math.random() * GRID_SIZE;
      const posY = Math.floor(Math.random() * 6) * 1000;
      const posZ = z * GRID_SIZE + Math.random() * GRID_SIZE;
      const position = new THREE.Vector3(posX, posY, posZ);

      newPositions.push(position);

      if (i % 4 === 0) newRedPositions.push(position.clone());
      if (i % 4 === 1) newGreenPositions.push(position.clone());
      if (i % 4 === 2) newBluePositions.push(position.clone());
      if (i % 4 === 3) newPurplePositions.push(position.clone());
    }

    return {
      newPositions,
      newRedPositions,
      newGreenPositions,
      newBluePositions,
      newPurplePositions,
    };
  };

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
          const { positions: savedPositions = [] } = await response.json();

          const newPositions = savedPositions.positions.map(
            (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
          );
          const newRedPositions = savedPositions.redPositions.map(
            (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
          );
          const newGreenPositions = savedPositions.greenPositions.map(
            (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
          );
          const newBluePositions = savedPositions.bluePositions.map(
            (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
          );
          const newPurplePositions = savedPositions.purplePositions.map(
            (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
          );

          cellCache[cellKey] = newPositions;
          setPositions((prevPositions) => [...prevPositions, ...newPositions]);
          setRedPositions((prevPositions) => [
            ...prevPositions,
            ...newRedPositions,
          ]);
          setGreenPositions((prevPositions) => [
            ...prevPositions,
            ...newGreenPositions,
          ]);
          setBluePositions((prevPositions) => [
            ...prevPositions,
            ...newBluePositions,
          ]);
          setPurplePositions((prevPositions) => [
            ...prevPositions,
            ...newPurplePositions,
          ]);
          setLoadedCells((prevLoadedCells) => {
            const updatedLoadedCells = [...prevLoadedCells, cellKey];
            return updatedLoadedCells;
          });
        } else if (response.status === 404) {
          // Handle 404 error by generating new positions
          console.log(
            `Cell data not found for ${cellKey}, generating new data.`
          );

          const {
            newPositions,
            newRedPositions,
            newGreenPositions,
            newBluePositions,
            newPurplePositions,
          } = generateNewPositions(x, z);

          cellCache[cellKey] = newPositions;

          setPositions((prevPositions) => [...prevPositions, ...newPositions]);
          setRedPositions((prevPositions) => [
            ...prevPositions,
            ...newRedPositions,
          ]);
          setGreenPositions((prevPositions) => [
            ...prevPositions,
            ...newGreenPositions,
          ]);
          setBluePositions((prevPositions) => [
            ...prevPositions,
            ...newBluePositions,
          ]);
          setPurplePositions((prevPositions) => [
            ...prevPositions,
            ...newPurplePositions,
          ]);
          setLoadedCells((prevLoadedCells) => {
            const updatedLoadedCells = [...prevLoadedCells, cellKey];
            return updatedLoadedCells;
          });

          await saveCellData(cellKey, {
            positions: newPositions,
            redPositions: newRedPositions,
            greenPositions: newGreenPositions,
            bluePositions: newBluePositions,
            purplePositions: newPurplePositions,
          });
        } else {
          console.error(
            'Error loading cell data from Firestore:',
            response.statusText
          );
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading cell data from Firestore:', error);
        }
      } finally {
        setLoadingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
        swapBuffers(); // Swap buffers after loading cell data
      }
    },
    [
      loadedCells,
      loadingCells,
      saveCellData,
      setPositions,
      setRedPositions,
      setGreenPositions,
      setBluePositions,
      setPurplePositions,
      setLoadedCells,
      swapBuffers,
    ]
  );

  const disposeMaterial = (material) => {
    if (material && typeof material.dispose === 'function') {
      material.dispose();
    }
  };

  const unloadCell = useCallback(
    (x, z) => {
      const cellKey = `${x},${z}`;
      if (!loadedCells.includes(cellKey)) return;

      const cellPositions = cellCache[cellKey];
      if (cellPositions) {
        removeAllPositions(cellKey);
      }

      setLoadedCells((prevLoadedCells) =>
        prevLoadedCells.filter((key) => key !== cellKey)
      );

      removeSphereRefs(cellKey);
      useStore.getState().removePlaneMeshes(cellKey);
      delete cellCache[cellKey];

      if (sphereRendererRef.current) {
        sphereRendererRef.current.clearNonYellowSpheres(cellKey);
      }

      // Dispose of materials
      disposeMaterial(sphereMaterial);
      disposeMaterial(redSphereMaterial);
      disposeMaterial(greenSphereMaterial);
      disposeMaterial(blueSphereMaterial);
      disposeMaterial(purpleSphereMaterial);

      swapBuffers(); // Swap buffers after unloading cell data
    },
    [
      loadedCells,
      setLoadedCells,
      removeAllPositions,
      removeSphereRefs,
      sphereRendererRef,
      swapBuffers,
    ]
  );

  useEffect(() => {
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
            ref={sphereRendererRef}
            flattenedPositions={
              Array.isArray(flattenedPositions) ? flattenedPositions : []
            }
            redPositions={redPositions}
            greenPositions={greenPositions}
            bluePositions={bluePositions}
            purplePositions={purplePositions}
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
              .map((_, i) => [x * GRID_SIZE, i * 1000, z * GRID_SIZE]);
            return (
              <PlaneMesh
                key={`${cellKey}-${index}`}
                positions={positions}
                sphereRefs={{}}
                instancedMeshRef={{}}
                redInstancedMeshRef={{}}
                greenInstancedMeshRef={{}}
                blueInstancedMeshRef={{}}
                purpleInstancedMeshRef={{}}
                cellKey={cellKey}
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
});

export default App;
