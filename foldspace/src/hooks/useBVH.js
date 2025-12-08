import { useEffect } from 'react';
import { useStore } from '../stores/store';
import { BVH } from '../utils/BVH';

export const useBVH = (positions, activeBuffer) => {
  useEffect(() => {
    // Build BVH when positions change
    useStore.getState().setBVH(new BVH(positions), activeBuffer);
  }, [positions, activeBuffer]);
};