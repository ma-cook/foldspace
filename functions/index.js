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
const { v4: uuidv4 } = require('uuid');

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

const SHIP_SPEED = 75000; // Units per minute
const MOVEMENT_INTERVAL = 1;
const COLONIZE_DURATION = 60;

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Configure CORS to allow requests from any origin
const allowedOrigins = [
  'https://orderofgalaxies.web.app',
  'https://foldspace-6483c.web.app',
  'http://localhost:5173/',
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

// New endpoint to verify ID token and issue custom token
app.post('/verify-token', cors(corsOptions), async (req, res) => {
  const idToken = req.body.token;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const customToken = await admin.auth().createCustomToken(uid);
    res.json({ customToken });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(400).json({ error: 'Invalid ID token' });
  }
});

// New endpoint to assign ownership of a green sphere to a new user
// New endpoint to assign ownership of a green sphere to a new user
app.post('/startingPlanet', cors(corsOptions), async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.error('Missing userId in request body');
    return res.status(400).json({ error: 'Missing userId in request body' });
  }

  try {
    // Fetch user data outside the transaction
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const { civilisationName, homePlanetName, spheres } = userData;

    if (!civilisationName || !homePlanetName) {
      throw new Error('User data is incomplete');
    }

    // Check if the user already has a starting planet
    if (spheres && spheres.length > 0) {
      throw new Error('User already has a starting planet');
    }

    // Fetch all users' spheres to check distance constraints (Outside Transaction)
    const usersSnapshot = await db.collection('users').get();
    const existingSpheres = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.spheres) {
        existingSpheres.push(...data.spheres);
      }
    });

    // Fetch all cells (Outside Transaction)
    const cellsSnapshot = await db.collection('cells').get();
    let closestSphere = null;
    let closestDistanceSq = Infinity;

    // Iterate through cells to find the closest unowned green sphere outside 35,000 units
    for (const doc of cellsSnapshot.docs) {
      const data = doc.data();
      const greenPositions = data.positions.greenPositions || [];

      for (let i = 0; i < greenPositions.length; i++) {
        const position = greenPositions[i];
        if (position.owner) continue;

        // Calculate squared distance from origin
        const distanceSq = position.x ** 2 + position.y ** 2 + position.z ** 2;

        // Check distance constraints with existing spheres
        let isTooClose = false;
        for (const sphere of existingSpheres) {
          const dx = sphere.x - position.x;
          const dy = sphere.y - position.y;
          const dz = sphere.z - position.z;
          const userDistanceSq = dx ** 2 + dy ** 2 + dz ** 2;
          if (userDistanceSq <= 35000 ** 2) {
            isTooClose = true;
            break;
          }
        }

        if (!isTooClose && distanceSq < closestDistanceSq) {
          closestSphere = { cellId: doc.id, position, instanceId: i };
          closestDistanceSq = distanceSq;
        }
      }

      if (closestSphere && closestDistanceSq === 0) break; // Optimal sphere found
    }

    if (!closestSphere) {
      throw new Error('No green spheres available');
    }

    // Now perform the transaction
    await db.runTransaction(async (transaction) => {
      // Re-fetch the user document within the transaction
      const userDocTxn = await transaction.get(userRef);
      const userDataTxn = userDocTxn.data();

      // Double-check if the user already has a starting planet
      const { spheres: spheresTxn } = userDataTxn;
      if (spheresTxn && spheresTxn.length > 0) {
        throw new Error('User already has a starting planet');
      }

      // Get the specific cell document
      const cellRef = db.collection('cells').doc(closestSphere.cellId);
      const cellDoc = await transaction.get(cellRef);

      if (!cellDoc.exists) {
        throw new Error('Selected cell does not exist');
      }

      const cellData = cellDoc.data();
      const greenPositions = cellData.positions.greenPositions || [];

      // Ensure the sphere is still unowned
      const position = greenPositions[closestSphere.instanceId];
      if (position.owner) {
        throw new Error('Selected sphere is no longer available');
      }

      // Assign ownership
      greenPositions[closestSphere.instanceId] = {
        ...position,
        owner: userId,
        civilisationName,
        homePlanetName,
        planetName: homePlanetName,
      };

      // Update the cell with the assigned sphere
      transaction.update(cellRef, {
        'positions.greenPositions': greenPositions,
      });

      // Prepare the new sphere data
      const newSphere = {
        ...position,
        planetName: homePlanetName,
        civilisationName,
        cellId: closestSphere.cellId, // Include cellId
        instanceId: closestSphere.instanceId, // Include instanceId
      };

      // Generate unique ship IDs
      const colonyShipId = uuidv4();
      const scoutShipId = uuidv4();

      // Create initial ships for the user
      const colonyShip = {
        id: colonyShipId,
        type: 'colony ship',
        position: {
          x: position.x + 50,
          y: position.y,
          z: position.z,
        },
        destination: null,
        isColonizing: false,
        ownerId: userId,
      };

      const scoutShip = {
        id: scoutShipId,
        type: 'scout',
        position: {
          x: position.x + 60,
          y: position.y,
          z: position.z,
        },
        destination: null,
        isColonizing: false,
        ownerId: userId,
      };

      // Update the user's document with the ships using unique IDs
      transaction.update(userRef, {
        spheres: admin.firestore.FieldValue.arrayUnion(newSphere),
        [`ships.${colonyShipId}`]: colonyShip,
        [`ships.${scoutShipId}`]: scoutShip,
      });

      console.log(`Assigned sphere ${closestSphere.cellId} to user ${userId}`);
    });

    res.json({ message: 'Ownership assigned successfully' });
  } catch (error) {
    console.error(`Error assigning ownership for userId ${userId}:`, error);

    if (error.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else if (error.message === 'User data is incomplete') {
      res.status(400).json({ error: 'User data is incomplete' });
    } else if (error.message === 'User already has a starting planet') {
      res.status(400).json({ error: 'User already has a starting planet' });
    } else if (error.message === 'Selected sphere is no longer available') {
      res.status(400).json({ error: 'Selected sphere is no longer available' });
    } else if (error.message === 'No green spheres available') {
      res.status(404).json({ error: 'No green spheres available' });
    } else if (error.message === 'Selected cell does not exist') {
      res.status(404).json({ error: 'Selected cell does not exist' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.get('/getUserPlanets', cors(corsOptions), async (req, res) => {
  const { userId } = req.query;
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    const planets = userData.spheres || [];
    res.json({ planets });
  } catch (error) {
    console.error('Error fetching user planets:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

exports.api = functions.https.onRequest(app);

// index.js
// index.js

exports.updateShipPositions = functions.pubsub
  .schedule('every minute')
  .onRun(async (context) => {
    console.log('Scheduled function: updateShipPositions started');

    try {
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();
      const currentTime = admin.firestore.Timestamp.now();

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const ships = userData.ships || {};

        for (const [shipKey, shipInfo] of Object.entries(ships)) {
          const {
            position,
            destination,
            isColonizing,
            colonizeStartTime,
            type,
            ownerId,
          } = shipInfo;

          // Ensure 'position' and 'destination' exist
          if (!position || !destination) {
            console.warn(
              `Ship ${shipKey} for user ${userDoc.id} is missing position or destination.`
            );
            continue;
          }

          // Safely handle 'type' with default value
          const shipType =
            typeof type === 'string' ? type.toLowerCase() : 'scout';

          if (shipType === 'scout' && typeof type !== 'string') {
            // Assign default type if missing
            batch.update(userDoc.ref, {
              [`ships.${shipKey}.type`]: 'scout',
            });
            console.warn(
              `Assigned default type 'scout' to ship ${shipKey} for user ${userDoc.id}.`
            );
          }

          if (destination && !isColonizing) {
            // Calculate direction and distance
            const dir = {
              x: destination.x - position.x,
              y: destination.y - position.y,
              z: destination.z - position.z,
            };
            const distance = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);

            if (distance < 100) {
              // Destination reached
              if (
                shipType === 'colony ship' &&
                destination.instanceId !== undefined
              ) {
                // Start colonization
                batch.update(userDoc.ref, {
                  [`ships.${shipKey}.isColonizing`]: true,
                  [`ships.${shipKey}.colonizeStartTime`]: currentTime,
                });
              } else {
                // Clear destination
                batch.update(userDoc.ref, {
                  [`ships.${shipKey}.destination`]: null,
                });
              }
              continue;
            }

            // Normalize direction
            const normDir = {
              x: dir.x / distance,
              y: dir.y / distance,
              z: dir.z / distance,
            };

            // Calculate movement step
            const moveDist = Math.min(
              (SHIP_SPEED * MOVEMENT_INTERVAL) / 60,
              distance
            );

            // New position
            const newPosition = {
              x: position.x + normDir.x * moveDist,
              y: position.y + normDir.y * moveDist,
              z: position.z + normDir.z * moveDist,
            };

            // Update position
            batch.update(userDoc.ref, {
              [`ships.${shipKey}.position`]: newPosition,
            });

            // Clear destination if reached
            if (moveDist >= distance) {
              if (
                shipType === 'colony ship' &&
                destination.instanceId !== undefined
              ) {
                // Start colonization
                batch.update(userDoc.ref, {
                  [`ships.${shipKey}.isColonizing`]: true,
                  [`ships.${shipKey}.colonizeStartTime`]: currentTime,
                });
              } else {
                batch.update(userDoc.ref, {
                  [`ships.${shipKey}.destination`]: null,
                });
              }
            }
          }

          if (isColonizing) {
            if (
              !colonizeStartTime ||
              typeof colonizeStartTime.seconds !== 'number'
            ) {
              console.warn(
                `Ship ${shipKey} for user ${userDoc.id} is colonizing but missing colonizeStartTime.`
              );
              continue;
            }

            const timeElapsed = currentTime.seconds - colonizeStartTime.seconds;

            if (timeElapsed >= COLONIZE_DURATION) {
              // Complete colonization
              const dest = shipInfo.destination;
              if (!dest || !dest.cellId || dest.instanceId === undefined) {
                console.warn(
                  `Ship ${shipKey} for user ${userDoc.id} has invalid destination for colonization.`
                );
                continue;
              }

              const cellRef = db.collection('cells').doc(dest.cellId);
              const cellDoc = await cellRef.get();

              if (!cellDoc.exists) {
                console.warn(`Cell document ${dest.cellId} does not exist.`);
                continue;
              }

              const cellData = cellDoc.data();
              const greenPositions = cellData.positions.greenPositions || [];

              // Ensure the sphere exists
              if (!greenPositions[dest.instanceId]) {
                console.warn(
                  `No sphere found at instanceId ${dest.instanceId} in cell ${dest.cellId}`
                );
                continue;
              }

              // Assign ownership
              greenPositions[dest.instanceId] = {
                ...greenPositions[dest.instanceId],
                owner: ownerId,
                planetName: dest.instanceId,
                civilisationName:
                  userData.civilisationName || 'Unnamed Civilization',
              };

              // Update the cell with the assigned sphere
              batch.update(cellRef, {
                'positions.greenPositions': greenPositions,
              });

              // Prepare the new sphere data
              const newSphere = {
                x: greenPositions[dest.instanceId].x,
                y: greenPositions[dest.instanceId].y,
                z: greenPositions[dest.instanceId].z,
                planetName: dest.instanceId,
                civilisationName:
                  userData.civilisationName || 'Unnamed Civilization',
                cellId: dest.cellId,
                instanceId: dest.instanceId,
              };

              // Update user's ships and spheres
              batch.update(userDoc.ref, {
                spheres: admin.firestore.FieldValue.arrayUnion(newSphere),
                [`ships.${shipKey}.isColonizing`]: false,
                [`ships.${shipKey}.colonizeStartTime`]: null,
                [`ships.${shipKey}.destination`]: null,
              });
            }
          }
        }
      }

      await batch.commit();
      console.log(
        'Scheduled function: updateShipPositions completed successfully'
      );
    } catch (error) {
      console.error('Error in updateShipPositions:', error);
    }

    return null;
  });
