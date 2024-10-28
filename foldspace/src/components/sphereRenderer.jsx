import React, { useRef, useEffect, forwardRef, useMemo } from 'react';
import PlaneMesh from '../PlaneMesh';
import { useThree } from '@react-three/fiber';
import { MemoizedSphere } from '../Sphere';
import { useStore } from '../store';
import {
  useFilteredPositions,
  useSpherePools,
  useSphereMaterials,
} from '../hooks';
import { useBVH } from '../hooks/useBVH';
import { useUpdateGeometry } from '../hooks/useUpdateGeometry';
import { useClearDetailedSpheres } from '../hooks/useClearDetailedSpheres';
import {
  sphereGeometry,
  lessDetailedSphereGeometry,
  sphereMaterial,
  moonMaterial,
} from '../SphereData';
import { DETAIL_DISTANCE } from '../config';
import { sunShader } from '../sunShader';
import { createPlanetShader } from '../shaders/planetShader';
import FakeGlowMaterial from '../shaders/FakeGlowMaterial';
import * as THREE from 'three';

const SphereRenderer = forwardRef(({ flattenedPositions, cameraRef }, ref) => {
  const previousYellowPositions = useRef(new Set());
  const planeMeshRef = useRef();
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
    ring: useRef(), // Ref for ring instanced mesh
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
  const brownPositions = useStore(
    (state) => state.brownPositions[activeBuffer]
  );
  const bvh = useStore((state) => state.bvh[activeBuffer]);

  useBVH(positions, activeBuffer);

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
  const filteredBrownPositions = useFilteredPositions(
    brownPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredPositions = useFilteredPositions(
    positions,
    cameraRef,
    DETAIL_DISTANCE
  );

  const memoizedSphereMaterials = useMemo(
    () => ({
      green: createPlanetShader('#1c911e', '#0000FF'),
      blue: createPlanetShader('#3b408a', '#8ac0f2'),
      red: createPlanetShader('#4f090b', '#080807'),
      purple: createPlanetShader('#140e01', '#cc6d14'),
      brown: createPlanetShader('#4a403a', '#998a82'),
    }),
    []
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
      instancedMesh.material = memoizedSphereMaterials[color];
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
  }, [flattenedPositions, memoizedSphereMaterials, spherePools]);

  useEffect(() => {
    return () => {
      previousYellowPositions.current.clear();
    };
  }, []);

  const clearDetailedSpheres = useClearDetailedSpheres(
    cameraRef,
    redPositions,
    greenPositions,
    bluePositions,
    purplePositions,
    brownPositions,
    greenMoonPositions,
    purpleMoonPositions,
    filteredPositions,
    activeBuffer
  );

  useEffect(() => {
    useStore.setState({ unloadDetailedSpheres: clearDetailedSpheres });
  }, [clearDetailedSpheres]);

  useEffect(() => {
    // Set sphere refs in the store
    useStore.getState().setSphereRefs('someCellKey', sphereRefs);
  }, []);

  const { detailedPositions, lessDetailedPositions } = useUpdateGeometry(
    cameraRef,
    positions,
    bvh
  );

  const memoizedDetailedPositions = useMemo(
    () => detailedPositions,
    [detailedPositions]
  );
  const memoizedLessDetailedPositions = useMemo(
    () => lessDetailedPositions,
    [lessDetailedPositions]
  );
  const memoizedFilteredRedPositions = useMemo(
    () => filteredRedPositions,
    [filteredRedPositions]
  );
  const memoizedFilteredGreenPositions = useMemo(
    () => filteredGreenPositions,
    [filteredGreenPositions]
  );
  const memoizedFilteredBluePositions = useMemo(
    () => filteredBluePositions,
    [filteredBluePositions]
  );
  const memoizedFilteredPurplePositions = useMemo(
    () => filteredPurplePositions,
    [filteredPurplePositions]
  );
  const memoizedFilteredBrownPositions = useMemo(
    () => filteredBrownPositions,
    [filteredBrownPositions]
  );
  const memoizedFilteredGreenMoonPositions = useMemo(
    () => filteredGreenMoonPositions,
    [filteredGreenMoonPositions]
  );
  const memoizedFilteredPurpleMoonPositions = useMemo(
    () => filteredPurpleMoonPositions,
    [filteredPurpleMoonPositions]
  );

  useEffect(() => {
    const animate = () => {
      sunShader.uniforms.time.value += 0.0001;
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <>
      <PlaneMesh
        key={`plane-`}
        ref={planeMeshRef}
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

      <MemoizedSphere
        key={`central${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.centralDetailed} // Use detailed ref
        positions={memoizedDetailedPositions}
        material={sunShader}
        geometry={sphereGeometry}
        frustumCulled={false}
      />
      {memoizedDetailedPositions.map((position, index) => (
        <mesh
          key={`sunGlow-${index}`}
          ref={sphereRefs.centralDetailed}
          position={position}
          frustumCulled={false}
        >
          <sphereGeometry args={[130, 130, 15]} />
          <FakeGlowMaterial glowColor="#ee7e19" />
        </mesh>
      ))}
      <MemoizedSphere
        key={`central-less-detailed-${lessDetailedSphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.centralLessDetailed} // Use less detailed ref
        positions={memoizedLessDetailedPositions}
        material={sphereMaterial}
        geometry={lessDetailedSphereGeometry}
        frustumCulled={false}
      />
      <MemoizedSphere
        key={`red-${sphereMaterials.red.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.red}
        positions={memoizedFilteredRedPositions}
        material={memoizedSphereMaterials.red}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      {memoizedFilteredRedPositions.map((position, index) => (
        <mesh key={`redPlanetAtmos-${index}`} position={position}>
          <sphereGeometry args={[25, 25, 10]} />
          <FakeGlowMaterial glowColor="#754446" />
        </mesh>
      ))}
      <MemoizedSphere
        key={`green-${sphereMaterials.green.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.green}
        positions={memoizedFilteredGreenPositions}
        material={memoizedSphereMaterials.green}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      {memoizedFilteredGreenPositions.map((position, index) => (
        <mesh key={`greenPlanetAtmos-${index}`} position={position}>
          <sphereGeometry args={[25, 25, 10]} />
          <FakeGlowMaterial glowColor="#658555" />
        </mesh>
      ))}
      <MemoizedSphere
        key={`greenMoon-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.greenMoon}
        positions={memoizedFilteredGreenMoonPositions}
        material={moonMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`blue-${sphereMaterials.blue.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.blue}
        positions={filteredBluePositions}
        material={memoizedSphereMaterials.blue}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      {memoizedFilteredBluePositions.map((position, index) => (
        <mesh key={`bluePlanetAtmos-${index}`} position={position}>
          <sphereGeometry args={[20, 20, 10]} />
          <FakeGlowMaterial glowColor="#7ba5ad" />
        </mesh>
      ))}
      <MemoizedSphere
        key={`purple-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.purple}
        positions={memoizedFilteredPurplePositions}
        material={memoizedSphereMaterials.purple}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      {memoizedFilteredPurplePositions.map((position, index) => (
        <mesh key={`purplePlanetAtmos-${index}`} position={position}>
          <sphereGeometry args={[17, 17, 10]} />
          <FakeGlowMaterial glowColor="#cf8123" />
        </mesh>
      ))}
      <MemoizedSphere
        key={`purpleMoon-${sphereGeometry.uuid}`} // Force re-render when geometry changes
        ref={sphereRefs.purpleMoon}
        positions={memoizedFilteredPurpleMoonPositions}
        material={moonMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`brown-${sphereGeometry.uuid}`}
        ref={sphereRefs.brown}
        positions={memoizedFilteredBrownPositions}
        material={memoizedSphereMaterials.brown}
        geometry={sphereGeometry}
        scale={[0.4, 0.4, 0.4]}
      />
      {memoizedFilteredBrownPositions.map((position, index) => (
        <mesh key={`brownPlanetAtmos-${index}`} position={position}>
          <sphereGeometry args={[50, 50, 10]} />
          <FakeGlowMaterial glowColor="#7d6f6f" />
        </mesh>
      ))}
    </>
  );
});

export default SphereRenderer;
