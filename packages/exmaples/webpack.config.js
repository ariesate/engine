const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    'react-basic-simple': './react-basic/simple/index.js',
  },
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'React Basic Example',
      chunks: ['react-basic-simple'],
      filename: 'react-basic-simple.html',
      template: 'common-template.html'
    })
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  resolve: {
    alias: {
      'areact': path.resolve('../controller-react/src/index.js'),
      '@ariesate/are': path.resolve('../engine'),
    },
  }
};