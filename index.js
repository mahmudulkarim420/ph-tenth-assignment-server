const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');


app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGO_URI is not defined in environment variables.');
}

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




    app.post('/books', async (req, res) => {
      const { title, author, genre, rating, summary, coverImage, userId } = req.body;


      if (!title || !author || !userId) {
        return res.status(400).send({ message: 'Title, Author and userId required' });
      }

      try {

        const numericRating = Number(rating);

        const newBook = {
          title,
          author,
          genre,
          rating: numericRating,
          summary,
          coverImage,
          userId,
          createdAt: new Date(),
        };

        const result = await booksCollection.insertOne(newBook);
        res.status(201).send({ message: 'Book added successfully', id: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to add book', error: err.message });
      }
    });


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

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid Book ID format' });
        }
        const book = await booksCollection.findOne({ _id: new ObjectId(id) });
        if (!book) return res.status(404).send({ message: 'Book not found' });
        res.send(book);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Server error' });
      }
    });


    app.get('/my-books/:userId', async (req, res) => {
      const { userId } = req.params;
      try {
        const books = await booksCollection.find({ userId }).toArray();
        res.send(books);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch user books' });
      }
    });


    app.put('/books/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      try {
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid Book ID format' });
        }
        const result = await booksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Book not found for update' });
        }
        res.send({ message: 'Book updated', modifiedCount: result.modifiedCount });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to update book' });
      }
    });


    app.delete('/books/:id', async (req, res) => {
      const id = req.params.id;
      try {
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid Book ID format' });
        }
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


    app.post('/comments', async (req, res) => {
      const { bookId, userName, photoURL, comment } = req.body;
      if (!bookId || !comment) {
        return res.status(400).send({ message: 'Book ID and comment required' });
      }
      try {
        const result = await commentsCollection.insertOne({
          bookId,
          userName,
          photoURL,
          comment,
          createdAt: new Date(),
        });
        res.status(201).send({ message: 'Comment added', id: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to add comment' });
      }
    });

    console.log("✅ API Routes are ready");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);

    process.exit(1);
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Books Haven API Running ✅');
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});