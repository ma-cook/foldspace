import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useCallback,
} from 'react';
import PlaneMesh from './PlaneMesh';
import { MemoizedSphere } from './Sphere';
import { useStore } from './store';
import { DETAIL_DISTANCE, UNLOAD_DETAIL_DISTANCE } from './config';
import {
  useFilteredPositions,
  useSpherePools,
  useSphereMaterials,
} from './hooks';
import {
  sphereGeometry,
  lessDetailedSphereGeometry,
  sphereMaterial,
  atmosMaterial,
  atmosMaterial2,
  moonMaterial,
} from './SphereData';
import { BVH } from './BVH'; // Import BVH class

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
    greenMoon: useRef(),
    purpleMoon: useRef(),
    red: useRef(),
    green: useRef(),
    blue: useRef(),
    purple: useRef(),
    centralDetailed: useRef(), // Separate ref for detailed central sphere
    centralLessDetailed: useRef(), // Separate ref for less detailed central sphere
  }).current;

  const sphereMaterials = useSphereMaterials();
  const spherePools = useSpherePools(sphereGeometry);

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
  const greenMoonPositions = useStore(
    (state) => state.greenMoonPositions[activeBuffer]
  );
  const purpleMoonPositions = useStore(
    (state) => state.purpleMoonPositions[activeBuffer]
  );
  const bvh = useStore((state) => state.bvh[activeBuffer]);

  useEffect(() => {
    // Build BVH when positions change
    useStore.getState().setBVH(new BVH(positions), activeBuffer);
  }, [positions, activeBuffer]);

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
  const filteredGreenMoonPositions = useFilteredPositions(
    greenMoonPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredPurpleMoonPositions = useFilteredPositions(
    purpleMoonPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredPositions = useFilteredPositions(
    positions,
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

    const spheres = [
      'red',
      'green',
      'blue',
      'purple',
      'greenMoon',
      'purpleMoon',
    ].map((color) => {
      const instancedMesh = spherePools[color].get();
      instancedMesh.material = sphereMaterials[color];
      return instancedMesh;
    });

    return () => {
      spheres.forEach((instancedMesh, index) => {
        const color = [
          'red',
          'green',
          'blue',
          'purple',
          'greenMoon',
          'purpleMoon',
        ][index];
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
    const clearedGreenMoonPositions = clearPositionsByDistance(
      greenMoonPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedPurpleMoonPositions = clearPositionsByDistance(
      purpleMoonPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedYellowPositions = clearPositionsByDistance(
      filteredPositions,
      UNLOAD_DETAIL_DISTANCE
    );

    useStore.getState().setRedPositions(clearedRedPositions, activeBuffer);
    useStore.getState().setGreenPositions(clearedGreenPositions, activeBuffer);
    useStore.getState().setBluePositions(clearedBluePositions, activeBuffer);
    useStore
      .getState()
      .setPurplePositions(clearedPurplePositions, activeBuffer);
    useStore
      .getState()
      .setGreenMoonPositions(clearedGreenMoonPositions, activeBuffer);
    useStore
      .getState()
      .setPurpleMoonPositions(clearedPurpleMoonPositions, activeBuffer);
    useStore.getState().setPositions(clearedYellowPositions, activeBuffer);
  }, [
    cameraRef,
    redPositions,
    greenPositions,
    bluePositions,
    purplePositions,
    greenMoonPositions,
    purpleMoonPositions,
    filteredPositions,
    activeBuffer,
  ]);

  useEffect(() => {
    useStore.setState({ unloadDetailedSpheres: clearDetailedSpheres });
  }, [clearDetailedSpheres]);

  useEffect(() => {
    // Set sphere refs in the store
    useStore.getState().setSphereRefs('someCellKey', sphereRefs);
  }, []);

  const [detailedPositions, setDetailedPositions] = useState([]);
  const [lessDetailedPositions, setLessDetailedPositions] = useState([]);

  useEffect(() => {
    const updateGeometry = () => {
      if (!cameraRef.current || !bvh) return;
      const cameraPosition = cameraRef.current.position;
      const detailBoundingBox = {
        min: {
          x: cameraPosition.x - DETAIL_DISTANCE,
          y: cameraPosition.y - DETAIL_DISTANCE,
          z: cameraPosition.z - DETAIL_DISTANCE,
        },
        max: {
          x: cameraPosition.x + DETAIL_DISTANCE,
          y: cameraPosition.y + DETAIL_DISTANCE,
          z: cameraPosition.z + DETAIL_DISTANCE,
        },
      };

      const newDetailedPositions = bvh.query(detailBoundingBox);
      const newLessDetailedPositions = positions.filter(
        (pos) => !newDetailedPositions.includes(pos)
      );

      setDetailedPositions(newDetailedPositions);
      setLessDetailedPositions(newLessDetailedPositions);
    };

    updateGeometry();
    const interval = setInterval(updateGeometry, 1000); // Check every second

    return () => clearInterval(interval);
  }, [cameraRef, positions, bvh]);

  return (
    <>
      {planeMeshRefs.current.map((ref, i) => (
        <PlaneMesh
          key={`plane-${i}`}
          id={i}
          ref={ref}
          sphereRefs={sphereRefs}
          lessDetailedMeshRef={sphereRefs.centralLessDetailed} // Use less detailed ref
          instancedMeshRef={sphereRefs.centralDetailed} // Use detailed ref
          redInstancedMeshRef={sphereRefs.red}
          greenInstancedMeshRef={sphereRefs.green}
          blueInstancedMeshRef={sphereRefs.blue}
          purpleInstancedMeshRef={sphereRefs.purple}
          greenMoonInstancedMeshRef={sphereRefs.greenMoon}
          purpleMoonInstancedMeshRef={sphereRefs.purpleMoon} // Ensure this line is present
        />
      ))}
      <MemoizedSphere
        key={`central-detailed-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.centralDetailed} // Use detailed ref
        positions={detailedPositions}
        material={sphereMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
      />
      <MemoizedSphere
        key={`central-less-detailed-${lessDetailedSphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.centralLessDetailed} // Use less detailed ref
        positions={lessDetailedPositions}
        material={sphereMaterial}
        geometry={lessDetailedSphereGeometry}
        frustumCulled={false}
      />
      <MemoizedSphere
        key={`atmos-${atmosMaterial.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.atmos}
        positions={filteredPositions}
        material={atmosMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[1.4, 1.4, 1.4]}
      />
      <MemoizedSphere
        key={`red-${sphereMaterials.red.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.red}
        positions={filteredRedPositions}
        material={sphereMaterials.red}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`atmos2-${sphereMaterials.green.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.atmos2}
        positions={filteredGreenPositions}
        material={sphereMaterials.green}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`green-${atmosMaterial2.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.green}
        positions={filteredGreenPositions}
        material={atmosMaterial2}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        key={`atmos3-${sphereMaterials.blue.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.atmos3}
        positions={filteredBluePositions}
        material={sphereMaterials.blue}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`greenMoon-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.greenMoon}
        positions={filteredGreenMoonPositions}
        material={moonMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`blue-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.blue}
        positions={filteredBluePositions}
        material={atmosMaterial2}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        key={`purple-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.purple}
        positions={filteredPurplePositions}
        material={sphereMaterials.purple}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`purpleMoon-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.purpleMoon}
        positions={filteredPurpleMoonPositions}
        material={moonMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
    </>
  );
});

export default SphereRenderer;
