import React, { useCallback, useEffect, useRef, memo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { cullInstance } from './Culling';
import * as THREE from 'three';
import { PerspectiveCamera } from '@react-three/drei';
import { OrbitControls } from '@react-three/drei';
import { useStore } from './store';
import PlaneMesh from './PlaneMesh';
import CustomCamera from './CustomCamera';

const sphereGeometry = new THREE.SphereGeometry(30, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 'white' });

const Sphere = React.forwardRef(({ positions }, ref) => {
  useEffect(() => {
    const mesh = ref.current;
    positions.forEach((position, index) => {
      mesh.setMatrixAt(index, new THREE.Matrix4().setPosition(position));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = positions.length; // Set the count to the total number of instances
  }, [positions]);

  return (
    <instancedMesh
      ref={ref}
      args={[sphereGeometry, sphereMaterial, positions.length]}
      scale={[1, 1, 1]} // Adjust this value for the smaller spheres
    />
  );
});

const MemoizedSphere = memo(Sphere);

function App() {
  const setCameraPosition = useStore((state) => state.setCameraPosition);
  const defaultPosition = useStore((state) => state.defaultPosition);
  const totalSpheres = 5000;
  const planes = 5;
  const spheresPerPlane = Math.floor(totalSpheres / planes);
  const sphereRefs = useRef([]);
  const instancedMeshRef = useRef();

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

  const setSphereRef = useCallback((el, i, j) => {
    sphereRefs.current[i * spheresPerPlane + j] = el;
  }, []);

  const positions = Array(planes)
    .fill(0)
    .map((_, i) => {
      const planePositions = [];
      while (planePositions.length < spheresPerPlane) {
        const radius = Math.sqrt(Math.random()) * 200000;
        const angle = Math.random() * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const newPosition = new THREE.Vector3(x, i * 2500, z);

        if (
          planePositions.every(
            (position) => position.distanceTo(newPosition) >= 1000
          )
        ) {
          planePositions.push(newPosition);
          // Add a smaller sphere 100 units away on the x-axis
          const smallerSpherePosition = new THREE.Vector3(x + 100, i * 2500, z);
          planePositions.push(smallerSpherePosition);
        }
      }
      return planePositions;
    });

  const flattenedPositions = positions.flat();

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
                instancedMeshRef={instancedMeshRef} // Pass the same ref to PlaneMesh
                positionY={i * 2500 - 1}
              />
              <Sphere ref={instancedMeshRef} positions={flattenedPositions} />
            </group>
          );
        })}
        <CustomCamera />
      </Canvas>
    </div>
  );
}
export default App;
