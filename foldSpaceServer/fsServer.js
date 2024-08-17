const express = require('express');
const cors = require('cors'); // Include CORS package
const app = express();
app.use(express.json());
app.use(cors()); // Use CORS with default options

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.post('/save-sphere-data', async (req, res) => {
  const { cellKey, positions } = req.body;
  const docRef = db.collection('cells').doc(cellKey);
  await docRef.set({ positions });
  res.send('Sphere data saved successfully');
});

app.get('/get-sphere-data/:cellKey', async (req, res) => {
  const { cellKey } = req.params;
  const docRef = db.collection('cells').doc(cellKey);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).send('No sphere data found');
  } else {
    res.send(doc.data());
  }
});
