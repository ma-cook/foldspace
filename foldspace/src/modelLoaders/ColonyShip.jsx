// components/ColonyShip.jsx
import React from 'react';
import { useGLTF } from '@react-three/drei';

const ColonyShip = (props) => {
  const { nodes, materials } = useGLTF('/colonyShip.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.Plane.geometry}
        material={materials.Material}
        scale={[0.231, 0.231, 0.128]}
        onClick={onClick}
      />
    </group>
  );
};

useGLTF.preload('/colonyShip.glb');

export default ColonyShip; // Ensure default export
