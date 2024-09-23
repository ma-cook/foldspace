class BVHNode {
  constructor(boundingBox, left = null, right = null, objects = []) {
    this.boundingBox = boundingBox;
    this.left = left;
    this.right = right;
    this.objects = objects;
  }
}

class BVH {
  constructor(objects) {
    this.root = this.buildBVH(objects);
  }

  buildBVH(objects) {
    if (objects.length === 0) return null;

    // Compute bounding box for all objects
    const boundingBox = this.computeBoundingBox(objects);

    if (objects.length === 1) {
      return new BVHNode(boundingBox, null, null, objects);
    }

    // Split objects into two groups using Surface Area Heuristic (SAH)
    const [leftObjects, rightObjects] = this.splitObjectsSAH(objects);

    // Recursively build BVH for each group
    const leftNode = this.buildBVH(leftObjects);
    const rightNode = this.buildBVH(rightObjects);

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
    // Sort objects by their centroid along the longest axis
    const axis = this.findLongestAxis(objects);
    objects.sort((a, b) => a[axis] - b[axis]);

    const mid = Math.floor(objects.length / 2);
    return [objects.slice(0, mid), objects.slice(mid)];
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

export { BVH, BVHNode };
