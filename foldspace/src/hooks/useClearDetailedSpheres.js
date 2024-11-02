import { useCallback } from 'react';
import { useStore } from '../store';
import { UNLOAD_DETAIL_DISTANCE } from '../config';

export const useClearDetailedSpheres = (
  cameraRef,
  redPositions,
  greenPositions,
  bluePositions,
  purplePositions,
  greenMoonPositions,
  purpleMoonPositions,
  gasPosisitions,
  filteredPositions,
  activeBuffer
) => {
  return useCallback(() => {
    const clearPositionsByDistance = (positions, maxDistance) => {
      if (!cameraRef.current) return positions;
      const cameraPosition = cameraRef.current.position;
      return positions.filter((pos) => {
        const distance = cameraPosition.distanceTo(pos);
        return distance >= maxDistance;
      });
    };

    const clearedRedPositions = clearPositionsByDistance(
      redPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedGreenPositions = clearPositionsByDistance(
      greenPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedBluePositions = clearPositionsByDistance(
      bluePositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedPurplePositions = clearPositionsByDistance(
      purplePositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedGreenMoonPositions = clearPositionsByDistance(
      greenMoonPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedPurpleMoonPositions = clearPositionsByDistance(
      purpleMoonPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedYellowPositions = clearPositionsByDistance(
      filteredPositions,
      UNLOAD_DETAIL_DISTANCE
    );
    const clearedGasPositions = clearPositionsByDistance(
      filteredPositions,
      UNLOAD_DETAIL_DISTANCE
    );

    useStore.getState().setRedPositions(clearedRedPositions, activeBuffer);
    useStore.getState().setGreenPositions(clearedGreenPositions, activeBuffer);
    useStore.getState().setBluePositions(clearedBluePositions, activeBuffer);
    useStore
      .getState()
      .setPurplePositions(clearedPurplePositions, activeBuffer);
    useStore
      .getState()
      .setGreenMoonPositions(clearedGreenMoonPositions, activeBuffer);
    useStore
      .getState()
      .setPurpleMoonPositions(clearedPurpleMoonPositions, activeBuffer);
    useStore.getState().setPositions(clearedYellowPositions, activeBuffer);
    useStore.getState().setGasPositions(clearedGasPositions, activeBuffer);
  }, [
    cameraRef,
    redPositions,
    greenPositions,
    bluePositions,
    purplePositions,
    greenMoonPositions,
    purpleMoonPositions,
    gasPosisitions,
    filteredPositions,
    activeBuffer,
  ]);
};
