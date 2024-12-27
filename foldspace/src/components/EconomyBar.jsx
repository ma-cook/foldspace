import React from 'react';

const EconomyBar = ({ economy }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 1000,
      }}
    >
      <div>Credits: {economy?.credits || 0}</div>
      <div>Crystals: {economy?.crystals || 0}</div>
      <div>Gases: {economy?.gases || 0}</div>
      <div>Minerals: {economy?.minerals || 0}</div>
    </div>
  );
};

export default EconomyBar;
