import React, {
  useEffect,
  useRef,
  memo,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
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

  // Memoize the camera far value and update projection matrix
  useEffect(() => {
    camera.far = 300000;
    camera.updateProjectionMatrix();
  }, [camera]);

  // Memoize the camera position and target updates
  useEffect(() => {
    if (vec) {
      camera.position.copy(vec);
      setCameraPosition(vec.x, vec.y, vec.z);
    }

    if (ref) {
      ref.current = camera;
    }

    if (target) {
      camera.position.copy(target);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
      setCameraPosition(target.x, target.y, target.z);
    }
  }, [vec, target, camera, ref, setCameraPosition]);

  // Memoize the camera position and lookAt values
  const memoizedCameraPosition = useMemo(
    () => cameraPosition,
    [cameraPosition]
  );
  const memoizedLookAt = useMemo(() => lookAt, [lookAt]);

  return (
    <PerspectiveCamera
      defaultCamera={true}
      fov={70}
      near={0.1}
      far={300000}
      position={memoizedCameraPosition}
    >
      <OrbitControls
        ref={ref || controlsRef}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        target={memoizedLookAt}
        enableDamping={true}
        dampingFactor={1}
        staticMoving={true}
        maxDistance={200000}
      />
    </PerspectiveCamera>
  );
});

export default memo(CustomCamera);
