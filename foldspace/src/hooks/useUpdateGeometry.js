import { useEffect, useState } from 'react';
import { DETAIL_DISTANCE } from '../config';

export const useUpdateGeometry = (cameraRef, positions, bvh) => {
  const [detailedPositions, setDetailedPositions] = useState([]);
  const [lessDetailedPositions, setLessDetailedPositions] = useState([]);

  useEffect(() => {
    const updateGeometry = () => {
      if (!cameraRef.current || !bvh) return;
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

      const newDetailedPositions = bvh.query(detailBoundingBox);
      const newLessDetailedPositions = positions.filter(
        (pos) => !newDetailedPositions.includes(pos)
      );

      setDetailedPositions(newDetailedPositions);
      setLessDetailedPositions(newLessDetailedPositions);
    };

    updateGeometry();
    const interval = setInterval(updateGeometry, 1000); // Check every second

    return () => clearInterval(interval);
  }, [cameraRef, positions, bvh]);

  return { detailedPositions, lessDetailedPositions };
};
