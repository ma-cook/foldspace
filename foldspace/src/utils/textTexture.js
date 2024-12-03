// utils/textTexture.js
import * as THREE from 'three';

export const createTextTexture = (
  text,
  font = 'Arial',
  size = 64,
  color = '#FFFFFF'
) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  context.font = `${size}px ${font}`;
  const metrics = context.measureText(text);
  canvas.width = metrics.width;
  canvas.height = size;

  // Redraw with proper sizing
  context.font = `${size}px ${font}`;
  context.fillStyle = color;
  context.fillText(text, 0, size - 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};
