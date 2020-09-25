const path = require( 'path')

module.exports = {
    entry: './src/panel.js',
    output: {
        filename: 'panel.js',
        path: path.resolve(__dirname)
    },
    module: {
        rules: [
            { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        ],
    },
    resolve: {
        alias: {
            'axii': path.resolve('../../controller-axii/src/index.js'),
            '@ariesate/are': path.resolve('../../engine'),
        },
    },
    watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 200,
        poll: 1000
    }
}