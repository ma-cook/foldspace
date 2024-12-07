// Ship.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import ColonyShip from '../modelLoaders/ColonyShip';
import ScoutShip from '../modelLoaders/ScoutShip';
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
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Call the Cloud Function
      const response = await fetch(
        'https://us-central1-your-project-id.cloudfunctions.net/completeColonization',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            shipKey,
            shipInfo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete colonization');
      }

      console.log('Colonization completed successfully:', data.message);
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
