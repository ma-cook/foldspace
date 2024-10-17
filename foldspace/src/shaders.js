// src/shaders.js
export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  void main() {
    float dist = length(vUv - vec2(0.5, 0.5)); // Center the distance calculation
    float alpha = smoothstep(0.2, 0.7, dist); // Adjust the range for blurring effect
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0 - alpha); // White color with alpha
  }
`;

export const dotVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const dotFragmentShader = `
  varying vec2 vUv;
  void main() {
    float dist = length(vUv - vec2(0.5, 0.5));
    float angle = atan(vUv.y - 0.5, vUv.x - 0.6);
    float dotSpacing = 0.1; // Adjust the spacing between dots
    float dotSize = 0.01; // Adjust the size of the dots

    // Calculate the position of the dot
    float dotDist = mod(dist, dotSpacing);
    float dotAlpha = step(dotDist, dotSize);

    // Ensure dots appear in a ring
    float ringAlpha = step(0.48, dist) * step(dist, 0.52);

    // Combine the dot pattern with the ring
    float alpha = dotAlpha * ringAlpha;

    gl_FragColor = vec4(0.6, 0.6, 0.6, alpha); // Grey color with alpha
  }
`;
