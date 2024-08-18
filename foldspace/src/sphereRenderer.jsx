import React, { useRef, useEffect, useState } from 'react';
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

const SphereRenderer = ({ flattenedPositions }) => {
  const [sphereData, setSphereData] = useState({
    red: [],
    green: [],
    blue: [],
    purple: [],
  });

  const previousYellowPositions = useRef(new Set());

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

  useEffect(() => {
    const newYellowPositions = flattenedPositions.filter(
      (pos) => !previousYellowPositions.current.has(pos.toArray().toString())
    );

    if (newYellowPositions.length > 0) {
      const newPositions = getSpherePositions(newYellowPositions);
      console.log('Sphere positions:', newPositions);

      setSphereData((prevData) => ({
        red: [...prevData.red, ...newPositions.redSpherePositions],
        green: [...prevData.green, ...newPositions.greenSpherePositions],
        blue: [...prevData.blue, ...newPositions.blueSpherePositions],
        purple: [...prevData.purple, ...newPositions.purpleSpherePositions],
      }));

      newYellowPositions.forEach((pos) =>
        previousYellowPositions.current.add(pos.toArray().toString())
      );
    }
  }, [flattenedPositions]);

  useEffect(() => {
    console.log('Getting a sphere from the pool');
    const sphere = spherePool.get();
    sphere.material = redSphereMaterial;

    return () => {
      console.log('Releasing a sphere back to the pool');
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
          frustumCulled={false}
        />
      ))}
      <MemoizedSphere
        ref={sphereRefs.central}
        positions={Array.isArray(flattenedPositions) ? flattenedPositions : []}
        material={sphereMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
      />
      {['red', 'green', 'blue', 'purple'].map((color, index) => (
        <MemoizedSphere
          key={index}
          ref={sphereRefs[color]}
          positions={sphereData[color]}
          material={eval(`${color}SphereMaterial`)}
          geometry={sphereGeometry}
          scale={[0.2, 0.2, 0.2]}
          frustumCulled={false}
        />
      ))}
    </>
  );
};

export default SphereRenderer;
