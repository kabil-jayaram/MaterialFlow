import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import fs from 'fs'; // Import the fs module to handle file operations

const app = express();
const port = process.env.PORT || 5000;

const url = 'mongodb://127.0.0.1:27017/';
const dbName = 'materialflow';

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173'
}));

let db;
MongoClient.connect(url)
  .then((client) => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Function to add a log entry to the log file
const addToLog = (entry) => {
  fs.appendFile('material_log.txt', entry + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

app.post('/api/add', async (req, res) => {
  const { id, name, count, date } = req.body;
  const myobj = { id: parseInt(id), name, count: parseInt(count), date };

  try {
    // Check if the material with the same id already exists in the database
    const existingMaterial = await db.collection('inventory').findOne({ id: parseInt(id) });

    if (existingMaterial) {
      // If material exists, update the count by adding the new count to the existing count
      await db.collection('inventory').updateOne({ id: parseInt(id) }, { $inc: { count: +parseInt(count) } });

      console.log('1 document updated');
      // Create a log entry for the update
      addToLog(`[${new Date()}] Material ID ${id} (${name}) count updated by ${count}.`);
      res.status(200).json({ message: 'Material updated successfully' });
    } else {
      // If material doesn't exist, insert a new document
      await db.collection('inventory').insertOne(myobj);

      console.log('1 document inserted');
      // Create a log entry for the new material
      addToLog(`[${new Date()}] Material ID ${id} (${name}) count added: ${count}.`);
      res.status(200).json({ message: 'Material inserted successfully' });
    }
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: 'Error processing request' });
  }
});

app.post('/api/remove', async (req, res) => {
  const { id, count, date } = req.body;

  try {
    // Fetch the existing material
    const existingMaterial = await db.collection('inventory').findOne({ id: parseInt(id) });

    if (!existingMaterial) {
      // Material with the given id doesn't exist
      console.error('Material with the given id not found');
      return res.status(404).json({ message: 'Material not found' });
    }

    const name = existingMaterial.name;
    const existingCount = existingMaterial.count;
    const addDate = new Date(existingMaterial.date);
    const removeDate = new Date(date);

    if (existingCount < parseInt(count)) {
      // If existing count is less than the requested count, show a toast message
      console.error('Existing count is less than the requested count');
      return res.status(400).json({ message: 'Existing count is less than the requested count' });
    }

    if (existingCount === 0) {
      // If existing count is zero, show a toast message
      console.error('Existing count is zero');
      return res.status(400).json({ message: 'Existing count is zero' });
    }

    if (removeDate < addDate) {
      // If remove date is before add date, show a toast message
      console.error('Remove date is before add date');
      return res.status(400).json({ message: 'Remove date is before add date' });
    }

    // Update the count for the material by subtracting the provided count
    await db.collection('inventory').updateOne({ id: parseInt(id) }, { $inc: { count: -parseInt(count) } });

    console.log('1 document updated');
    // Create a log entry for the removal
    addToLog(`[${new Date()}] Material ID ${id} (${name}) count removed: ${count}.`);
    res.status(200).json({ message: 'Material updated successfully' });
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: 'Error processing request' });
  }
});

app.get('/api/getRecentEntries', async (req, res) => {
  try {
    const entries = await db.collection('inventory').find().sort({ date: -1 }).limit(5).toArray();
    // Assuming your inventory collection has a 'date' field to sort the entries based on the most recent date.
    res.json({ entries });
  } catch (err) {
    console.error('Error fetching recent entries:', err);
    res.status(500).json({ message: 'Error fetching recent entries' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
