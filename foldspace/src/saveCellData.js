const saveCellData = async (cellKey, positions) => {
  try {
    await fetch('http://localhost:5000/save-sphere-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cellKey, positions }),
    });
  } catch (error) {
    console.error('Error saving cell data to Firestore:', error);
  }
};

export default saveCellData;
