const path = require('path');

module.exports = {
  mode: 'development',
  entry: './renderer.js',
  output: {
    path: path.resolve(__dirname, 'webpack-dist'),
    filename: 'renderer.bundle.js',
  },
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'ui'), 'node_modules', __dirname]
  },
};
