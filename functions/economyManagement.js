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
        const research = userData.research || {};
        const populationGrowthLevel = research.populationGrowth || 1;
        let totalPopulation = 0;
        let totalMines = 0;

        // Calculate population growth rate
        const populationGrowthRate = 0.01 * populationGrowthLevel;

        // Process each sphere
        for (const [sphereKey, sphere] of Object.entries(spheres)) {
          if (
            sphere.planetStats &&
            typeof sphere.planetStats.population === 'number'
          ) {
            // Calculate new population with growth
            const currentPopulation = sphere.planetStats.population;
            const populationCapacity =
              sphere.planetStats.populationCapacity || 0;
            const populationIncrease = Math.min(
              currentPopulation * populationGrowthRate,
              populationCapacity - currentPopulation
            );

            if (populationIncrease > 0) {
              batch.update(userDoc.ref, {
                [`spheres.${sphereKey}.planetStats.population`]:
                  admin.firestore.FieldValue.increment(populationIncrease),
              });
            }

            totalPopulation += currentPopulation;
          }

          // Count mines from buildings
          if (sphere.buildings && typeof sphere.buildings.Mine === 'number') {
            totalMines += sphere.buildings.Mine;
          }
        }

        // Calculate resource increases
        const creditIncrease = totalPopulation * 0.1;
        const mineralIncrease = totalMines * 10;
        const crystalIncrease = totalMines * 5;
        const gasIncrease = totalMines * 2;

        // Update user's economy
        batch.update(userDoc.ref, {
          'economy.credits':
            admin.firestore.FieldValue.increment(creditIncrease),
          'economy.minerals':
            admin.firestore.FieldValue.increment(mineralIncrease),
          'economy.crystals':
            admin.firestore.FieldValue.increment(crystalIncrease),
          'economy.gases': admin.firestore.FieldValue.increment(gasIncrease),
        });

        console.log(`User ${userDoc.id} update:`, {
          totalPopulation,
          totalMines,
          populationGrowthLevel,
          creditIncrease,
          mineralIncrease,
          crystalIncrease,
          gasIncrease,
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
