const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const NodeCache = require('node-cache');
const async = require('async');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const cache = new NodeCache({ stdTTL: 600 });

const dataFilePath = path.join(os.tmpdir(), 'cells.json');

const readCellDataFile = async () => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const writeCellDataFile = async (data) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {}
};

const fileQueue = async.queue(async (task, callback) => {
  try {
    await task();
  } catch (error) {
  } finally {
    if (callback) callback();
  }
}, 1);

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Configure CORS to allow requests from any origin
const allowedOrigins = [
  'https://orderofgalaxies.web.app',
  'https://foldspace-6483c.web.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  optionsSuccessStatus: 204,
};

const deleteDocumentsInBatches = async (collectionRef) => {
  const snapshot = await collectionRef.get();
  const batchSize = 5; // Firestore limits batch size to 500
  let batch = db.batch(); // Use let instead of const

  for (let i = 0; i < snapshot.docs.length; i++) {
    batch.delete(snapshot.docs[i].ref);
    if ((i + 1) % batchSize === 0) {
      await batch.commit();
      batch = db.batch(); // Reassign batch
    }
  }

  if (snapshot.docs.length % batchSize !== 0) {
    await batch.commit();
  }
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests
app.options('*', cors(corsOptions));

app.post('/save-sphere-data', cors(corsOptions), async (req, res) => {
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

app.post('/get-sphere-data', cors(corsOptions), async (req, res) => {
  const { cellKeys } = req.body;
  const results = {};
  const missingKeys = [];

  try {
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

      missingKeys.forEach((cellKey) => {
        if (cellData[cellKey]) {
          cache.set(cellKey, cellData[cellKey]);
          results[cellKey] = cellData[cellKey];
        } else {
          missingKeys.push(cellKey);
        }
      });

      if (missingKeys.length > 0) {
        const batchSize = 100;
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

app.delete('/delete-all-cells', cors(corsOptions), async (req, res) => {
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

exports.api = functions.https.onRequest(app);
