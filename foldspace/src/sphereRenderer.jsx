import React, { useRef, useEffect, useMemo, forwardRef } from 'react';
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

const createInstancedMesh = (material, count = 100) => {
  return new THREE.InstancedMesh(sphereGeometry, material, count);
};

const SphereRenderer = forwardRef(({ flattenedPositions }, ref) => {
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
      default: new SpherePool(
        () => createInstancedMesh(sphereMaterial),
        10,
        100
      ),
      red: new SpherePool(
        () => createInstancedMesh(redSphereMaterial),
        10,
        100
      ),
      green: new SpherePool(
        () => createInstancedMesh(greenSphereMaterial),
        10,
        100
      ),
      blue: new SpherePool(
        () => createInstancedMesh(blueSphereMaterial),
        10,
        100
      ),
      purple: new SpherePool(
        () => createInstancedMesh(purpleSphereMaterial),
        10,
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

      newYellowPositions.forEach((pos) =>
        previousYellowPositions.current.add(pos.toArray().toString())
      );
    }

    const spheres = ['red', 'green', 'blue', 'purple'].map((color) => {
      const instancedMesh = spherePools[color].get();
      instancedMesh.material = sphereMaterials[color];
      return instancedMesh;
    });

    return () => {
      spheres.forEach((instancedMesh, index) => {
        const color = ['red', 'green', 'blue', 'purple'][index];
        spherePools[color].release(instancedMesh);
      });
    };
  }, [flattenedPositions, sphereMaterials, spherePools]);

  useEffect(() => {
    return () => {
      previousYellowPositions.current.clear();
    };
  }, []);

  const calculateCircularPositions = (centralPosition, radius, count) => {
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * 2 * Math.PI;
      const offsetX = radius * Math.cos(angle);
      const offsetZ = radius * Math.sin(angle);
      return centralPosition
        .clone()
        .add(new THREE.Vector3(offsetX, 0, offsetZ));
    });
  };

  const radius = 400; // Adjust this value to increase the spacing
  const orbitCount = 4; // Number of non-yellow spheres orbiting each yellow sphere

  const redOrbitPositions = flattenedPositions.flatMap(
    (centralPosition) =>
      calculateCircularPositions(centralPosition, radius, orbitCount)[0]
  );
  const greenOrbitPositions = flattenedPositions.flatMap(
    (centralPosition) =>
      calculateCircularPositions(centralPosition, radius, orbitCount)[1]
  );
  const blueOrbitPositions = flattenedPositions.flatMap(
    (centralPosition) =>
      calculateCircularPositions(centralPosition, radius, orbitCount)[2]
  );
  const purpleOrbitPositions = flattenedPositions.flatMap(
    (centralPosition) =>
      calculateCircularPositions(centralPosition, radius, orbitCount)[3]
  );

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
        />
      ))}
      <MemoizedSphere
        ref={sphereRefs.central}
        positions={Array.isArray(flattenedPositions) ? flattenedPositions : []}
        material={sphereMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
      />
      <MemoizedSphere
        ref={sphereRefs.red}
        positions={redOrbitPositions}
        material={sphereMaterials.red}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        ref={sphereRefs.green}
        positions={greenOrbitPositions}
        material={sphereMaterials.green}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        ref={sphereRefs.blue}
        positions={blueOrbitPositions}
        material={sphereMaterials.blue}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        ref={sphereRefs.purple}
        positions={purpleOrbitPositions}
        material={sphereMaterials.purple}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
    </>
  );
});

export default SphereRenderer;
