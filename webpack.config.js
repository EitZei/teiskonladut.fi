const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'docs/script'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },
  plugins: [
    new UglifyJSPlugin({ sourceMap: true })
  ],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './docs',
    publicPath: '/script/',
  },
};