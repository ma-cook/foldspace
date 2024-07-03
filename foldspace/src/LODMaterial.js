import * as THREE from 'three';

// GLSL code for the vertex shader
const vertexShader = `#version 300 es
  in vec2 uv;
  in vec4 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * position;
  }
`;

// GLSL code for the fragment shader
const fragmentShader = `#version 300 es
  precision highp float;
  uniform vec3 cameraPosition;
  in vec2 vUv;
  out vec4 outColor;

  void main() {
    // Calculate the distance from the camera to this instance
    float distance = length(cameraPosition - vec3(modelMatrix * vec4(position, 1.0)));

    // Use a smoothstep function to transition from a circle to a sphere based on the distance
    float radius = smoothstep(0.0, 1.0, distance / 1000.0);
    float circle = length(vUv - vec2(0.5)) - radius;

    // Discard the fragment if it's outside the circle/sphere
    if (circle > 0.0) discard;

    outColor = vec4(1.0, 1.0, 1.0, 1.0); // White color
  }
`;

// Export the ShaderMaterial
export const LODMaterial = new THREE.ShaderMaterial({
  uniforms: {
    cameraPosition: { value: new THREE.Vector3() },
  },
  vertexShader,
  fragmentShader,
});
