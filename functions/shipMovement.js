const functions = require('firebase-functions');
const admin = require('firebase-admin');

const SHIP_SPEED = 75000; // Units per minute
const MOVEMENT_INTERVAL = 1;
const COLONIZE_DURATION = 60;

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
  shipConstructionQueue: [],
};

const updateShipPositions = async (context) => {
  console.log('Scheduled function: updateShipPositions started');

  try {
    const db = admin.firestore();
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

        if (!position || !destination) {
          console.warn(
            `Ship ${shipKey} for user ${userDoc.id} missing position or destination.`
          );
          continue;
        }

        const shipType =
          typeof type === 'string' ? type.toLowerCase() : 'scout';

        if (shipType === 'scout' && typeof type !== 'string') {
          batch.update(userDoc.ref, {
            [`ships.${shipKey}.type`]: 'scout',
          });
        }

        if (destination && !isColonizing) {
          const dir = {
            x: destination.x - position.x,
            y: destination.y - position.y,
            z: destination.z - position.z,
          };
          const distance = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);

          if (distance < 100) {
            if (shipType === 'colony ship') {
              batch.update(userDoc.ref, {
                [`ships.${shipKey}.isColonizing`]: true,
                [`ships.${shipKey}.colonizeStartTime`]: currentTime,
              });
            } else {
              batch.update(userDoc.ref, {
                [`ships.${shipKey}.destination`]: null,
              });
            }
            continue;
          }

          const normDir = {
            x: dir.x / distance,
            y: dir.y / distance,
            z: dir.z / distance,
          };

          const moveDist = Math.min(
            (SHIP_SPEED * MOVEMENT_INTERVAL) / 60,
            distance
          );

          const newPosition = {
            x: position.x + normDir.x * moveDist,
            y: position.y + normDir.y * moveDist,
            z: position.z + normDir.z * moveDist,
          };

          batch.update(userDoc.ref, {
            [`ships.${shipKey}.position`]: newPosition,
          });

          if (moveDist >= distance) {
            if (shipType === 'colony ship') {
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
            continue;
          }

          const timeElapsed = currentTime.seconds - colonizeStartTime.seconds;

          if (timeElapsed >= COLONIZE_DURATION) {
            const dest = shipInfo.destination;
            if (!dest || !dest.cellId) continue;

            const cellRef = db.collection('cells').doc(dest.cellId);
            const cellDoc = await cellRef.get();

            if (!cellDoc.exists) continue;

            const cellData = cellDoc.data();
            const greenPositions = cellData.positions.greenPositions || [];

            const sphereIndex = greenPositions.findIndex((sphere) => {
              const dx = sphere.x - dest.x;
              const dy = sphere.y - dest.y;
              const dz = sphere.z - dest.z;
              const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
              return distance <= 100;
            });

            if (sphereIndex === -1) continue;

            greenPositions[sphereIndex] = {
              ...greenPositions[sphereIndex],
              owner: ownerId,
              planetName: sphereIndex,
              civilisationName:
                userData.civilisationName || 'Unnamed Civilization',
              ...COLONY_METADATA,
            };

            batch.update(cellRef, {
              'positions.greenPositions': greenPositions,
            });

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
};

module.exports = {
  updateShipPositions: functions.pubsub
    .schedule('every minute')
    .onRun(updateShipPositions),
};
