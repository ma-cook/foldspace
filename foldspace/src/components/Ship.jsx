// Ship.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ColonyShip from '../modelLoaders/ColonyShip';
import ScoutShip from '../modelLoaders/ScoutShip';
import { useAuth } from '../hooks/useAuth';

const Ship = ({ shipKey, shipInfo, handleShipClick }) => {
  const shipRef = useRef();
  const lineRef = useRef();
  const { user } = useAuth();
  const isOwnShip = user && shipInfo.ownerId === user.uid;

  // Create line shader materials
  const lineMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        lineLength: { value: 1.0 },
        shipPosition: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float lineLength;
        uniform vec3 shipPosition;
        varying vec3 vPosition;
        void main() {
          float dist = distance(vPosition, shipPosition) / lineLength;
          float opacity = smoothstep(0.0, 0.2, dist);
          gl_FragColor = vec4(1.0, 1.0, 1.0, opacity * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(() => {
    if (shipRef.current && shipInfo.position) {
      // Update ship position
      shipRef.current.position.set(
        shipInfo.position.x,
        shipInfo.position.y,
        shipInfo.position.z
      );

      // Update line if destination exists
      if (shipInfo.destination && lineRef.current) {
        const start = new THREE.Vector3(
          shipInfo.position.x,
          shipInfo.position.y,
          shipInfo.position.z
        );
        const end = new THREE.Vector3(
          shipInfo.destination.x,
          shipInfo.destination.y,
          shipInfo.destination.z
        );

        // Update line geometry
        const points = [start, end];
        lineRef.current.geometry.setFromPoints(points);

        // Update shader uniforms
        lineMaterial.uniforms.lineLength.value = start.distanceTo(end);
        lineMaterial.uniforms.shipPosition.value = start;
      }
    }
  });

  const handleClick = () => {
    if (isOwnShip) {
      handleShipClick(shipInfo.position);
    }
  };

  const shipType = shipInfo.type || shipKey.replace(/\d+/g, '').trim();

  return (
    <>
      {shipInfo.destination && (
        <line ref={lineRef}>
          <bufferGeometry />
          <primitive object={lineMaterial} attach="material" />
        </line>
      )}
      {shipType.toLowerCase() === 'colony ship' ? (
        <ColonyShip
          ref={shipRef}
          position={[
            shipInfo.position.x,
            shipInfo.position.y,
            shipInfo.position.z,
          ]}
          onClick={handleClick}
        />
      ) : shipType.toLowerCase() === 'scout' ? (
        <ScoutShip
          ref={shipRef}
          position={[
            shipInfo.position.x,
            shipInfo.position.y,
            shipInfo.position.z,
          ]}
          onClick={handleClick}
        />
      ) : null}
    </>
  );
};

export default Ship;
