// Scene.jsx
import React, {
  useRef,
  useCallback,
  useMemo,
  Suspense,
  useDeferredValue,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../stores/store';
import { Stats, Environment, Bvh } from '@react-three/drei';
import CustomCamera from './CustomCamera';
import SphereRenderer from './SphereRenderer';
import CellLoader from './CellLoader';
import Loader from './Loader';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import * as THREE from 'three';
import { useAuth } from '../hooks/useAuth';
import Ship from './Ship';
import loadCell from '../utils/loadCell';
import unloadCell from '../utils/unloadCell';

const Scene = ({
  backgroundColor,
  cameraRef,
  sphereRendererRef,
  shipsData,
  handleShipClick,
  loadingCells,
  setLoadingCells,
  updateShipDestination,
  civilisationName, // Add this prop
}) => {
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
  const setPlanetNames = useStore((state) => state.setPlanetNames);
  const deferredPositions = useDeferredValue(positions);
  const { user } = useAuth();

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
        swapBuffers,
        setPlanetNames
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
      setPlanetNames,
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

  const updateShipPosition = async (shipKey, position) => {
    try {
      const userId = user.uid;
      const shipRef = doc(db, 'users', userId);
      await updateDoc(shipRef, {
        [`ships.${shipKey}.position`]: position,
      });
    } catch (error) {
      console.error('Error updating ship position:', error);
    }
  };

  return (
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
            civilisationName={civilisationName} // Add this prop
          />
          <CustomEnvironment />
          <CustomCamera ref={cameraRef} />
          <CellLoader
            cameraRef={cameraRef}
            loadCell={loadCellCallback}
            unloadCell={unloadCellCallback}
          />
          {shipsData && (
            <>
              {Object.entries(shipsData).map(([shipKey, shipInfo]) => (
                <Ship
                  key={shipKey}
                  shipKey={shipKey}
                  shipInfo={shipInfo}
                  handleShipClick={handleShipClick}
                  updateShipPosition={updateShipPosition}
                  updateShipDestination={updateShipDestination}
                />
              ))}
            </>
          )}
        </Suspense>
      </Bvh>
    </Canvas>
  );
};

export default Scene;
