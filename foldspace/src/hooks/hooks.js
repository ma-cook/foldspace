import { useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import SpherePool from '../utils/SpherePool';
import { createInstancedMesh } from '../utils/utils';
import { lessDetailedSphereGeometry, torusGeometry } from '../utils/SphereData';

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
      red: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      green: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      blue: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      purple: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      brown: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      greenMoon: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      purpleMoon: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      gas: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      redMoon: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      gasMoon: new SpherePool(() => createInstancedMesh(geometry), 10, 200),
      brownMoon: new SpherePool(() => createInstancedMesh(geometry), 10, 200),

      lessDetailed: new SpherePool(
        () => createInstancedMesh(lessDetailedSphereGeometry),
        10,
        200
      ),
      brownRing: new SpherePool(
        () => createInstancedMesh(torusGeometry),
        10,
        200
      ),
      systemRing: new SpherePool(
        () => createInstancedMesh(torusGeometry),
        10,
        200
      ),
    }),
    [geometry]
  );
};
