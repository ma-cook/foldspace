// UserPanel.jsx
import React, { useState } from 'react';
import { useStore } from '../store';

const UserPanel = ({
  user,
  ownedPlanets,
  shipsData,
  handleShipClick,
  setTarget,
  setLookAt,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState({});
  const setIsSelectingDestination = useStore(
    (state) => state.setIsSelectingDestination
  );
  const setShipToMove = useStore((state) => state.setShipToMove);
  const setColonizeMode = useStore((state) => state.setColonizeMode);

  const toggleDropdown = (shipKey) => {
    setDropdownVisible((prev) => ({
      ...prev,
      [shipKey]: !prev[shipKey],
    }));
  };

  const handleMoveToClick = (shipKey) => {
    const shipPosition = shipsData[shipKey].position;
    handleShipClick(shipPosition);
    // Additional logic for 'move to' can be added here
  };

  const handleMoveShipClick = (shipKey) => {
    setIsSelectingDestination(true);
    setShipToMove(shipKey);
    console.log(`Select destination for ship: ${shipKey}`);
  };

  const handleColonizeClick = (shipKey) => {
    setIsSelectingDestination(true);
    setShipToMove(shipKey);
    setColonizeMode(true); // Enable colonize mode
    console.log(`Select planet to colonize with ship: ${shipKey}`);
  };

  const handleStopClick = (shipKey) => {
    // Logic for 'stop' can be added here
    console.log(`Stopping ship: ${shipKey}`);
  };

  const handlePlanetClick = (planetPosition) => {
    const offsetPosition = {
      x: planetPosition.x + 100,
      y: planetPosition.y + 280,
      z: planetPosition.z + 380,
    };
    setTarget(offsetPosition);
    setLookAt(planetPosition);
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
              <li
                key={index}
                onClick={() => handlePlanetClick(planet)}
                style={{ cursor: 'pointer' }}
              >
                {planet.planetName}: ({planet.x.toFixed(2)},{' '}
                {planet.y.toFixed(2)}, {planet.z.toFixed(2)})
              </li>
            ))}
          </ul>
          <h3>Ships:</h3>
          {shipsData ? (
            <ul>
              {(() => {
                const shipTypeCounts = {};

                // Pre-calculate ship type counts
                Object.values(shipsData).forEach((info) => {
                  const type = info.type || '';
                  if (!shipTypeCounts[type]) {
                    shipTypeCounts[type] = 1;
                  } else {
                    shipTypeCounts[type]++;
                  }
                });

                return Object.entries(shipsData).map(([shipKey, shipInfo]) => {
                  const shipType =
                    shipInfo.type || shipKey.replace(/\d+/g, '').trim();
                  const shipNumber = shipTypeCounts[shipType]++;
                  const shipDisplayName = `${shipType} ${shipNumber}`;
                  const handleClick = () => toggleDropdown(shipKey);
                  return (
                    <li key={shipKey} style={{ cursor: 'pointer' }}>
                      <div onClick={handleClick}>
                        {shipDisplayName} at position (
                        {shipInfo.position.x.toFixed(2)},{' '}
                        {shipInfo.position.y.toFixed(2)},{' '}
                        {shipInfo.position.z.toFixed(2)})
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
                    </li>
                  );
                });
              })()}
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
