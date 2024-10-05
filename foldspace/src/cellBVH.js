import * as THREE from 'three';
import { GRID_SIZE } from './config';

class BVHNode {
  constructor(boundingBox, left = null, right = null, cellKey = null) {
    this.boundingBox = boundingBox;
    this.left = left;
    this.right = right;
    this.cellKey = cellKey;
  }
}

const buildBVH = (cells) => {
  if (cells.length === 0) return null;

  if (cells.length === 1) {
    const cell = cells[0];
    const boundingBox = new THREE.Box3(
      new THREE.Vector3(cell.x * GRID_SIZE, 0, cell.z * GRID_SIZE),
      new THREE.Vector3(
        (cell.x + 1) * GRID_SIZE,
        1000,
        (cell.z + 1) * GRID_SIZE
      )
    );
    return new BVHNode(boundingBox, null, null, cell.cellKey);
  }

  // Sort cells by x-axis
  cells.sort((a, b) => a.x - b.x);
  const mid = Math.floor(cells.length / 2);

  const left = buildBVH(cells.slice(0, mid));
  const right = buildBVH(cells.slice(mid));

  const boundingBox = new THREE.Box3()
    .union(left.boundingBox)
    .union(right.boundingBox);

  return new BVHNode(boundingBox, left, right);
};

const queryBVH = (node, cameraPosition, loadDistance, result = []) => {
  if (!node) return result;

  const cameraBox = new THREE.Box3(
    new THREE.Vector3(
      cameraPosition.x - loadDistance,
      0,
      cameraPosition.z - loadDistance
    ),
    new THREE.Vector3(
      cameraPosition.x + loadDistance,
      75000,
      cameraPosition.z + loadDistance
    )
  );

  if (!cameraBox.intersectsBox(node.boundingBox)) return result;

  if (node.cellKey) {
    result.push(node.cellKey);
  } else {
    queryBVH(node.left, cameraPosition, loadDistance, result);
    queryBVH(node.right, cameraPosition, loadDistance, result);
  }

  return result;
};

export { BVHNode, buildBVH, queryBVH };
