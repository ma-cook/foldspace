import React, {
  useRef,
  useEffect,
  forwardRef,
  useMemo,
  useCallback,
} from 'react';
import PlaneMesh from '../PlaneMesh';
import { MemoizedSphere } from '../Sphere';
import { useStore } from '../store';
import { useFilteredPositions, useSpherePools } from '../hooks/hooks';
import { useBVH } from '../hooks/useBVH';
import { useUpdateGeometry } from '../hooks/useUpdateGeometry';
import { getCachedGeometry, getCachedShader } from '../resourceCache';
import { DETAIL_DISTANCE, GRID_SIZE, UNLOAD_DETAIL_DISTANCE } from '../config';
import * as THREE from 'three';
import SphereGroup from './SphereGroup'; // Import SphereGroup
import { usePositionUpdates } from '../hooks/usePositionUpdates';
import { useStoreActions } from '../hooks/useStoreActions';
import { useCellLoading } from '../hooks/useCellLoading';

const positionToString = (pos) => {
  return `${pos.x},${pos.y},${pos.z}`;
};

const SphereRenderer = forwardRef(({ flattenedPositions, cameraRef }, ref) => {
  const previousClearFn = useRef(null);
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
    centralGlow: useRef(), // Added separate ref
    centralLessDetailed: useRef(),
    brownRing: useRef(),
    systemRing: useRef(),
    gasRing: useRef(),
  }).current;
  const activeBuffer = useStore((state) => state.activeBuffer);
  const updatePositions = usePositionUpdates();
  const batchUpdate = useStoreActions();
  const setStore = useStore((state) => state.setState);
  const spherePools = useSpherePools(
    getCachedGeometry('sphere'),
    getCachedGeometry('lessDetailedSphere'),
    getCachedGeometry('torus')
  );

  const positions = useStore((state) =>
    Object.values(state.positions[activeBuffer] || {})
  );
  const redPositions = useStore((state) =>
    Object.values(state.redPositions[activeBuffer] || {})
  );
  const greenPositions = useStore((state) =>
    Object.values(state.greenPositions[activeBuffer] || {})
  );
  const bluePositions = useStore((state) =>
    Object.values(state.bluePositions[activeBuffer] || {})
  );
  const purplePositions = useStore((state) =>
    Object.values(state.purplePositions[activeBuffer] || {})
  );
  const greenMoonPositions = useStore((state) =>
    Object.values(state.greenMoonPositions[activeBuffer] || {})
  );
  const purpleMoonPositions = useStore((state) =>
    Object.values(state.purpleMoonPositions[activeBuffer] || {})
  );
  const brownPositions = useStore((state) =>
    Object.values(state.brownPositions[activeBuffer] || {})
  );
  const gasPositions = useStore((state) =>
    Object.values(state.gasPositions[activeBuffer] || {})
  );
  const redMoonPositions = useStore((state) =>
    Object.values(state.redMoonPositions[activeBuffer] || {})
  );
  const gasMoonPositions = useStore((state) =>
    Object.values(state.gasMoonPositions[activeBuffer] || {})
  );
  const brownMoonPositions = useStore((state) =>
    Object.values(state.brownMoonPositions[activeBuffer] || {})
  );
  const bvh = useStore((state) => state.bvh[activeBuffer]);
  const planetNames = useStore((state) => state.planetNames);

  useBVH(positions, activeBuffer);

  useCellLoading(cameraRef);

  const filteredPositions = useFilteredPositions(
    positions,
    cameraRef,
    DETAIL_DISTANCE
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
      distantSun: getCachedShader('planet', '#f7f1d5', '#f7bb43'),
      moon: getCachedShader('planet', '#858585', '#d4d4d4'),
      sunGlow: getCachedShader('atmosGlow', null, null, '#fcc203'),
      redGlow: getCachedShader('atmosGlow', null, null, '#6e0700'),
      greenGlow: getCachedShader('atmosGlow', null, null, '#92a37f'),
      blueGlow: getCachedShader('atmosGlow', null, null, '#92aeb3'),
      purpleGlow: getCachedShader('atmosGlow', null, null, '#917c88'),
      brownGlow: getCachedShader('atmosGlow', null, null, '#7d7272'),
      gasGlow: getCachedShader('atmosGlow', null, null, '#bcbdaa'),
    }),
    []
  );

  useEffect(() => {
    const newYellowPositions = Object.values(flattenedPositions || {}).filter(
      (pos) => !previousYellowPositions.current.has(positionToString(pos))
    );

    if (newYellowPositions.length > 0) {
      newYellowPositions.forEach((pos) =>
        previousYellowPositions.current.add(positionToString(pos))
      );
    }

    const sphereColors = [
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
    ];

    const spheres = sphereColors.map((color) => {
      const instancedMesh = spherePools[color].get();
      instancedMesh.material = memoizedSphereMaterials[color];
      return instancedMesh;
    });

    return () => {
      spheres.forEach((instancedMesh, index) => {
        const color = sphereColors[index];
        spherePools[color].release(instancedMesh);
      });
    };
  }, [flattenedPositions, memoizedSphereMaterials, spherePools]);

  useEffect(() => {
    return () => {
      previousYellowPositions.current.clear();
    };
  }, []);

  // Move clearDetailedSpheres logic to top level
  const clearDetailedSpheres = useCallback(() => {
    if (!cameraRef.current) return;
    const cameraPosition = cameraRef.current.position;

    const updates = {};

    const update = (positions, key) => {
      const cleared = updatePositions(positions, cameraPosition);
      if (Object.keys(cleared).length > 0) {
        updates[key] = cleared;
      }
    };

    update(redPositions, 'redPositions');
    update(greenPositions, 'greenPositions');
    update(bluePositions, 'bluePositions');
    update(purplePositions, 'purplePositions');
    update(brownPositions, 'brownPositions');
    update(greenMoonPositions, 'greenMoonPositions');
    update(purpleMoonPositions, 'purpleMoonPositions');
    update(gasPositions, 'gasPositions');
    update(redMoonPositions, 'redMoonPositions');
    update(gasMoonPositions, 'gasMoonPositions');
    update(brownMoonPositions, 'brownMoonPositions');

    batchUpdate(updates);
  }, [
    cameraRef,
    updatePositions,
    batchUpdate,
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
  ]);

  useEffect(() => {
    if (previousClearFn.current !== clearDetailedSpheres) {
      previousClearFn.current = clearDetailedSpheres;
      batchUpdate({ unloadDetailedSpheres: clearDetailedSpheres });
    }

    return () => {
      batchUpdate({ unloadDetailedSpheres: null });
      previousClearFn.current = null;
    };
  }, [clearDetailedSpheres, batchUpdate]);

  // Call useUpdateGeometry to get detailed and less detailed positions
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
        ref={sphereRefs.systemRing} // Unique ref
        positions={Object.values(memoizedDetailedPositions || {})}
        material={memoizedSphereMaterials.systemRing}
        geometry={getCachedGeometry('torus')}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[70, 70, 4]}
      />
      <MemoizedSphere
        key={`central-${getCachedGeometry('sphere').uuid}`}
        ref={sphereRefs.centralGlow} // Unique ref
        positions={Object.values(memoizedDetailedPositions || {})}
        material={memoizedSphereMaterials.sun}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[1.3, 1.3, 1.3]}
      />
      <MemoizedSphere
        key={`centralGlow-${getCachedGeometry('sphere').uuid}`}
        ref={sphereRefs.centralDetailed} // Separate unique ref
        positions={Object.values(memoizedDetailedPositions || {})}
        material={memoizedSphereMaterials.sunGlow}
        geometry={getCachedGeometry('sphere')}
        frustumCulled={false}
        scale={[2.1, 2.1, 2.1]}
      />
      <MemoizedSphere
        key={`central-less-detailed-${
          getCachedGeometry('lessDetailedSphere').uuid
        }`}
        ref={sphereRefs.centralLessDetailed}
        positions={Object.values(memoizedLessDetailedPositions || {})}
        material={memoizedSphereMaterials.distantSun}
        geometry={getCachedGeometry('lessDetailedSphere')}
        frustumCulled={false}
        scale={[1.3, 1.3, 1.3]}
      />
      <SphereGroup
        color="red"
        positions={Object.values(filteredRedPositions || {})}
        moonPositions={Object.values(filteredRedMoonPositions || {})}
        sphereRefs={sphereRefs}
        materials={memoizedSphereMaterials}
        planetNames={planetNames}
      />
      <SphereGroup
        color="green"
        positions={Object.values(filteredGreenPositions || {})}
        moonPositions={Object.values(filteredGreenMoonPositions || {})}
        sphereRefs={sphereRefs}
        materials={memoizedSphereMaterials}
        planetNames={planetNames}
      />
      <SphereGroup
        color="blue"
        positions={Object.values(filteredBluePositions || {})}
        sphereRefs={sphereRefs}
        materials={memoizedSphereMaterials}
      />
      <SphereGroup
        color="purple"
        positions={Object.values(filteredPurplePositions || {})}
        moonPositions={Object.values(filteredPurpleMoonPositions || {})}
        sphereRefs={sphereRefs}
        materials={memoizedSphereMaterials}
      />
      <SphereGroup
        color="brown"
        positions={Object.values(filteredBrownPositions || {})}
        moonPositions={Object.values(filteredBrownMoonPositions || {})}
        sphereRefs={sphereRefs}
        materials={memoizedSphereMaterials}
      />
      <SphereGroup
        color="gas"
        positions={Object.values(filteredGasPositions || {})}
        moonPositions={Object.values(filteredGasMoonPositions || {})}
        sphereRefs={sphereRefs}
        materials={memoizedSphereMaterials}
      />
    </>
  );
});

export default SphereRenderer;
