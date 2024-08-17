import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import PlaneMesh from './PlaneMesh';
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
  return new THREE.Mesh(sphereGeometry, sphereMaterial);
};

const spherePool = new SpherePool(createSphereMesh, 50);

const calculateAverageY = (positions) => {
  const totalY = positions.reduce((sum, pos) => sum + pos[1], 0);
  return totalY / positions.length;
};

const SphereRenderer = ({ flattenedPositions }) => {
  const planeMeshRefs = useRef(
    Array(6)
      .fill(null)
      .map(() => React.createRef())
  );

  const sphereRefs = {
    red: useRef(),
    green: useRef(),
    blue: useRef(),
    purple: useRef(),
    central: useRef(),
  };

  const sphereData = useMemo(() => {
    if (!Array.isArray(flattenedPositions)) {
      console.error('flattenedPositions is not an array:', flattenedPositions);
      return [];
    }

    const positions = getSpherePositions(flattenedPositions);
    return [
      {
        positions: positions.redSpherePositions,
        material: redSphereMaterial,
        ref: sphereRefs.red,
      },
      {
        positions: positions.greenSpherePositions,
        material: greenSphereMaterial,
        ref: sphereRefs.green,
      },
      {
        positions: positions.blueSpherePositions,
        material: blueSphereMaterial,
        ref: sphereRefs.blue,
      },
      {
        positions: positions.purpleSpherePositions,
        material: purpleSphereMaterial,
        ref: sphereRefs.purple,
      },
    ];
  }, [flattenedPositions]);

  useEffect(() => {
    const sphere = spherePool.get();
    sphere.material = redSphereMaterial;

    return () => {
      spherePool.release(sphere);
    };
  }, []);

  return (
    <>
      {planeMeshRefs.current.map((ref, i) => (
        <PlaneMesh
          key={i}
          id={i}
          ref={ref}
          sphereRefs={sphereRefs}
          instancedMeshRef={sphereRefs.central}
          redInstancedMeshRef={sphereRefs.red}
          greenInstancedMeshRef={sphereRefs.green}
          blueInstancedMeshRef={sphereRefs.blue}
          purpleInstancedMeshRef={sphereRefs.purple}
          positionY={i * 300}
        />
      ))}
      <MemoizedSphere
        ref={sphereRefs.central}
        positions={Array.isArray(flattenedPositions) ? flattenedPositions : []}
        material={sphereMaterial}
        geometry={sphereGeometry}
      />
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
