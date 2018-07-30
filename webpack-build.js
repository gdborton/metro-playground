const path = require('path');
const webpack = require('webpack');

const config = {
  entry: path.resolve('./src/index.js'),
  output: {
    path: path.resolve('./dist'),
    filename: 'index.bundle.js',
  }
};

const compiler = webpack(config);

compiler.run(() => {});