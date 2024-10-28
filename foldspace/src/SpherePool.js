class SpherePool {
  constructor(createFunc, initialSize = 100, maxSize = 1000) {
    this.createFunc = createFunc; // Function to create a new instanced mesh
    this.pool = []; // Pool of available instanced meshes
    this.maxSize = maxSize; // Maximum pool size
    this.expandPool(initialSize); // Initially fill the pool
  }

  // Expands the pool by creating new instanced meshes
  expandPool(size) {
    for (let i = 0; i < size; i++) {
      const newItem = this.createFunc();
      this.pool.push(newItem);
    }
  }

  // Gets an instanced mesh from the pool, expanding the pool if necessary
  get() {
    if (this.pool.length === 0) {
      this.expandPool(10); // Expand the pool by 10 if empty
    }
    return this.pool.pop(); // Remove and return the last item in the pool
  }

  // Releases an instanced mesh back into the pool
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
