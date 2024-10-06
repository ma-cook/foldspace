import * as THREE from 'three';
import { GRID_SIZE } from './config';

class BVHNode {
  constructor(
    boundingBox,
    left = null,
    right = null,
    objects = [],
    cellKey = null
  ) {
    this.boundingBox = boundingBox;
    this.left = left;
    this.right = right;
    this.objects = objects;
    this.cellKey = cellKey;
  }
}

class BVH {
  constructor(objects, maxDepth = 20) {
    this.maxDepth = maxDepth;
    this.root = this.buildBVH(objects, 0);
  }

  buildBVH(objects, depth) {
    if (objects.length === 0) return null;

    // Compute bounding box for all objects
    const boundingBox = this.computeBoundingBox(objects);

    if (objects.length === 1 || depth >= this.maxDepth) {
      return new BVHNode(boundingBox, null, null, objects, objects[0]?.cellKey);
    }

    // Split objects into two groups using Surface Area Heuristic (SAH)
    const [leftObjects, rightObjects] = this.splitObjectsSAH(objects);

    // Recursively build BVH for each group
    const leftNode = this.buildBVH(leftObjects, depth + 1);
    const rightNode = this.buildBVH(rightObjects, depth + 1);

    return new BVHNode(boundingBox, leftNode, rightNode);
  }

  computeBoundingBox(objects) {
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    objects.forEach((obj) => {
      min.x = Math.min(min.x, obj.x);
      min.y = Math.min(min.y, obj.y);
      min.z = Math.min(min.z, obj.z);
      max.x = Math.max(max.x, obj.x);
      max.y = Math.max(max.y, obj.y);
      max.z = Math.max(max.z, obj.z);
    });

    return { min, max };
  }

  splitObjectsSAH(objects) {
    const axis = this.findLongestAxis(objects);
    objects.sort((a, b) => a[axis] - b[axis]);

    let bestCost = Infinity;
    let bestSplit = 0;

    for (let i = 1; i < objects.length; i++) {
      const leftObjects = objects.slice(0, i);
      const rightObjects = objects.slice(i);

      const leftBoundingBox = this.computeBoundingBox(leftObjects);
      const rightBoundingBox = this.computeBoundingBox(rightObjects);

      const leftSurfaceArea = this.computeSurfaceArea(leftBoundingBox);
      const rightSurfaceArea = this.computeSurfaceArea(rightBoundingBox);

      const cost =
        leftSurfaceArea * leftObjects.length +
        rightSurfaceArea * rightObjects.length;

      if (cost < bestCost) {
        bestCost = cost;
        bestSplit = i;
      }
    }

    return [objects.slice(0, bestSplit), objects.slice(bestSplit)];
  }

  findLongestAxis(objects) {
    const bbox = this.computeBoundingBox(objects);
    const lengths = {
      x: bbox.max.x - bbox.min.x,
      y: bbox.max.y - bbox.min.y,
      z: bbox.max.z - bbox.min.z,
    };

    return Object.keys(lengths).reduce((a, b) =>
      lengths[a] > lengths[b] ? a : b
    );
  }

  computeSurfaceArea(boundingBox) {
    const dx = boundingBox.max.x - boundingBox.min.x;
    const dy = boundingBox.max.y - boundingBox.min.y;
    const dz = boundingBox.max.z - boundingBox.min.z;
    return 2 * (dx * dy + dy * dz + dz * dx);
  }

  query(boundingBox) {
    return this.queryBVH(this.root, boundingBox);
  }

  queryBVH(node, boundingBox) {
    if (!node) return [];

    if (!this.intersectBoundingBox(node.boundingBox, boundingBox)) {
      return [];
    }

    if (!node.left && !node.right) {
      return node.objects;
    }

    return [
      ...this.queryBVH(node.left, boundingBox),
      ...this.queryBVH(node.right, boundingBox),
    ];
  }

  intersectBoundingBox(box1, box2) {
    return (
      box1.min.x <= box2.max.x &&
      box1.max.x >= box2.min.x &&
      box1.min.y <= box2.max.y &&
      box1.max.y >= box2.min.y &&
      box1.min.z <= box2.max.z &&
      box1.max.z >= box2.min.z
    );
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
    return new BVHNode(boundingBox, null, null, [], cell.cellKey);
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

export { BVH, BVHNode, buildBVH, queryBVH };
