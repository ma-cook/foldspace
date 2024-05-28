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

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
}

function App() {
  const setCameraPosition = useStore((state) => state.setCameraPosition);
  const defaultPosition = useStore((state) => state.defaultPosition);
  const positions = useStore((state) => state.positions);
  const setPositions = useStore((state) => state.setPositions);
  const totalSpheres = 1000;
  const planes = 5;
  const spheresPerPlane = Math.floor(totalSpheres / planes);
  const sphereRefs = useRef([]);
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
    const newPositions = Array(planes)
      .fill(0)
      .map((_, i) => {
        const planePositions = [];
        while (planePositions.length < spheresPerPlane) {
          const radius = Math.sqrt(Math.random()) * 250000;
          const angle = Math.random() * 2 * Math.PI;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          const newPosition = new THREE.Vector3(x, i * 2000, z);

          if (
            planePositions.every(
              (position) => position.distanceTo(newPosition) >= 2200
            )
          ) {
            planePositions.push(newPosition);
          }
        }
        return planePositions;
      });

    setPositions(newPositions);
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
      <Canvas>
        <Suspense fallback={<Loader />}>
          <Stats />
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
                  purpleInstancedMeshRef={purpleInstancedMeshRef}
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
                  scale={[0.2, 0.2, 0.2]}
                />
                <MemoizedSphere
                  ref={greenInstancedMeshRef}
                  positions={greenSpherePositions}
                  material={greenSphereMaterial}
                  scale={[0.2, 0.2, 0.2]}
                />
                <MemoizedSphere
                  ref={blueInstancedMeshRef}
                  positions={blueSpherePositions}
                  material={blueSphereMaterial}
                  scale={[0.2, 0.2, 0.2]}
                />
                <MemoizedSphere
                  ref={purpleInstancedMeshRef}
                  positions={purpleSpherePositions}
                  material={purpleSphereMaterial}
                  scale={[0.35, 0.35, 0.35]}
                />
              </group>
            );
          })}
          <CustomCamera />
        </Suspense>
      </Canvas>
    </div>
  );
}
export default App;
