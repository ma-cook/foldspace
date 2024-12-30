// LoadingMessage.jsx
import React from 'react';

const LoadingMessage = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: '4px',
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
};

export default LoadingMessage;
