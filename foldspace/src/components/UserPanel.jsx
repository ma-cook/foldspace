// UserPanel.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import axios from 'axios'; // Ensure axios is installed and imported

const UserPanel = ({
  user,
  ownedPlanets,
  shipsData,
  handleShipClick,
  setTarget,
  setLookAt,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState({});
  const [shipMessages, setShipMessages] = useState({});
  const [planetBuildVisible, setPlanetBuildVisible] = useState({});
  const [buildingsData, setBuildingsData] = useState({});
  const [buildQueue, setBuildQueue] = useState({});

  const isSelectingDestination = useStore(
    (state) => state.isSelectingDestination
  );
  const selectedShip = useStore((state) => state.shipToMove);
  const setIsSelectingDestination = useStore(
    (state) => state.setIsSelectingDestination
  );
  const setShipToMove = useStore((state) => state.setShipToMove);
  const setColonizeMode = useStore((state) => state.setColonizeMode);
  const selectedShipRef = useRef(selectedShip);

  const toggleDropdown = (shipKey) => {
    setDropdownVisible((prev) => ({
      ...prev,
      [shipKey]: !prev[shipKey],
    }));
  };

  const handleMoveToClick = (shipKey) => {
    const shipPosition = shipsData[shipKey]?.position;
    if (shipPosition) {
      handleShipClick(shipPosition);
    } else {
      console.error(`Ship ${shipKey} position is undefined.`);
    }
  };

  const handleMoveShipClick = (shipKey) => {
    setIsSelectingDestination(true);
    setShipToMove(shipKey);

    // Set the message for this ship
    setShipMessages((prev) => ({
      ...prev,
      [shipKey]: 'set destination',
    }));
    console.log(`Select destination for ship: ${shipKey}`);
  };

  const handleColonizeClick = (shipKey) => {
    setIsSelectingDestination(true);
    setShipToMove(shipKey);
    setColonizeMode(true); // Enable colonize mode

    // Set the message for this ship
    setShipMessages((prev) => ({
      ...prev,
      [shipKey]: 'set destination',
    }));
    console.log(`Select planet to colonize with ship: ${shipKey}`);
  };

  const handleStopClick = (shipKey) => {
    // Logic for 'stop' can be added here
    console.log(`Stopping ship: ${shipKey}`);
  };

  const handlePlanetClick = (planetPosition) => {
    if (planetPosition) {
      const offsetPosition = {
        x: planetPosition.x + 100,
        y: planetPosition.y + 280,
        z: planetPosition.z + 380,
      };
      setTarget(offsetPosition);
      setLookAt(planetPosition);
    } else {
      console.error('Planet position is undefined.');
    }
  };

  useEffect(() => {
    if (selectedShip) {
      selectedShipRef.current = selectedShip;
    }
  }, [selectedShip]);

  // Effect to update message when destination is set
  useEffect(() => {
    if (!isSelectingDestination && selectedShipRef.current) {
      const shipKey = selectedShipRef.current;

      // Destination has been set for shipKey
      setShipMessages((prev) => ({
        ...prev,
        [shipKey]: 'destination set',
      }));

      // Remove the message after 2 seconds
      const timer = setTimeout(() => {
        setShipMessages((prev) => {
          const updated = { ...prev };
          delete updated[shipKey];
          return updated;
        });
      }, 2000);

      // Cleanup timer
      return () => clearTimeout(timer);
    }
  }, [isSelectingDestination]);

  const toggleBuildButton = (planetIndex) => {
    setPlanetBuildVisible((prev) => ({
      ...prev,
      [planetIndex]: !prev[planetIndex],
    }));
    // Fetch buildings data for the selected planet
    const buildings = ownedPlanets[planetIndex]?.buildings;
    if (buildings) {
      setBuildingsData((prev) => ({
        ...prev,
        [planetIndex]: buildings,
      }));
    } else {
      console.error('No buildings data available for this planet.');
    }
  };

  const handleAddBuilding = async (planetIndex, buildingName) => {
    try {
      if (!user) {
        console.error('User not authenticated.');
        return;
      }
      const planet = ownedPlanets[planetIndex];
      if (!planet) {
        console.error('Planet not found.');
        return;
      }

      // Send request to the server to add building to construction queue
      const response = await axios.post('/addBuildingToQueue', {
        userId: user.uid,
        planetId: planet.instanceId,
        cellId: planet.cellId,
        buildingName: buildingName,
      });

      if (response.data.success) {
        // Optionally, update build queue state to reflect the change
        setBuildQueue((prev) => ({
          ...prev,
          [planetIndex]: [
            ...(prev[planetIndex] || []),
            {
              buildingName: buildingName,
              startTime: Date.now(),
              status: 'In Queue',
            },
          ],
        }));

        console.log(
          `Added ${buildingName} to build queue on planet ${planet.planetName}`
        );
      } else {
        console.error('Failed to add building to build queue.');
      }
    } catch (error) {
      console.error('Error adding building to build queue:', error);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '5px 10px',
        borderRadius: '5px',
      }}
    >
      {user && (
        <>
          <span style={{ marginRight: '10px' }}>
            {user.displayName || user.email}
          </span>
          <h3>Owned Planets:</h3>
          <ul>
            {ownedPlanets.map((planet, index) => (
              <li key={index} style={{ cursor: 'pointer' }}>
                <div onClick={() => toggleBuildButton(index)}>
                  {planet.planetName}: ({planet.x.toFixed(2)},{' '}
                  {planet.y.toFixed(2)}, {planet.z.toFixed(2)})
                </div>
                {planetBuildVisible[index] && (
                  <div style={{ marginLeft: '20px' }}>
                    {/* Display buildings list with '+' buttons */}
                    {buildingsData[index] && (
                      <ul>
                        {Object.entries(buildingsData[index]).map(
                          ([buildingName, quantity]) => (
                            <li key={buildingName}>
                              {buildingName}: {quantity}{' '}
                              <button
                                onClick={() =>
                                  handleAddBuilding(index, buildingName)
                                }
                              >
                                +
                              </button>
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <h3>Your Ships:</h3>
          {shipsData ? (
            <ul>
              {Object.entries(shipsData)
                .filter(([shipKey, shipInfo]) => shipInfo.ownerId === user.uid)
                .map(([shipKey, shipInfo]) => {
                  const shipType =
                    shipInfo.type || shipKey.replace(/\d+/g, '').trim();
                  const handleClick = () => toggleDropdown(shipKey);
                  return (
                    <li key={shipKey} style={{ cursor: 'pointer' }}>
                      <div onClick={handleClick}>
                        {shipType} at position (
                        {shipInfo.position?.x.toFixed(2)},{' '}
                        {shipInfo.position?.y.toFixed(2)},{' '}
                        {shipInfo.position?.z.toFixed(2)})
                      </div>
                      {dropdownVisible[shipKey] && (
                        <div style={{ marginLeft: '20px' }}>
                          <button onClick={() => handleMoveToClick(shipKey)}>
                            Move to
                          </button>
                          <button onClick={() => handleMoveShipClick(shipKey)}>
                            Move ship
                          </button>
                          {shipType.toLowerCase() === 'colony ship' && (
                            <button
                              onClick={() => handleColonizeClick(shipKey)}
                            >
                              Colonize
                            </button>
                          )}
                          <button onClick={() => handleStopClick(shipKey)}>
                            Stop
                          </button>
                        </div>
                      )}
                      {/* Display the message */}
                      {shipMessages[shipKey] && (
                        <div style={{ color: 'red', marginLeft: '20px' }}>
                          {shipMessages[shipKey]}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p>No ship data available.</p>
          )}
        </>
      )}
    </div>
  );
};

export default UserPanel;
