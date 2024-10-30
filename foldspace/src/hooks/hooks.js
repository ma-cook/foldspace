import { useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import SpherePool from '../SpherePool';
import { createInstancedMesh } from '../utils';
import { lessDetailedSphereGeometry, torusGeometry } from '../SphereData';

export const useFilteredPositions = (positions, cameraRef, maxDistance) => {
  const [filteredPositions, setFilteredPositions] = useState([]);

  useFrame(() => {
    if (!cameraRef.current) return;
    const cameraPosition = cameraRef.current.position;
    const newFilteredPositions = positions.filter((pos) => {
      const distance = cameraPosition.distanceTo(pos);
      return distance < maxDistance;
    });
    setFilteredPositions(newFilteredPositions);
  });

  return filteredPositions;
};

export const useSpherePools = (geometry) => {
  return useMemo(
    () => ({
      red: new SpherePool(() => createInstancedMesh(geometry), 10, 100),
      green: new SpherePool(() => createInstancedMesh(geometry), 10, 100),
      blue: new SpherePool(() => createInstancedMesh(geometry), 10, 100),
      purple: new SpherePool(() => createInstancedMesh(geometry), 10, 100),
      brown: new SpherePool(() => createInstancedMesh(geometry), 10, 100),
      greenMoon: new SpherePool(() => createInstancedMesh(geometry), 10, 100),
      purpleMoon: new SpherePool(() => createInstancedMesh(geometry), 10, 100),
      gas: new SpherePool(() => createInstancedMesh(geometry), 10, 100),

      lessDetailed: new SpherePool(
        () => createInstancedMesh(lessDetailedSphereGeometry),
        10,
        100
      ),
      brownRing: new SpherePool(
        () => createInstancedMesh(torusGeometry),
        10,
        100
      ),
    }),
    [geometry]
  );
};
