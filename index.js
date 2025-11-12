const express = require('express');
const serverless = require('serverless-http'); // add this
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected");

    const booksCollection = client.db("books_haven").collection("Books");

    // GET all books
    app.get('/books', async (req, res) => {
      const books = await booksCollection.find().toArray();
      res.send(books);
    });

    // GET single book
    app.get('/books/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const book = await booksCollection.findOne({ _id: new ObjectId(id) });
        if (!book) return res.status(404).send({ message: 'Book not found' });
        res.send(book);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // POST add book
    app.post('/books', async (req, res) => {
      const newBook = req.body;
      try {
        const result = await booksCollection.insertOne(newBook);
        res.send({ message: 'Book added successfully', id: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to add book' });
      }
    });

    // PUT update book
    app.put('/books/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      try {
        const result = await booksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send({ message: 'Book updated successfully', modifiedCount: result.modifiedCount });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to update book' });
      }
    });

    // DELETE book
    app.delete('/books/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).send({ message: 'Book not found' });
        res.send({ message: 'Book deleted successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to delete book' });
      }
    });

  } catch (err) {
    console.error(err);
  }
}
run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
  res.send('Books Haven API Running ✅')
})

// ❌ Remove app.listen
// app.listen(port, () => console.log(`Server running on port ${port}`))

// ✅ Export serverless handler for Vercel
module.exports.handler = serverless(app);
