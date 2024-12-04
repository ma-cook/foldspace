// ColonyShip.jsx
import React from 'react';
import { useGLTF } from '@react-three/drei';

const ColonyShip = ({ position, onClick }) => {
  const { nodes, materials } = useGLTF('/colonyShip.glb');
  return (
    <group position={position} dispose={null}>
      <mesh
        geometry={nodes.Plane.geometry}
        material={nodes.Plane.material}
        scale={[0.231, 0.231, 0.128]}
        onClick={onClick}
      />
    </group>
  );
};

useGLTF.preload('/colonyShip.glb');

export default ColonyShip;
