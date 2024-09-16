import * as THREE from 'three';

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  varying vec3 vWorldPosition;
  void main() {
    float depth = length(vWorldPosition);
    float fogFactor = smoothstep(fogNear, fogFar, depth);
    gl_FragColor = vec4(mix(vec3(1.0), fogColor, fogFactor), 1.0);
  }
`;

const CustomFogMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    fogColor: { value: new THREE.Color('white') },
    fogNear: { value: 20000 },
    fogFar: { value: 200000 },
  },
  transparent: true,
  depthWrite: false,
});

export default CustomFogMaterial;
