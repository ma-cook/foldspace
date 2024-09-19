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
    central: useRef(),
  }).current;

  const sphereMaterials = useSphereMaterials();
  const [geometry, setGeometry] = useState(lessDetailedSphereGeometry);
  const spherePools = useSpherePools(geometry);

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

    useStore.getState().setRedPositions(clearedRedPositions);
    useStore.getState().setGreenPositions(clearedGreenPositions);
    useStore.getState().setBluePositions(clearedBluePositions);
    useStore.getState().setPurplePositions(clearedPurplePositions);
    useStore.getState().setGreenMoonPositions(clearedGreenMoonPositions);
    useStore.getState().setPurpleMoonPositions(clearedPurpleMoonPositions);
  }, [
    cameraRef,
    redPositions,
    greenPositions,
    bluePositions,
    purplePositions,
    greenMoonPositions,
    purpleMoonPositions,
  ]);

  useEffect(() => {
    useStore.setState({ unloadDetailedSpheres: clearDetailedSpheres });
  }, [clearDetailedSpheres]);

  useEffect(() => {
    // Set sphere refs in the store
    useStore.getState().setSphereRefs('someCellKey', sphereRefs);
  }, []);

  useEffect(() => {
    const updateGeometry = () => {
      if (!cameraRef.current) return;
      const cameraPosition = cameraRef.current.position;
      const anyClose = positions.some((pos) => {
        const distance = cameraPosition.distanceTo(pos);
        return distance < DETAIL_DISTANCE;
      });
      setGeometry(anyClose ? sphereGeometry : lessDetailedSphereGeometry);
    };

    updateGeometry();
    const interval = setInterval(updateGeometry, 1000); // Check every second

    return () => clearInterval(interval);
  }, [cameraRef, positions]);

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
          greenMoonInstancedMeshRef={sphereRefs.greenMoon}
          purpleMoonInstancedMeshRef={sphereRefs.purpleMoon} // Ensure this line is present
        />
      ))}
      <MemoizedSphere
        key={`central-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.central}
        positions={Array.isArray(positions) ? positions : []}
        material={sphereMaterial}
        geometry={geometry}
        frustumCulled={false}
      />
      <MemoizedSphere
        key={`atmos-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.atmos}
        positions={Array.isArray(positions) ? positions : []}
        material={atmosMaterial}
        geometry={geometry}
        frustumCulled={false}
        scale={[1.4, 1.4, 1.4]}
      />
      <MemoizedSphere
        key={`red-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.red}
        positions={filteredRedPositions}
        material={sphereMaterials.red}
        geometry={geometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`atmos2-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.atmos2}
        positions={filteredGreenPositions}
        material={sphereMaterials.green}
        geometry={geometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`green-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.green}
        positions={filteredGreenPositions}
        material={atmosMaterial2}
        geometry={geometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        key={`atmos3-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.atmos3}
        positions={filteredBluePositions}
        material={sphereMaterials.blue}
        geometry={geometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`greenMoon-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.greenMoon}
        positions={filteredGreenMoonPositions}
        material={moonMaterial}
        geometry={geometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`blue-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.blue}
        positions={filteredBluePositions}
        material={atmosMaterial2}
        geometry={geometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        key={`purple-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.purple}
        positions={filteredPurplePositions}
        material={sphereMaterials.purple}
        geometry={geometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`purpleMoon-${geometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.purpleMoon}
        positions={filteredPurpleMoonPositions}
        material={moonMaterial}
        geometry={geometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
    </>
  );
});

export default SphereRenderer;
