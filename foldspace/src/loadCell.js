import * as THREE from 'three';
import cellCache from './cellCache';
import generateNewPositions from './generateNewPositions';
import saveCellData from './saveCellData';

const loadCell = async (
  x,
  z,
  loadDetail,
  loadedCells,
  loadingCells,
  setLoadingCells,
  setPositions,
  setRedPositions,
  setGreenPositions,
  setBluePositions,
  setPurplePositions,
  setLoadedCells,
  swapBuffers
) => {
  const cellKey = `${x},${z}`;
  if (loadedCells.has(cellKey) || loadingCells.has(cellKey)) {
    return;
  }

  setLoadingCells((prev) => new Set(prev).add(cellKey));

  try {
    const response = await fetch(
      `http://localhost:5000/get-sphere-data/${cellKey}`
    );

    if (response.ok) {
      const savedPositions = await response.json();

      const positions = Array.isArray(savedPositions.positions)
        ? savedPositions.positions
        : [];
      const redPositions = Array.isArray(savedPositions.redPositions)
        ? savedPositions.redPositions
        : [];
      const greenPositions = Array.isArray(savedPositions.greenPositions)
        ? savedPositions.greenPositions
        : [];
      const bluePositions = Array.isArray(savedPositions.bluePositions)
        ? savedPositions.bluePositions
        : [];
      const purplePositions = Array.isArray(savedPositions.purplePositions)
        ? savedPositions.purplePositions
        : [];

      const newPositions = positions.map(
        (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
      );

      cellCache[cellKey] = newPositions;
      setPositions((prevPositions) => [...prevPositions, ...newPositions]);

      if (loadDetail) {
        const newRedPositions = redPositions.map(
          (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
        );
        const newGreenPositions = greenPositions.map(
          (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
        );
        const newBluePositions = bluePositions.map(
          (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
        );
        const newPurplePositions = purplePositions.map(
          (pos) => new THREE.Vector3(pos.x, pos.y, pos.z)
        );

        setRedPositions((prevPositions) => [
          ...prevPositions,
          ...newRedPositions,
        ]);
        setGreenPositions((prevPositions) => [
          ...prevPositions,
          ...newGreenPositions,
        ]);
        setBluePositions((prevPositions) => [
          ...prevPositions,
          ...newBluePositions,
        ]);
        setPurplePositions((prevPositions) => [
          ...prevPositions,
          ...newPurplePositions,
        ]);
      }

      setLoadedCells((prevLoadedCells) => {
        const updatedLoadedCells = new Set(prevLoadedCells);
        updatedLoadedCells.add(cellKey);
        return updatedLoadedCells;
      });
    } else if (response.status === 404) {
      const {
        newPositions,
        newRedPositions,
        newGreenPositions,
        newBluePositions,
        newPurplePositions,
      } = generateNewPositions(x, z);

      cellCache[cellKey] = newPositions;

      setPositions((prevPositions) => [...prevPositions, ...newPositions]);

      if (loadDetail) {
        setRedPositions((prevPositions) => [
          ...prevPositions,
          ...newRedPositions,
        ]);
        setGreenPositions((prevPositions) => [
          ...prevPositions,
          ...newGreenPositions,
        ]);
        setBluePositions((prevPositions) => [
          ...prevPositions,
          ...newBluePositions,
        ]);
        setPurplePositions((prevPositions) => [
          ...prevPositions,
          ...newPurplePositions,
        ]);
      }

      setLoadedCells((prevLoadedCells) => {
        const updatedLoadedCells = new Set(prevLoadedCells);
        updatedLoadedCells.add(cellKey);
        return updatedLoadedCells;
      });

      await saveCellData(cellKey, {
        positions: newPositions,
        redPositions: newRedPositions,
        greenPositions: newGreenPositions,
        bluePositions: newBluePositions,
        purplePositions: newPurplePositions,
      });
    } else {
      console.error(
        `Error loading cell data from Firestore for ${cellKey}:`,
        response.statusText
      );
    }
  } catch (error) {
    console.error(
      `Error loading cell data from Firestore for ${cellKey}:`,
      error
    );
  } finally {
    setLoadingCells((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cellKey);
      return newSet;
    });
    swapBuffers();
  }
};

export default loadCell;
