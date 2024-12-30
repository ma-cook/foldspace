// App.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from './store';
import { useAuth } from './hooks/useAuth';
import { db } from './firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
} from 'firebase/firestore';
import UserPanel from './components/UserPanel';
import Scene from './components/Scene';
import LoadingMessage from './components/LoadingMessage';
import EconomyBar from './components/EconomyBar';

const App = React.memo(() => {
  const cameraRef = useRef();
  const sphereRendererRef = useRef();
  const [loadingCells, setLoadingCells] = useState(new Set());
  const [backgroundColor, setBackgroundColor] = useState('white');
  const { isAuthenticated, isLoading, user } = useAuth();
  const [ownedPlanets, setOwnedPlanets] = useState([]);
  const setTarget = useStore((state) => state.setTarget);
  const setLookAt = useStore((state) => state.setLookAt);
  const [shipsData, setShipsData] = useState(null);
  const setIsSelectingDestination = useStore(
    (state) => state.setIsSelectingDestination
  );
  const setShipToMove = useStore((state) => state.setShipToMove);
  const isInitialCameraSet = useRef(false);
  const [economy, setEconomy] = useState(null);
  const [civilisationName, setCivilisationName] = useState('');
  const [isAssigningPlanet, setIsAssigningPlanet] = useState(false);

  const fetchUserEconomy = useCallback((userId) => {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setEconomy(
          userData.economy || {
            credits: 0,
            crystals: 0,
            gases: 0,
            minerals: 0,
          }
        );
      }
    });
  }, []);

  // Function to set up real-time listener for ships data
  const fetchAllShipsData = useCallback(() => {
    const usersCollectionRef = collection(db, 'users');

    const unsubscribe = onSnapshot(
      usersCollectionRef,
      (snapshot) => {
        const allShips = {};
        snapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          const userId = userDoc.id;
          const ships = userData.ships || {};
          Object.entries(ships).forEach(([shipKey, shipInfo]) => {
            allShips[shipKey] = {
              ...shipInfo,
              ownerId: userId,
            };
          });
        });
        setShipsData(allShips);
      },
      (error) => {
        console.error('Error fetching all ships data:', error);
      }
    );

    return unsubscribe;
  }, []);

  // Function to set up real-time listener for owned planets
  const fetchOwnedPlanets = useCallback((userId) => {
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data:', userData); // Debug log

          // Convert spheres map to array if needed
          let planets = [];
          if (userData.spheres) {
            if (Array.isArray(userData.spheres)) {
              planets = userData.spheres;
            } else {
              // Convert map to array
              planets = Object.entries(userData.spheres).map(
                ([key, sphere]) => ({
                  ...sphere,
                  index: key,
                })
              );
            }
          }

          console.log('Processed planets:', planets); // Debug log
          setOwnedPlanets(planets);
        } else {
          console.error('User not found');
        }
      },
      (error) => {
        console.error('Error listening to owned planets:', error);
      }
    );

    return unsubscribe;
  }, []);

  const assignGreenSphere = useCallback(async (userId) => {
    setIsAssigningPlanet(true);
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
    } finally {
      setIsAssigningPlanet(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeEconomy = null;
    if (user) {
      unsubscribeEconomy = fetchUserEconomy(user.uid);
    }
    return () => {
      if (unsubscribeEconomy) unsubscribeEconomy();
    };
  }, [user, fetchUserEconomy]);

  useEffect(() => {
    let unsubscribeShips = null;
    let unsubscribePlanets = null;
    if (user) {
      unsubscribeShips = fetchAllShipsData();
      unsubscribePlanets = fetchOwnedPlanets(user.uid);
      assignGreenSphere(user.uid).then(() => {
        unsubscribePlanets = fetchOwnedPlanets(user.uid); // Set up listener for owned planets
      });
    }

    return () => {
      if (unsubscribeShips) unsubscribeShips();
      if (unsubscribePlanets) unsubscribePlanets();
    };
  }, [user, assignGreenSphere, fetchAllShipsData, fetchOwnedPlanets]);

  // Set initial camera position based on the first owned planet
  useEffect(() => {
    if (!isInitialCameraSet.current && ownedPlanets.length > 0) {
      const firstPlanet = ownedPlanets[0];
      const newPosition = {
        x: firstPlanet.x + 100,
        y: firstPlanet.y + 280,
        z: firstPlanet.z + 380,
      };
      setTarget(newPosition);
      setLookAt({
        x: firstPlanet.x,
        y: firstPlanet.y,
        z: firstPlanet.z,
      });
      isInitialCameraSet.current = true;
    }
  }, [ownedPlanets, setTarget, setLookAt]);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setCivilisationName(userData.civilisationName || '');
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleShipClick = (shipPosition) => {
    const offsetPosition = {
      x: shipPosition.x + 10,
      y: shipPosition.y + 20,
      z: shipPosition.z + 30,
    };
    setTarget(offsetPosition);
    setLookAt(shipPosition);
  };

  // Function to update ship's destination (passed to UserPanel)
  const updateShipDestination = useCallback(
    async (shipKey, destination) => {
      try {
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        const userId = user.uid;
        const shipRef = doc(db, 'users', userId);

        // Fetch current ship data to preserve the 'type'
        const shipDoc = await getDoc(shipRef);
        if (shipDoc.exists()) {
          const shipData = shipDoc.data().ships[shipKey];
          if (!shipData) {
            console.error(`Ship ${shipKey} does not exist.`);
            return;
          }

          const { type } = shipData; // Preserve the 'type'

          await updateDoc(shipRef, {
            [`ships.${shipKey}.destination`]: destination,
            [`ships.${shipKey}.type`]: type, // Ensure 'type' is not altered
          });

          console.log(`Destination for ship ${shipKey} set to:`, destination);
          setIsSelectingDestination(false);
          setShipToMove(null);
        } else {
          console.error('User document does not exist.');
        }
      } catch (error) {
        console.error('Error updating ship destination:', error);
      }
    },
    [user]
  );

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <UserPanel
        user={user}
        ownedPlanets={ownedPlanets}
        shipsData={shipsData}
        handleShipClick={handleShipClick}
        setTarget={setTarget}
        setLookAt={setLookAt}
        updateShipDestination={updateShipDestination} // Pass the function
      />
      <EconomyBar economy={economy} />
      <Scene
        backgroundColor={backgroundColor}
        cameraRef={cameraRef}
        sphereRendererRef={sphereRendererRef}
        shipsData={shipsData}
        handleShipClick={handleShipClick}
        loadingCells={loadingCells}
        setLoadingCells={setLoadingCells}
        updateShipDestination={updateShipDestination}
        civilisationName={civilisationName} // Pass the civilisation name
      />
      {loadingCells.size > 0 && <LoadingMessage />}
      {isAssigningPlanet && (
        <LoadingMessage message="Assigning your starting planet..." />
      )}
    </div>
  );
});

export default App;
