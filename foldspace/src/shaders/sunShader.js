import * as THREE from 'three';

export const vertexSunShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (instanceMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`;

export const fragmentSunShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;

  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(42.9898, 58.233, 51.7182))) * 3375.5453);
  }

  void main() {
    vec3 sunColor = vec3(0.7, 0.3, 0.1);
    float patchFactor = noise(vPosition * 0.05 + time * 0.05); // Slowed down noise
    float yellowThreshold = 0.4;
    vec3 yellowColor = vec3(0.9, 0.55, 0.15);
    float blendFactor = smoothstep(yellowThreshold - 0.05, yellowThreshold + 0.05, patchFactor);
    vec3 finalColor = mix(sunColor, yellowColor, blendFactor);
    gl_FragColor = vec4(finalColor, 0.8);
  }
`;

export const sunShader = new THREE.ShaderMaterial({
  vertexShader: vertexSunShader,
  fragmentShader: fragmentSunShader,
  uniforms: {
    time: { value: 0.0 },
  },
  blending: THREE.NormalBlending,
  side: THREE.BackSide,
});
