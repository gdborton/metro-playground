'use strict';

/* eslint-disable no-bitwise */

// declare var __DEV__: boolean;
// declare var __NUM_MODULES__: mixed;

// Used to include paths in production bundles for traces of performance tuned runs
// e.g. to update fbandroid/apps/fb4a/compiled_react_native_modules.txt
// Make sure to set PASS_MODULE_PATHS_TO_DEFINE = true too, and restart Metro.
const PRINT_REQUIRE_PATHS = false;

require = metroRequire;
__d = define;

const modules =
  typeof __NUM_MODULES__ === 'number'
    ? (Array(__NUM_MODULES__ | 0))
    : Object.create(null);
if (__DEV__) {
  var verboseNamesToModuleIds = Object.create(null);
  var initializingModuleIds = [];
}

function define(factory, moduleId, dependencyMap) {
  if (modules[moduleId] != null) {
    if (__DEV__) {
      // (We take `inverseDependencies` from `arguments` to avoid an unused
      // named parameter in `define` in production.
      const inverseDependencies = arguments[4];

      // If the module has already been defined and the define method has been
      // called with inverseDependencies, we can hot reload it.
      if (inverseDependencies) {
        global.__accept(moduleId, factory, dependencyMap, inverseDependencies);
      } else {
        console.warn(
          `Trying to define twice module ID ${moduleId} in the same bundle`,
        );
      }
    }

    // prevent repeated calls to `global.nativeRequire` to overwrite modules
    // that are already loaded
    return;
  }
  modules[moduleId] = {
    dependencyMap,
    exports: undefined,
    factory,
    hasError: false,
    isInitialized: false,
  };
  if (PRINT_REQUIRE_PATHS) {
    const path = arguments[4];
    if (path) {
      modules[moduleId].path = path;
    } else {
      throw new Error(
        'path not set on module with PRINT_REQUIRE_PATHS true. Make sure ' +
          'PASS_MODULE_PATHS_TO_DEFINE is true and restart Metro or rebuild bundle',
      );
    }
  }
  if (__DEV__) {
    // HMR
    modules[moduleId].hot = createHotReloadingObject();

    // DEBUGGABLE MODULES NAMES
    // we take `verboseName` from `arguments` to avoid an unused named parameter
    // in `define` in production.
    const verboseName = arguments[3];
    if (verboseName) {
      modules[moduleId].verboseName = verboseName;
      verboseNamesToModuleIds[verboseName] = moduleId;
    }
  }
}

function metroRequire(moduleId) {
  if (__DEV__ && typeof moduleId === 'string') {
    const verboseName = moduleId;
    moduleId = verboseNamesToModuleIds[verboseName];
    if (moduleId == null) {
      throw new Error(`Unknown named module: '${verboseName}'`);
    } else {
      console.warn(
        `Requiring module '${verboseName}' by name is only supported for ` +
          'debugging purposes and will BREAK IN PRODUCTION!',
      );
    }
  }

  //$FlowFixMe: at this point we know that moduleId is a number
  const moduleIdReallyIsNumber = moduleId;
  if (__DEV__) {
    const initializingIndex = initializingModuleIds.indexOf(
      moduleIdReallyIsNumber,
    );
    if (initializingIndex !== -1) {
      const cycle = initializingModuleIds
        .slice(initializingIndex)
        .map(id => modules[id].verboseName);
      // We want to show A -> B -> A:
      cycle.push(cycle[0]);
      console.warn(
        `Require cycle: ${cycle.join(' -> ')}\n\n` +
          'Require cycles are allowed, but can result in uninitialized values. ' +
          'Consider refactoring to remove the need for a cycle.',
      );
    }
  }
  const module = modules[moduleIdReallyIsNumber];
  return module && module.isInitialized
    ? module.exports
    : guardedLoadModule(moduleIdReallyIsNumber, module);
}

let inGuard = false;
function guardedLoadModule(moduleId, module) {
  if (!inGuard && global.ErrorUtils) {
    inGuard = true;
    let returnValue;
    try {
      returnValue = loadModuleImplementation(moduleId, module);
    } catch (e) {
      global.ErrorUtils.reportFatalError(e);
    }
    inGuard = false;
    return returnValue;
  } else {
    return loadModuleImplementation(moduleId, module);
  }
}

const ID_MASK_SHIFT = 16;
const LOCAL_ID_MASK = ~0 >>> ID_MASK_SHIFT;

function unpackModuleId(moduleId) {
  const segmentId = moduleId >>> ID_MASK_SHIFT;
  const localId = moduleId & LOCAL_ID_MASK;
  return {segmentId, localId};
}
metroRequire.unpackModuleId = unpackModuleId;

function packModuleId(value) {
  return value.segmentId << (ID_MASK_SHIFT + value.localId);
}
metroRequire.packModuleId = packModuleId;

function loadModuleImplementation(moduleId, module) {
  if (!module && global.__defineModule) {
    global.__defineModule(moduleId);
    module = modules[moduleId];
  }

  const nativeRequire = global.nativeRequire;
  if (!module && nativeRequire) {
    const {segmentId, localId} = unpackModuleId(moduleId);
    nativeRequire(localId, segmentId);
    module = modules[moduleId];
  }

  if (!module) {
    throw unknownModuleError(moduleId);
  }

  if (module.hasError) {
    throw moduleThrewError(moduleId, module.error);
  }

  // `metroRequire` calls into the require polyfill itself are not analyzed and
  // replaced so that they use numeric module IDs.
  // The systrace module will expose itself on the metroRequire function so that
  // it can be used here.
  // TODO(davidaurelio) Scan polyfills for dependencies, too (t9759686)
  if (__DEV__) {
    var {Systrace} = metroRequire;
  }

  // We must optimistically mark module as initialized before running the
  // factory to keep any require cycles inside the factory from causing an
  // infinite require loop.
  module.isInitialized = true;
  const exports = (module.exports = {});
  const {factory, dependencyMap} = module;
  if (__DEV__) {
    initializingModuleIds.push(moduleId);
  }
  try {
    if (PRINT_REQUIRE_PATHS) {
      console.log(`require file path ${module.path || 'unknown'}`); // eslint-disable-line no-console
    }
    if (__DEV__) {
      // $FlowFixMe: we know that __DEV__ is const and `Systrace` exists
      Systrace.beginEvent('JS_require_' + (module.verboseName || moduleId));
    }

    const moduleObject = {exports};
    if (__DEV__ && module.hot) {
      moduleObject.hot = module.hot;
    }

    // keep args in sync with with defineModuleCode in
    // metro/src/Resolver/index.js
    // and metro/src/ModuleGraph/worker.js
    factory(global, metroRequire, moduleObject, exports, dependencyMap);

    // avoid removing factory in DEV mode as it breaks HMR
    if (!__DEV__) {
      // $FlowFixMe: This is only sound because we never access `factory` again
      module.factory = undefined;
      module.dependencyMap = undefined;
    }

    if (__DEV__) {
      // $FlowFixMe: we know that __DEV__ is const and `Systrace` exists
      Systrace.endEvent();
    }
    return (module.exports = moduleObject.exports);
  } catch (e) {
    module.hasError = true;
    module.error = e;
    module.isInitialized = false;
    module.exports = undefined;
    throw e;
  } finally {
    if (__DEV__) {
      if (initializingModuleIds.pop() !== moduleId) {
        throw new Error(
          'initializingModuleIds is corrupt; something is terribly wrong',
        );
      }
    }
  }
}

function unknownModuleError(id) {
  let message = 'Requiring unknown module "' + id + '".';
  if (__DEV__) {
    message +=
      'If you are sure the module is there, try restarting Metro Bundler. ' +
      'You may also want to run `yarn`, or `npm install` (depending on your environment).';
  }
  return Error(message);
}

function moduleThrewError(id, error) {
  const displayName = (__DEV__ && modules[id] && modules[id].verboseName) || id;
  return Error(
    'Requiring module "' +
      displayName +
      '", which threw an exception: ' +
      error,
  );
}

if (__DEV__) {
  metroRequire.Systrace = {beginEvent: () => {}, endEvent: () => {}};

  metroRequire.getModules = () => {
    return modules;
  };

  // HOT MODULE RELOADING
  var createHotReloadingObject = function() {
    const hot = {
      acceptCallback: null,
      accept: callback => {
        hot.acceptCallback = callback;
      },
      disposeCallback: null,
      dispose: callback => {
        hot.disposeCallback = callback;
      },
    };
    return hot;
  };

  const metroAcceptAll = function(dependentModules, inverseDependencies, patchedModules) {
    if (!dependentModules || dependentModules.length === 0) {
      return true;
    }

    const notAccepted = dependentModules.filter(
      module =>
        !metroAccept(
          module,
          /*factory*/ undefined,
          /*dependencyMap*/ undefined,
          inverseDependencies,
          patchedModules,
        ),
    );

    const parents = [];
    for (let i = 0; i < notAccepted.length; i++) {
      // if the module has no parents then the change cannot be hot loaded
      if (inverseDependencies[notAccepted[i]].length === 0) {
        return false;
      }

      parents.push.apply(parents, inverseDependencies[notAccepted[i]]);
    }

    return parents.length == 0;
  };

  const metroAccept = function(
    id,
    factory,
    dependencyMap,
    inverseDependencies,
    patchedModules = {},
  ) {
    if (id in patchedModules) {
      // Do not patch the same module more that once during an update.
      return true;
    }
    patchedModules[id] = true;

    const mod = modules[id];

    if (!mod && factory) {
      // New modules are going to be handled by the define() method.
      return true;
    }

    const {hot} = mod;
    if (!hot) {
      console.warn(
        'Cannot accept module because Hot Module Replacement ' +
          'API was not installed.',
      );
      return false;
    }

    if (hot.disposeCallback) {
      try {
        hot.disposeCallback();
      } catch (error) {
        console.error(
          `Error while calling dispose handler for module ${id}: `,
          error,
        );
      }
    }

    // replace and initialize factory
    if (factory) {
      mod.factory = factory;
    }
    if (dependencyMap) {
      mod.dependencyMap = dependencyMap;
    }
    mod.hasError = false;
    mod.isInitialized = false;
    metroRequire(id);

    if (hot.acceptCallback) {
      try {
        hot.acceptCallback();
        return true;
      } catch (error) {
        console.error(
          `Error while calling accept handler for module ${id}: `,
          error,
        );
      }
    }

    // need to have inverseDependencies to bubble up accept
    if (!inverseDependencies) {
      throw new Error('Undefined `inverseDependencies`');
    }

    // accept parent modules recursively up until all siblings are accepted
    return metroAcceptAll(
      inverseDependencies[id],
      inverseDependencies,
      patchedModules,
    );
  };

  global.__accept = metroAccept;
}