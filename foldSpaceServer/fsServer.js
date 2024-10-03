const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 600 });

const dataFilePath = path.join(__dirname, 'data', 'cells.json');

const fsSync = require('fs');
if (!fsSync.existsSync(path.dirname(dataFilePath))) {
  fsSync.mkdirSync(path.dirname(dataFilePath), { recursive: true });
}

const readCellDataFile = async () => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading cell data file:', error);
    return {};
  }
};

const writeCellDataFile = async (data) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cell data file:', error);
  }
};

const fileQueue = async.queue(async (task, callback) => {
  try {
    await task();
  } catch (error) {
    console.error('Error processing task in queue:', error);
  } finally {
    if (callback) callback();
  }
}, 1);

app.post('/save-sphere-data', async (req, res) => {
  const { cellKey, positions } = req.body;
  const docRef = db.collection('cells').doc(cellKey);
  await docRef.set({ positions });

  fileQueue.push(async () => {
    const cellData = await readCellDataFile();
    cellData[cellKey] = positions;
    await writeCellDataFile(cellData);
    cache.set(cellKey, positions);
  });

  res.send('Sphere data saved successfully');
});

app.post('/get-sphere-data', async (req, res) => {
  const { cellKeys } = req.body;
  const results = {};
  const missingKeys = [];

  try {
    // Check cache first
    cellKeys.forEach((cellKey) => {
      const cachedData = cache.get(cellKey);
      if (cachedData) {
        results[cellKey] = cachedData;
      } else {
        missingKeys.push(cellKey);
      }
    });

    if (missingKeys.length > 0) {
      const cellData = await readCellDataFile();

      // Check file cache
      missingKeys.forEach((cellKey) => {
        if (cellData[cellKey]) {
          cache.set(cellKey, cellData[cellKey]);
          results[cellKey] = cellData[cellKey];
        } else {
          missingKeys.push(cellKey);
        }
      });

      if (missingKeys.length > 0) {
        // Fetch missing keys from Firestore in batches
        const batchSize = 10;
        for (let i = 0; i < missingKeys.length; i += batchSize) {
          const batchKeys = missingKeys.slice(i, i + batchSize);
          const batchDocs = await Promise.all(
            batchKeys.map((cellKey) =>
              db.collection('cells').doc(cellKey).get()
            )
          );

          batchDocs.forEach((doc, index) => {
            const cellKey = batchKeys[index];
            if (doc.exists) {
              const data = doc.data();
              const validData = {
                positions: data.positions || [],
                redPositions: data.redPositions || [],
                greenPositions: data.greenPositions || [],
                bluePositions: data.bluePositions || [],
                purplePositions: data.purplePositions || [],
                greenMoonPositions: data.greenMoonPositions || [],
                purpleMoonPositions: data.purpleMoonPositions || [],
              };
              results[cellKey] = validData;
              cache.set(cellKey, validData);

              fileQueue.push(async () => {
                const cellData = await readCellDataFile();
                cellData[cellKey] = validData;
                await writeCellDataFile(cellData);
              });
            } else {
              results[cellKey] = null;
            }
          });
        }
      }
    }

    res.json(results);
  } catch (error) {
    console.error(`Error loading cell data:`, error);
    res.status(500).send('Internal Server Error');
  }
});

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

app.delete('/delete-all-cells', async (req, res) => {
  try {
    const cellsCollection = db.collection('cells');
    await deleteDocumentsInBatches(cellsCollection);

    cache.flushAll();

    await writeCellDataFile({});

    res.send('All cell data deleted successfully');
  } catch (error) {
    console.error('Error deleting all cell data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});
