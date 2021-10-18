require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// Create new token to log data in HTTP POST request
morgan.token('body', (request) => JSON.stringify(request.body));

// Use Morgan middleware to log messages to console
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

// Use Cors middleware to allow requests from all origins
app.use(cors());

// Use Express middleware to parse incoming requests with JSON payloads
app.use(express.json());

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
});

const Blog = mongoose.model('Blog', blogSchema);

const mongoUrl = process.env.MONGODB_URI;
mongoose.connect(mongoUrl);

app.get('/api/blogs', (request, response) => {
  Blog
    .find({})
    .then((blogs) => {
      response.json(blogs);
    });
});

app.post('/api/blogs', (request, response) => {
  const blog = new Blog(request.body);

  blog
    .save()
    .then((result) => {
      response.status(201).json(result);
    });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
