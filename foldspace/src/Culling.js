import * as THREE from 'three';

const frustum = new THREE.Frustum();
const sphere = new THREE.Sphere();

export function cullInstance(instanceMatrix, camera, geometry) {
  // Update the frustum to match the current camera state
  frustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
  );

  // Get the world position of the instance
  const position = new THREE.Vector3();
  instanceMatrix.decompose(
    position,
    new THREE.Quaternion(),
    new THREE.Vector3()
  );

  // Ensure the bounding sphere is calculated
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();

  // Create a bounding sphere for the instance
  sphere.set(position, geometry.boundingSphere.radius);

  // Check if the sphere is inside the frustum
  return frustum.intersectsSphere(sphere);
}
