const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
// NOTE: Make sure your MONGO_URI is correctly set in your .env file
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
        // ✨ THE CRITICAL FIX: Ensure the MongoDB client connects before defining routes.
        await client.connect(); 
        console.log("✅ MongoDB Connected");

        const db = client.db("books_haven");
        const booksCollection = db.collection("Books");
        const commentsCollection = db.collection("Comments");

        // ---------------- BOOKS ROUTES ----------------
        
        // POST add new book (FIXED: This route is correct for the frontend's POST request)
        app.post('/books', async (req, res) => {
            const { title, author, genre, rating, summary, coverImage, userId } = req.body;
            
            // Basic validation
            if (!title || !author || !userId) {
                return res.status(400).send({ message: 'Title, Author and userId required' });
            }

            try {
                // Ensure rating is stored as a number
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
                res.status(201).send({ message: 'Book added successfully', id: result.insertedId }); // 201 Created status
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: 'Failed to add book', error: err.message });
            }
        });
        
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
                // Validate ObjectId format
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

        // GET books by userId (My Books)
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

        // PUT update book
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

        // DELETE book
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

        // ---------------- COMMENTS ROUTES ----------------

        // GET all comments
        app.get('/comments', async (req, res) => {
            try {
                const comments = await commentsCollection.find().toArray();
                res.send(comments);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: 'Failed to fetch comments' });
            }
        });

        // GET comments by bookId
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

        // POST add a comment
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
        // Exit process if connection fails to prevent server from running without db
        process.exit(1); 
    }
}
run().catch(console.dir);

// Root endpoint (Health Check)
app.get('/', (req, res) => {
    res.send('Books Haven API Running ✅');
});

app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});