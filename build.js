const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const MetroApi = require('metro');
const metroDefaults = require('metro/src/defaults');

/**
 *  This config doesn't seem to be exposed.
 */
metroDefaults.moduleSystem = require.resolve('./src/metroModuleSystem');

function wrapMetroNodeFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  lines[lines.length - 1] = `module.exports = ${lines[lines.length - 1]}`;
  /**
   * Metro has a `postProcessBundleSourcemap` that allows you to edit
   * code/sourcemaps before writing to disk, but it doesn't seem to be in use.
   */
  const newContent = `
(function(){
  var __d = function(){};
  var require;
  ${lines.join('\n  ')}
}).call(global);
  `;
  fs.writeFileSync(filepath, newContent, 'utf8');
}

const config = MetroApi.loadMetroConfig();
mkdirp.sync('./dist');

const commonOptions = {
  config,
  maxWorkers: 1,
  verbose: true,
  resetCache: true,
  minify: false,
  dev: true,
  out: path.resolve('dist/index.bundle.js'),
}

MetroApi.runBuild({
  ...commonOptions,
  entry: path.resolve('./src/index.js'),
}).then(() => {
  wrapMetroNodeFile(path.resolve('./dist/index.bundle.js'));
});


process.on('unhandledRejection', (err) => {
  console.log(err);
});