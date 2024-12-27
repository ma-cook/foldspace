// utils/textTexture.js
import * as THREE from 'three';

const nextPowerOf2 = (n) => {
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

export const createTextTexture = (
  text,
  font = 'Arial',
  size = 64,
  color = '#FFFFFF'
) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Measure text first
  context.font = `${size}px ${font}`;
  const metrics = context.measureText(text);

  // Calculate power-of-2 dimensions
  const width = nextPowerOf2(metrics.width);
  const height = nextPowerOf2(size);

  // Set canvas to power-of-2 dimensions
  canvas.width = width;
  canvas.height = height;

  // Clear and redraw with proper sizing
  context.clearRect(0, 0, width, height);
  context.font = `${size}px ${font}`;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';

  // Draw text centered in the canvas
  context.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Set texture parameters to prevent mipmapping issues
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return texture;
};
