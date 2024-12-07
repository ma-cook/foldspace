// Ship.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ColonyShip from '../modelLoaders/ColonyShip';
import ScoutShip from '../modelLoaders/ScoutShip';

const Ship = ({
  shipKey,
  shipInfo,
  handleShipClick,
  // Remove server-side update functions
}) => {
  const shipRef = useRef();

  // Local state for position
  const [position, setPosition] = useState(shipInfo.position);

  // Update local state when shipInfo changes
  useEffect(() => {
    setPosition(shipInfo.position);
  }, [shipInfo.position]);

  useFrame((state, delta) => {
    if (shipRef.current) {
      // Update the ship's position based on Firestore data
      shipRef.current.position.set(position.x, position.y, position.z);
    }
  });

  const positionArray = [position.x, position.y, position.z];
  const handleClick = () => handleShipClick(position);

  const shipType = shipKey.replace(/\d+/g, '').trim();

  if (shipType.toLowerCase() === 'colony ship') {
    return (
      <ColonyShip
        ref={shipRef}
        position={positionArray}
        onClick={handleClick}
      />
    );
  } else if (shipType.toLowerCase() === 'scout') {
    return (
      <ScoutShip ref={shipRef} position={positionArray} onClick={handleClick} />
    );
  } else {
    return null;
  }
};

export default Ship;
