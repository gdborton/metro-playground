const path = require('path');
const mkdirp = require('mkdirp');
const MetroApi = require('metro');

const config = MetroApi.loadMetroConfig();
mkdirp.sync('./dist');

/** works */
MetroApi.runBuild({
  config,
  out: path.resolve('dist/index.bundle.js'),
  entry: path.resolve('./src/index.js'),
})

/** does not work */
// MetroApi.runBuild({
//   config,
//   out: path.resolve('dist/index.bundle.js'),
//   entry: path.resolve('./src/index.jsx'),
// });
