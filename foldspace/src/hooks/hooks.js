import { useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import SpherePool from '../SpherePool';
import { createInstancedMesh } from '../utils';
import { lessDetailedSphereGeometry, torusGeometry } from '../SphereData';

export const useFilteredPositions = (positions, cameraRef, maxDistance) => {
  return useMemo(() => {
    if (!positions || !cameraRef.current) return {};

    const filteredPositions = {};
    const cameraPosition = cameraRef.current.position;

    Object.entries(positions).forEach(([key, pos]) => {
      const distance = cameraPosition.distanceTo(pos);
      if (distance < maxDistance) {
        filteredPositions[key] = pos;
      }
    });

    return filteredPositions;
  }, [positions, cameraRef, maxDistance]);
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
