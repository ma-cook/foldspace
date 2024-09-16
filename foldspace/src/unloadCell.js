import cellCache from './cellCache';
import { useStore } from './store';
import {
  redSphereMaterial,
  greenSphereMaterial,
  blueSphereMaterial,
  purpleSphereMaterial,
  atmosMaterial,
  atmosMaterial2,
} from './SphereData';

const disposeMaterial = (material) => {
  if (material && typeof material.dispose === 'function') {
    material.dispose();
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
  swapBuffers
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

  // Dispose of materials
  disposeMaterial(redSphereMaterial);
  disposeMaterial(greenSphereMaterial);
  disposeMaterial(blueSphereMaterial);
  disposeMaterial(purpleSphereMaterial);
  disposeMaterial(atmosMaterial);
  disposeMaterial(atmosMaterial2);

  swapBuffers(); // Swap buffers after unloading cell data

  // Log to console
  console.log(`Cell at (${x}, ${z}) has been unloaded.`);
};

export default unloadCell;
