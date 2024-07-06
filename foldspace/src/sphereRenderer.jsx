import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import PlaneMesh from './PlaneMesh'; // Import PlaneMesh
import {
  sphereMaterial,
  redSphereMaterial,
  greenSphereMaterial,
  blueSphereMaterial,
  purpleSphereMaterial,
  getSpherePositions,
} from './SphereData';
import { MemoizedSphere } from './Sphere';
import * as THREE from 'three';
import SpherePool from './SpherePool';

const sphereGeometry = new THREE.SphereGeometry(10, 20, 20);

const createSphereMesh = () => {
  return new THREE.Mesh(sphereGeometry, sphereMaterial); // Default material, can be changed later
};

const spherePool = new SpherePool(createSphereMesh, 50);

const SphereRenderer = ({ flattenedPositions }) => {
  const planeMeshRefs = Array(6)
    .fill(null)
    .map(() => useRef());

  const sphereRefs = {
    red: useRef(),
    green: useRef(),
    blue: useRef(),
    purple: useRef(),
    central: useRef(), // Reference for the central sphere
  };

  const sphereData = [
    {
      positions: getSpherePositions(flattenedPositions).redSpherePositions,
      material: redSphereMaterial,
      ref: sphereRefs.red,
    },
    {
      positions: getSpherePositions(flattenedPositions).greenSpherePositions,
      material: greenSphereMaterial,
      ref: sphereRefs.green,
    },
    {
      positions: getSpherePositions(flattenedPositions).blueSpherePositions,
      material: blueSphereMaterial,
      ref: sphereRefs.blue,
    },
    {
      positions: getSpherePositions(flattenedPositions).purpleSpherePositions,
      material: purpleSphereMaterial,
      ref: sphereRefs.purple,
    },
  ];

  useEffect(() => {
    // Example of using the pool to get a sphere
    const sphere = spherePool.get();
    // Set the material or any other properties as needed
    sphere.material = redSphereMaterial; // Example of changing the material

    // When the component unmounts or you're done with the sphere
    return () => {
      spherePool.release(sphere);
    };
  }, []);

  return (
    <>
      {/* Iterate over planes and render PlaneMesh for each */}
      {planeMeshRefs.map((ref, i) => (
        <PlaneMesh
          key={i}
          id={i}
          ref={ref} // Pass the unique ref here
          sphereRefs={sphereRefs}
          instancedMeshRef={sphereRefs.central}
          redInstancedMeshRef={sphereRefs.red}
          greenInstancedMeshRef={sphereRefs.green}
          blueInstancedMeshRef={sphereRefs.blue}
          purpleInstancedMeshRef={sphereRefs.purple}
          positionY={i * 1000 - 1}
        />
      ))}
      {/* Central MemoizedSphere */}
      <MemoizedSphere
        ref={sphereRefs.central}
        positions={flattenedPositions}
        material={sphereMaterial}
        geometry={sphereGeometry}
      />
      {/* Render spheres based on their colors */}
      {sphereData.map((data, index) => (
        <MemoizedSphere
          key={index}
          ref={data.ref}
          positions={data.positions}
          material={data.material}
          geometry={sphereGeometry}
          scale={[0.2, 0.2, 0.2]}
        />
      ))}
    </>
  );
};

export default SphereRenderer;
