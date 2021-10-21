const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');

const api = supertest(app);

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(helper.initialBlogs);
});

describe('when there is initially some blogs saved', () => {
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

  test('there is a unique identifier property of blog named id', async () => {
    const response = await api.get('/api/blogs');

    const ids = response.body.map((r) => r.id);
    ids.forEach((id) => {
      expect(id).toBeDefined();
    });
  });
});

describe('the addition of a new blog', () => {
  test('succeeds with valid data', async () => {
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

  test('without likes should default to 0 likes', async () => {
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

  test('fails with status code 400 if data is invalid', async () => {
    const newBlogMissingTitleAndUrl = {
      author: 'Edsger W. Dijkstra',
      likes: 4,
    };

    await api
      .post('/api/blogs')
      .send(newBlogMissingTitleAndUrl)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
