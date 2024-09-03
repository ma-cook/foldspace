import { create } from 'zustand';
import * as THREE from 'three';

export const useStore = create((set) => ({
  vec: null,
  defaultPosition: new THREE.Vector3(0, 50, 100),
  lookAt: new THREE.Vector3(),
  rotation: new THREE.Euler(),
  currentPlaneIndex: 0,
  positions: [], // Ensure positions is always an array
  cameraPosition: [0, 50, 100], // new state variable
  sphereRefs: null,
  loadedCells: [], // Store as an array
  setLoadedCells: (loadedCells) => {
    set((state) => {
      const newLoadedCells =
        typeof loadedCells === 'function'
          ? loadedCells(state.loadedCells)
          : loadedCells;

      return {
        loadedCells: Array.isArray(newLoadedCells) ? newLoadedCells : [],
      };
    });
  },
  setSphereRefs: (refs) => set({ sphereRefs: refs }),
  setCurrentPlaneIndex: (index) => set(() => ({ currentPlaneIndex: index })),
  setTarget: ({ x, y, z }) =>
    set((state) => ({
      vec: new THREE.Vector3(x, y, z),
      lookAt: new THREE.Vector3(x, y, z),
    })),
  setLookAt: ({ x, y, z }) =>
    set((state) => ({
      lookAt: new THREE.Vector3(x, y, z),
    })),
  setRotation: ({ x, y, z }) =>
    set((state) => ({
      rotation: new THREE.Euler(x, y, z),
    })),
  setCameraPosition: (x, y, z) =>
    set((state) => ({
      cameraPosition: [x, y, z], // update the array
    })),
  setPositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.positions)
          : positions;

      // Ensure positions are unique
      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(newPositions.map((pos) => pos.toArray().toString()))
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      return { positions: uniquePositions };
    });
  },
  removePositions: (positionsToRemove) => {
    set((state) => {
      const positionsSet = new Set(
        positionsToRemove.map((pos) => pos.toArray().toString())
      );
      const newPositions = state.positions.filter(
        (pos) => !positionsSet.has(pos.toArray().toString())
      );
      return { positions: newPositions };
    });
  },
}));
