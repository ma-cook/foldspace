import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { OrbitControls } from '@react-three/drei';
import { useStore } from './store';

export default function CustomCamera() {
  const vec = useStore((state) => state.vec);
  const lookAt = useStore((state) => state.lookAt);
  const defaultPosition = useStore((state) => state.defaultPosition);
  const { camera } = useThree(); // Get the camera object
  const controlsRef = useRef(); // Reference to the OrbitControls component
  const target = useStore((state) => state.target);
  const clickedObject = useStore((state) => state.clickedObject);

  // Update the camera's position and lookAt when vec or lookAt changes
  useEffect(() => {
    camera.far = 25000; // Update the far property
    camera.updateProjectionMatrix(); // Update the camera's projection matrix

    if (vec) {
      camera.position.copy(vec);
    }

    if (target) {
      camera.position.copy(target);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [vec, lookAt, target, camera]);

  return (
    <PerspectiveCamera
      defaultCamera={true}
      fov={70}
      near={0.1}
      far={25000} // Increase this value
      position={[0, 0, 0]}
    >
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        target={lookAt}
        enableDamping={true} // Add this line
        dampingFactor={1} // Add this line
        staticMoving={true} // Add this line
      />
    </PerspectiveCamera>
  );
}
