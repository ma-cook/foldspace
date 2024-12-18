import { useEffect, useState } from 'react';
import { DETAIL_DISTANCE } from '../config';

import { useEffect, useState } from 'react';
import { DETAIL_DISTANCE } from '../config';

export const useUpdateGeometry = (cameraRef, positions, bvh) => {
  const [detailedPositions, setDetailedPositions] = useState({});
  const [lessDetailedPositions, setLessDetailedPositions] = useState({});

  useEffect(() => {
    const updateGeometry = () => {
      if (!cameraRef.current || !bvh || !positions) return;

      const cameraPosition = cameraRef.current.position;
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

      // Query BVH and create detailed positions map
      const detailedPositionsArray = bvh.query(detailBoundingBox);
      const newDetailedPositions = {};
      const newLessDetailedPositions = {};

      // Process all positions into either detailed or less detailed maps
      Object.entries(positions).forEach(([key, pos]) => {
        if (detailedPositionsArray.includes(pos)) {
          newDetailedPositions[key] = pos;
        } else {
          newLessDetailedPositions[key] = pos;
        }
      });

      setDetailedPositions(newDetailedPositions);
      setLessDetailedPositions(newLessDetailedPositions);
    };

    updateGeometry();
    const interval = setInterval(updateGeometry, 100);

    return () => clearInterval(interval);
  }, [cameraRef, positions, bvh]);

  return { detailedPositions, lessDetailedPositions };
};
