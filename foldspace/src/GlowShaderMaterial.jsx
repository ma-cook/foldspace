import React, { useMemo } from 'react';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import { Color } from 'three';
import * as THREE from 'three';

const GlowShaderMaterial = shaderMaterial(
  {
    glowColor: new Color('yellow'),
    viewVector: new THREE.Vector3(),
  },
  // Vertex Shader
  `
  uniform vec3 viewVector;
  varying float intensity;
  void main() {
    vec3 vNormal = normalize(normalMatrix * normal);
    vec3 vNormel = normalize(normalMatrix * viewVector);
    intensity = pow(0.5 - dot(vNormal, vNormel), 2.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform vec3 glowColor;
  varying float intensity;
  void main() {
    vec3 glow = glowColor * intensity;
    gl_FragColor = vec4(glow, 1.0);
  }
  `
);

extend({ GlowShaderMaterial });

const GlowMaterial = ({ camera }) => {
  const material = useMemo(() => new GlowShaderMaterial(), []);

  useFrame(() => {
    if (camera && camera.current) {
      material.uniforms.viewVector.value = camera.current.position;
    }
  });

  return <primitive object={material} attach="material" />;
};

export default GlowMaterial;
