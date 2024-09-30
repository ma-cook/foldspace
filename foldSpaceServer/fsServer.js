const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');
const bodyParser = require('body-parser'); // Import body-parser
const app = express();

// Increase the limit for the request payload size
app.use(bodyParser.json({ limit: '10mb' })); // Set the limit to 10MB
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

// Helper function read the entire cell data file
const readCellDataFile = async () => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading cell data file:', error);
    return {};
  }
};

// Helper function to write the entire cell data file
const writeCellDataFile = async (data) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cell data file:', error);
  }
};

// Create a queue to manage read/write operations
const fileQueue = async.queue(async (task, callback) => {
  try {
    await task();
  } catch (error) {
    console.error('Error processing task in queue:', error);
  } finally {
    if (callback) callback();
  }
}, 1); // Only one task is processed at a time

app.post('/save-sphere-data', async (req, res) => {
  const { cellKey, positions } = req.body;
  const docRef = db.collection('cells').doc(cellKey);
  await docRef.set({ positions });

  fileQueue.push(async () => {
    const cellData = await readCellDataFile();
    cellData[cellKey] = positions;
    await writeCellDataFile(cellData);
    cache.set(cellKey, positions); // Update cache
  });

  res.send('Sphere data saved successfully');
});

app.get('/get-sphere-data/:cellKey', async (req, res) => {
  const { cellKey } = req.params;

  try {
    const cachedData = cache.get(cellKey);
    if (cachedData) {
      return res.send(cachedData);
    }
    console.log(cachedData);
    console.log(`Cache miss for cellKey: ${cellKey}, checking local file.`);
    fileQueue.push(
      async () => {
        const cellData = await readCellDataFile();
        if (cellData[cellKey]) {
          console.log(`Loading cell data for ${cellKey} from local file.`);
          cache.set(cellKey, cellData[cellKey]); // Update cache
          res.send(cellData[cellKey]);
        } else {
          console.log(`No local file data for ${cellKey}, checking Firestore.`);
          const docRef = db.collection('cells').doc(cellKey);
          const doc = await docRef.get();

          if (!doc.exists) {
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
              greenMoonPositions: data.greenMoonPositions || [],
              purpleMoonPositions: data.purpleMoonPositions || [],
            };
            fileQueue.push(async () => {
              const cellData = await readCellDataFile();
              cellData[cellKey] = validData;
              await writeCellDataFile(cellData);
              cache.set(cellKey, validData); // Update cache
            });
            res.send(validData);
          }
        }
      },
      (err) => {
        if (err) {
          console.error('Error processing task in queue:', err);
          res.status(500).send('Internal Server Error');
        }
      }
    );
  } catch (error) {
    console.error(`Error loading cell data for ${cellKey}:`, error);
    res.status(500).send('Internal Server Error');
  }
});

// Helper function to delete documents in batches
const deleteDocumentsInBatches = async (collectionRef, batchSize = 10) => {
  const snapshot = await collectionRef.get();
  const totalDocs = snapshot.size;
  let deletedDocs = 0;

  while (deletedDocs < totalDocs) {
    const batch = db.batch();
    const batchDocs = snapshot.docs.slice(deletedDocs, deletedDocs + batchSize);

    batchDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedDocs += batchDocs.length;
  }
};

// Endpoint to delete all cell data
app.delete('/delete-all-cells', async (req, res) => {
  try {
    // Delete all documents in the 'cells' collection in Firestore
    const cellsCollection = db.collection('cells');
    await deleteDocumentsInBatches(cellsCollection);

    // Clear the cache
    cache.flushAll();

    // Clear the local file
    await writeCellDataFile({});

    res.send('All cell data deleted successfully');
  } catch (error) {
    console.error('Error deleting all cell data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});
