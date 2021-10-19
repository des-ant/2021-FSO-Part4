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
  return 0;
};
/* eslint-enable no-unused-vars, arrow-body-style */

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
};
