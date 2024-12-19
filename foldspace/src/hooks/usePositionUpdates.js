import { useCallback } from 'react';
import { UNLOAD_DETAIL_DISTANCE } from '../config';

export const usePositionUpdates = () => {
  return useCallback((positions, cameraPosition) => {
    if (!positions) return {};

    const clearedPositions = {};
    Object.entries(positions).forEach(([key, pos]) => {
      if (pos && typeof pos === 'object') {
        const distance = cameraPosition.distanceTo(pos);
        if (distance >= UNLOAD_DETAIL_DISTANCE) {
          clearedPositions[key] = pos;
        }
      }
    });

    return clearedPositions;
  }, []);
};
