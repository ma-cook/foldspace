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

const COLONY_METADATA = {
  buildings: {
    'Housing complex': 1,
    'Power plant': 1,
    Mine: 0,
    Laboratory: 0,
    'Constr. facility': 1,
    Shipyard: 0,
    'Space shipyard': 0,
    'Ground defense': 0,
    'Planetary shield': 0,
    'Space defense': 0,
  },
  constructionQueue: [],
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

const BUILDING_CONSTRUCTION_TIME = 60;

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

    // Check if user already has spheres
    if (spheres && Object.keys(spheres).length > 0) {
      throw new Error('User already has a starting planet');
    }

    // Fetch all users' spheres
    const usersSnapshot = await db.collection('users').get();
    const existingSpheres = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.spheres) {
        // Handle both array and map structures
        if (Array.isArray(data.spheres)) {
          existingSpheres.push(...data.spheres);
        } else {
          existingSpheres.push(...Object.values(data.spheres));
        }
      }
    });

    console.log('Existing spheres:', existingSpheres.length);

    // Fetch cells
    const cellsSnapshot = await db.collection('cells').get();
    let closestSphere = null;
    let closestDistanceSq = Infinity;

    for (const doc of cellsSnapshot.docs) {
      const data = doc.data();
      const greenPositions = data.positions?.greenPositions || {};

      // Handle positions as object/map
      for (const [index, position] of Object.entries(greenPositions)) {
        if (position.owner) continue;

        const distanceSq = position.x ** 2 + position.y ** 2 + position.z ** 2;

        // Check minimum distance from other spheres
        let isTooClose = false;
        for (const sphere of existingSpheres) {
          if (!sphere.x || !sphere.y || !sphere.z) continue;

          const dx = sphere.x - position.x;
          const dy = sphere.y - position.y;
          const dz = sphere.z - position.z;
          const userDistanceSq = dx ** 2 + dy ** 2 + dz ** 2;

          if (userDistanceSq <= 80000 ** 2) {
            console.log('Sphere too close:', {
              distance: Math.sqrt(userDistanceSq),
              position,
              existingSphere: sphere,
            });
            isTooClose = true;
            break;
          }
        }

        if (!isTooClose && distanceSq < closestDistanceSq) {
          closestSphere = {
            cellId: doc.id,
            position,
            instanceId: parseInt(index),
          };
          closestDistanceSq = distanceSq;
          console.log('Found potential sphere:', {
            distance: Math.sqrt(distanceSq),
            position,
          });
        }
      }
    }

    if (!closestSphere) {
      throw new Error('No available green spheres found');
    }

    // Define the buildings metadata
    const buildingsMetadata = {
      buildings: {
        'Housing complex': 10,
        'Power plant': 5,
        Mine: 5,
        Laboratory: 1,
        'Constr. facility': 1,
        Shipyard: 1,
        'Space shipyard': 0,
        'Ground defense': 0,
        'Planetary shield': 0,
        'Space defense': 0,
      },
      constructionQueue: [],
      shipConstructionQueue: [],
    };

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

      // Assign ownership and add buildings metadata
      greenPositions[closestSphere.instanceId] = {
        ...position,
        owner: userId,
        civilisationName,
        homePlanetName,
        planetName: homePlanetName,
        ...buildingsMetadata, // Add buildings metadata
      };

      // Update the cell with the assigned sphere
      transaction.update(cellRef, {
        'positions.greenPositions': greenPositions,
      });

      const sphereKey = `sphere_${closestSphere.instanceId}_${Date.now()}`;

      // Prepare the new sphere data
      const newSphere = {
        ...position,
        planetName: homePlanetName,
        civilisationName,
        cellId: closestSphere.cellId, // Include cellId
        instanceId: closestSphere.instanceId, // Include instanceId
        ...buildingsMetadata, // Add buildings metadata
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

      // Update the user's document with the ships and the new sphere using unique IDs
      transaction.update(userRef, {
        [`spheres.${sphereKey}`]: newSphere,
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
              if (shipType === 'colony ship') {
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
              if (shipType === 'colony ship') {
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
              if (!dest || !dest.cellId) {
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

              // Find sphere within 100 units...
              const sphereIndex = greenPositions.findIndex((sphere) => {
                const dx = sphere.x - dest.x;
                const dy = sphere.y - dest.y;
                const dz = sphere.z - dest.z;
                const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
                return distance <= 100;
              });

              if (sphereIndex === -1) {
                console.warn(
                  `No sphere found within 100 units of destination coordinates (${dest.x}, ${dest.y}, ${dest.z}) in cell ${dest.cellId}`
                );
                continue;
              }

              // Assign ownership
              greenPositions[sphereIndex] = {
                ...greenPositions[sphereIndex],
                owner: ownerId,
                planetName: sphereIndex,
                civilisationName:
                  userData.civilisationName || 'Unnamed Civilization',
                ...COLONY_METADATA,
              };

              // Update the cell with the assigned sphere
              batch.update(cellRef, {
                'positions.greenPositions': greenPositions,
              });

              // Prepare the new sphere data
              const newSphere = {
                x: greenPositions[sphereIndex].x,
                y: greenPositions[sphereIndex].y,
                z: greenPositions[sphereIndex].z,
                planetName: sphereIndex,
                civilisationName:
                  userData.civilisationName || 'Unnamed Civilization',
                cellId: dest.cellId,
                instanceId: sphereIndex,
                ...COLONY_METADATA,
              };
              const newSphereKey = `sphere_${
                dest.cellId
              }_${sphereIndex}_${Date.now()}`;
              // Update user's ships and spheres
              batch.update(userDoc.ref, {
                [`spheres.${newSphereKey}`]: newSphere,
                [`ships.${shipKey}`]: admin.firestore.FieldValue.delete(),
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

// index.js

// index.js

app.post('/addBuildingToQueue', cors(corsOptions), async (req, res) => {
  const { userId, planetId, cellId, buildingName } = req.body;

  if (!userId || !planetId || !cellId || !buildingName) {
    return res
      .status(400)
      .json({ error: 'Missing parameters in request body' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const spheres = userData.spheres;

    if (!spheres) {
      throw new Error('No spheres found for user');
    }

    // Ensure spheres is a map, not an array
    if (Array.isArray(spheres)) {
      throw new Error('Spheres is an array. Expected an object/map.');
    }

    // Find sphere
    const sphereKey = Object.keys(spheres).find(
      (key) =>
        spheres[key].instanceId === planetId && spheres[key].cellId === cellId
    );

    if (!sphereKey) {
      throw new Error('Planet not found');
    }

    // Create new queue item
    const newQueueItem = {
      buildingName,
      startTime: admin.firestore.Timestamp.now(),
    };

    // Use arrayUnion to add the new item
    await userRef.update({
      [`spheres.${sphereKey}.constructionQueue`]:
        admin.firestore.FieldValue.arrayUnion(newQueueItem),
    });

    console.log('Added to queue:', {
      sphereKey,
      buildingName,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

exports.processConstructionQueue = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Scheduled function: processConstructionQueue started');

    try {
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userRef = userDoc.ref;
        const spheres = userData.spheres || {};

        // Check if spheres is a map
        if (Array.isArray(spheres)) {
          console.error(
            `Spheres for user ${userDoc.id} is an array. Expected an object/map.`
          );
          continue; // Skip this user or handle conversion
        }

        // Process each sphere in the map
        for (const [sphereKey, sphere] of Object.entries(spheres)) {
          const {
            instanceId: planetId,
            cellId,
            constructionQueue = [],
            buildings = {},
          } = sphere;

          if (!planetId || !cellId) {
            console.error(
              `Missing planetId or cellId for sphere ${sphereKey} of user ${userDoc.id}`
            );
            continue;
          }

          if (constructionQueue.length === 0) continue;

          const currentTime = admin.firestore.Timestamp.now();
          const completedBuildings = [];
          const remainingQueue = [];

          for (const item of constructionQueue) {
            const { buildingName, startTime } = item;
            const elapsedTime = currentTime.seconds - startTime.seconds;

            if (elapsedTime >= BUILDING_CONSTRUCTION_TIME) {
              completedBuildings.push(item);
            } else {
              remainingQueue.push(item);
            }
          }

          if (completedBuildings.length > 0) {
            // Update building counts
            const updatedBuildings = { ...buildings };
            for (const item of completedBuildings) {
              const { buildingName } = item;
              updatedBuildings[buildingName] =
                (updatedBuildings[buildingName] || 0) + 1;
            }

            // Update user's sphere data without overwriting other metadata
            batch.update(userRef, {
              [`spheres.${sphereKey}.buildings`]: updatedBuildings,
              [`spheres.${sphereKey}.constructionQueue`]: remainingQueue,
            });

            // Update cell data
            const cellRef = db.collection('cells').doc(cellId);
            const cellDoc = await cellRef.get();

            if (cellDoc.exists) {
              const cellData = cellDoc.data();
              const greenPositions = cellData.positions?.greenPositions || {};
              const cellSphere = greenPositions[planetId];

              if (cellSphere) {
                // Get existing sphere data
                const existingSphere = cellSphere;

                // Create updated buildings data
                const updatedBuildings = {
                  ...existingSphere.buildings,
                  ...completedBuildings.reduce((acc, item) => {
                    const count =
                      (existingSphere.buildings?.[item.buildingName] || 0) + 1;
                    return { ...acc, [item.buildingName]: count };
                  }, {}),
                };

                // Update only buildings field in greenPositions map
                greenPositions[planetId] = {
                  ...greenPositions[planetId],
                  buildings: updatedBuildings,
                };

                // Write back complete greenPositions map
                batch.update(cellRef, {
                  'positions.greenPositions': greenPositions,
                });

                console.log('Updated cell data:', {
                  planetId,
                  updatedBuildings,
                  fullGreenPositions: greenPositions,
                });
              }
            }

            console.log(
              `Buildings constructed on planet ${planetId} for user ${userDoc.id}:`,
              completedBuildings.map((b) => b.buildingName).join(', ')
            );
          }
        }
      }

      await batch.commit();
      console.log('Scheduled function: processConstructionQueue completed');
    } catch (error) {
      console.error('Error in processConstructionQueue:', error);
    }

    return null;
  });

app.post('/addShipToQueue', cors(corsOptions), async (req, res) => {
  const { userId, planetId, cellId, shipType } = req.body;

  if (!userId || !planetId || !cellId || !shipType) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const spheres = userData.spheres;

    if (!spheres || Array.isArray(spheres)) {
      throw new Error('Invalid spheres data');
    }

    const sphereKey = Object.keys(spheres).find(
      (key) =>
        spheres[key].instanceId === planetId && spheres[key].cellId === cellId
    );

    if (!sphereKey) {
      throw new Error('Planet not found');
    }

    const newQueueItem = {
      shipType,
      startTime: admin.firestore.Timestamp.now(),
    };

    await userRef.update({
      [`spheres.${sphereKey}.shipConstructionQueue`]:
        admin.firestore.FieldValue.arrayUnion(newQueueItem),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add ship construction processing function
exports.processShipConstructionQueue = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('Processing ship construction queue...');

    try {
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();
      const SHIP_BUILD_TIME = 60; // 1 minute build time

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const spheres = userData.spheres || {};

        if (Array.isArray(spheres)) continue;

        for (const [sphereKey, sphere] of Object.entries(spheres)) {
          const shipQueue = sphere.shipConstructionQueue || [];
          if (shipQueue.length === 0) continue;

          const currentTime = admin.firestore.Timestamp.now();
          const completedShips = [];
          const remainingQueue = [];

          for (const item of shipQueue) {
            const elapsedTime = currentTime.seconds - item.startTime.seconds;

            if (elapsedTime >= SHIP_BUILD_TIME) {
              completedShips.push(item);
            } else {
              remainingQueue.push(item);
            }
          }

          if (completedShips.length > 0) {
            // Add completed ships to user's ships collection
            for (const ship of completedShips) {
              const shipId = uuidv4();
              const newShip = {
                id: shipId,
                type: ship.shipType,
                position: {
                  x: sphere.x,
                  y: sphere.y,
                  z: sphere.z,
                },
                destination: null,
                isColonizing: false,
                ownerId: userDoc.id,
              };

              batch.update(userDoc.ref, {
                [`ships.${shipId}`]: newShip,
              });
            }

            // Update construction queue
            batch.update(userDoc.ref, {
              [`spheres.${sphereKey}.shipConstructionQueue`]: remainingQueue,
            });

            console.log(
              `Ships built for user ${userDoc.id}:`,
              completedShips.map((s) => s.shipType).join(', ')
            );
          }
        }
      }

      await batch.commit();
      console.log('Ship construction queue processing completed');
    } catch (error) {
      console.error('Error processing ship construction:', error);
    }

    return null;
  });
