// Scene.jsx
import React, {
  useRef,
  useCallback,
  useMemo,
  Suspense,
  useDeferredValue,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { Stats, Environment, Bvh } from '@react-three/drei';
import CustomCamera from '../CustomCamera';
import SphereRenderer from './sphereRenderer';
import CellLoader from './CellLoader';
import Loader from './Loader';
import LoadingMessage from './LoadingMessage';
import loadCell from '../loadCell';
import unloadCell from '../unloadCell';
import ColonyShip from '../modelLoaders/ColonyShip';
import ScoutShip from '../modelLoaders/ScoutShip';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ShipMovement = ({
  shipsData,
  shipRefs,
  updateShipPosition,
  updateShipDestination,
}) => {
  const timeSinceLastUpdate = useRef(0);

  useFrame((state, delta) => {
    if (shipsData) {
      Object.entries(shipsData).forEach(([shipKey, shipInfo]) => {
        const { position, destination } = shipInfo;
        if (destination) {
          const shipRef = shipRefs.current[shipKey];
          if (shipRef) {
            const currentPos = new THREE.Vector3(
              position.x,
              position.y,
              position.z
            );
            const destPos = new THREE.Vector3(
              destination.x,
              destination.y,
              destination.z
            );
            const direction = destPos.clone().sub(currentPos).normalize();
            const distance = currentPos.distanceTo(destPos);
            const moveDistance = Math.min(distance, 10 * delta); // 10 units per second

            if (distance > 0.1) {
              currentPos.add(direction.multiplyScalar(moveDistance));

              // Update ship's position
              shipRef.position.copy(currentPos);

              // Update local shipData
              shipInfo.position = {
                x: currentPos.x,
                y: currentPos.y,
                z: currentPos.z,
              };

              // Update position in database every second
              timeSinceLastUpdate.current += delta;
              if (timeSinceLastUpdate.current >= 1) {
                updateShipPosition(shipKey, shipInfo.position);
                timeSinceLastUpdate.current = 0;
              }
            } else {
              // Destination reached, clear destination
              shipInfo.destination = null;
              updateShipDestination(shipKey, null);
            }
          }
        }
      });
    }
  });

  return null;
};

const Scene = ({
  backgroundColor,
  cameraRef,
  sphereRendererRef,
  shipsData,
  handleShipClick,
  loadingCells,
  setLoadingCells,
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
  const shipRefs = useRef({});

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

  const updateShipDestination = async (shipKey, destination) => {
    try {
      const userId = user.uid;
      const shipRef = doc(db, 'users', userId);
      await updateDoc(shipRef, {
        [`ships.${shipKey}.destination`]: destination,
      });
    } catch (error) {
      console.error('Error updating ship destination:', error);
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
              {Object.entries(shipsData).map(([shipKey, shipInfo]) => {
                const shipType = shipKey.replace(/\d+/g, '').trim();
                const position = [
                  shipInfo.position.x,
                  shipInfo.position.y,
                  shipInfo.position.z,
                ];

                const handleClick = () => handleShipClick(shipInfo.position);

                const shipRef = useRef();
                shipRefs.current[shipKey] = shipRef.current;

                if (shipType === 'colony ship') {
                  return (
                    <ColonyShip
                      key={shipKey}
                      ref={shipRef}
                      position={position}
                      onClick={handleClick}
                    />
                  );
                } else if (shipType === 'scout') {
                  return (
                    <ScoutShip
                      key={shipKey}
                      ref={shipRef}
                      position={position}
                      onClick={handleClick}
                    />
                  );
                } else {
                  return null;
                }
              })}
            </>
          )}
          <ShipMovement
            shipsData={shipsData}
            shipRefs={shipRefs}
            updateShipPosition={updateShipPosition}
            updateShipDestination={updateShipDestination}
          />
        </Suspense>
      </Bvh>
    </Canvas>
  );
};

export default Scene;
