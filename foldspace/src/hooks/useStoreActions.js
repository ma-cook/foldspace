import { useCallback } from 'react';
import { useStore } from '../store';

export const useStoreActions = () => {
  const setState = useStore((state) => state.setState);

  return useCallback(
    (updates) => {
      if (!updates || Object.keys(updates).length === 0) return;

      // Schedule update
      queueMicrotask(() => {
        setState(updates);
      });
    },
    [setState]
  );
};
