// SphereRenderer.jsx
import React, { useRef, useEffect, forwardRef, useMemo } from 'react';
import PlaneMesh from '../PlaneMesh';
import { MemoizedSphere } from '../Sphere';
import { useStore } from '../store';
import { useFilteredPositions, useSpherePools } from '../hooks/hooks';
import { useBVH } from '../hooks/useBVH';
import { useUpdateGeometry } from '../hooks/useUpdateGeometry';
import { useClearDetailedSpheres } from '../hooks/useClearDetailedSpheres';
import { getCachedGeometry, getCachedShader } from '../resourceCache';
import { DETAIL_DISTANCE } from '../config';
import * as THREE from 'three';

const SphereRenderer = forwardRef(({ flattenedPositions, cameraRef }, ref) => {
  const previousYellowPositions = useRef(new Set());
  const planeMeshRef = useRef();
  const sphereRefs = useRef({
    greenMoon: useRef(),
    purpleMoon: useRef(),
    redMoon: useRef(),
    gasMoon: useRef(),
    brownMoon: useRef(),
    red: useRef(),
    green: useRef(),
    blue: useRef(),
    purple: useRef(),
    gas: useRef(),
    centralDetailed: useRef(),
    centralLessDetailed: useRef(),
    brownRing: useRef(),
    systemRing: useRef(),
    gasRing: useRef(),
  }).current;

  const spherePools = useSpherePools(
    getCachedGeometry('sphere'),
    getCachedGeometry('lessDetailedSphere'),
    getCachedGeometry('torus')
  );

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
  const gasPositions = useStore((state) => state.gasPositions[activeBuffer]);
  const redMoonPositions = useStore(
    (state) => state.redMoonPositions[activeBuffer]
  );
  const gasMoonPositions = useStore(
    (state) => state.gasMoonPositions[activeBuffer]
  );
  const brownMoonPositions = useStore(
    (state) => state.brownMoonPositions[activeBuffer]
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
  const filteredGasPositions = useFilteredPositions(
    gasPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredRedMoonPositions = useFilteredPositions(
    redMoonPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredGasMoonPositions = useFilteredPositions(
    gasMoonPositions,
    cameraRef,
    DETAIL_DISTANCE
  );
  const filteredBrownMoonPositions = useFilteredPositions(
    brownMoonPositions,
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
      green: getCachedShader('planet', '#1c911e', '#0000FF'),
      blue: getCachedShader('planet', '#3b408a', '#8ac0f2'),
      red: getCachedShader('planet', '#4f090b', '#ab2929'),
      purple: getCachedShader('planet', '#805203', '#d17504'),
      brown: getCachedShader('planet', '#4a403a', '#998a82'),
      gas: getCachedShader('planet', '#e1e3a6', '#c2a7a7'),
      sun: getCachedShader('sun'),
      brownRing: getCachedShader('ring'),
      systemRing: getCachedShader('system'),
      distantSun: getCachedShader('planet', '#fadc46', '#f7bb43'),
      moon: getCachedShader('planet', '#858585', '#3b3b3b'),
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
      'brown',
      'greenMoon',
      'purpleMoon',
      'gas',
      'redMoon',
      'gasMoon',
      'brownMoon',
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
          'brown',
          'greenMoon',
          'purpleMoon',
          'gas',
          'redMoon',
          'gasMoon',
          'brownMoon',
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
    gasPositions,
    redMoonPositions,
    gasMoonPositions,
    brownMoonPositions,
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
  const memoizedFilteredGasPositions = useMemo(
    () => filteredGasPositions,
    [filteredGasPositions]
  );
  const memoizedFilteredRedMoonPositions = useMemo(
    () => filteredRedMoonPositions,
    [filteredRedMoonPositions]
  );
  const memoizedFilteredGasMoonPositions = useMemo(
    () => filteredGasMoonPositions,
    [filteredGasMoonPositions]
  );
  const memoizedFilteredBrownMoonPositions = useMemo(
    () => filteredBrownMoonPositions,
    [filteredBrownMoonPositions]
  );

  // Log brownMoonPositions data
  useEffect(() => {
    console.log('brownMoonPositions:', brownMoonPositions);
  }, [brownMoonPositions]);

  useEffect(() => {
    const animate = () => {
      const sunShader = getCachedShader('sun');
      sunShader.uniforms.time.value += 0.00005;
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
        lessDetailedMeshRef={sphereRefs.centralLessDetailed}
        instancedMeshRef={sphereRefs.centralDetailed}
        redInstancedMeshRef={sphereRefs.red}
        greenInstancedMeshRef={sphereRefs.green}
        blueInstancedMeshRef={sphereRefs.blue}
        purpleInstancedMeshRef={sphereRefs.purple}
        brownInstancedMeshRef={sphereRefs.brown}
        greenMoonInstancedMeshRef={sphereRefs.greenMoon}
        purpleMoonInstancedMeshRef={sphereRefs.purpleMoon}
        redMoonInstancedMeshRef={sphereRefs.redMoon}
        gasMoonInstancedMeshRef={sphereRefs.gasMoon}
        brownMoonInstancedMeshRef={sphereRefs.brownMoon}
        gasInstancedMeshRef={sphereRefs.gas}
        brownRingInstancedMeshRef={sphereRefs.brownRing}
        systemRingInstancedMeshRef={sphereRefs.systemRing}
      />
      <MemoizedSphere
        key={`systemRing-${getCachedGeometry('torus').uuid}`}
        ref={sphereRefs.systemRing}
        positions={memoizedDetailedPositions}
        material={memoizedSphereMaterials.systemRing}
        geometry={getCachedGeometry('torus')}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[70, 70, 4]}
      />
      <MemoizedSphere
        key={`central${getCachedGeometry('sphere').uuid}`}
        ref={sphereRefs.centralDetailed}
        positions={memoizedDetailedPositions}
        material={memoizedSphereMaterials.sun}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[1.2, 1.2, 1.2]}
      />
      <MemoizedSphere
        key={`central-less-detailed-${
          getCachedGeometry('lessDetailedSphere').uuid
        }`}
        ref={sphereRefs.centralLessDetailed}
        positions={memoizedLessDetailedPositions}
        material={memoizedSphereMaterials.distantSun}
        geometry={getCachedGeometry('lessDetailedSphere')}
        frustumCulled={false}
      />
      <MemoizedSphere
        key={`red`}
        ref={sphereRefs.red}
        positions={memoizedFilteredRedPositions}
        material={memoizedSphereMaterials.red}
        geometry={getCachedGeometry('sphere')}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`redMoon`}
        ref={sphereRefs.redMoon}
        positions={memoizedFilteredRedMoonPositions}
        material={memoizedSphereMaterials.moon}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`green`}
        ref={sphereRefs.green}
        positions={memoizedFilteredGreenPositions}
        material={memoizedSphereMaterials.green}
        geometry={getCachedGeometry('sphere')}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`greenMoon`}
        ref={sphereRefs.greenMoon}
        positions={memoizedFilteredGreenMoonPositions}
        material={memoizedSphereMaterials.moon}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`blue`}
        ref={sphereRefs.blue}
        positions={memoizedFilteredBluePositions}
        material={memoizedSphereMaterials.blue}
        geometry={getCachedGeometry('sphere')}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`purple`}
        ref={sphereRefs.purple}
        positions={memoizedFilteredPurplePositions}
        material={memoizedSphereMaterials.purple}
        geometry={getCachedGeometry('sphere')}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`purpleMoon`}
        ref={sphereRefs.purpleMoon}
        positions={memoizedFilteredPurpleMoonPositions}
        material={memoizedSphereMaterials.moon}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`brown`}
        ref={sphereRefs.brown}
        positions={memoizedFilteredBrownPositions}
        material={memoizedSphereMaterials.brown}
        geometry={getCachedGeometry('sphere')}
        scale={[0.4, 0.4, 0.4]}
      />
      <MemoizedSphere
        key={`brownRing`}
        ref={sphereRefs.brownRing}
        positions={memoizedFilteredBrownPositions}
        material={memoizedSphereMaterials.brownRing}
        geometry={getCachedGeometry('torus')}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 1, 1]}
      />
      <MemoizedSphere
        key={`brownMoon`}
        ref={sphereRefs.brownMoon}
        positions={memoizedFilteredBrownMoonPositions}
        material={memoizedSphereMaterials.moon}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[0.1, 0.1, 0.1]}
      />
      <MemoizedSphere
        key={`gas`}
        ref={sphereRefs.gas}
        positions={memoizedFilteredGasPositions}
        material={memoizedSphereMaterials.gas}
        geometry={getCachedGeometry('sphere')}
        scale={[0.6, 0.6, 0.6]}
      />
      <MemoizedSphere
        key={`gasRing`}
        ref={sphereRefs.gasRing}
        positions={memoizedFilteredGasPositions}
        material={memoizedSphereMaterials.brownRing}
        geometry={getCachedGeometry('torus')}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.6, 1.6, 1.6]}
      />
      <MemoizedSphere
        key={`gasMoon`}
        ref={sphereRefs.gasMoon}
        positions={memoizedFilteredGasMoonPositions}
        material={memoizedSphereMaterials.moon}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[0.1, 0.1, 0.1]}
      />
    </>
  );
});

export default SphereRenderer;
