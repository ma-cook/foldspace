import * as THREE from 'three';

export const vertexSunShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);
    vNormal = modelNormal.xyz;
    vPosition = (instanceMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`;

export const fragmentSunShader = `
  uniform vec3 glowColor;
  uniform float falloffAmount;
  uniform float glowSharpness;
  uniform float glowInternalRadius;
  uniform float opacity;
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main()
  {
    // Normal
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing)
        normal *= - 1.0;
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = dot(viewDirection, normal);
    fresnel = pow(fresnel, glowInternalRadius + 0.1);
    float falloff = smoothstep(0., falloffAmount, fresnel);
    float fakeGlow = fresnel;
    fakeGlow += fresnel * glowSharpness;
    fakeGlow *= falloff;
    gl_FragColor = vec4(clamp(glowColor * fresnel, 0., 1.0), clamp(fakeGlow, 0., opacity));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosGlowShader = new THREE.ShaderMaterial({
  vertexShader: vertexSunShader,
  fragmentShader: fragmentSunShader,
  uniforms: {
    glowColor: { value: new THREE.Color('#00ff00') },
    falloffAmount: { value: 3 },
    glowSharpness: { value: 1 },
    glowInternalRadius: { value: 0.5 },
    opacity: { value: 0.4 },
  },
  blending: THREE.AdditiveBlending,
  transparent: true,
  side: THREE.DoubleSide,

  depthWrite: false,
});
