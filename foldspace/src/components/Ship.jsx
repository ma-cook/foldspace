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
  updateShipPosition,
  updateShipDestination,
}) => {
  const shipRef = useRef();
  const timeSinceLastUpdate = useRef(0);

  // Local state for position and destination
  const [position, setPosition] = useState(shipInfo.position);
  const [destination, setDestination] = useState(shipInfo.destination);

  // Update local state when shipInfo changes
  useEffect(() => {
    setPosition(shipInfo.position);
    setDestination(shipInfo.destination);
  }, [shipInfo.position, shipInfo.destination]);

  useFrame((state, delta) => {
    if (destination && shipRef.current) {
      const currentPos = new THREE.Vector3(position.x, position.y, position.z);
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
        shipRef.current.position.copy(currentPos);

        // Update local position state
        setPosition({
          x: currentPos.x,
          y: currentPos.y,
          z: currentPos.z,
        });

        // Update position in database every second
        timeSinceLastUpdate.current += delta;
        if (timeSinceLastUpdate.current >= 1) {
          updateShipPosition(shipKey, {
            x: currentPos.x,
            y: currentPos.y,
            z: currentPos.z,
          });
          timeSinceLastUpdate.current = 0;
        }
      } else {
        // Destination reached, clear destination
        setDestination(null);
        updateShipDestination(shipKey, null);
      }
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
