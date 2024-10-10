import { useMemo } from 'react';
import { InstancedMesh } from 'three';
import { sphereGeometry } from '../SphereData';

class ObjectPool {
  constructor(createFunc, size = 1000) {
    this.createFunc = createFunc;
    this.pool = [];
    this.size = size;
    for (let i = 0; i < size; i++) {
      this.pool.push(createFunc());
    }
  }

  get() {
    return this.pool.length > 0 ? this.pool.pop() : this.createFunc();
  }

  release(obj) {
    if (this.pool.length < this.size) {
      this.pool.push(obj);
    }
  }
}

export const useSpherePools = (geometry = sphereGeometry) => {
  return useMemo(() => {
    const createInstancedMesh = () => new InstancedMesh(geometry, null, 1000);
    const pools = {
      red: new ObjectPool(createInstancedMesh),
      green: new ObjectPool(createInstancedMesh),
      blue: new ObjectPool(createInstancedMesh),
      brown: new ObjectPool(createInstancedMesh),
      purple: new ObjectPool(createInstancedMesh),
      greenMoon: new ObjectPool(createInstancedMesh),
      purpleMoon: new ObjectPool(createInstancedMesh),
    };
    return pools;
  }, [geometry]);
};
