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
import SphereGroup from './SphereGroup'; // Import SphereGroup

const SphereRenderer = forwardRef(
  ({ flattenedPositions, cameraRef, cellKey }, ref) => {
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
    const bluePositions = useStore(
      (state) => state.bluePositions[activeBuffer]
    );
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
    const planetNames = useStore((state) => state.planetNames);

    useBVH(positions, activeBuffer);

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
      const newYellowPositions = flattenedPositions.filter(
        (pos) => !previousYellowPositions.current.has(pos.toArray().toString())
      );

      if (newYellowPositions.length > 0) {
        newYellowPositions.forEach((pos) =>
          previousYellowPositions.current.add(pos.toArray().toString())
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
      useStore.getState().setSphereRefs(cellKey, sphereRefs);
    }, [cellKey]);

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
          cellKey={cellKey} // Pass the cellKey prop
        />
        <MemoizedSphere
          key={`systemRing-${getCachedGeometry('torus').uuid}`}
          ref={sphereRefs.systemRing} // Unique ref
          positions={memoizedDetailedPositions}
          material={memoizedSphereMaterials.systemRing}
          geometry={getCachedGeometry('torus')}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[70, 70, 4]}
        />
        <MemoizedSphere
          key={`central-${getCachedGeometry('sphere').uuid}`}
          ref={sphereRefs.centralDetailed} // Unique ref
          positions={memoizedDetailedPositions}
          material={memoizedSphereMaterials.sun}
          geometry={getCachedGeometry('sphere')}
          frustumCulled={false}
          scale={[1.3, 1.3, 1.3]}
        />
        <MemoizedSphere
          key={`centralGlow-${getCachedGeometry('sphere').uuid}`}
          ref={sphereRefs.centralGlow} // Separate unique ref
          positions={memoizedDetailedPositions}
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
          positions={memoizedLessDetailedPositions}
          material={memoizedSphereMaterials.distantSun}
          geometry={getCachedGeometry('lessDetailedSphere')}
          frustumCulled={false}
          scale={[1.3, 1.3, 1.3]}
        />
        <SphereGroup
          color="red"
          positions={filteredRedPositions}
          moonPositions={filteredRedMoonPositions}
          sphereRefs={sphereRefs}
          materials={memoizedSphereMaterials}
          planetNames={planetNames}
        />
        <SphereGroup
          color="green"
          positions={filteredGreenPositions}
          moonPositions={filteredGreenMoonPositions}
          sphereRefs={sphereRefs}
          materials={memoizedSphereMaterials}
          planetNames={planetNames}
        />
        <SphereGroup
          color="blue"
          positions={filteredBluePositions}
          sphereRefs={sphereRefs}
          materials={memoizedSphereMaterials}
        />
        <SphereGroup
          color="purple"
          positions={filteredPurplePositions}
          moonPositions={filteredPurpleMoonPositions}
          sphereRefs={sphereRefs}
          materials={memoizedSphereMaterials}
        />
        <SphereGroup
          color="brown"
          positions={filteredBrownPositions}
          moonPositions={filteredBrownMoonPositions}
          sphereRefs={sphereRefs}
          materials={memoizedSphereMaterials}
        />
        <SphereGroup
          color="gas"
          positions={filteredGasPositions}
          moonPositions={filteredGasMoonPositions}
          sphereRefs={sphereRefs}
          materials={memoizedSphereMaterials}
        />
      </>
    );
  }
);

export default SphereRenderer;
