import { useEffect, useState, useMemo } from 'react';
import { DETAIL_DISTANCE } from '../config';
import * as THREE from 'three';

const isValidBVH = (bvh) => {
  return (
    bvh &&
    bvh.root &&
    bvh.root.boundingBox &&
    bvh.root.boundingBox instanceof THREE.Box3
  );
};

export const useUpdateGeometry = (cameraRef, positions, bvh) => {
  const [detailedPositions, setDetailedPositions] = useState({});
  const [lessDetailedPositions, setLessDetailedPositions] = useState({});

  useEffect(() => {
    if (!cameraRef?.current?.position || !positions) {
      setDetailedPositions({});
      setLessDetailedPositions({});
      return;
    }

    const updateGeometry = () => {
      const cameraPosition = cameraRef.current.position;

      // Create detail box around camera
      const detailBox = new THREE.Box3(
        new THREE.Vector3(
          cameraPosition.x - DETAIL_DISTANCE,
          cameraPosition.y - DETAIL_DISTANCE,
          cameraPosition.z - DETAIL_DISTANCE
        ),
        new THREE.Vector3(
          cameraPosition.x + DETAIL_DISTANCE,
          cameraPosition.y + DETAIL_DISTANCE,
          cameraPosition.z + DETAIL_DISTANCE
        )
      );

      const newDetailedPositions = {};
      const newLessDetailedPositions = {};

      // Filter positions
      Object.entries(positions).forEach(([key, pos]) => {
        if (!pos?.isVector3) return;

        const isInDetailRange = detailBox.containsPoint(pos);

        if (isInDetailRange) {
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
  }, [cameraRef, positions]);

  return { detailedPositions, lessDetailedPositions };
};
