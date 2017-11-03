const webpack = require('webpack')
const path = require('path')

// const isDevMode = process.env.NODE_ENV === 'dev'

const config = {
  entry: {
    popup: './popup.js',
    runner: './runner.js',
  },
  output: {
    filename: '[name].js',
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.json$/, exclude: /node_modules/, loader: 'json-loader' },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
}

// if (isDevMode) {
  const packagePath = path.resolve(__dirname, '../../packages')

  config.resolve = {
    alias: {
      novice: path.resolve(packagePath, 'controller-novice/src'),
      '@ariesate/are': path.resolve(packagePath, 'engine/src'),
    },
  }
// }

module.exports = config
