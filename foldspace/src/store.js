import { create } from 'zustand';
import * as THREE from 'three';

export const useStore = create((set) => ({
  vec: null,
  defaultPosition: new THREE.Vector3(0, 50, 100),
  lookAt: new THREE.Vector3(),
  rotation: new THREE.Euler(),
  currentPlaneIndex: 0,
  positions: [], // new state variable
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
  setCameraPosition: ({ x, y, z }) =>
    set((state) => ({
      defaultPosition: new THREE.Vector3(x, y, z),
    })),
  setPositions: (newPositions) => set(() => ({ positions: newPositions })), // new setter function
}));
