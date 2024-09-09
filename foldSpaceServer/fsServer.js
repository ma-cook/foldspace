const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const dataFilePath = path.join(__dirname, 'data', 'cells.json');
if (!fs.existsSync(path.dirname(dataFilePath))) {
  fs.mkdirSync(path.dirname(dataFilePath));
}

// Helper function to read the entire cell data file
const readCellDataFile = () => {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  }
  return {};
};

// Helper function to write the entire cell data file
const writeCellDataFile = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

app.post('/save-sphere-data', async (req, res) => {
  const { cellKey, positions } = req.body;
  const docRef = db.collection('cells').doc(cellKey);
  await docRef.set({ positions });

  const cellData = readCellDataFile();
  cellData[cellKey] = positions;
  writeCellDataFile(cellData);

  res.send('Sphere data saved successfully');
});

app.get('/get-sphere-data/:cellKey', async (req, res) => {
  const { cellKey } = req.params;

  try {
    const cellData = readCellDataFile();
    if (cellData[cellKey]) {
      console.log(`Loading cell data for ${cellKey} from local file.`);
      res.send(cellData[cellKey]);
    } else {
      console.log(`Loading cell data for ${cellKey} from Firestore.`);
      const docRef = db.collection('cells').doc(cellKey);
      const doc = await docRef.get();
      if (!doc.exists) {
        console.log(`No sphere data found for ${cellKey} in Firestore.`);
        res.status(404).send('No sphere data found');
      } else {
        const data = doc.data();
        // Ensure the data structure is valid
        const validData = {
          positions: data.positions || [],
          redPositions: data.redPositions || [],
          greenPositions: data.greenPositions || [],
          bluePositions: data.bluePositions || [],
          purplePositions: data.purplePositions || [],
        };
        cellData[cellKey] = validData;
        writeCellDataFile(cellData);
        res.send(validData);
      }
    }
  } catch (error) {
    console.error(`Error loading cell data for ${cellKey}:`, error);
    res.status(500).send('Internal Server Error');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});
