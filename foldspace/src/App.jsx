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
import { useStore } from './store';
import { useAuth } from './hooks/useAuth';
import { db } from './firebase';
import AppLoader from './AppLoader';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
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

  const fetchShipsData = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.ships) {
          setShipsData(userData.ships);
        } else {
          console.log('No ships data found for this user.');
        }
      } else {
        console.error('User not found');
      }
    } catch (error) {
      console.error('Error fetching ships data:', error);
    }
  };

  const fetchOwnedPlanets = async (userId) => {
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
      assignGreenSphere(user.uid).then(() => {
        fetchOwnedPlanets(user.uid);
      });
      fetchShipsData(user.uid);
    }
  }, [user, setTarget, setLookAt]);

  const handleShipClick = (shipPosition) => {
    const offsetPosition = {
      x: shipPosition.x + 10,
      y: shipPosition.y + 20,
      z: shipPosition.z + 30,
    };
    setTarget(offsetPosition);
    setLookAt(shipPosition);
  };

  const handlePlanetClick = (planetPosition) => {
    const offsetPosition = {
      x: planetPosition.x + 100,
      y: planetPosition.y + 280,
      z: planetPosition.z + 380,
    };
    setTarget(offsetPosition);
    setLookAt(planetPosition);
  };

  // if (isLoading) {
  //   return <AppLoader />;
  // }

  // if (!isAuthenticated) {
  //   return <div>Please sign in to access this application.</div>;
  // }

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <UserPanel
        user={user}
        ownedPlanets={ownedPlanets}
        shipsData={shipsData}
        handlePlanetClick={handlePlanetClick}
        handleShipClick={handleShipClick}
      />
      <Scene
        backgroundColor={backgroundColor}
        cameraRef={cameraRef}
        sphereRendererRef={sphereRendererRef}
        shipsData={shipsData}
        handleShipClick={handleShipClick}
        loadingCells={loadingCells}
        setLoadingCells={setLoadingCells}
      />
      {loadingCells.size > 0 && <LoadingMessage />}
    </div>
  );
});

export default App;
