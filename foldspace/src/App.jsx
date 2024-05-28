import React, { useCallback, useEffect, useRef, memo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { cullInstance } from './Culling';
import * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import { OrbitControls } from '@react-three/drei';
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
} from './SphereData';

function App() {
  const setCameraPosition = useStore((state) => state.setCameraPosition);
  const defaultPosition = useStore((state) => state.defaultPosition);
  const positions = useStore((state) => state.positions);
  const setPositions = useStore((state) => state.setPositions);
  const totalSpheres = 5000;
  const planes = 5;
  const spheresPerPlane = Math.floor(totalSpheres / planes);
  const sphereRefs = useRef([]);
  const instancedMeshRef = useRef();
  const redInstancedMeshRef = useRef();
  const greenInstancedMeshRef = useRef();
  const blueInstancedMeshRef = useRef();
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
    const newPositions = Array(planes)
      .fill(0)
      .map((_, i) => {
        const planePositions = [];
        while (planePositions.length < spheresPerPlane) {
          const radius = Math.sqrt(Math.random()) * 300000;
          const angle = Math.random() * 2 * Math.PI;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          const newPosition = new THREE.Vector3(x, i * 2500, z);

          if (
            planePositions.every(
              (position) => position.distanceTo(newPosition) >= 3000
            )
          ) {
            planePositions.push(newPosition);
          }
        }
        return planePositions;
      });

    setPositions(newPositions);
  }, []);

  const flattenedPositions = positions.flat();
  const { redSpherePositions, greenSpherePositions, blueSpherePositions } =
    getSpherePositions(flattenedPositions);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', zIndex: 1 }}>
        <button onClick={handleMoveUp}>Move Up</button>
        <button onClick={handleMoveDown}>Move Down</button>
      </div>
      <Canvas frameloop="demand">
        <ambientLight />
        {positions.map((planePositions, i) => {
          return (
            <group key={i}>
              <PlaneMesh
                sphereRefs={sphereRefs}
                instancedMeshRef={instancedMeshRef}
                redInstancedMeshRef={redInstancedMeshRef}
                greenInstancedMeshRef={greenInstancedMeshRef} // This should be greenInstancedMeshRef
                blueInstancedMeshRef={blueInstancedMeshRef} // This should be blueInstancedMeshRef
                positionY={i * 2500 - 1}
              />
              <MemoizedSphere
                ref={instancedMeshRef}
                positions={flattenedPositions}
                material={sphereMaterial}
              />
              <MemoizedSphere
                ref={redInstancedMeshRef}
                positions={redSpherePositions}
                material={redSphereMaterial}
                scale={[0.5, 0.5, 0.5]}
              />
              <MemoizedSphere
                ref={greenInstancedMeshRef}
                positions={greenSpherePositions}
                material={greenSphereMaterial}
                scale={[0.5, 0.5, 0.5]}
              />
              <MemoizedSphere
                ref={blueInstancedMeshRef}
                positions={blueSpherePositions}
                material={blueSphereMaterial}
                scale={[0.5, 0.5, 0.5]}
              />
            </group>
          );
        })}
        <CustomCamera />
      </Canvas>
    </div>
  );
}
export default App;
