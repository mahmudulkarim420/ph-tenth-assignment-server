const express = require('express');
const serverless = require('serverless-http'); // Vercel serverless handler
const app = express();
require('dotenv').config();
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const cors = require('cors');

app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = process.env.MONGO_URI;

// ✅ Cached MongoDB client to avoid reconnecting per request
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
  await client.connect();
  const db = client.db("books_haven");
  cachedClient = client;
  cachedDb = db;
  console.log("✅ MongoDB Connected");
  return { client, db };
}

// ✅ Routes

// Test route
app.get('/', (req, res) => {
  res.send('Books Haven API Running ✅');
});

// GET all books
app.get('/books', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const books = await db.collection("Books").find().toArray();
    res.send(books);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// GET single book
app.get('/books/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const { db } = await connectToDatabase();
    const book = await db.collection("Books").findOne({ _id: new ObjectId(id) });
    if (!book) return res.status(404).send({ message: "Book not found" });
    res.send(book);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error" });
  }
});

// POST add book
app.post('/books', async (req, res) => {
  const newBook = req.body;
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection("Books").insertOne(newBook);
    res.send({ message: "Book added successfully", id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to add book" });
  }
});

// PUT update book
app.put('/books/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection("Books").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    res.send({ message: "Book updated successfully", modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to update book" });
  }
});

// DELETE book
app.delete('/books/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const { db } = await connectToDatabase();
    const result = await db.collection("Books").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).send({ message: "Book not found" });
    res.send({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to delete book" });
  }
});

// ❌ Remove app.listen
// app.listen(port, () => console.log(`Server running on port ${port}`));

// ✅ Export serverless handler for Vercel
module.exports.handler = serverless(app);
