import * as THREE from 'three';

const GlowShader = {
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float glowSize;
    uniform vec3 glowColor;
    uniform vec3 baseColor;
    void main() {
      // Calculate the intensity of the glow based on the normal and glowSize
      float intensity = pow(glowSize - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      vec3 color = mix(baseColor, glowColor, intensity);

      // Add green patches based on position
      float patchIntensity = smoothstep(0.0, 1.0, sin(vPosition.x * 10.0) * sin(vPosition.y * 10.0) * sin(vPosition.z * 10.0));
      vec3 patchColor = vec3(0.0, 1.0, 0.0); // Green color
      color = mix(color, patchColor, patchIntensity);

      gl_FragColor = vec4(color, 1.0); // Set alpha to 1.0 to make it solid
    }
  `,
  uniforms: {
    glowColor: { type: 'd', value: new THREE.Color(0x0000ff) },
    glowSize: { type: 'f', value: 1.5 }, // Default glow size
    baseColor: { type: 'c', value: new THREE.Color(0x0000ff) }, // Default base color
  },
};

export default GlowShader;
