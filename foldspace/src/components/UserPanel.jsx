// UserPanel.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';

const UserPanel = ({
  user,
  ownedPlanets = [],
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
  const [localPlanets, setLocalPlanets] = useState(ownedPlanets);
  const [planetOptionsVisible, setPlanetOptionsVisible] = useState({});
  const [shipsListVisible, setShipsListVisible] = useState({});

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

  const SHIP_TYPES = [
    'Scout',
    'Colony ship',
    'Troop carrier',
    'Transporter',
    'Fighter',
    'Bomber',
    'Frigate',
    'Cruiser',
    'BattleShip',
    'StarNova',
  ];

  const moveCameraToPlanet = (planet) => {
    if (
      planet &&
      planet.x !== undefined &&
      planet.y !== undefined &&
      planet.z !== undefined
    ) {
      const planetPosition = {
        x: planet.x,
        y: planet.y,
        z: planet.z,
      };
      const offsetPosition = {
        x: planetPosition.x + 100,
        y: planetPosition.y + 280,
        z: planetPosition.z + 380,
      };
      setTarget(offsetPosition);
      setLookAt(planetPosition);
    }
  };

  const toggleShipsList = (planetIndex) => {
    setShipsListVisible((prev) => ({
      ...prev,
      [planetIndex]: !prev[planetIndex],
    }));
  };

  const togglePlanetOptions = (planetIndex, planet) => {
    // Close all other options and building lists
    setPlanetOptionsVisible({});
    setPlanetBuildVisible({});

    // Move camera
    moveCameraToPlanet(planet);

    // Load buildings data
    const buildings = planet?.buildings;
    if (buildings) {
      setBuildingsData((prev) => ({
        ...prev,
        [planetIndex]: buildings,
      }));
    }

    // Toggle menu for clicked planet
    setPlanetOptionsVisible((prev) => ({
      ...prev,
      [planetIndex]: !prev[planetIndex],
    }));
  };

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

    setShipMessages((prev) => ({
      ...prev,
      [shipKey]: 'set destination',
    }));
    console.log(`Select destination for ship: ${shipKey}`);
  };

  const handleColonizeClick = (shipKey) => {
    setIsSelectingDestination(true);
    setShipToMove(shipKey);
    setColonizeMode(true);

    setShipMessages((prev) => ({
      ...prev,
      [shipKey]: 'set destination',
    }));
    console.log(`Select planet to colonize with ship: ${shipKey}`);
  };

  const handleStopClick = (shipKey) => {
    console.log(`Stopping ship: ${shipKey}`);
  };

  useEffect(() => {
    if (selectedShip) {
      selectedShipRef.current = selectedShip;
    }
  }, [selectedShip]);

  useEffect(() => {
    setLocalPlanets(ownedPlanets);
  }, [ownedPlanets]);

  useEffect(() => {
    if (!isSelectingDestination && selectedShipRef.current) {
      const shipKey = selectedShipRef.current;

      setShipMessages((prev) => ({
        ...prev,
        [shipKey]: 'destination set',
      }));

      const timer = setTimeout(() => {
        setShipMessages((prev) => {
          const updated = { ...prev };
          delete updated[shipKey];
          return updated;
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSelectingDestination]);

  const toggleBuildButton = (planetIndex) => {
    // If the buildings list is visible, close both lists
    if (planetBuildVisible[planetIndex]) {
      setPlanetBuildVisible((prev) => ({
        ...prev,
        [planetIndex]: false,
      }));
      setPlanetOptionsVisible((prev) => ({
        ...prev,
        [planetIndex]: false,
      }));
    } else {
      // Show buildings list
      setPlanetBuildVisible((prev) => ({
        ...prev,
        [planetIndex]: true,
      }));
      const buildings = ownedPlanets[planetIndex]?.buildings;
      if (buildings) {
        setBuildingsData((prev) => ({
          ...prev,
          [planetIndex]: buildings,
        }));
      } else {
        console.error('No buildings data available for this planet.');
      }
    }
  };

  const handleAddShip = async (planetIndex, shipType) => {
    try {
      if (!user) {
        console.error('User not authenticated.');
        return;
      }

      const planet = localPlanets[planetIndex];
      if (!planet) {
        console.error('Planet not found.');
        return;
      }

      // Validate required fields
      if (!planet.instanceId || !planet.cellId) {
        console.error('Missing required planet data:', { planet });
        return;
      }

      const payload = {
        userId: user.uid,
        planetId: planet.instanceId,
        cellId: planet.cellId,
        shipType: shipType,
      };

      const response = await fetch(
        'https://us-central1-foldspace-6483c.cloudfunctions.net/api/addShipToQueue',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Server error: ${data.error || response.statusText}`);
      }

      if (data.success) {
        console.log(
          `Added ${shipType} to construction queue on planet ${planet.planetName}`
        );
      }
    } catch (error) {
      console.error('Error adding ship to construction queue:', error);
      alert(`Failed to add ship: ${error.message}`);
    }
  };

  const handleAddBuilding = async (planetIndex, buildingName) => {
    try {
      if (!user) {
        console.error('User not authenticated.');
        return;
      }

      const planet = localPlanets[planetIndex];
      if (!planet) {
        console.error('Planet not found.');
        return;
      }

      // Validate required fields
      if (!planet.instanceId || !planet.cellId) {
        console.error('Missing required planet data:', { planet });
        return;
      }

      const payload = {
        userId: user.uid,
        planetId: planet.instanceId,
        cellId: planet.cellId,
        buildingName: buildingName,
      };

      const response = await fetch(
        'https://us-central1-foldspace-6483c.cloudfunctions.net/api/addBuildingToQueue',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Server error: ${data.error || response.statusText}`);
      }

      if (data.success) {
        // Update local queue
        setBuildQueue((prev) => {
          const updatedQueue = { ...prev };
          if (!updatedQueue[planetIndex]) {
            updatedQueue[planetIndex] = [];
          }
          updatedQueue[planetIndex].push({
            buildingName: buildingName,
            startTime: Date.now(),
          });
          return updatedQueue;
        });

        console.log(
          `Added ${buildingName} to build queue on planet ${planet.planetName}`
        );
      }
    } catch (error) {
      console.error('Error adding building to build queue:', error);
      alert(`Failed to add building: ${error.message}`);
    }
  };

  const getShipsInConstruction = (planet, shipType) => {
    const queue = planet?.shipConstructionQueue || [];
    return queue.filter((item) => item.shipType === shipType).length;
  };

  const getBuildingsInConstruction = (planet, buildingName) => {
    const queue = planet?.constructionQueue || [];
    return queue.filter((item) => item.buildingName === buildingName).length;
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          {Array.isArray(localPlanets) && localPlanets.length > 0 ? (
            <ul>
              {localPlanets.map((planet, index) => (
                <li key={index} style={{ cursor: 'pointer' }}>
                  <div onClick={() => togglePlanetOptions(index, planet)}>
                    {planet.planetName}
                  </div>

                  {planetOptionsVisible[index] && (
                    <div style={{ marginLeft: '20px' }}>
                      <button onClick={() => toggleBuildButton(index)}>
                        Build
                      </button>
                      {buildingsData[index] &&
                        (Number(buildingsData[index]['Shipyard'] || 0) > 0 ||
                          Number(buildingsData[index]['Space shipyard'] || 0) >
                            0) && (
                          <>
                            <button onClick={() => toggleShipsList(index)}>
                              Ships
                            </button>
                            {shipsListVisible[index] && (
                              <div style={{ marginLeft: '40px' }}>
                                <ul>
                                  {SHIP_TYPES.map((shipType) => {
                                    const inConstruction =
                                      getShipsInConstruction(planet, shipType);
                                    return (
                                      <li key={shipType}>
                                        {shipType}:{' '}
                                        {inConstruction > 0 ? (
                                          <span style={{ color: 'red' }}>
                                            {inConstruction}
                                          </span>
                                        ) : (
                                          0
                                        )}{' '}
                                        <button
                                          onClick={() =>
                                            handleAddShip(index, shipType)
                                          }
                                        >
                                          +
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                    </div>
                  )}
                  {planetBuildVisible[index] && (
                    <div style={{ marginLeft: '40px' }}>
                      {buildingsData[index] && (
                        <ul>
                          {Object.entries(buildingsData[index]).map(
                            ([buildingName, quantity]) => {
                              const inConstruction = getBuildingsInConstruction(
                                planet,
                                buildingName
                              );
                              return (
                                <li key={buildingName}>
                                  {buildingName}: {quantity}
                                  {inConstruction > 0 && (
                                    <span style={{ color: 'red' }}>
                                      {' '}
                                      +{inConstruction}
                                    </span>
                                  )}{' '}
                                  <button
                                    onClick={() =>
                                      handleAddBuilding(index, buildingName)
                                    }
                                  >
                                    +
                                  </button>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No planets owned.</p>
          )}
          <h3>Your Ships:</h3>
          {shipsData ? (
            <ul>
              {Object.entries(shipsData)
                .filter(([, shipInfo]) => shipInfo.ownerId === user.uid)
                .map(([shipKey, shipInfo]) => {
                  const shipType =
                    shipInfo.type || shipKey.replace(/\d+/g, '').trim();
                  const handleClick = () => toggleDropdown(shipKey);
                  return (
                    <li key={shipKey} style={{ cursor: 'pointer' }}>
                      <div onClick={handleClick}>{shipType}</div>
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
