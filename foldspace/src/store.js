import { create } from 'zustand';
import * as THREE from 'three';
import cellCache from './cellCache';

// Define the ensureVector3 function
const ensureVector3 = (pos) => {
  return pos instanceof THREE.Vector3
    ? pos
    : new THREE.Vector3(pos.x, pos.y, pos.z);
};

const createPositionSetter = (stateKey) => (positions) => {
  set((state) => {
    const newPositions =
      typeof positions === 'function'
        ? positions(state[stateKey][state.activeBuffer])
        : positions;

    // Convert to map if array is passed
    const positionsMap = Array.isArray(newPositions)
      ? newPositions.reduce((acc, pos, index) => {
          acc[index] = ensureVector3(pos);
          return acc;
        }, {})
      : newPositions;

    const nextBuffer = (state.activeBuffer + 1) % 2;
    const updatedPositions = [...state[stateKey]];
    updatedPositions[nextBuffer] = positionsMap;

    return { [stateKey]: updatedPositions };
  });
};

export const useStore = create((set, get) => ({
  vec: null,
  defaultPosition: new THREE.Vector3(0, 50, 100),
  lookAt: new THREE.Vector3(),
  rotation: new THREE.Euler(),
  currentPlaneIndex: 0,
  positions: [{}, {}], // Double buffer using maps
  redPositions: [{}, {}],
  greenPositions: [{}, {}],
  bluePositions: [{}, {}],
  purplePositions: [{}, {}],
  brownPositions: [{}, {}],
  greenMoonPositions: [{}, {}],
  purpleMoonPositions: [{}, {}],
  gasPositions: [{}, {}],
  redMoonPositions: [{}, {}],
  gasMoonPositions: [{}, {}],
  brownMoonPositions: [{}, {}],
  activeBuffer: 0, // Index of the active buffer
  cameraPosition: [[-150786.12625276775, 5000, -97811.47099344924]],
  sphereRefs: {},
  planeMeshes: {}, // Add state to track plane meshes
  cameraRef: { current: null }, // Add cameraRef to the store
  loadedCells: new Set(), // Use a Set to track loaded cells
  bvh: [null, null], // Add BVH state
  detailedPositions: [], // Add detailed positions state
  lessDetailedPositions: [],
  planetNames: {},
  loadingCells: new Set(), // Add less detailed positions state
  isSelectingDestination: false,
  shipToMove: null,
  colonizeMode: false,
  currentCellKey: null,
  pendingUpdates: new Map(),
  isUpdating: false,
  setState: (updates) => {
    const state = get();
    if (state.isUpdating) {
      // Queue updates if already processing
      const pendingUpdates = new Map(state.pendingUpdates);
      Object.entries(updates).forEach(([key, value]) => {
        pendingUpdates.set(key, value);
      });
      set({ pendingUpdates });
      return;
    }

    set({ isUpdating: true });

    try {
      const nextBuffer = (state.activeBuffer + 1) % 2;
      const positionUpdates = {};
      const otherUpdates = {};

      Object.entries(updates).forEach(([key, value]) => {
        if (key.endsWith('Positions')) {
          positionUpdates[key] = value;
        } else {
          otherUpdates[key] = value;
        }
      });

      if (Object.keys(positionUpdates).length > 0) {
        set((state) => {
          const newState = { ...state };
          Object.entries(positionUpdates).forEach(([key, value]) => {
            const updatedPositions = [...state[key]];
            updatedPositions[nextBuffer] = value;
            newState[key] = updatedPositions;
          });
          return newState;
        });
      }

      if (Object.keys(otherUpdates).length > 0) {
        set((state) => ({ ...state, ...otherUpdates }));
      }

      // Process pending updates
      const pending = get().pendingUpdates;
      if (pending.size > 0) {
        const updates = Object.fromEntries(pending);
        set({ pendingUpdates: new Map() });
        state.setState(updates);
      }
    } finally {
      set({ isUpdating: false });
    }
  },
  setCurrentCellKey: (cellKey) => set({ currentCellKey: cellKey }),
  setColonizeMode: (value) => set({ colonizeMode: value }),
  setIsSelectingDestination: (value) => set({ isSelectingDestination: value }),
  setShipToMove: (shipKey) => set({ shipToMove: shipKey }),
  setLoadingCells: (loadingCells) => set({ loadingCells }),
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
  setPlanetNames: (planetNames) =>
    set((state) => ({
      planetNames: { ...state.planetNames, ...planetNames },
    })),
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

  setPositions: createPositionSetter('positions'),
  setRedPositions: createPositionSetter('redPositions'),
  setGreenPositions: createPositionSetter('greenPositions'),
  setBluePositions: createPositionSetter('bluePositions'),
  setPurplePositions: createPositionSetter('purplePositions'),
  setBrownPositions: createPositionSetter('brownPositions'),
  setGreenMoonPositions: createPositionSetter('greenMoonPositions'),
  setPurpleMoonPositions: createPositionSetter('purpleMoonPositions'),
  setGasPositions: createPositionSetter('gasPositions'),
  setRedMoonPositions: createPositionSetter('redMoonPositions'),
  setGasMoonPositions: createPositionSetter('gasMoonPositions'),
  setBrownMoonPositions: createPositionSetter('brownMoonPositions'),

  swapBuffers: () =>
    set((state) => ({
      activeBuffer: 1 - state.activeBuffer, // Toggle between 0 and 1
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
      const cellPositions = cellCache[cellKey] || {};
      const nextBuffer = (state.activeBuffer + 1) % 2;

      // Helper function to filter positions map
      const filterPositions = (positions) => {
        const filtered = {};
        Object.entries(positions || {}).forEach(([key, pos]) => {
          if (!cellPositions[key]) {
            filtered[key] = pos;
          }
        });
        return filtered;
      };

      // Create new buffers for all position types
      const updatedPositions = [...state.positions];
      const updatedRedPositions = [...state.redPositions];
      const updatedGreenPositions = [...state.greenPositions];
      const updatedBluePositions = [...state.bluePositions];
      const updatedPurplePositions = [...state.purplePositions];
      const updatedBrownPositions = [...state.brownPositions];
      const updatedGreenMoonPositions = [...state.greenMoonPositions];
      const updatedPurpleMoonPositions = [...state.purpleMoonPositions];
      const updatedGasPositions = [...state.gasPositions];
      const updatedRedMoonPositions = [...state.redMoonPositions];
      const updatedGasMoonPositions = [...state.gasMoonPositions];
      const updatedBrownMoonPositions = [...state.brownMoonPositions];

      // Filter positions for next buffer
      updatedPositions[nextBuffer] = filterPositions(
        state.positions[state.activeBuffer]
      );
      updatedRedPositions[nextBuffer] = filterPositions(
        state.redPositions[state.activeBuffer]
      );
      updatedGreenPositions[nextBuffer] = filterPositions(
        state.greenPositions[state.activeBuffer]
      );
      updatedBluePositions[nextBuffer] = filterPositions(
        state.bluePositions[state.activeBuffer]
      );
      updatedPurplePositions[nextBuffer] = filterPositions(
        state.purplePositions[state.activeBuffer]
      );
      updatedBrownPositions[nextBuffer] = filterPositions(
        state.brownPositions[state.activeBuffer]
      );
      updatedGreenMoonPositions[nextBuffer] = filterPositions(
        state.greenMoonPositions[state.activeBuffer]
      );
      updatedPurpleMoonPositions[nextBuffer] = filterPositions(
        state.purpleMoonPositions[state.activeBuffer]
      );
      updatedGasPositions[nextBuffer] = filterPositions(
        state.gasPositions[state.activeBuffer]
      );
      updatedRedMoonPositions[nextBuffer] = filterPositions(
        state.redMoonPositions[state.activeBuffer]
      );
      updatedGasMoonPositions[nextBuffer] = filterPositions(
        state.gasMoonPositions[state.activeBuffer]
      );
      updatedBrownMoonPositions[nextBuffer] = filterPositions(
        state.brownMoonPositions[state.activeBuffer]
      );

      return {
        positions: updatedPositions,
        redPositions: updatedRedPositions,
        greenPositions: updatedGreenPositions,
        bluePositions: updatedBluePositions,
        purplePositions: updatedPurplePositions,
        brownPositions: updatedBrownPositions,
        greenMoonPositions: updatedGreenMoonPositions,
        purpleMoonPositions: updatedPurpleMoonPositions,
        gasPositions: updatedGasPositions,
        redMoonPositions: updatedRedMoonPositions,
        gasMoonPositions: updatedGasMoonPositions,
        brownMoonPositions: updatedBrownMoonPositions,
      };
    });
  },
}));
