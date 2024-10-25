import React, { useRef, useEffect, forwardRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from '../store';
import { MemoizedSphere } from '../Sphere';
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
  atmosMaterial,
  atmosMaterial2,
  moonMaterial,
} from '../SphereData';
import { DETAIL_DISTANCE } from '../config';
import { createMouseHandlers } from '../hooks/mouseEvents';
import * as THREE from 'three';
import {
  vertexShader,
  fragmentShader,
  dotVertexShader,
  dotFragmentShader,
} from '../shaders';
import { vertexSunShader, fragmentSunShader } from '../sunShader';
import FakeGlowMaterial from '../FakeGlowMaterial';

const SphereRenderer = forwardRef(({ flattenedPositions, cameraRef }, ref) => {
  const previousYellowPositions = useRef(new Set());
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
    brown: useRef(),
    centralDetailed: useRef(),
    centralLessDetailed: useRef(),
  }).current;

  const { raycaster, mouse, camera, size, scene } = useThree();
  const setTarget = useStore((state) => state.setTarget);
  const setLookAt = useStore((state) => state.setLookAt);

  const isMouseDown = useRef(false);
  const lastMoveTimestamp = useRef(Date.now());
  const isDragging = useRef(false);
  const mouseMoved = useRef(false);

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
  const brownPositions = useStore(
    (state) => state.brownPositions[activeBuffer]
  );
  const greenMoonPositions = useStore(
    (state) => state.greenMoonPositions[activeBuffer]
  );
  const purpleMoonPositions = useStore(
    (state) => state.purpleMoonPositions[activeBuffer]
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
  const filteredBrownPositions = useFilteredPositions(
    brownPositions,
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
      'brown',
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
          'brown',
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
    useStore.getState().setSphereRefs('someCellKey', sphereRefs);
  }, []);

  const { detailedPositions, lessDetailedPositions } = useUpdateGeometry(
    cameraRef,
    positions,
    bvh
  );

  const { onMouseDown, onMouseUp, onMouseMove } = createMouseHandlers(
    raycaster,
    mouse,
    camera,
    sphereRefs,
    setTarget,
    setLookAt,
    isMouseDown,
    lastMoveTimestamp,
    isDragging,
    mouseMoved
  );

  useEffect(() => {
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      onMouseMove.cancel();
    };
  }, [
    raycaster,
    mouse,
    camera,
    setTarget,
    setLookAt,
    size,
    sphereRefs,
    onMouseDown,
    onMouseUp,
    onMouseMove,
  ]);

  useEffect(() => {
    const unsubscribe = useStore.subscribe(
      (state) => state.target,
      (target) => {
        console.log('Camera target updated:', target);
        camera.position.set(target.x, target.y, target.z);
      }
    );

    return () => unsubscribe();
  }, [camera]);

  useEffect(() => {
    const unsubscribe = useStore.subscribe(
      (state) => state.lookAt,
      (lookAt) => {
        console.log('Camera lookAt updated:', lookAt);
        camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
      }
    );

    return () => unsubscribe();
  }, [camera]);

  return (
    <>
      <MemoizedSphere
        key={`central-detailed-${sphereGeometry.uuid}`}
        ref={sphereRefs.centralDetailed}
        positions={detailedPositions}
        material={sphereMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.8, 0.8, 0.8]}
      />
      <MemoizedSphere
        key={`atmos-${atmosMaterial.uuid}`}
        ref={sphereRefs.atmos}
        positions={filteredPositions}
        material={atmosMaterial}
        geometry={sphereGeometry}
      />
      {detailedPositions.map((position, index) => (
        <React.Fragment key={`detailed-${index}`}>
          <mesh key={`sun-${index}`} position={position}>
            <sphereGeometry args={[120, 120, 25]} />
            <FakeGlowMaterial glowColor={'#d9b145'} />
          </mesh>
          <mesh
            key={`torus-${index}`}
            position={position}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[3000, 20, 16, 70]} />
            <FakeGlowMaterial glowColor={'#1a1a1a'} />
          </mesh>
        </React.Fragment>
      ))}

      <MemoizedSphere
        key={`central-less-detailed-${lessDetailedSphereGeometry.uuid}`}
        ref={sphereRefs.centralLessDetailed}
        positions={lessDetailedPositions}
        material={sphereMaterial}
        geometry={lessDetailedSphereGeometry}
      />

      <MemoizedSphere
        key={`red-${sphereMaterials.red.uuid}`}
        ref={sphereRefs.red}
        positions={filteredRedPositions}
        material={sphereMaterials.red}
        geometry={sphereGeometry}
        scale={[0.15, 0.15, 0.15]}
      />
      {filteredRedPositions.map((position, index) => (
        <mesh key={`distant-${index}`} position={position}>
          <sphereGeometry args={[30, 30, 10]} />
          <FakeGlowMaterial glowColor={'#be310e'} />
        </mesh>
      ))}
      <MemoizedSphere
        key={`atmos2-${sphereMaterials.green.uuid}`}
        ref={sphereRefs.atmos2}
        positions={filteredGreenPositions}
        material={sphereMaterials.green}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`green-${atmosMaterial2.uuid}`}
        ref={sphereRefs.green}
        positions={filteredGreenPositions}
        material={atmosMaterial2}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        key={`atmos3-${sphereMaterials.blue.uuid}`}
        ref={sphereRefs.atmos3}
        positions={filteredBluePositions}
        material={sphereMaterials.blue}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`greenMoon-${sphereGeometry.uuid}`}
        ref={sphereRefs.greenMoon}
        positions={filteredGreenMoonPositions}
        material={moonMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      <MemoizedSphere
        key={`blue-${sphereGeometry.uuid}`}
        ref={sphereRefs.blue}
        positions={filteredBluePositions}
        material={atmosMaterial2}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.25, 0.25, 0.25]}
      />
      <MemoizedSphere
        key={`purple-${sphereGeometry.uuid}`}
        ref={sphereRefs.purple}
        positions={filteredPurplePositions}
        material={sphereMaterials.purple}
        geometry={sphereGeometry}
        scale={[0.2, 0.2, 0.2]}
      />
      <MemoizedSphere
        key={`brown-${sphereGeometry.uuid}`}
        ref={sphereRefs.brown}
        positions={filteredBrownPositions}
        material={sphereMaterials.brown}
        geometry={sphereGeometry}
        scale={[0.4, 0.4, 0.4]}
      />
      <MemoizedSphere
        key={`purpleMoon-${sphereGeometry.uuid}`}
        ref={sphereRefs.purpleMoon}
        positions={filteredPurpleMoonPositions}
        material={moonMaterial}
        geometry={sphereGeometry}
        frustumCulled={false}
        scale={[0.05, 0.05, 0.05]}
      />
      {filteredBrownPositions.map((position, index) => (
        <mesh
          key={`ring-${index}`}
          position={position}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[50, 40, 32]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
});

export default SphereRenderer;
