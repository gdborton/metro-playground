const path = require('path');
const mkdirp = require('mkdirp');
const MetroApi = require('metro');

const config = MetroApi.loadMetroConfig();
mkdirp.sync('./dist');

const commonOptions = {
  config,
  maxWorkers: 1,
  verbose: true,
  resetCache: true,
  out: path.resolve('dist/index.bundle.js'),
}

MetroApi.runBuild({
  ...commonOptions,
  entry: path.resolve('./src/index.js'),
});

// MetroApi.runBuild({
//   ...commonOptions,
//   entry: path.resolve('./src/index.jsx'),
// });


process.on('unhandledRejection', (err) => {
  console.log(err);
});