import React, {
  useRef,
  useEffect,
  useMemo,
  Suspense,
  useState,
  useCallback,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from './store';
import { Stats, Environment } from '@react-three/drei';
import CustomCamera from './CustomCamera';
import SphereRenderer from './sphereRenderer';
import PlaneMesh from './PlaneMesh';
import CustomFogMaterial from './CustomFogMaterial';

import CellLoader from './CellLoader';
import Loader from './Loader';

import loadCell from './loadCell';
import unloadCell from './unloadCell';

const GRID_SIZE = 80000;

const App = React.memo(() => {
  const loadedCells = useStore((state) => state.loadedCells);
  const positions = useStore((state) => state.positions);
  const redPositions = useStore((state) => state.redPositions);
  const greenPositions = useStore((state) => state.greenPositions);
  const bluePositions = useStore((state) => state.bluePositions);
  const purplePositions = useStore((state) => state.purplePositions);
  const greenMoonPositions = useStore((state) => state.greenMoonPositions);
  const purpleMoonPositions = useStore((state) => state.purpleMoonPositions);
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const setPositions = useStore((state) => state.setPositions);
  const setRedPositions = useStore((state) => state.setRedPositions);
  const setGreenPositions = useStore((state) => state.setGreenPositions);
  const setBluePositions = useStore((state) => state.setBluePositions);
  const setPurplePositions = useStore((state) => state.setPurplePositions);
  const setGreenMoonPositions = useStore(
    (state) => state.setGreenMoonPositions
  );
  const setPurpleMoonPositions = useStore(
    (state) => state.setPurpleMoonPositions
  );
  const removeAllPositions = useStore((state) => state.removeAllPositions);
  const removeSphereRefs = useStore((state) => state.removeSphereRefs);
  const swapBuffers = useStore((state) => state.swapBuffers);
  const cameraRef = useRef();
  const sphereRendererRef = useRef();
  const [loadingCells, setLoadingCells] = useState(new Set());
  const [backgroundColor, setBackgroundColor] = useState('white');

  const loadCellCallback = useCallback(
    (x, z) =>
      loadCell(
        x,
        z,
        true, // Pass loadDetail
        new Set(loadedCells), // Ensure loadedCells is a Set
        new Set(loadingCells), // Ensure loadingCells is a Set
        setLoadingCells,
        setPositions,
        setRedPositions,
        setGreenPositions,
        setBluePositions,
        setPurplePositions,
        setGreenMoonPositions,
        setPurpleMoonPositions,
        setLoadedCells,
        swapBuffers
      ),
    [
      loadedCells,
      loadingCells,
      setLoadingCells,
      setPositions,
      setRedPositions,
      setGreenPositions,
      setBluePositions,
      setPurplePositions,
      setGreenMoonPositions,
      setPurpleMoonPositions,
      setLoadedCells,
      swapBuffers,
    ]
  );

  const unloadCellCallback = useCallback(
    (x, z) =>
      unloadCell(
        x,
        z,
        new Set(loadedCells), // Ensure loadedCells is a Set
        setLoadedCells,
        removeAllPositions,
        removeSphereRefs,
        sphereRendererRef,
        swapBuffers
      ),
    [
      loadedCells,
      setLoadedCells,
      removeAllPositions,
      removeSphereRefs,
      sphereRendererRef,
      swapBuffers,
    ]
  );

  const flattenedPositions = useMemo(() => {
    if (
      Array.isArray(positions) &&
      positions.length > 0 &&
      Array.isArray(positions[0])
    ) {
      return positions.flat();
    }
    return positions;
  }, [positions]);

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <Canvas>
        <Suspense fallback={<Loader />}>
          <Stats />
          <ambientLight />
          <SphereRenderer
            cameraRef={cameraRef}
            ref={sphereRendererRef}
            flattenedPositions={
              Array.isArray(flattenedPositions) ? flattenedPositions : []
            }
            redPositions={redPositions}
            greenPositions={greenPositions}
            bluePositions={bluePositions}
            purplePositions={purplePositions}
            greenMoonPositions={greenMoonPositions}
            purpleMoonPositions={purpleMoonPositions}
          />
          <fog attach="fog" args={[backgroundColor, 10000, 100000]} />

          <Environment
            preset="forest"
            background
            backgroundBlurriness={0.8}
            backgroundIntensity={0.007}
          />

          <CustomCamera ref={cameraRef} />
          <CellLoader
            cameraRef={cameraRef}
            loadCell={loadCellCallback}
            unloadCell={unloadCellCallback}
          />
          {[...loadedCells].map((cellKey, index) => {
            if (typeof cellKey !== 'string') {
              console.error(`Invalid cellKey: ${cellKey}`);
              return null;
            }

            const [x, z] = cellKey.split(',').map(Number);

            const positions = Array(10)
              .fill()
              .map((_, i) => [x * GRID_SIZE, i * 5000, z * GRID_SIZE]);
            return (
              <PlaneMesh
                key={`${cellKey}-${index}`}
                positions={positions}
                sphereRefs={{}}
                instancedMeshRef={{}}
                redInstancedMeshRef={{}}
                greenInstancedMeshRef={{}}
                blueInstancedMeshRef={{}}
                purpleInstancedMeshRef={{}}
                greenMoonInstancedMeshRef={{}}
                cellKey={cellKey}
              />
            );
          })}
        </Suspense>
      </Canvas>
    </div>
  );
});

export default App;
