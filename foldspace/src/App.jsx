import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  Suspense,
} from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import { Stats, useProgress, Html } from '@react-three/drei';
import { useStore } from './store';
import PlaneMesh from './PlaneMesh';
import CustomCamera from './CustomCamera';
import { MemoizedSphere } from './Sphere';
import {
  sphereMaterial,
  redSphereMaterial,
  greenSphereMaterial,
  blueSphereMaterial,
  getSpherePositions,
  purpleSphereMaterial,
} from './SphereData';
import SphereRenderer from './sphereRenderer'; // Assuming SphereRenderer is in the same directory

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}

function App() {
  const setCameraPosition = useStore((state) => state.setCameraPosition);
  const defaultPosition = useStore((state) => state.defaultPosition);
  const positions = useStore((state) => state.positions) || [];
  const setPositions = useStore((state) => state.setPositions);
  const totalSpheres = 10000;
  const planes = 6;
  const spheresPerPlane = Math.floor(totalSpheres / planes);
  const sphereRefs = useRef(Array(totalSpheres).fill(null));
  const instancedMeshRef = useRef();
  const redInstancedMeshRef = useRef();
  const greenInstancedMeshRef = useRef();
  const blueInstancedMeshRef = useRef();
  const purpleInstancedMeshRef = useRef();

  const handleMoveUp = useCallback(() => {
    useStore
      .getState()
      .setCurrentPlaneIndex(
        (useStore.getState().currentPlaneIndex + 1) % planes
      );
  }, [defaultPosition, setCameraPosition]);

  const handleMoveDown = useCallback(() => {
    setCameraPosition({
      x: defaultPosition.x,
      y: defaultPosition.y - 650,
      z: defaultPosition.z,
    });
    useStore
      .getState()
      .setCurrentPlaneIndex(
        (useStore.getState().currentPlaneIndex - 1 + planes) % planes
      );
  }, [defaultPosition, setCameraPosition]);

  useEffect(() => {
    // Function to fetch positions from the server
    const fetchPositionsFromServer = async () => {
      try {
        const response = await fetch('http://localhost:5000/get-sphere-data');
        if (!response.ok) throw new Error('Failed to fetch sphere data');
        const data = await response.json();
        // Assuming the server response format is an object with keys like plane_0, plane_1, etc.
        const positionsArray = Object.keys(data.positions).map((key) => {
          return data.positions[key].map(
            (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
          );
        });
        return positionsArray; // Return the array of arrays of THREE.Vector3 objects
      } catch (error) {
        console.error('Error fetching positions from server:', error);
        return null;
      }
    };

    // Function to save positions to the server
    const savePositionsToServer = async (positions) => {
      try {
        // Transform the nested arrays into an object with keys
        const positionsObject = positions.reduce(
          (acc, planePositions, index) => {
            acc[`plane_${index}`] = planePositions.map(({ x, y, z }) => ({
              x,
              y,
              z,
            }));
            return acc;
          },
          {}
        );

        const response = await fetch('http://localhost:5000/save-sphere-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ positions: positionsObject }),
        });
        if (!response.ok) throw new Error('Failed to save sphere data');
        console.log('Positions saved to server');
      } catch (error) {
        console.error('Error saving positions to server:', error);
      }
    };

    // Attempt to fetch positions from the server first
    fetchPositionsFromServer().then((serverPositions) => {
      if (serverPositions) {
        // If positions are fetched successfully, use them
        setPositions(
          serverPositions.map((planePositions) =>
            planePositions.map((pos) => new THREE.Vector3(pos.x, pos.y, pos.z))
          )
        );
      } else {
        // Generate new positions if none are fetched from the server
        const newPositions = Array(planes)
          .fill(0)
          .map((_, i) => {
            const planePositions = [];
            while (planePositions.length < spheresPerPlane) {
              const radius = Math.sqrt(Math.random()) * 50000;
              const angle = Math.random() * 2 * Math.PI;
              const x = radius * Math.cos(angle);
              const z = radius * Math.sin(angle);
              const newPosition = new THREE.Vector3(x, i * 1000, z);

              if (
                planePositions.every(
                  (position) => position.distanceTo(newPosition) >= 1200
                )
              ) {
                planePositions.push(newPosition);
              }
            }
            return planePositions;
          });

        const cameraPosition = new THREE.Vector3(
          defaultPosition.x,
          defaultPosition.y,
          defaultPosition.z
        );
        const positionsWithin10000 = newPositions
          .map((planePositions) =>
            planePositions.filter(
              (position) => position.distanceTo(cameraPosition) <= 10000
            )
          )
          .filter((planePositions) => planePositions.length > 0);

        // Convert THREE.Vector3 objects to plain objects for saving
        const positionsToSave = positionsWithin10000.map((planePositions) =>
          planePositions.map(({ x, y, z }) => ({ x, y, z }))
        );

        // Save the newly generated positions to the server
        savePositionsToServer(positionsToSave);

        // Update the state with the new positions
        setPositions(positionsWithin10000);
      }
    });
  }, []);

  const flattenedPositions = useMemo(() => positions.flat(), [positions]);
  const {
    redSpherePositions,
    greenSpherePositions,
    blueSpherePositions,
    purpleSpherePositions,
  } = useMemo(
    () => getSpherePositions(flattenedPositions),
    [flattenedPositions]
  );

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', zIndex: 1 }}>
        <button onClick={handleMoveUp}>Move Up</button>
        <button onClick={handleMoveDown}>Move Down</button>
      </div>
      <Canvas frameloop="onDemand">
        <Suspense fallback={<Loader />}>
          <Stats />
          <ambientLight />
          <SphereRenderer flattenedPositions={flattenedPositions} />
          <CustomCamera />
        </Suspense>
      </Canvas>
    </div>
  );
}
export default App;
