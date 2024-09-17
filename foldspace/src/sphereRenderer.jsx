import React, {
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useCallback,
  useState,
} from 'react';
import PlaneMesh from './PlaneMesh';
import {
  sphereMaterial,
  atmosMaterial,
  atmosMaterial2,
  redSphereMaterial,
  greenSphereMaterial,
  blueSphereMaterial,
  purpleSphereMaterial,
} from './SphereData';
import { MemoizedSphere } from './Sphere';
import * as THREE from 'three';
import SpherePool from './SpherePool';
import { useStore } from './store';
import { useFrame } from '@react-three/fiber';

const sphereGeometry = new THREE.SphereGeometry(5, 3, 3);

const createInstancedMesh = (material, count = 100) => {
  return new THREE.InstancedMesh(sphereGeometry, material, count);
};

const DETAIL_DISTANCE = 40000;
const UNLOAD_DETAIL_DISTANCE = 60000;

const useFilteredPositions = (positions, cameraRef, maxDistance) => {
  const [filteredPositions, setFilteredPositions] = useState([]);

  useFrame(() => {
    if (!cameraRef.current) return;
    const cameraPosition = cameraRef.current.position;
    const newFilteredPositions = positions.filter((pos) => {
      const distance = cameraPosition.distanceTo(pos);
      return distance < maxDistance;
    });
    setFilteredPositions(newFilteredPositions);
  });

  return filteredPositions;
};

const useSpherePools = () => {
  return useMemo(
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
};

const useSphereMaterials = () => {
  return useMemo(
    () => ({
      red: redSphereMaterial,
      green: greenSphereMaterial,
      blue: blueSphereMaterial,
      purple: purpleSphereMaterial,
    }),
    []
  );
};

const SphereRenderer = forwardRef(({ flattenedPositions, cameraRef }, ref) => {
  const previousYellowPositions = useRef(new Set());
  const planeMeshRefs = useRef(
    Array(6)
      .fill(null)
      .map(() => React.createRef())
  );
  const sphereRefs = useRef({
    atmos: useRef(),
    atmos2: useRef(),
    atmos3: useRef(),
    red: useRef(),
    green: useRef(),
    blue: useRef(),
    purple: useRef(),
    central: useRef(),
  }).current;

  const sphereMaterials = useSphereMaterials();
  const spherePools = useSpherePools();

  const activeBuffer = useStore((state) => state.activeBuffer);
  const positions = useStore((state) => state.positions[activeBuffer]);
  const redPositions = useStore((state) => state.redPositions[activeBuffer]);
  const greenPositions = useStore(
    (state) => state.greenPositions[activeBuffer]
  );
  const bluePositions = useStore((state) => state.bluePositions[activeBuffer]);
  const purplePositions = useStore(
    (state) => state.purplePositions[activeBuffer]
  );

  const filteredRedPositions = useFilteredPositions(
    redPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredGreenPositions = useFilteredPositions(
    greenPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredBluePositions = useFilteredPositions(
    bluePositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredPurplePositions = useFilteredPositions(
    purplePositions,
    cameraRef,
    DETAIL_DISTANCE
  );

  useEffect(() => {
    const newYellowPositions = flattenedPositions.filter(
      (pos) => !previousYellowPositions.current.has(pos.toArray().toString())
    );

    if (newYellowPositions.length > 0) {
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

  const clearDetailedSpheres = useCallback(() => {
    const clearPositionsByDistance = (positions, maxDistance) => {
      if (!cameraRef.current) return positions;
      const cameraPosition = cameraRef.current.position;
      return positions.filter((pos) => {
        const distance = cameraPosition.distanceTo(pos);
        return distance >= maxDistance;
      });
    };

    const clearedRedPositions = clearPositionsByDistance(
      redPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedGreenPositions = clearPositionsByDistance(
      greenPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedBluePositions = clearPositionsByDistance(
      bluePositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedPurplePositions = clearPositionsByDistance(
      purplePositions,
      UNLOAD_DETAIL_DISTANCE
    );

    useStore.getState().setRedPositions(clearedRedPositions);
    useStore.getState().setGreenPositions(clearedGreenPositions);
    useStore.getState().setBluePositions(clearedBluePositions);
    useStore.getState().setPurplePositions(clearedPurplePositions);
  }, [cameraRef, redPositions, greenPositions, bluePositions, purplePositions]);

  useEffect(() => {
    useStore.setState({ unloadDetailedSpheres: clearDetailedSpheres });
  }, [clearDetailedSpheres]);

  useEffect(() => {
    // Set sphere refs in the store
    useStore.getState().setSphereRefs('someCellKey', sphereRefs);
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
        />
      ))}
      <MemoizedSphere
        ref={sphereRefs.central}
        positions={Array.isArray(positions) ? positions : []}
        material={sphereMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
      />
      <MemoizedSphere
        ref={sphereRefs.atmos}
        positions={Array.isArray(positions) ? positions : []}
        material={atmosMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[1.4, 1.4, 1.4]}
      />
      <MemoizedSphere
        ref={sphereRefs.red}
        positions={filteredRedPositions}
        material={sphereMaterials.red}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        ref={sphereRefs.atmos2}
        positions={filteredGreenPositions}
        material={sphereMaterials.green}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        ref={sphereRefs.green}
        positions={filteredGreenPositions}
        material={atmosMaterial2}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        ref={sphereRefs.atmos3}
        positions={filteredBluePositions}
        material={sphereMaterials.blue}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        ref={sphereRefs.blue}
        positions={filteredBluePositions}
        material={atmosMaterial2}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        ref={sphereRefs.purple}
        positions={filteredPurplePositions}
        material={sphereMaterials.purple}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
    </>
  );
});

export default SphereRenderer;
