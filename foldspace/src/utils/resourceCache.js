import * as THREE from 'three';
import {
  sphereGeometry,
  lessDetailedSphereGeometry,
  torusGeometry,
} from './SphereData';

import { sunShader } from '../shaders/sunShader';
import { createPlanetShader } from '../shaders/planetShader';
import { ringShaderMaterial } from '../shaders/ringShader';
import { systemShaderMaterial } from '../shaders/systemShader';
import { atmosGlowShader } from '../shaders/atmosGlow';

const geometryCache = {
  sphere: sphereGeometry,
  lessDetailedSphere: lessDetailedSphereGeometry,
  torus: torusGeometry,
};

const shaderCache = {};

export const getCachedGeometry = (type) => {
  if (geometryCache[type]) {
    return geometryCache[type];
  }
  let geometry;
  switch (type) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(1, 16, 16);
      break;
    case 'lessDetailedSphere':
      geometry = new THREE.SphereGeometry(1, 8, 8);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  geometryCache[type] = geometry;
  return geometry;
};

export const getCachedShader = (
  type,
  primaryColor,
  secondaryColor,
  glowColor
) => {
  const cacheKey = `${type}-${primaryColor}-${secondaryColor}-${glowColor}`;
  if (shaderCache[cacheKey]) {
    return shaderCache[cacheKey];
  }
  let shader;
  switch (type) {
    case 'sun':
      shader = sunShader;
      break;
    case 'planet':
      shader = createPlanetShader(primaryColor, secondaryColor);
      break;
    case 'ring':
      shader = ringShaderMaterial;
      break;
    case 'system':
      shader = systemShaderMaterial;
      break;
    case 'atmosGlow':
      shader = atmosGlowShader.clone();
      shader.uniforms.glowColor.value = new THREE.Color(glowColor);
      break;
    // Add other shader types as needed
    default:
      shader = new THREE.MeshStandardMaterial({ color: 'orange' });
  }
  shaderCache[cacheKey] = shader;
  return shader;
};
