const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected");

    const db = client.db("books_haven");
    const booksCollection = db.collection("Books");
    const commentsCollection = db.collection("Comments");

    // ---------------- BOOKS ROUTES ----------------
    // GET all books
    app.get('/books', async (req, res) => {
      try {
        const books = await booksCollection.find().toArray();
        res.send(books);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch books' });
      }
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

    // POST add new book
    app.post('/books', async (req, res) => {
      const newBook = req.body;
      if (!newBook.title || !newBook.author) {
        return res.status(400).send({ message: 'Title and Author required' });
      }
      try {
        const result = await booksCollection.insertOne(newBook);
        res.send({ message: 'Book added', id: result.insertedId });
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
        res.send({ message: 'Book updated', modifiedCount: result.modifiedCount });
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
        res.send({ message: 'Book deleted' });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to delete book' });
      }
    });

    app.get('/comments', async (req, res) => {
      try {
        const comments = await commentsCollection.find().toArray();
        res.send(comments);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch comments' });
      }
    });


    // ---------------- COMMENTS ROUTES ----------------
    // GET comments by bookId
    app.get('/comments/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const comment = await booksCollection.findOne({ _id: new ObjectId(id) });
        if (!comment) return res.status(404).send({ message: 'Book not found' });
        res.send(comment);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // POST add a comment
    
    console.log("✅ API Routes are ready");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}
run().catch(console.dir);

// Root
app.get('/', (req, res) => {
  res.send('Books Haven API Running ✅');
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
