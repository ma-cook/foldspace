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

        // Sum up population from all planets
        Object.values(spheres).forEach((sphere) => {
          if (
            sphere.planetStats &&
            typeof sphere.planetStats.population === 'number'
          ) {
            totalPopulation += sphere.planetStats.population;
          }
        });

        // Calculate credit increase (0.1 credits per population per minute)
        const creditIncrease = totalPopulation * 0.1;

        // Get current economy or create default
        const currentEconomy = userData.economy || {
          credits: 0,
          crystals: 0,
          gases: 0,
          minerals: 0,
        };

        // Update credits
        batch.update(userDoc.ref, {
          'economy.credits':
            admin.firestore.FieldValue.increment(creditIncrease),
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
