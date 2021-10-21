const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');

const api = supertest(app);

beforeEach(async () => {
  await Blog.deleteMany({});

  let blogObject = new Blog(helper.initialBlogs[0]);
  await blogObject.save();

  blogObject = new Blog(helper.initialBlogs[1]);
  await blogObject.save();
});

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/);
});

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs');

  expect(response.body).toHaveLength(helper.initialBlogs.length);
});

test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs');

  const titles = response.body.map((r) => r.title);
  expect(titles).toContain(
    'Go To Statement Considered Harmful',
  );
});

test('verify unique identifier property of blog is named id', async () => {
  const response = await api.get('/api/blogs');

  const ids = response.body.map((r) => r.id);
  ids.forEach((id) => {
    expect(id).toBeDefined();
  });
});

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  };

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();
  // Verify that the total number of blogs in the system is increased by one
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

  const titles = blogsAtEnd.map((b) => b.title);
  expect(titles).toContain(
    'Canonical string reduction',
  );
});

test('blog added without likes should default to 0 likes', async () => {
  // Clear database
  await Blog.deleteMany({});

  const blogWithoutLikes = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
  };

  await api
    .post('/api/blogs')
    .send(blogWithoutLikes)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();

  const newlyAddedBlog = blogsAtEnd[0];
  const { likes } = newlyAddedBlog;
  // Likes should default to 0 if likes property missing from the request
  expect(likes).toBe(0);
});

test('blog without title and url is not added', async () => {
  const newBlogMissingTitleAndUrl = {
    author: 'Edsger W. Dijkstra',
    likes: 4,
  };

  await api
    .post('/api/blogs')
    .send(newBlogMissingTitleAndUrl)
    .expect(500);

  const blogsAtEnd = await helper.blogsInDb();

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
});

afterAll(() => {
  mongoose.connection.close();
});
