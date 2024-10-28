import * as THREE from 'three';

export const vertexRingShader = `
  attribute vec3 instancePosition;
  attribute vec3 instanceScale;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position * instanceScale + instancePosition;
    vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`;

export const fragmentRingShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float dist = length(vPosition);
    float alpha = smoothstep(0.2, 0.7, dist);
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0 - alpha);
  }
`;

export const ringShaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexRingShader,
  fragmentShader: fragmentRingShader,
  transparent: true,
  side: THREE.DoubleSide,
});
