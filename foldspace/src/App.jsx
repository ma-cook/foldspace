import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  Suspense,
  useTransition,
  useDeferredValue,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from './store';
import {
  Stats,
  Environment,
  Bvh,
  AdaptiveEvents,
  PerformanceMonitor,
} from '@react-three/drei';
import CustomCamera from './CustomCamera';
import SphereRenderer from './components/sphereRenderer';
import CellLoader from './CellLoader';
import Loader from './Loader';
import LoadingMessage from './LoadingMessage';
import loadCell from './loadCell';
import unloadCell from './unloadCell';
import { useAuth } from './hooks/useAuth';
import AppLoader from './AppLoader';

const App = React.memo(() => {
  const loadedCells = useStore((state) => state.loadedCells);
  const positions = useStore((state) => state.positions);
  const redPositions = useStore((state) => state.redPositions);
  const greenPositions = useStore((state) => state.greenPositions);
  const bluePositions = useStore((state) => state.bluePositions);
  const purplePositions = useStore((state) => state.purplePositions);
  const brownPositions = useStore((state) => state.brownPositions);
  const gasPositions = useStore((state) => state.gasPositions);
  const greenMoonPositions = useStore((state) => state.greenMoonPositions);
  const purpleMoonPositions = useStore((state) => state.purpleMoonPositions);
  const redMoonPositions = useStore((state) => state.redMoonPositions);
  const gasMoonPositions = useStore((state) => state.gasMoonPositions);
  const brownMoonPositions = useStore((state) => state.brownMoonPositions);
  const setLoadedCells = useStore((state) => state.setLoadedCells);
  const setPositions = useStore((state) => state.setPositions);
  const setRedPositions = useStore((state) => state.setRedPositions);
  const setGreenPositions = useStore((state) => state.setGreenPositions);
  const setBluePositions = useStore((state) => state.setBluePositions);
  const setPurplePositions = useStore((state) => state.setPurplePositions);
  const setBrownPositions = useStore((state) => state.setBrownPositions);
  const setGreenMoonPositions = useStore(
    (state) => state.setGreenMoonPositions
  );
  const setPurpleMoonPositions = useStore(
    (state) => state.setPurpleMoonPositions
  );
  const setGasPositions = useStore((state) => state.setGasPositions);
  const setRedMoonPositions = useStore((state) => state.setRedMoonPositions);
  const setGasMoonPositions = useStore((state) => state.setGasMoonPositions);
  const setBrownMoonPositions = useStore(
    (state) => state.setBrownMoonPositions
  );
  const removeAllPositions = useStore((state) => state.removeAllPositions);
  const removeSphereRefs = useStore((state) => state.removeSphereRefs);
  const swapBuffers = useStore((state) => state.swapBuffers);
  const cameraRef = useRef();
  const sphereRendererRef = useRef();
  const [loadingCells, setLoadingCells] = useState(new Set());
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [isPending, startTransition] = useTransition();
  const deferredPositions = useDeferredValue(positions);
  const { isAuthenticated, isLoading, user } = useAuth();
  const [ownedPlanets, setOwnedPlanets] = useState([]);

  const fetchOwnedPlanets = async (userId) => {
    try {
      const response = await fetch(
        `https://us-central1-foldspace-6483c.cloudfunctions.net/api/getUserPlanets?userId=${userId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch owned planets');
      }
      const data = await response.json();
      setOwnedPlanets(data.planets);
    } catch (error) {
      console.error('Error fetching owned planets:', error);
    }
  };

  const assignGreenSphere = async (userId) => {
    try {
      const response = await fetch(
        'https://us-central1-foldspace-6483c.cloudfunctions.net/api/startingPlanet',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'User already has a starting planet') {
          console.log('User already has a starting planet');
          return;
        }
        throw new Error('Failed to assign ownership');
      }

      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Error assigning ownership:', error);
    }
  };

  useEffect(() => {
    if (user) {
      assignGreenSphere(user.uid);
      fetchOwnedPlanets(user.uid); // Fetch owned planets on user login
    }
  }, [user]);

  const loadCellCallback = useCallback(
    (x, z) =>
      loadCell(
        [`${x},${z}`], // Ensure cellKeysToLoad is an array
        true, // Pass loadDetail
        loadedCells, // Ensure loadedCells is a Set
        loadingCells, // Ensure loadingCells is a Set
        setLoadingCells,
        setPositions,
        setRedPositions,
        setGreenPositions,
        setBluePositions,
        setPurplePositions,
        setBrownPositions,
        setGreenMoonPositions,
        setPurpleMoonPositions,
        setGasPositions,
        setRedMoonPositions,
        setGasMoonPositions,
        setBrownMoonPositions,
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
      setBrownPositions,
      setGreenMoonPositions,
      setPurpleMoonPositions,
      setGasPositions,
      setRedMoonPositions,
      setGasMoonPositions,
      setBrownMoonPositions,
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
      Array.isArray(deferredPositions) &&
      deferredPositions.length > 0 &&
      Array.isArray(deferredPositions[0])
    ) {
      return deferredPositions.flat();
    }
    return deferredPositions;
  }, [deferredPositions]);

  const handleDeleteAllCells = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:5001/foldspace-6483c/us-central1/api/delete-all-cells',
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
        setBrownPositions([]);
        setGreenMoonPositions([]);
        setPurpleMoonPositions([]);
        setGasPositions([]);
        setRedMoonPositions([]);
        setGasMoonPositions([]);
        setBrownMoonPositions([]);
      } else {
        console.error('Failed to delete all cell data');
      }
    } catch (error) {
      console.error('Error deleting all cell data:', error);
    }
  };

  // Log gasPositions data

  function CustomEnvironment() {
    return (
      <Environment
        background
        backgroundBlurriness={0.01}
        backgroundIntensity={0.01}
        files="/kloppenheim_02_puresky_4k.hdr"
      />
    );
  }

  if (isLoading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <div>Please sign in to access this application.</div>;
  }

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '5px 10px',
          borderRadius: '5px',
        }}
      >
        {user && (
          <>
            <span style={{ marginRight: '10px' }}>
              {user.displayName || user.email}
            </span>
            <ul>
              {ownedPlanets.map((planet, index) => (
                <li key={index}>
                  {`(${planet.x.toFixed(2)}, ${planet.y.toFixed(
                    2
                  )}, ${planet.z.toFixed(2)})`}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Canvas gl={{ stencil: true }}>
        <fog attach="fog" args={[backgroundColor, 10000, 100000]} />

        <Bvh>
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
              brownPositions={brownPositions}
              greenMoonPositions={greenMoonPositions}
              purpleMoonPositions={purpleMoonPositions}
              gasPositions={gasPositions}
              redMoonPositions={redMoonPositions}
              gasMoonPositions={gasMoonPositions}
              brownMoonPositions={brownMoonPositions}
            />
            <CustomEnvironment />
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
