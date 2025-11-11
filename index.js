const express = require('express')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')

app.use(cors())
app.use(express.json())

const port = process.env.PORT || 3000
const uri = process.env.MONGO_URI

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

    // ✅ GET all books
    app.get('/books', async (req, res) => {
      const books = await booksCollection.find().toArray();
      res.send(books);
    });

    // ✅ POST Add a new book
    app.post('/books', async (req, res) => {
      const newBook = req.body;
      const result = await booksCollection.insertOne(newBook);
      res.send(result);
    });

    // ✅ PUT Update book
    app.put('/books/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );

      res.send(result);
    });

    // ✅ DELETE book
    app.delete('/books/:id', async (req, res) => {
      const id = req.params.id;

      const result = await booksCollection.deleteOne({
        _id: new ObjectId(id)
      });

      res.send(result);
    });

  } catch (err) {
    console.error(err);
  }
}
run().catch(console.dir);

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('Books Haven API Running ✅')
})

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`)
})
