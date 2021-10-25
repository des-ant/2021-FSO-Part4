const jwt = require('jsonwebtoken');
const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', {
      username: 1, name: 1,
    });

  response.json(blogs.map((blog) => blog.toJSON()));
});

// eslint-disable-next-line consistent-return
blogsRouter.post('/', async (request, response) => {
  const { body } = request;
  // Check validity of token
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  // If there is no token or object decoded from token does not contain
  // user's identity, return error status code
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined ? 0 : body.likes,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.json(savedBlog.toJSON());
});

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (blog) {
    response.json(blog.toJSON());
  } else {
    response.status(404).end();
  }
});

blogsRouter.put('/:id', async (request, response) => {
  const { body } = request;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true });
  response.json(updatedBlog.toJSON());
});

// eslint-disable-next-line consistent-return
blogsRouter.delete('/:id', async (request, response) => {
  // Blog can be deleted only by user who added the blog
  // Check validity of token
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  // If there is no token or object decoded from token does not contain
  // user's identity, return error status code
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const userId = decodedToken.id;
  const blog = await Blog.findById(request.params.id);
  // If deleting a blog is attempted without a token or by a wrong user,
  // The operation should return a suitable status code
  if (blog.user.toString() !== userId.toString()) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  await Blog.deleteOne(blog);
  response.status(204).end();
});

module.exports = blogsRouter;
