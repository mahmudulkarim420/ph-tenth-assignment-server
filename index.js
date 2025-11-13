const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
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

    // ========== Books ==========
    app.get('/books', async (req, res) => {
      try {
        const books = await booksCollection.find().toArray();
        res.send(books);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch books' });
      }
    });

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

        app.post('/comments', async (req, res) => {
      const { bookId, userName, photoURL, comment } = req.body;
      if (!bookId || !comment) return res.status(400).send({ message: 'Book ID and comment required' });

      try {
        const result = await commentsCollection.insertOne({
          bookId,
          userName,
          photoURL,
          comment,
          createdAt: new Date(),
        });
        res.send({ message: 'Comment added', id: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to add comment' });
      }
    });


    // ========== Comments ==========
    app.get('/comments/:bookId', async (req, res) => {
      const { bookId } = req.params;
      try {
        const comments = await commentsCollection
          .find({ bookId })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(comments);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch comments' });
      }
    });


    console.log("✅ API Routes ready");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => res.send('Books Haven API Running ✅'));

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
