import React, { useRef, useEffect, useState, useMemo } from 'react';
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

const createSphereMesh = (material) => {
  return new THREE.Mesh(sphereGeometry, material);
};

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

  const sphereMaterials = useMemo(
    () => ({
      red: redSphereMaterial,
      green: greenSphereMaterial,
      blue: blueSphereMaterial,
      purple: purpleSphereMaterial,
    }),
    []
  );

  const spherePools = useMemo(
    () => ({
      default: new SpherePool(() => createSphereMesh(sphereMaterial), 50, 100),
      red: new SpherePool(() => createSphereMesh(redSphereMaterial), 50, 100),
      green: new SpherePool(
        () => createSphereMesh(greenSphereMaterial),
        50,
        100
      ),
      blue: new SpherePool(() => createSphereMesh(blueSphereMaterial), 50, 100),
      purple: new SpherePool(
        () => createSphereMesh(purpleSphereMaterial),
        50,
        100
      ),
    }),
    []
  );

  useEffect(() => {
    const newYellowPositions = flattenedPositions.filter(
      (pos) => !previousYellowPositions.current.has(pos.toArray().toString())
    );

    if (newYellowPositions.length > 0) {
      const newPositions = getSpherePositions(newYellowPositions);

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

    const spheres = ['red', 'green', 'blue', 'purple'].map((color) => {
      const sphere = spherePools[color].get();
      sphere.material = sphereMaterials[color];
      return sphere;
    });

    return () => {
      spheres.forEach((sphere, index) => {
        const color = ['red', 'green', 'blue', 'purple'][index];
        spherePools[color].release(sphere);
      });
    };
  }, [flattenedPositions, sphereMaterials, spherePools]);

  useEffect(() => {
    return () => {
      // Cleanup sphere data when component unmounts
      setSphereData({
        red: [],
        green: [],
        blue: [],
        purple: [],
      });
      previousYellowPositions.current.clear();
    };
  }, []);

  return (
    <>
      {planeMeshRefs.current.map((ref, i) => (
        <PlaneMesh
          key={`plane-${i}`}
          id={i}
          ref={ref}
          sphereRefs={sphereRefs}
          instancedMeshRef={sphereRefs.central}
          redInstancedMeshRef={sphereRefs.red}
          greenInstancedMeshRef={sphereRefs.green}
          blueInstancedMeshRef={sphereRefs.blue}
          purpleInstancedMeshRef={sphereRefs.purple}
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
          key={`sphere-${color}-${index}`}
          ref={sphereRefs[color]}
          positions={sphereData[color]}
          material={sphereMaterials[color]}
          geometry={sphereGeometry}
          scale={[0.2, 0.2, 0.2]}
          frustumCulled={false}
        />
      ))}
    </>
  );
};

export default SphereRenderer;
