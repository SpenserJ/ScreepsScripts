var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'main.js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      mangle: false,
    }),
  ],
  externals: {
    "lodash": "_",
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/screeps-profiler'),
        ],
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0'],
          plugins: ['transform-runtime'],
        }
      }
    ]
  }
}
