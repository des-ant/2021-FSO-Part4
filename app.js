const mongoose = require('mongoose');
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const morgan = require('morgan');
const middleware = require('./utils/middleware');
const config = require('./utils/config');
const blogsRouter = require('./controllers/blogs');
const usersRouter = require('./controllers/users');
const logger = require('./utils/logger');

const app = express();

logger.info('connecting to', config.MONGODB_URI);

// Use Cors middleware to allow requests from all origins
app.use(cors());
// Use Express middleware to parse incoming requests with JSON payloads
app.use(express.json());
// Create new token to log data in HTTP POST request
morgan.token('body', (request) => JSON.stringify(request.body));
// Use Morgan middleware to log messages to console
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

app.use('/api/blogs', blogsRouter);
app.use('/api/users', usersRouter);

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message);
  });

app.use(middleware.requestLogger);
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
