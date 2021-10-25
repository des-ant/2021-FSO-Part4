const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const helper = require('./test_helper');
const app = require('../app');
const Blog = require('../models/blog');
const User = require('../models/user');

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

describe('viewing a specific blog', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToView = blogsAtStart[0];

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const processedBlogToView = JSON.parse(JSON.stringify(blogToView));

    expect(resultBlog.body).toEqual(processedBlogToView);
  });

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId();

    console.log(validNonexistingId);

    await api
      .get(`/api/blogs/${validNonexistingId}`)
      .expect(404);
  });
});

describe('the addition of a new blog', () => {
  let token;

  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash });

    await user.save();

    const loginRequest = {
      username: 'root',
      password: 'sekret',
    };

    const loginResponse = await api
      .post('/api/login')
      .send(loginRequest)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    token = loginResponse.body.token;
  });

  test('succeeds with valid data and a valid token', async () => {
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12,
    };

    await api
      .post('/api/blogs')
      .set('Content-Type', 'application/json')
      .set('Authorization', `bearer ${token}`)
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
      .set('Content-Type', 'application/json')
      .set('Authorization', `bearer ${token}`)
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
      .set('Content-Type', 'application/json')
      .set('Authorization', `bearer ${token}`)
      .send(newBlogMissingTitleAndUrl)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });

  test('fails with status code 401 Unauthorized if a token is not provided', async () => {
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12,
    };

    await api
      .post('/api/blogs')
      .set('Content-Type', 'application/json')
      .send(newBlog)
      .expect(401);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

describe('deletion of a blog', () => {
  let token;
  let blogResponse;
  let newlyAddedBlog;

  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash });

    await user.save();

    const loginRequest = {
      username: 'root',
      password: 'sekret',
    };

    const loginResponse = await api
      .post('/api/login')
      .send(loginRequest)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    token = loginResponse.body.token;

    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12,
    };

    blogResponse = await api
      .post('/api/blogs')
      .set('Content-Type', 'application/json')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    newlyAddedBlog = blogResponse.body;
  });

  test('succeeds with status code 204 if id is valid and token is valid', async () => {
    const blogToDelete = newlyAddedBlog;

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length,
    );

    const titles = blogsAtEnd.map((r) => r.title);

    expect(titles).not.toContain(blogToDelete.title);
  });

  test('fails with status code 401 Unauthorized if a token is not provided', async () => {
    const blogToDelete = newlyAddedBlog;

    await api
      .delete(`/api/blogs/${blogToDelete}`)
      .expect(401);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length + 1,
    );

    const titles = blogsAtEnd.map((r) => r.title);

    expect(titles).toContain(blogToDelete.title);
  });
});

describe('updating a specific blog', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToUpdate = blogsAtStart[0];

    const updatedBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12,
      id: blogToUpdate.id,
    };

    const resultBlog = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(resultBlog.body).toEqual(updatedBlog);
  });
});

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'testnewuser',
      name: 'Test Username',
      password: 'testpassword',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails with invalid username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'na',
      name: 'Username Tooshort',
      password: 'usernametooshort',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('creation fails with invalid password', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'validusername',
      name: 'Password Tooshort',
      password: 'na',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400);

    expect(result.body.error).toContain('`password` must be at least 3 characters');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('`username` to be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
