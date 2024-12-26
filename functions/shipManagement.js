const functions = require('firebase-functions');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const cors = require('cors');

const SHIP_BUILD_TIME = 60; // 1 minute build time

const addShipToQueue = async (req, res) => {
  const { userId, planetId, cellId, shipType } = req.body;

  if (!userId || !planetId || !cellId || !shipType) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
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
};

const processShipConstructionQueue = async (context) => {
  console.log('Processing ship construction queue...');

  try {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();

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
};

module.exports = {
  addShipToQueue,
  processShipConstructionQueue: functions.pubsub
    .schedule('every 1 minutes')
    .onRun(processShipConstructionQueue),
};
