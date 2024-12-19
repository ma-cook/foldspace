import { useEffect, useRef, useMemo, useCallback } from 'react';
import { buildBVH } from '../BVH';
import { useStore } from '../store';

export const useBVH = (positions, activeBuffer) => {
  const bvhRef = useRef(null);
  const previousPositionsRef = useRef(null);
  const setBVH = useStore((state) => state.setBVH);

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

  // Memoize BVH update function
  const updateBVH = useCallback(
    (positions) => {
      if (positions.length > 0) {
        const newBVH = buildBVH(positions);
        if (newBVH !== bvhRef.current) {
          bvhRef.current = newBVH;
          // Queue BVH update
          queueMicrotask(() => {
            setBVH(newBVH, activeBuffer);
          });
        }
      }
    },
    [activeBuffer, setBVH]
  );

  useEffect(() => {
    // Skip if positions haven't changed
    if (previousPositionsRef.current === memoizedPositions) {
      return;
    }

    updateBVH(memoizedPositions);
    previousPositionsRef.current = memoizedPositions;

    return () => {
      // Cleanup on unmount/buffer change
      bvhRef.current = null;
    };
  }, [memoizedPositions, updateBVH]);
};
