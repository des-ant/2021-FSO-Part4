module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    eqeqeq: 'error',
    'no-console': 0,
    'no-param-reassign': [2, { props: false }],
    'no-underscore-dangle': 0,
  },
};
