import { useEffect, useState } from 'react';
import { DETAIL_DISTANCE } from '../config';

export const useUpdateGeometry = (cameraRef, positions, bvh) => {
  const [detailedPositions, setDetailedPositions] = useState({});
  const [lessDetailedPositions, setLessDetailedPositions] = useState({});

  useEffect(() => {
    const updateGeometry = () => {
      // Early return if any required data is missing
      if (!cameraRef?.current?.position || !bvh || !positions) {
        setDetailedPositions({});
        setLessDetailedPositions({});
        return;
      }

      const cameraPosition = cameraRef.current.position;

      // Validate camera position
      if (
        typeof cameraPosition.x !== 'number' ||
        typeof cameraPosition.y !== 'number' ||
        typeof cameraPosition.z !== 'number'
      ) {
        return;
      }

      const detailBoundingBox = {
        min: {
          x: cameraPosition.x - DETAIL_DISTANCE,
          y: cameraPosition.y - DETAIL_DISTANCE,
          z: cameraPosition.z - DETAIL_DISTANCE,
        },
        max: {
          x: cameraPosition.x + DETAIL_DISTANCE,
          y: cameraPosition.y + DETAIL_DISTANCE,
          z: cameraPosition.z + DETAIL_DISTANCE,
        },
      };

      try {
        // Query BVH and create detailed positions map
        const detailedPositionsArray = bvh.query(detailBoundingBox) || [];
        const newDetailedPositions = {};
        const newLessDetailedPositions = {};

        // Process positions with type checking
        Object.entries(positions).forEach(([key, pos]) => {
          if (!pos || typeof pos !== 'object') return;

          if (
            typeof pos.x === 'number' &&
            typeof pos.y === 'number' &&
            typeof pos.z === 'number'
          ) {
            if (detailedPositionsArray.includes(pos)) {
              newDetailedPositions[key] = pos;
            } else {
              newLessDetailedPositions[key] = pos;
            }
          }
        });

        setDetailedPositions(newDetailedPositions);
        setLessDetailedPositions(newLessDetailedPositions);
      } catch (error) {
        console.error('Error in updateGeometry:', error);
        setDetailedPositions({});
        setLessDetailedPositions({});
      }
    };

    updateGeometry();
    const interval = setInterval(updateGeometry, 100);

    return () => clearInterval(interval);
  }, [cameraRef, positions, bvh]);

  return { detailedPositions, lessDetailedPositions };
};
