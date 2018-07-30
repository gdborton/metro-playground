Playing with metro bundler.

## Circular Deps

This highlights an issue in Metro regarding circular dependencies. There are only two files in the bundle, each imports the other.


**Expected Behavior:**

Requiring the build output should `console.log('1');`

```bash
# Runs the metro build
node build.js
# produces an error
node dist/index.bundle.js
```

Note that this works in webpack, but also directly in node by requiring from `src/`

```bash
# Runs the webpack version of the build
node webpack-build.js
# correctly logs 1
node dist/index.bundle.js
```

```bash
# correctly logs 1
node src/index.js
```
