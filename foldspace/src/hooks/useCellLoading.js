import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import loadCell from '../loadCell';
import { GRID_SIZE } from '../config';
import * as THREE from 'three';

export const useCellLoading = (cameraRef) => {
  const lastPosition = useRef(null);

  const store = useStore((state) => ({
    loadedCells: state.loadedCells,
    loadingCells: state.loadingCells,
    setLoadingCells: state.setLoadingCells,
    setLoadedCells: state.setLoadedCells,
    setPositions: state.setPositions,
    setRedPositions: state.setRedPositions,
    setGreenPositions: state.setGreenPositions,
    setBluePositions: state.setBluePositions,
    setPurplePositions: state.setPurplePositions,
    setBrownPositions: state.setBrownPositions,
    setGreenMoonPositions: state.setGreenMoonPositions,
    setPurpleMoonPositions: state.setPurpleMoonPositions,
    setGasPositions: state.setGasPositions,
    setRedMoonPositions: state.setRedMoonPositions,
    setGasMoonPositions: state.setGasMoonPositions,
    setBrownMoonPositions: state.setBrownMoonPositions,
    swapBuffers: state.swapBuffers,
    setPlanetNames: state.setPlanetNames,
  }));

  const getCellKey = useCallback((position) => {
    if (!position || !(position instanceof THREE.Vector3)) {
      console.warn('Invalid position:', position);
      return null;
    }
    return `${Math.floor(position.x / GRID_SIZE)},${Math.floor(
      position.y / GRID_SIZE
    )},${Math.floor(position.z / GRID_SIZE)}`;
  }, []);

  useEffect(() => {
    if (!cameraRef?.current) {
      console.warn('No camera reference available');
      return;
    }

    const loadCells = () => {
      const camera = cameraRef.current;
      if (!camera?.position) {
        console.warn('No camera position available');
        return;
      }

      const currentPosition = camera.position.clone();

      // Skip if position hasn't changed enough
      if (lastPosition.current?.distanceTo(currentPosition) < GRID_SIZE / 2) {
        return;
      }

      lastPosition.current = currentPosition;
      const cellKey = getCellKey(currentPosition);

      if (!cellKey) return;

      console.log('Loading cell:', cellKey, 'at position:', currentPosition);

      loadCell(
        cellKey,
        true,
        store.loadedCells,
        store.loadingCells,
        store.setLoadingCells,
        store.setPositions,
        store.setRedPositions,
        store.setGreenPositions,
        store.setBluePositions,
        store.setPurplePositions,
        store.setBrownPositions,
        store.setGreenMoonPositions,
        store.setPurpleMoonPositions,
        store.setGasPositions,
        store.setRedMoonPositions,
        store.setGasMoonPositions,
        store.setBrownMoonPositions,
        store.setLoadedCells,
        store.swapBuffers,
        store.setPlanetNames
      );
    };

    // Initial load
    loadCells();

    // Handle camera updates
    const handleCameraMove = () => {
      requestAnimationFrame(loadCells);
    };

    window.addEventListener('cameramove', handleCameraMove);

    return () => {
      window.removeEventListener('cameramove', handleCameraMove);
    };
  }, [cameraRef, getCellKey, store]);

  return null;
};
