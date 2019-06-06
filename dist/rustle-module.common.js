'use strict';

class Cache {
  constructor () {
    this.Modules = new Map();
  }
  cache (path, Module,) {
    if (update || !this.has(path)) {
      this.Modules.set(path, Module);
    }
  }
  has (path) {
    return this.Modules.has(path)
  }
  get (path) {
    return this.Modules.get(path) || null
  }
  clear (path) {
    return this.Modules.delete(path)
  }
  clearAll () {
    return this.Modules.clear()
  }
}
var cacheModule = new Cache();

var config = {
  init: false,
  defaultExname: 'js',
};

class Plugins {
  constructor (type) {
    this.type = type;
    this.plugins = new Set();
  }
  add (fn) {
    this.plugins.add(fn);
  }
  forEach (params) {
    let res = params;
    for (const plugin of this.plugins.values()) {
      res.resource = plugin(res);
    }
    return res
  }
}
const map = {
  allPlugins: new Map(),
  add (type, fn) {
    if (typeof type === 'string' && typeof fn === 'function') {
      if (!this.allPlugins.has(type)) {
        const pluginClass = new Plugins(type);
        pluginClass.add(fn);
        this.allPlugins.set(type, pluginClass);
      } else {
        this.allPlugins.get(type).add(fn);
      }
    } else {
      throw TypeError('The "parameter" does not meet the requirements')
    }
  },
  get (type = '*') {
    return this.allPlugins.get(type)
  },
  run (type, params) {
    const plugins = this.allPlugins.get(type);
    if (plugins) {
      return plugins.forEach(params)
    }
    return params
  }
};
function addDefaultPlugins () {
  map.add('*', opts => opts.resource);
  map.add('js', jsPlugin);
}

function request (url, isAsync) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, isAsync);
  xhr.send();
  if (isAsync) {
    return new Promise((resolve, reject) => {
      xhr.onload = resolve;
      xhr.onerror = reject;
    })
  }
  return xhr
}
function dealWithResponse (url, xhr) {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      if (typeof xhr.response === 'string') {
        return {
          resource: xhr.response,
          responseURL: xhr.responseURL,
        }
      }
    } else if (xhr.status === 404) {
      throw Error(`Module "${url}" is not found`)
    }
  }
}
async function asyncRequest (url) {
  const { target: xhr } = await request(url, true);
  return dealWithResponse(url, xhr)
}
function syncRequest (url) {
  const xhr = request(url, false);
  return dealWithResponse(url, xhr)
}

const DOT_RE = /\/\.\//g;
const DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
const MULTI_SLASH_RE = /([^:/])\/+\//g;
const readOnly = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    value: value,
    writable: false,
  });
};
const readOnlyMap = obj => {
  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      readOnly(newObj, key, obj[key]);
    }
  }
  return newObj
};
const getExname = path => {
  const index = path.lastIndexOf('.');
  return index > -1
    ? path.substr(index + 1)
    : null
};
const realpath = path => {
  path = path.replace(DOT_RE, "/");
  path = path.replace(MULTI_SLASH_RE, "$1/");
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/");
  }
  return path
};

function init (url, opts = {}) {
  if (this.config && this.config.init) {
    throw new Error('can\'t repeat init')
  }
  opts.init = true;
  opts.baseURL = url;
  readOnly(this, 'config',
    readOnlyMap(Object.assign(config, opts))
  );
  addDefaultPlugins();
  importModule(url, this.config, true);
}
function addPlugin (exname, fn) {
  if (this.config && this.config.init) {
    throw Error('Unable to add plugin after initialization')
  } else {
    if (typeof exname === 'string') {
      const types = exname.split(' ');
      if (types.length) {
        if (types.length === 1) {
          map.add(types[0], fn);
        } else {
          for (const type of types) {
            map.add(type, fn);
          }
        }
      }
    }
  }
}
function ready (paths) {
  if (!this.config || !this.config.init) {
    throw new Error('must be initialized before use')
  }
  if (!Array.isArray(paths)) {
    throw TypeError('"paths" must be an array')
  }
  return Promise.all(
    paths.map(path => importModule(path, this.config, true))
  )
}
function importModule (path, config, isAsync) {
  if (typeof path !== 'string') {
    throw TypeError('"path" must be a string')
  }
  const pathOpts = getRealPath(path, config);
  if (cacheModule.has(pathOpts.path)) {
    const Module = cacheModule.get(pathOpts.path);
    const result = getModuleResult(Module);
    return !isAsync
      ? result
      : Promise.resolve(result)
  }
  return isAsync
    ? getModuleForAsync(pathOpts, config)
    : getModuleForSync(pathOpts, config)
}
function getModuleResult (Module) {
  return typeof Module === 'object' && Module.__rustleModule
    ? Module.exports
    : Module
}
function getRealPath (path, config) {
  let exname = getExname(path);
  if (!exname) {
    exname = config.defaultExname;
    path += ('.' + config.defaultExname);
  }
  return {
    exname,
    path: realpath(path),
  }
}
function getModuleForAsync ({path, exname}, config) {
  return asyncRequest(path, config).then(res => {
    return processResource(path, exname, config, res)
  })
}
function getModuleForSync ({path, exname}, config) {
  const res = syncRequest(path, config);
  return processResource(path, exname, config, res)
}
function processResource (path, exname, config, res) {
  const Module = runPlugins(exname, {
    path,
    exname,
    config,
    resource: res.resource,
    responseURL: res.responseURL || null,
  });
  cacheModule.cache(path, Module);
  return getModuleResult(Module)
}
function runPlugins (type, opts) {
  opts = map.run('*', opts);
  return map.run(type, opts).resource
}

function run (fn, require, requireAsync, _module, _exports, filename) {
  try {
    return fn(require, requireAsync, _module, _exports, filename)
  } catch (error) {
    throw new Error(error)
  }
}
function getRegisterParams (config) {
  const Module = { exports: {} };
  readOnly(Module, '__rustleModule', true);
  const require = path => importModule(path, config, false);
  const requireAsync = path => importModule(path, config, true);
  return { Module, require, requireAsync }
}
function runInThisContext (code, path, config) {
  code = "'use strict';\n" + code;
  const { Module, require, requireAsync } = getRegisterParams(config);
  const fn = new Function('require', 'requireAsync', 'module', 'exports', '__filename', code);
  cacheModule.cache(path, Module);
  run(fn, require, requireAsync, Module, Module.exports, path);
  return Module
}
function jsPlugin ({resource, path, config, responseURL}) {
  return runInThisContext(resource, path, config)
}

var index = {
  init,
  ready,
  addPlugin,
  cache: cacheModule,
  plugins: {
    jsPlugin,
  }
};

module.exports = index;
