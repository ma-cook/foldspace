// Ship.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import ColonyShip from '../modelLoaders/ColonyShip';
import ScoutShip from '../modelLoaders/ScoutShip';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const Ship = ({ shipKey, shipInfo, handleShipClick }) => {
  const shipRef = useRef();
  const { user } = useAuth();
  const isOwnShip = user && shipInfo.ownerId === user.uid;

  const [position, setPosition] = useState(shipInfo.position);

  useEffect(() => {
    setPosition(shipInfo.position);
  }, [shipInfo.position]);

  useFrame(() => {
    if (shipRef.current) {
      shipRef.current.position.set(position.x, position.y, position.z);
    }
  });

  const handleClick = () => {
    if (isOwnShip) {
      handleShipClick(position);
    }
  };

  // Handle colonization countdown
  useEffect(() => {
    if (
      shipInfo.isColonizing &&
      shipInfo.colonizeStartTime &&
      shipInfo.destination
    ) {
      const colonizeDuration = 60 * 1000; // 1 minute in milliseconds
      const timeElapsed = Date.now() - shipInfo.colonizeStartTime.toMillis();

      if (timeElapsed >= colonizeDuration) {
        // Colonization complete
        completeColonization();
      } else {
        // Update UI or show countdown (optional)
      }
    }
  }, [shipInfo]);

  const completeColonization = async () => {
    try {
      // Update the sphere data in Firestore to assign ownership
      await updateDoc(doc(db, 'cells', shipInfo.destination.cellId), {
        // Update the specific sphere in the cell's data
        [`positions.greenPositions.${shipInfo.destination.instanceId}.owner`]:
          user.uid,
        [`positions.greenPositions.${shipInfo.destination.instanceId}.planetName`]:
          user.uid, // Or any other name
        [`positions.greenPositions.${shipInfo.destination.instanceId}.civilisationName`]:
          user.displayName || user.email,
      });

      // Add the planet to the user's spheres
      await updateDoc(doc(db, 'users', user.uid), {
        spheres: admin.firestore.FieldValue.arrayUnion({
          x: shipInfo.destination.x,
          y: shipInfo.destination.y,
          z: shipInfo.destination.z,
          planetName: user.uid, // Or any other name
          civilisationName: user.displayName || user.email,
        }),
      });

      // Remove the ship or reset its state
      await updateDoc(doc(db, 'ships', shipKey), {
        isColonizing: false,
        colonizeStartTime: null,
        destination: null,
        // Optionally, remove the ship
      });
    } catch (error) {
      console.error('Error completing colonization:', error);
    }
  };

  const shipType = shipInfo.type || shipKey.replace(/\d+/g, '').trim();

  if (shipType.toLowerCase() === 'colony ship') {
    return (
      <ColonyShip
        ref={shipRef}
        position={[position.x, position.y, position.z]}
        onClick={handleClick}
      />
    );
  } else if (shipType.toLowerCase() === 'scout') {
    return (
      <ScoutShip
        ref={shipRef}
        position={[position.x, position.y, position.z]}
        onClick={handleClick}
      />
    );
  } else {
    return null;
  }
};

export default Ship;
