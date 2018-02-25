const path = require('path');

module.exports = {
  entry: ['babel-polyfill', 'isomorphic-fetch', './src/app.js'],
  output: {
    path: path.resolve(__dirname, 'docs/script'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  }
};