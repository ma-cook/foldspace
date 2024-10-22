import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from './store';
import {
  Stats,
  Environment,
  Bvh,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor,
} from '@react-three/drei';
import CustomCamera from './CustomCamera';
import SphereRenderer from './components/sphereRenderer';
import CellLoader from './CellLoader';
import Loader from './Loader';
import LoadingMessage from './LoadingMessage'; // Import LoadingMessage
import loadCell from './loadCell';
import unloadCell from './unloadCell';

//testing deployment, aligning keys//
const App = React.memo(() => {
  const loadedCells = useStore((state) => state.loadedCells);
  const positions = useStore((state) => state.positions);
  const redPositions = useStore((state) => state.redPositions);
  const greenPositions = useStore((state) => state.greenPositions);
  const bluePositions = useStore((state) => state.bluePositions);
  const purplePositions = useStore((state) => state.purplePositions);
  const brownPositions = useStore((state) => state.brownPositions); // Add brown positions
  const greenMoonPositions = useStore((state) => state.greenMoonPositions);
  const purpleMoonPositions = useStore((state) => state.purpleMoonPositions);
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const setPositions = useStore((state) => state.setPositions);
  const setRedPositions = useStore((state) => state.setRedPositions);
  const setGreenPositions = useStore((state) => state.setGreenPositions);
  const setBluePositions = useStore((state) => state.setBluePositions);
  const setPurplePositions = useStore((state) => state.setPurplePositions);
  const setBrownPositions = useStore((state) => state.setBrownPositions); // Add setBrownPositions
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
  const [dpr, setDpr] = useState(2);

  const loadCellCallback = useCallback(
    (x, z) =>
      loadCell(
        x,
        z,
        true, // Pass loadDetail
        loadedCells, // Ensure loadedCells is a Set
        loadingCells, // Ensure loadingCells is a Set
        setLoadingCells,
        setPositions,
        setRedPositions,
        setGreenPositions,
        setBluePositions,
        setPurplePositions,
        setBrownPositions, // Add setBrownPositions
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
      setBrownPositions, // Add setBrownPositions
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
        loadedCells, // Ensure loadedCells is a Set
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

  const handleDeleteAllCells = async () => {
    try {
      const response = await fetch(
        'https://foldspace-6483c.cloudFunctions.net/delete-all-cells',
        {
          method: 'DELETE',
        }
      );
      if (response.ok) {
        console.log('All cell data deleted successfully');
        // Clear local state if needed
        setLoadedCells(new Set());
        setPositions([]);
        setRedPositions([]);
        setGreenPositions([]);
        setBluePositions([]);
        setPurplePositions([]);
        setBrownPositions([]); // Clear brown positions
        setGreenMoonPositions([]);
        setPurpleMoonPositions([]);
      } else {
        console.error('Failed to delete all cell data');
      }
    } catch (error) {
      console.error('Error deleting all cell data:', error);
    }
  };

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <Canvas>
        <fog attach="fog" args={[backgroundColor, 10000, 100000]} />

        <AdaptiveEvents />
        <Bvh firstHitOnly>
          <Suspense fallback={<Loader />}>
            <PerformanceMonitor flipflops={3} onFallback={() => setDpr(1)} />

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
              brownPositions={brownPositions} // Pass brown positions
              greenMoonPositions={greenMoonPositions}
              purpleMoonPositions={purpleMoonPositions}
            />

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
          </Suspense>
        </Bvh>
      </Canvas>
      {loadingCells.size > 0 && <LoadingMessage />}
      <button onClick={handleDeleteAllCells}>Delete All Cells</button>
    </div>
  );
});

export default App;
