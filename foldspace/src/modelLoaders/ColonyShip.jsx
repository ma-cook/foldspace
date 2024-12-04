/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 colonyShip.glb 
*/

import React from 'react';
import { useGLTF } from '@react-three/drei';

export function ColonyShip(props) {
  const { nodes, materials } = useGLTF('/colonyShip.glb');
  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.Plane.geometry}
        material={nodes.Plane.material}
        scale={[0.231, 0.231, 0.128]}
      />
    </group>
  );
}

useGLTF.preload('/colonyShip.glb');
