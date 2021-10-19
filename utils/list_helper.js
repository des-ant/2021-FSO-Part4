/* eslint-disable no-unused-vars, arrow-body-style */
const dummy = (blogs) => {
  // Receives array of blog posts as parameter
  // Return value 1
  return 1;
};
/* eslint-enable no-unused-vars, arrow-body-style */

/* eslint-disable arrow-body-style */
const totalLikes = (blogs) => {
  // Receive list of blog posts as a parameter
  // Return total sum of likes in all of the blog posts
  const reducer = (sumOfLikes, blog) => {
    return sumOfLikes + blog.likes;
  };

  return blogs.reduce(reducer, 0);
};
/* eslint-enable arrow-body-style */

module.exports = {
  dummy,
  totalLikes,
};
