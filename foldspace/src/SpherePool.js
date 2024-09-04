import * as THREE from 'three';

class SpherePool {
  constructor(createFunc, initialSize = 10, maxSize = 100) {
    this.createFunc = createFunc; // Function to create a new sphere mesh
    this.pool = []; // Pool of available sphere meshes
    this.maxSize = maxSize; // Maximum pool size
    this.expandPool(initialSize); // Initially fill the pool
  }

  // Expands the pool by creating new sphere meshes
  expandPool(size) {
    for (let i = 0; i < size; i++) {
      const newItem = this.createFunc();
      this.pool.push(newItem);
    }
  }

  // Gets a sphere mesh from the pool, expanding the pool if necessary
  get() {
    if (this.pool.length === 0) {
      this.expandPool(10); // Expand the pool by 10 if empty
    }
    return this.pool.pop(); // Remove and return the last item in the pool
  }

  // Releases a sphere mesh back into the pool
  release(item) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(item);
    } else {
      // Dispose of the item if the pool is full
      item.geometry.dispose();
      item.material.dispose();
    }
  }
}

export default SpherePool;
