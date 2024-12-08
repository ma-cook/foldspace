// App.jsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Suspense,
  useDeferredValue,
} from 'react';
import { useStore } from './store';
import { useAuth } from './hooks/useAuth';
import { db } from './firebase';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc, // Import onSnapshot for real-time updates
} from 'firebase/firestore';
import UserPanel from './components/UserPanel';
import Scene from './components/Scene';
import LoadingMessage from './components/LoadingMessage';

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

  // Function to set up real-time listener for ships data
  const fetchShipsData = useCallback((userId) => {
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.ships) {
            setShipsData(userData.ships);
          } else {
            console.log('No ships data found for this user.');
            setShipsData(null);
          }
        } else {
          console.error('User not found');
          setShipsData(null);
        }
      },
      (error) => {
        console.error('Error listening to ships data:', error);
      }
    );

    return unsubscribe;
  }, []);

  const fetchOwnedPlanets = useCallback(
    async (userId) => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const planets = userData.spheres || [];

          setOwnedPlanets(planets);

          if (planets.length > 0) {
            const firstPlanet = planets[0];
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
          } else {
            console.log('No owned planets found for this user.');
          }
        } else {
          console.error('User not found');
        }
      } catch (error) {
        console.error('Error fetching owned planets:', error);
      }
    },
    [setTarget, setLookAt]
  );

  const assignGreenSphere = useCallback(async (userId) => {
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
  }, []);

  useEffect(() => {
    let unsubscribeShips = null;
    if (user) {
      assignGreenSphere(user.uid).then(() => {
        fetchOwnedPlanets(user.uid);
      });
      unsubscribeShips = fetchShipsData(user.uid); // Set up listener
    }

    // Clean up the listener on unmount or when user changes
    return () => {
      if (unsubscribeShips) unsubscribeShips();
    };
  }, [user, assignGreenSphere, fetchOwnedPlanets, fetchShipsData]);

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
            // Ensure 'type' is not altered
            // Alternatively, re-include 'type' if necessary
            // [`ships.${shipKey}.type`]: type,
          });

          console.log(`Destination for ship ${shipKey} set to:`, destination);
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
      <Scene
        backgroundColor={backgroundColor}
        cameraRef={cameraRef}
        sphereRendererRef={sphereRendererRef}
        shipsData={shipsData}
        handleShipClick={handleShipClick}
        loadingCells={loadingCells}
        setLoadingCells={setLoadingCells}
        updateShipDestination={updateShipDestination}
      />
      {loadingCells.size > 0 && <LoadingMessage />}
    </div>
  );
});

export default App;
