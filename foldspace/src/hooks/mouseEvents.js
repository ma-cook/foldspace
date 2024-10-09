import { throttle } from 'lodash';
import { handleMouseDown, handleMouseUp } from '../handleClick';
import { useStore } from '../store';

export const createMouseHandlers = (
  raycaster,
  mouse,
  camera,
  sphereRefs,
  setTarget,
  setLookAt,
  isMouseDown,
  lastMoveTimestamp,
  isDragging,
  mouseMoved
) => {
  const onMouseDown = (event) => {
    handleMouseDown(
      event,
      raycaster,
      mouse,
      camera,
      sphereRefs,
      sphereRefs.centralDetailed,
      sphereRefs.centralLessDetailed,
      sphereRefs.red,
      sphereRefs.green,
      sphereRefs.blue,
      sphereRefs.purple,
      sphereRefs.greenMoon,
      sphereRefs.purpleMoon,
      sphereRefs.atmos,
      sphereRefs.atmos2,
      sphereRefs.atmos3,
      isMouseDown,
      lastMoveTimestamp
    );
  };

  const onMouseUp = (event) => {
    handleMouseUp(
      event,
      raycaster,
      mouse,
      camera,
      setTarget,
      setLookAt,
      sphereRefs,
      sphereRefs.centralDetailed,
      sphereRefs.centralLessDetailed,
      sphereRefs.red,
      sphereRefs.green,
      sphereRefs.blue,
      sphereRefs.purple,
      sphereRefs.greenMoon,
      sphereRefs.purpleMoon,
      sphereRefs.atmos,
      sphereRefs.atmos2,
      sphereRefs.atmos3,
      isMouseDown,
      lastMoveTimestamp,
      isDragging,
      mouseMoved
    );
  };

  const onMouseMove = throttle((event) => {
    if (isMouseDown.current) {
      const currentTime = Date.now();
      lastMoveTimestamp.current = currentTime;
      const movementX =
        event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      const movementY =
        event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      if (Math.abs(movementX) > 1 || Math.abs(movementY) > 1) {
        mouseMoved.current = true;
        isDragging.current = true;
      }

      const rotation = useStore.getState().rotation;
      rotation.y -= movementX * 0.002;
      rotation.x -= movementY * 0.002;

      useStore.getState().setRotation(rotation);
    }
  }, 16);

  return { onMouseDown, onMouseUp, onMouseMove };
};
