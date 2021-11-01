const mongoose = require('mongoose');
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const morgan = require('morgan');
const middleware = require('./utils/middleware');
const config = require('./utils/config');
const blogsRouter = require('./controllers/blogs');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
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
// Allow routes to access json web token with request.token
app.use(middleware.tokenExtractor);

app.use('/api/blogs', blogsRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

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
