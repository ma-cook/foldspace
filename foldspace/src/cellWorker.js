// cellWorker.js
self.onmessage = async (event) => {
  const { cellKey, data } = event.data;

  // Simulate heavy computation
  const createVector3Array = (positions) => {
    return Array.isArray(positions)
      ? positions.map((pos) => ({ x: pos.x, y: pos.y, z: pos.z }))
      : [];
  };

  const newPositions = createVector3Array(data.positions);
  const newRedPositions = createVector3Array(data.redPositions);
  const newGreenPositions = createVector3Array(data.greenPositions);
  const newBluePositions = createVector3Array(data.bluePositions);
  const newPurplePositions = createVector3Array(data.purplePositions);
  const newGreenMoonPositions = createVector3Array(data.greenMoonPositions);
  const newPurpleMoonPositions = createVector3Array(data.purpleMoonPositions);

  self.postMessage({
    cellKey,
    newPositions,
    newRedPositions,
    newGreenPositions,
    newBluePositions,
    newPurplePositions,
    newGreenMoonPositions,
    newPurpleMoonPositions,
  });
};
