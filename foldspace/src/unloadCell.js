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
  if (!loadedCells.includes(cellKey)) return;

  const cellPositions = cellCache[cellKey];
  if (cellPositions) {
    removeAllPositions(cellKey);
  }

  setLoadedCells((prevLoadedCells) =>
    prevLoadedCells.filter((key) => key !== cellKey)
  );

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
};

export default unloadCell;
