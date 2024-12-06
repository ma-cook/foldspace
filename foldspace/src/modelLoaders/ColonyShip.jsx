// ColonyShip.jsx
import React, { forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';

const ColonyShip = forwardRef(({ position, onClick }, ref) => {
  const { nodes, materials } = useGLTF('/colonyShip.glb');
  return (
    <group ref={ref} position={position} dispose={null}>
      <mesh
        geometry={nodes.Plane.geometry}
        material={nodes.Plane.material}
        scale={[0.231, 0.231, 0.128]}
        onClick={onClick}
      />
    </group>
  );
});

useGLTF.preload('/colonyShip.glb');

export default ColonyShip;
