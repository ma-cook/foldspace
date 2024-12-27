const functions = require('firebase-functions');
const admin = require('firebase-admin');

const BUILDING_CONSTRUCTION_TIME = 60;

const addBuildingToQueue = async (req, res) => {
  const { userId, planetId, cellId, buildingName } = req.body;

  if (!userId || !planetId || !cellId || !buildingName) {
    return res
      .status(400)
      .json({ error: 'Missing parameters in request body' });
  }

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const spheres = userData.spheres;

    if (!spheres) {
      throw new Error('No spheres found for user');
    }

    if (Array.isArray(spheres)) {
      throw new Error('Spheres is an array. Expected an object/map.');
    }

    const sphereKey = Object.keys(spheres).find(
      (key) =>
        spheres[key].instanceId === planetId && spheres[key].cellId === cellId
    );

    if (!sphereKey) {
      throw new Error('Planet not found');
    }

    const newQueueItem = {
      buildingName,
      startTime: admin.firestore.Timestamp.now(),
    };

    await userRef.update({
      [`spheres.${sphereKey}.constructionQueue`]:
        admin.firestore.FieldValue.arrayUnion(newQueueItem),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

const processConstructionQueue = async (context) => {
  console.log('Processing building construction queue...');

  try {
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userRef = userDoc.ref;
      const spheres = userData.spheres || {};

      if (Array.isArray(spheres)) {
        console.error(
          `Spheres for user ${userDoc.id} is an array. Expected an object/map.`
        );
        continue;
      }

      for (const [sphereKey, sphere] of Object.entries(spheres)) {
        const {
          instanceId: planetId,
          cellId,
          constructionQueue = [],
          buildings = {},
        } = sphere;

        if (!planetId || !cellId) continue;
        if (constructionQueue.length === 0) continue;

        const currentTime = admin.firestore.Timestamp.now();
        const completedBuildings = [];
        const remainingQueue = [];

        for (const item of constructionQueue) {
          const elapsedTime = currentTime.seconds - item.startTime.seconds;
          if (elapsedTime >= BUILDING_CONSTRUCTION_TIME) {
            completedBuildings.push(item);
          } else {
            remainingQueue.push(item);
          }
        }

        if (completedBuildings.length > 0) {
          const updatedBuildings = { ...buildings };
          for (const item of completedBuildings) {
            updatedBuildings[item.buildingName] =
              (updatedBuildings[item.buildingName] || 0) + 1;
          }

          const updatedPlanetStats = { ...sphere.planetStats };
          if (
            completedBuildings.some((b) => b.buildingName === 'Housing complex')
          ) {
            updatedPlanetStats.populationCapacity =
              updatedBuildings['Housing complex'] * 1000;
          }

          batch.update(userRef, {
            [`spheres.${sphereKey}.buildings`]: updatedBuildings,
            [`spheres.${sphereKey}.planetStats`]: updatedPlanetStats,
            [`spheres.${sphereKey}.constructionQueue`]: remainingQueue,
          });

          const cellRef = db.collection('cells').doc(cellId);
          const cellDoc = await cellRef.get();

          if (cellDoc.exists) {
            const cellData = cellDoc.data();
            const greenPositions = cellData.positions?.greenPositions || {};
            if (greenPositions[planetId]) {
              greenPositions[planetId] = {
                ...greenPositions[planetId],
                buildings: updatedBuildings,
              };
              batch.update(cellRef, {
                'positions.greenPositions': greenPositions,
              });
            }
          }
        }
      }
    }

    await batch.commit();
    console.log('Building construction queue processing completed');
  } catch (error) {
    console.error('Error processing building construction:', error);
  }
  return null;
};

module.exports = {
  addBuildingToQueue,
  processConstructionQueue: functions.pubsub
    .schedule('every 1 minutes')
    .onRun(processConstructionQueue),
};
