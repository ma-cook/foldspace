const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const NodeCache = require('node-cache');
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
const cache = new NodeCache({ stdTTL: 600 }); // Cache with 10 minutes TTL

const dataFilePath = path.join(__dirname, 'data', 'cells.json');

// Use the synchronous fs module for existsSync and mkdirSync
const fsSync = require('fs');
if (!fsSync.existsSync(path.dirname(dataFilePath))) {
  fsSync.mkdirSync(path.dirname(dataFilePath), { recursive: true });
}

// Helper function to read the entire cell data file
const readCellDataFile = async () => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// Helper function to write the entire cell data file
const writeCellDataFile = async (data) => {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
};

app.post('/save-sphere-data', async (req, res) => {
  const { cellKey, positions } = req.body;
  const docRef = db.collection('cells').doc(cellKey);
  await docRef.set({ positions });

  const cellData = await readCellDataFile();
  cellData[cellKey] = positions;
  await writeCellDataFile(cellData);

  cache.set(cellKey, positions); // Update cache

  res.send('Sphere data saved successfully');
});

app.get('/get-sphere-data/:cellKey', async (req, res) => {
  const { cellKey } = req.params;

  try {
    // Check cache first
    const cachedData = cache.get(cellKey);
    if (cachedData) {
      return res.send(cachedData);
    }

    const cellData = await readCellDataFile();
    if (cellData[cellKey]) {
      console.log(`Loading cell data for ${cellKey} from local file.`);
      cache.set(cellKey, cellData[cellKey]); // Update cache
      return res.send(cellData[cellKey]);
    } else {
      console.log(`Loading cell data for ${cellKey} from Firestore.`);
      const docRef = db.collection('cells').doc(cellKey);

      const doc = await docRef.get();

      if (!doc.exists) {
        console.log(`No sphere data found for ${cellKey} in Firestore.`);
        return res.status(404).send('No sphere data found');
      } else {
        const data = doc.data();
        // Ensure the data structure is valid
        const validData = {
          positions: data.positions || [],
        };
        cellData[cellKey] = validData;
        await writeCellDataFile(cellData);
        cache.set(cellKey, validData); // Update cache
        return res.send(validData);
      }
    }
  } catch (error) {
    console.error(`Error loading cell data for ${cellKey}:`, error);
    return res.status(500).send('Internal Server Error');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});
