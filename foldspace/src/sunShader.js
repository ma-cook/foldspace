// sunShader.js
export const vertexSunShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentSunShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;

  // Simple 3D noise function (can replace with a more complex one if needed)
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 151.7182))) * 43758.5453);
  }

  void main() {
    // Base red color for the sun, reduced intensity
    vec3 sunColor = vec3(0.7, 0.0, 0.0); // Less intense red color

    // Generate noise based on the position and time
    float patchFactor = noise(vPosition * 0.5 + time * 0.1);

    // Increase the threshold to reduce the amount of red
    float yellowThreshold = 0.1;

    // Yellow color (mix of red and green)
    vec3 yellowColor = vec3(1.0, 0.65, 0.0);

    // Use smoothstep to create a gradient effect for blurred edges
    float blendFactor = smoothstep(yellowThreshold - 0.05, yellowThreshold + 0.05, patchFactor);

    // Mix red with yellow based on the blend factor
    vec3 finalColor = mix(sunColor, yellowColor, blendFactor);

    // Output the final color with transparency
    gl_FragColor = vec4(finalColor, 0.8);
  }
`;
