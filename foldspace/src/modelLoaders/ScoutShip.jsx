// ScoutShip.jsx
import React from 'react';
import { useGLTF } from '@react-three/drei';

const ScoutShip = ({ position, onClick }) => {
  const { nodes, materials } = useGLTF('/scoutShip.glb');
  return (
    <group position={position} dispose={null}>
      <mesh
        geometry={nodes.Cube.geometry}
        material={materials.Material}
        scale={0.156}
        onClick={onClick}
      />
    </group>
  );
};

useGLTF.preload('/scoutShip.glb');

export default ScoutShip;
