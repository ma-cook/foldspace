import React, { useEffect, useRef, memo, forwardRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useStore } from './store';

const CustomCamera = forwardRef((props, ref) => {
  const vec = useStore((state) => state.vec);
  const lookAt = useStore((state) => state.lookAt);
  const defaultPosition = useStore((state) => state.defaultPosition);
  const { camera } = useThree(); // Get the camera object
  const controlsRef = useRef(); // Reference to the OrbitControls component
  const target = useStore((state) => state.target);
  const cameraPosition = useStore((state) => state.cameraPosition);
  const setCameraPosition = useStore((state) => state.setCameraPosition);

  // Update the camera's position and lookAt when vec or lookAt changes
  useEffect(() => {
    camera.far = 300000; // Update the far property
    camera.updateProjectionMatrix(); // Update the camera's projection matrix

    if (vec) {
      camera.position.copy(vec);
      setCameraPosition(vec.x, vec.y, vec.z); // Update the cameraPosition state
    }

    if (ref) {
      ref.current = camera;
    }

    if (target) {
      camera.position.copy(target);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
      setCameraPosition(target.x, target.y, target.z); // Update the cameraPosition state
    }
  }, [vec, lookAt, target, camera, ref, setCameraPosition]);

  // Memoize the handleCameraMove function
  const handleCameraMove = useCallback(() => {
    setCameraPosition(camera.position.x, camera.position.y, camera.position.z);
  }, [camera.position, setCameraPosition]);

  // Update the camera position in the store whenever the camera moves
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.addEventListener('change', handleCameraMove);
    }

    return () => {
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('change', handleCameraMove);
      }
    };
  }, [handleCameraMove]);

  return (
    <PerspectiveCamera
      defaultCamera={true}
      fov={70}
      near={0.1}
      far={300000}
      position={cameraPosition}
    >
      <OrbitControls
        ref={ref || controlsRef}
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
});

export default memo(CustomCamera);
