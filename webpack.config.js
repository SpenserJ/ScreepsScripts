var webpack = require('webpack');
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
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0'],
          plugins: ['transform-runtime'],
        }
      }
    ]
  }
}
