import { useEffect, useRef, useMemo } from 'react';
import { buildBVH } from '../BVH';
import { useStore } from '../store';

export const useBVH = (positions, activeBuffer) => {
  const bvhRef = useRef(null);
  const previousPositionsRef = useRef(null);

  // Memoize positions to prevent unnecessary rebuilds
  const memoizedPositions = useMemo(() => {
    if (!positions || typeof positions !== 'object') return [];

    return Object.values(positions).filter(
      (pos) =>
        pos &&
        typeof pos === 'object' &&
        typeof pos.x === 'number' &&
        typeof pos.y === 'number' &&
        typeof pos.z === 'number'
    );
  }, [positions]);

  useEffect(() => {
    // Skip if positions haven't changed
    if (previousPositionsRef.current === memoizedPositions) {
      return;
    }

    // Only rebuild BVH if we have valid positions
    if (memoizedPositions.length > 0) {
      bvhRef.current = buildBVH(memoizedPositions);
      useStore.getState().setBVH(bvhRef.current, activeBuffer);
    }

    previousPositionsRef.current = memoizedPositions;
  }, [memoizedPositions, activeBuffer]);
};
