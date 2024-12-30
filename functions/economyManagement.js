const functions = require('firebase-functions');
const admin = require('firebase-admin');

const processEconomy = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();
    const batch = db.batch();

    try {
      const usersSnapshot = await db.collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const spheres = userData.spheres || {};
        let totalPopulation = 0;
        let totalMines = 0;

        // Calculate totals from all planets
        Object.values(spheres).forEach((sphere) => {
          if (
            sphere.planetStats &&
            typeof sphere.planetStats.population === 'number'
          ) {
            totalPopulation += sphere.planetStats.population;
          }

          // Count mines from buildings
          if (sphere.buildings && typeof sphere.buildings.Mine === 'number') {
            totalMines += sphere.buildings.Mine;
          }
        });

        // Calculate resource increases
        const creditIncrease = totalPopulation * 0.1;
        const mineralIncrease = totalMines * 10; // 10 minerals per mine per minute
        const crystalIncrease = totalMines * 5; // 5 crystals per mine per minute

        // Update user's economy
        batch.update(userDoc.ref, {
          'economy.credits':
            admin.firestore.FieldValue.increment(creditIncrease),
          'economy.minerals':
            admin.firestore.FieldValue.increment(mineralIncrease),
          'economy.crystals':
            admin.firestore.FieldValue.increment(crystalIncrease),
        });

        console.log(`User ${userDoc.id} update:`, {
          totalPopulation,
          totalMines,
          creditIncrease,
          mineralIncrease,
          crystalIncrease,
        });
      }

      await batch.commit();
      console.log('Economy processing completed successfully');
    } catch (error) {
      console.error('Error processing economy:', error);
    }

    return null;
  });

module.exports = { processEconomy };
