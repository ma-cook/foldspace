// shaders.js
import * as THREE from 'three';

export const vertexRingShader = `
  attribute vec3 instancePosition;
  attribute vec3 instanceScale;
  varying vec3 vPosition;
  void main() {
    vec3 pos = position * instanceScale + instancePosition;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const fragmentRingShader = `
  varying vec3 vPosition;
  void main() {
    float dist = length(vPosition.xy); // Use xy plane for ring geometry
    float alpha = smoothstep(0.7, 0.2, dist); // More opaque towards the center
    vec3 color = vec3(1.0, 1.0, 1.0); // White color
    gl_FragColor = vec4(color, alpha);
  }
`;

export const ringShaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexRingShader,
  fragmentShader: fragmentRingShader,
  transparent: true,
  side: THREE.DoubleSide,
});
