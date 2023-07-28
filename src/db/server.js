import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

var url = processenv.VITE_MONGODB_URL;

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err);
  });

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Define your MongoDB Schema and Model using Mongoose
const inventorySchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  count: { type: Number, required: true },
  date: { type: Date, required: true },
});

const Inventory = mongoose.model('Inventory', inventorySchema);

const logEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  entry: String,
});

const LogEntry = mongoose.model('LogEntry', logEntrySchema);

const addToLog = async (entry) => {
  const now = new Date();
  const logEntry = {
    date: now,
    entry: entry,
  };

  try {
    await LogEntry.create(logEntry);
    console.log('Log entry added to the database');
  } catch (err) {
    console.error('Error adding log entry to the database:', err);
  }
};

app.post('/api/add', async (req, res) => {
  const { id, name, count, date } = req.body;
  const myobj = { id: parseInt(id), name, count: parseInt(count), date: new Date(date) };

  try {
    // Check if the material with the same id already exists in the database
    const isExistingId = await Inventory.findOne({ id: parseInt(id) });
    if (isExistingId) {
      // If material with the same id exists, check if the names match
      if (isExistingId.name !== name) {
        // Name mismatch for the same id, throw an error
        console.error('Material with the same id but different name exists');
        return res.status(400).json({ message: 'Material with the same id but different name exists' });
      }
    }

    // Check if the material with the same name already exists in the database
    const isMatchingMaterial = await Inventory.findOne({ name });
    if (isMatchingMaterial) {
      // If material with the same name exists, check if the ids match
      if (isMatchingMaterial.id !== parseInt(id)) {
        // Id mismatch for the same name, throw an error
        console.error('Material with the same name but different id exists');
        return res.status(400).json({ message: 'Material with the same name but different id exists' });
      }
    }

    // If material doesn't exist, insert a new document
    await Inventory.create(myobj);

    console.log('1 document inserted');
    // Create a log entry for the new material
    addToLog(`[${new Date()}] Material ID ${id} (${name}) count added: ${count}.`);
    res.status(200).json({ message: 'Material inserted successfully' });
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ message: 'Error processing request' });
  }
});

app.post('/api/remove', async (req, res) => {
  const { id, name, count, date } = req.body;
  console.log('Received request to remove material with ID:', id, 'and name:', name);

  try {
    // Check if the material with the given id and name exists in the database
    const isMatchingMaterial = await Inventory.findOne({ id: parseInt(id), name });
    console.log('isMatchingMaterial:', isMatchingMaterial);
    if (!isMatchingMaterial) {
      // Material with the given id and name doesn't exist
      console.error('Material with the given id and name not found');
      return res.status(404).json({ message: 'Material not found' });
    }

    const existingCount = isMatchingMaterial.count;
    const addDate = isMatchingMaterial.date;
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
    await Inventory.updateOne({ id: parseInt(id), name }, { $inc: { count: -parseInt(count) } });

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
    const entries = await Inventory.find().sort({ date: -1 }).limit(5);

    // Format the date in the desired format for each entry
    const formattedEntries = entries.map((entry) => ({
      ...entry._doc,
      date: formatDate(entry.date),
    }));

    res.json({ entries: formattedEntries });
  } catch (err) {
    console.error('Error fetching recent entries:', err);
    res.status(500).json({ message: 'Error fetching recent entries' });
  }
});

// Helper function to format the date as "DD/MM/YYYY"
function formatDate(date) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const formattedDate = new Date(date).toLocaleDateString(undefined, options);
  return formattedDate;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});