const _ = require('lodash');

/* eslint-disable no-unused-vars, arrow-body-style */
const dummy = (blogs) => {
  // Receives array of blog posts as parameter
  // Return value 1
  return 1;
};

const totalLikes = (blogs) => {
  // Receive list of blog posts as a parameter
  // Return total sum of likes in all of the blog posts
  const reducer = (sumOfLikes, blog) => {
    return sumOfLikes + blog.likes;
  };

  return blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  // Receive list of blogs as a parameter
  // Return blog with most likes
  const reducer = (blogWithMostLikes, blog) => {
    return blog.likes > blogWithMostLikes.likes ? blog : blogWithMostLikes;
  };

  const emptyBlog = {
    title: '',
    author: '',
    likes: -1,
  };

  const blogWithMostLikes = blogs.reduce(reducer, emptyBlog);

  if (blogWithMostLikes.likes === -1) {
    return {};
  }

  const result = {
    title: blogWithMostLikes.title,
    author: blogWithMostLikes.author,
    likes: blogWithMostLikes.likes,
  };

  return result;
};

const mostBlogs = (blogs) => {
  // Receives array of blogs as parameter
  // Returns author who has largest amount of blogs
  // Return value also contains mumber of blogs the top author has
  if (_.isEmpty(blogs)) {
    return {};
  }
  // Count number of blogs by each author
  const authorBlogs = _.countBy(blogs, 'author');
  // Create new object of with keys for author and number of blogs
  const authorBlogCount = _.map(authorBlogs, (val, key) => {
    return { author: key, blogs: val };
  });
  const authorMostBlogs = _.maxBy(authorBlogCount, 'blogs');
  return authorMostBlogs;
};
/* eslint-enable no-unused-vars, arrow-body-style */

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
};
