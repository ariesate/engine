const webpack = require('webpack')
const path = require('path')

const isDevMode = process.env.NODE_ENV === 'dev'

const config = {
  entry: {
    todoMVC: './index.jsx',
  },
  output: {
    filename: '[name].js',
    publicPath: '/',
  },
  module: {
    rules: [
      { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ]
}

if (isDevMode) {
  const packagePath = path.resolve(__dirname, '../../packages')

  config.resolve = {
    alias: {
      novice: path.resolve(packagePath, 'controller-novice/src'),
      '@ariesate/are': path.resolve(packagePath, 'engine/src'),
    },
  }
}

module.exports = config
