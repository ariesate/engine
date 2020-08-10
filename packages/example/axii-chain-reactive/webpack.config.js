const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

const packagePath = path.resolve(__dirname, '../../')

const isDevMode = process.env.NODE_ENV === 'dev'

const config = {
  entry: {
    index: './index.jsx',
  },
  output: {
    filename: '[name].js',
    publicPath: '/',
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   title: 'AXII Table',
    //   chunks: ['table'],
    //   filename: 'table.html',
    //   template: 'common-template.html'
    // }),
    // new HtmlWebpackPlugin({
    //   title: 'AXII Input',
    //   chunks: ['input'],
    //   filename: 'input.html',
    //   template: 'common-template.html'
    // }),
    // new HtmlWebpackPlugin({
    //   title: 'AXII Icon',
    //   chunks: ['icon'],
    //   filename: 'icon.html',
    //   template: 'common-template.html'
    // }),
    new HtmlWebpackPlugin({
      title: 'AXII Tabs',
      chunks: ['index'],
      filename: 'index.html',
      template: 'common-template.html'
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      __DEV__: true,
    })
  ],

}

config.resolve = {
  alias: {
    'axii': path.resolve(packagePath, 'controller-axii/src/index.js'),
    '@ariesate/are': path.resolve(packagePath, 'engine'),
  },
}

module.exports = config
