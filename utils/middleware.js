const jwt = require('jsonwebtoken');
const logger = require('./logger');
const User = require('../models/user');

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next();
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

/* eslint-disable consistent-return, no-else-return */
const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({
      error: 'invalid token',
    });
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired',
    });
  }

  next(error);
};
/* eslint-enable */

const tokenExtractor = (request, response, next) => {
  // Isolate the token from Authorization header and
  // place it to the token field of the request object
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7);
  } else {
    request.token = null;
  }

  next();
};

const userExtractor = async (request, response, next) => {
  // Find out the user and set it to the request object

  // Check validity of token and decode token,
  // returning object containing usernanme and id fields
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (decodedToken && decodedToken.id) {
    const user = await User.findById(decodedToken.id);
    request.user = user;
  } else {
    request.user = null;
  }

  next();
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
