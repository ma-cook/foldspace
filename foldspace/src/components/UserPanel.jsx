// UserPanel.jsx
import React from 'react';

const UserPanel = ({
  user,
  ownedPlanets,
  shipsData,
  handlePlanetClick,
  handleShipClick,
}) => (
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
              {planet.planetName}: ({planet.x.toFixed(2)}, {planet.y.toFixed(2)}
              , {planet.z.toFixed(2)})
            </li>
          ))}
        </ul>
        <h3>Ships:</h3>
        {shipsData ? (
          <ul>
            {(() => {
              const shipTypeCounts = {};
              return Object.entries(shipsData).map(([shipKey, shipInfo]) => {
                const shipType = shipKey.replace(/\d+/g, '').trim();
                if (!shipTypeCounts[shipType]) {
                  shipTypeCounts[shipType] = 1;
                } else {
                  shipTypeCounts[shipType]++;
                }
                const shipNumber = shipTypeCounts[shipType];
                const shipDisplayName = `${shipType}${shipNumber}`;
                const handleClick = () => handleShipClick(shipInfo.position);
                return (
                  <li
                    key={shipKey}
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {shipDisplayName} at position (
                    {shipInfo.position.x.toFixed(2)},{' '}
                    {shipInfo.position.y.toFixed(2)},{' '}
                    {shipInfo.position.z.toFixed(2)})
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

export default UserPanel;
