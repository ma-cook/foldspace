import * as THREE from 'three';

export const vertexRingShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (instanceMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`;

export const fragmentRingShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    float dist = length(vUv - vec2(0.5, 0.5)); // Use uv coordinates for ring geometry
    float alpha = smoothstep(0.6, 0.1, dist); // More transparent towards the center
    vec3 color = mix(vec3(0.5, 0.5, 0.5), vec3(0.0, 0.0, 0.0), dist); // Gradient from white to grey
    gl_FragColor = vec4(color, alpha);
  }
`;

export const systemShaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexRingShader,
  fragmentShader: fragmentRingShader,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false, // Prevent depth buffer updates
  blending: THREE.NormalBlending, // Use normal blending mode
});
