// Ship.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ColonyShip from '../modelLoaders/ColonyShip';
import ScoutShip from '../modelLoaders/ScoutShip';
import { useAuth } from '../hooks/useAuth';

const Ship = ({ shipKey, shipInfo, handleShipClick }) => {
  const shipRef = useRef();
  const { user } = useAuth();
  const isOwnShip = user && shipInfo.ownerId === user.uid;

  useFrame(() => {
    if (shipRef.current && shipInfo.position) {
      shipRef.current.position.set(
        shipInfo.position.x,
        shipInfo.position.y,
        shipInfo.position.z
      );
    }
  });

  const handleClick = () => {
    if (isOwnShip) {
      handleShipClick(shipInfo.position);
    }
  };

  const shipType = shipInfo.type || shipKey.replace(/\d+/g, '').trim();

  if (shipType.toLowerCase() === 'colony ship') {
    return (
      <ColonyShip
        ref={shipRef}
        position={[
          shipInfo.position.x,
          shipInfo.position.y,
          shipInfo.position.z,
        ]}
        onClick={handleClick}
      />
    );
  } else if (shipType.toLowerCase() === 'scout') {
    return (
      <ScoutShip
        ref={shipRef}
        position={[
          shipInfo.position.x,
          shipInfo.position.y,
          shipInfo.position.z,
        ]}
        onClick={handleClick}
      />
    );
  } else {
    return null;
  }
};

export default Ship;
