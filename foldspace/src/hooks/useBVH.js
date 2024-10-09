import { useEffect } from 'react';
import { useStore } from '../store';
import { BVH } from '../BVH';

export const useBVH = (positions, activeBuffer) => {
  useEffect(() => {
    // Build BVH when positions change
    useStore.getState().setBVH(new BVH(positions), activeBuffer);
  }, [positions, activeBuffer]);
};