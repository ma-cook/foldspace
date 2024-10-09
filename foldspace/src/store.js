import { create } from 'zustand';
import * as THREE from 'three';
import cellCache from './cellCache';

// Define the ensureVector3 function
const ensureVector3 = (pos) => {
  return pos instanceof THREE.Vector3
    ? pos
    : new THREE.Vector3(pos.x, pos.y, pos.z);
};

export const useStore = create((set) => ({
  vec: null,
  defaultPosition: new THREE.Vector3(0, 50, 100),
  lookAt: new THREE.Vector3(),
  rotation: new THREE.Euler(),
  currentPlaneIndex: 0,
  positions: [[], []], // Double buffer for yellow sphere positions
  redPositions: [[], []], // Double buffer for red sphere positions
  greenPositions: [[], []], // Double buffer for green sphere positions
  bluePositions: [[], []], // Double buffer for blue sphere positions
  purplePositions: [[], []],
  greenMoonPositions: [[], []],
  purpleMoonPositions: [[], []], // Double buffer for purple sphere positions
  activeBuffer: 0, // Index of the active buffer
  cameraPosition: [0, 50, 100],
  sphereRefs: {},
  planeMeshes: {}, // Add state to track plane meshes
  cameraRef: { current: null }, // Add cameraRef to the store
  loadedCells: new Set(), // Use a Set to track loaded cells
  bvh: [null, null], // Add BVH state
  detailedPositions: [], // Add detailed positions state
  lessDetailedPositions: [], // Add less detailed positions state
  setBVH: (bvh, bufferIndex) =>
    set((state) => {
      const newBVH = [...state.bvh];
      newBVH[bufferIndex] = bvh;
      return { bvh: newBVH };
    }), // Add setter for BVH
  setDetailedPositions: (positions) =>
    set(() => ({ detailedPositions: positions })), // Add setter for detailed positions
  setLessDetailedPositions: (positions) =>
    set(() => ({ lessDetailedPositions: positions })), // Add setter for less detailed positions
  setCameraRef: (ref) => set(() => ({ cameraRef: ref })), // Add setter for cameraRef
  setPlaneMeshes: (cellKey, meshes) =>
    set((state) => ({
      planeMeshes: {
        ...state.planeMeshes,
        [cellKey]: meshes,
      },
    })),
  removePlaneMeshes: (cellKey) =>
    set((state) => {
      const newPlaneMeshes = { ...state.planeMeshes };
      delete newPlaneMeshes[cellKey];
      return { planeMeshes: newPlaneMeshes };
    }),
  setLoadedCells: (loadedCells) => {
    set((state) => {
      const newLoadedCells =
        typeof loadedCells === 'function'
          ? loadedCells(state.loadedCells)
          : loadedCells;

      return {
        loadedCells: new Set(newLoadedCells),
      };
    });
  },
  setSphereRefs: (cellKey, refs) =>
    set((state) => ({
      sphereRefs: {
        ...state.sphereRefs,
        [cellKey]: {
          ...state.sphereRefs[cellKey],
          ...refs,
        },
      },
    })),
  removeSphereRefs: (cellKey) =>
    set((state) => {
      const newSphereRefs = { ...state.sphereRefs };
      delete newSphereRefs[cellKey];
      return { sphereRefs: newSphereRefs };
    }),
  setCurrentPlaneIndex: (index) => set(() => ({ currentPlaneIndex: index })),
  setTarget: ({ x, y, z }) =>
    set((state) => {
      const cameraRef = state.cameraRef.current;
      if (cameraRef) {
        cameraRef.position.set(x, y, z);
      }
      return {
        vec: new THREE.Vector3(x, y, z),
        lookAt: new THREE.Vector3(x, y, z),
      };
    }),
  setLookAt: ({ x, y, z }) =>
    set((state) => {
      const cameraRef = state.cameraRef.current;
      if (cameraRef) {
        cameraRef.lookAt(x, y, z);
      }
      return {
        lookAt: new THREE.Vector3(x, y, z),
      };
    }),
  setRotation: ({ x, y, z }) =>
    set((state) => ({
      rotation: new THREE.Euler(x, y, z),
    })),
  setCameraPosition: (x, y, z) =>
    set((state) => ({
      cameraPosition: [x, y, z],
    })),
  setPositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.positions[state.activeBuffer])
          : positions;

      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(
              newPositions.map((pos) => ensureVector3(pos).toArray().toString())
            )
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.positions];
      updatedPositions[nextBuffer] = uniquePositions;

      return { positions: updatedPositions };
    });
  },

  setRedPositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.redPositions[state.activeBuffer])
          : positions;

      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(
              newPositions.map((pos) => ensureVector3(pos).toArray().toString())
            )
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.redPositions];
      updatedPositions[nextBuffer] = uniquePositions;

      return { redPositions: updatedPositions };
    });
  },

  setGreenPositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.greenPositions[state.activeBuffer])
          : positions;

      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(
              newPositions.map((pos) => ensureVector3(pos).toArray().toString())
            )
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.greenPositions];
      updatedPositions[nextBuffer] = uniquePositions;

      return { greenPositions: updatedPositions };
    });
  },

  setBluePositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.bluePositions[state.activeBuffer])
          : positions;

      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(
              newPositions.map((pos) => ensureVector3(pos).toArray().toString())
            )
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.bluePositions];
      updatedPositions[nextBuffer] = uniquePositions;

      return { bluePositions: updatedPositions };
    });
  },

  setPurplePositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.purplePositions[state.activeBuffer])
          : positions;

      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(
              newPositions.map((pos) => ensureVector3(pos).toArray().toString())
            )
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.purplePositions];
      updatedPositions[nextBuffer] = uniquePositions;

      return { purplePositions: updatedPositions };
    });
  },

  setGreenMoonPositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.greenMoonPositions[state.activeBuffer])
          : positions;

      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(
              newPositions.map((pos) => ensureVector3(pos).toArray().toString())
            )
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.greenMoonPositions];
      updatedPositions[nextBuffer] = uniquePositions;

      return { greenMoonPositions: updatedPositions };
    });
  },

  setPurpleMoonPositions: (positions) => {
    set((state) => {
      const newPositions =
        typeof positions === 'function'
          ? positions(state.purpleMoonPositions[state.activeBuffer])
          : positions;

      const uniquePositions = Array.isArray(newPositions)
        ? Array.from(
            new Set(
              newPositions.map((pos) => ensureVector3(pos).toArray().toString())
            )
          ).map((posStr) => new THREE.Vector3(...posStr.split(',').map(Number)))
        : [];

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.purpleMoonPositions];
      updatedPositions[nextBuffer] = uniquePositions;

      return { purpleMoonPositions: updatedPositions };
    });
  },
  swapBuffers: () =>
    set((state) => ({
      activeBuffer: (state.activeBuffer + 1) % 2,
    })),
  removePositions: (positionsToRemove) => {
    set((state) => {
      const positionsSet = new Set(
        positionsToRemove.map((pos) => ensureVector3(pos).toArray().toString())
      );
      const newPositions = state.positions[state.activeBuffer].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );
      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.positions];
      updatedPositions[nextBuffer] = newPositions;
      return { positions: updatedPositions };
    });
  },
  removeAllPositions: (cellKey) => {
    set((state) => {
      const cellPositions = cellCache[cellKey] || [];
      const positionsSet = new Set(
        cellPositions.map((pos) => ensureVector3(pos).toArray().toString())
      );

      const newPositions = state.positions[state.activeBuffer].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );
      const newRedPositions = state.redPositions[state.activeBuffer].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );
      const newGreenPositions = state.greenPositions[state.activeBuffer].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );
      const newBluePositions = state.bluePositions[state.activeBuffer].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );
      const newPurplePositions = state.purplePositions[
        state.activeBuffer
      ].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );

      const newGreenMoonPositions = state.greenMoonPositions[
        state.activeBuffer
      ].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );

      const newPurpleMoonPositions = state.purpleMoonPositions[
        state.activeBuffer
      ].filter(
        (pos) => !positionsSet.has(ensureVector3(pos).toArray().toString())
      );

      const nextBuffer = (state.activeBuffer + 1) % 2;
      const updatedPositions = [...state.positions];
      const updatedRedPositions = [...state.redPositions];
      const updatedGreenPositions = [...state.greenPositions];
      const updatedBluePositions = [...state.bluePositions];
      const updatedPurplePositions = [...state.purplePositions];
      const updatedGreenMoonPositions = [...state.greenMoonPositions];
      const updatedPurpleMoonPositions = [...state.purpleMoonPositions];

      updatedPositions[nextBuffer] = newPositions;
      updatedRedPositions[nextBuffer] = newRedPositions;
      updatedGreenPositions[nextBuffer] = newGreenPositions;
      updatedBluePositions[nextBuffer] = newBluePositions;
      updatedPurplePositions[nextBuffer] = newPurplePositions;
      updatedGreenMoonPositions[nextBuffer] = newGreenMoonPositions;
      updatedPurpleMoonPositions[nextBuffer] = newPurpleMoonPositions;

      return {
        positions: updatedPositions,
        redPositions: updatedRedPositions,
        greenPositions: updatedGreenPositions,
        bluePositions: updatedBluePositions,
        purplePositions: updatedPurplePositions,
        greenMoonPositions: updatedGreenMoonPositions,
        purpleMoonPositions: updatedPurpleMoonPositions,
      };
    });
  },
}));
