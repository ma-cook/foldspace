// hooks.js
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createInstancedMesh } from './utils';
import { DETAIL_DISTANCE, UNLOAD_DETAIL_DISTANCE } from './config';
import SpherePool from './SpherePool';
import { useStore } from './store';
import {
  sphereMaterial,
  redSphereMaterial,
  greenSphereMaterial,
  blueSphereMaterial,
  purpleSphereMaterial,
  brownSphereMaterial,
  moonMaterial,
} from './SphereData';

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
      default: new SpherePool(
        () => createInstancedMesh(geometry, sphereMaterial),
        10,
        100
      ),
      red: new SpherePool(
        () => createInstancedMesh(geometry, redSphereMaterial),
        10,
        100
      ),
      green: new SpherePool(
        () => createInstancedMesh(geometry, greenSphereMaterial),
        10,
        100
      ),
      blue: new SpherePool(
        () => createInstancedMesh(geometry, blueSphereMaterial),
        10,
        100
      ),
      purple: new SpherePool(
        () => createInstancedMesh(geometry, purpleSphereMaterial),
        10,
        100
      ),
      brown: new SpherePool(
        () => createInstancedMesh(geometry, brownSphereMaterial),
        10,
        100
      ),
      greenMoon: new SpherePool(
        () => createInstancedMesh(geometry, moonMaterial),
        10,
        100
      ),
      purpleMoon: new SpherePool(
        () => createInstancedMesh(geometry, moonMaterial),
        10,
        100
      ),
    }),
    [geometry]
  );
};

export const useSphereMaterials = () => {
  return useMemo(
    () => ({
      red: redSphereMaterial,
      green: greenSphereMaterial,
      blue: blueSphereMaterial,
      purple: purpleSphereMaterial,
      greenMoon: moonMaterial,
      purpleMoon: moonMaterial,
    }),
    []
  );
};
