import { useMemo } from 'react';
import { useStore } from '../store';
import { DETAIL_DISTANCE } from '../config';

export const useFilteredPositions = (
  positions,
  cameraRef,
  detailDistance = DETAIL_DISTANCE
) => {
  return useMemo(() => {
    if (!cameraRef.current) return positions;
    const cameraPosition = cameraRef.current.position;
    return positions.filter((pos) => {
      const distance = cameraPosition.distanceTo(pos);
      return distance < detailDistance;
    });
  }, [positions, cameraRef, detailDistance]);
};
