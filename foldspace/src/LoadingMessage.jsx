// LoadingMessage.jsx
import React from 'react';

const LoadingMessage = () => {
  return (
    <div style={styles.container}>
      <p>Loading cells...</p>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    zIndex: 1000,
  },
};

export default LoadingMessage;
