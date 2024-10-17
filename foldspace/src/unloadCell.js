import cellCache from './cellCache';
import { useStore } from './store';
import {
  redSphereMaterial,
  greenSphereMaterial,
  blueSphereMaterial,
  purpleSphereMaterial,
  moonMaterial,
  atmosMaterial,
  atmosMaterial2,
  sphereMaterial,
  brownSphereMaterial, // Add brown sphere material
  lessDetailedSphereGeometry,
} from './SphereData';

export const disposeMaterial = (material) => {
  if (material && typeof material.dispose === 'function') {
    material.dispose();
  }
};

export const disposeGeometry = (geometry) => {
  if (geometry && typeof geometry.dispose === 'function') {
    geometry.dispose();
  }
};

const unloadCell = (
  x,
  z,
  loadedCells,
  setLoadedCells,
  removeAllPositions,
  removeSphereRefs,
  sphereRendererRef,
  swapBuffers,
  sphereGeometry,
  lessDetailedSphereGeometry,
  ringGeometry // Add ring geometry parameter
) => {
  const cellKey = `${x},${z}`;
  if (!loadedCells.has(cellKey)) return;

  const cellPositions = cellCache[cellKey];
  if (cellPositions) {
    removeAllPositions(cellKey);
  }

  setLoadedCells((prevLoadedCells) => {
    const newLoadedCells = new Set(prevLoadedCells);
    newLoadedCells.delete(cellKey);
    return newLoadedCells;
  });

  removeSphereRefs(cellKey);
  useStore.getState().removePlaneMeshes(cellKey);
  delete cellCache[cellKey];

  if (sphereRendererRef.current) {
    sphereRendererRef.current.clearNonYellowSpheres(cellKey);
  }

  // Dispose of materials and geometries
  disposeMaterial(redSphereMaterial);
  disposeMaterial(greenSphereMaterial);
  disposeMaterial(blueSphereMaterial);
  disposeMaterial(purpleSphereMaterial);
  disposeMaterial(moonMaterial);
  disposeMaterial(atmosMaterial);
  disposeMaterial(atmosMaterial2);
  disposeMaterial(sphereMaterial); // Dispose of sphere material
  disposeMaterial(brownSphereMaterial); // Dispose of brown sphere material

  // Dispose of geometries if they are not shared
  disposeGeometry(sphereGeometry);
  disposeGeometry(lessDetailedSphereGeometry);
  disposeGeometry(ringGeometry); // Dispose of ring geometry

  swapBuffers(); // Swap buffers after unloading cell data

  // Log to console
  console.log(`Cell at (${x}, ${z}) has been unloaded.`);
};

export default unloadCell;
