// SphereGroup.jsx
import React, { useMemo } from 'react';
import { MemoizedSphere } from '../Sphere';
import { getCachedGeometry } from '../resourceCache';

const SphereGroup = ({
  color,
  positions,
  moonPositions,
  sphereRefs,
  materials,
  planetNames,
  cellKey,
}) => {
  const memoizedPositions = useMemo(() => positions, [positions]);
  const memoizedMoonPositions = useMemo(() => moonPositions, [moonPositions]);

  return (
    <>
      <MemoizedSphere
        key={`${color}`}
        ref={sphereRefs[color]}
        positions={memoizedPositions}
        material={materials[color]}
        geometry={getCachedGeometry('sphere')}
        scale={[0.2, 0.2, 0.2]}
        planetNames={planetNames}
        cellKey={cellKey}
      />
      <MemoizedSphere
        key={`${color}Glow`}
        ref={sphereRefs[color]}
        positions={memoizedPositions}
        material={materials[`${color}Glow`]}
        geometry={getCachedGeometry('sphere')}
        scale={[0.4, 0.4, 0.4]}
        cellKey={cellKey}
      />
      {moonPositions && (
        <MemoizedSphere
          key={`${color}Moon`}
          ref={sphereRefs[`${color}Moon`]}
          positions={memoizedMoonPositions}
          material={materials.moon}
          geometry={getCachedGeometry('sphere')}
          frustumCulled={false}
          scale={[0.05, 0.05, 0.05]}
          cellKey={cellKey}
        />
      )}
    </>
  );
};

export default SphereGroup;
