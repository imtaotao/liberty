'use strict';

var config = {
  init: false,
  defaultExname: 'js',
};

const cacheModules = Object.create(null);
function cacheModule (path, Module) {
  Object.defineProperty(cacheModules, path, {
    get () { return Module }
  });
}
function getModule (path) {
  return cacheModules[path]
}

const DOT_RE = /\/\.\//g;
const DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
const MULTI_SLASH_RE = /([^:/])\/+\//g;
const warn = (msg, isWarn) => {
  throw Error(msg)
};
const convertToReadOnly = obj => {
  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      Object.defineProperty(newObj, key, {
        get () { return obj[key] }
      });
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

function jsPlugin (opts) {
  console.log(opts);
}

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
      throw TypeError('The parameter does not meet the requirements')
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
    return null
  }
};
function addDefaultPlugins () {
  map.add('*', opts => opts.resource);
  map.add('js', jsPlugin);
}

function request (url, async) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, async);
  xhr.send();
  if (async) {
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
        return xhr.response
      }
    } else if (xhr.status === 404) {
      throw Error(`${url} is not found.`)
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

function init (url, otps = {}) {
  if (this.config && this.config.init) {
    warn('can\'t repeat init');
  }
  if (typeof url !== 'string') {
    warn('error');
  }
  otps.init = true;
  otps.baseURL = url;
  this.config = convertToReadOnly({...config, ...otps});
  addDefaultPlugins();
  importModule(url, this, true);
}
function addPlugin (type, fn) {
  if (!this.config.init) {
    map.add(type, fn);
  } else {
    throw Error('Unable to add plugin after initialization')
  }
}
function importModule (path, Instance, isAsync) {
  if (typeof path !== 'string') {
    warn('path must be a string');
  }
  const pathOpts = getRealPath(path, Instance.config);
  const Module = getModule(pathOpts.path);
  if (Module) {
    return isAsync
      ? Promise.resolve(Module.exports)
      : Module.exports
  }
  return isAsync
    ? getModuleForAsync(pathOpts, config)
    : getModuleForSync(pathOpts, config)
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
  return asyncRequest(path, config).then(resource => {
    const Module = runPlugins(exname, { path, config, resource });
    console.log(Module);
  })
}
function getModuleForSync ({path, exname}, config) {
  const Module = syncRequest(path, resource);
  cacheModule(path, Module);
  return Module.exports
}
function runPlugins (type, opts) {
  opts.resource = map.run('*', opts);
  return map.run(type, opts)
}

const rustleModule = {
  init,
  addPlugin,
};

module.exports = rustleModule;
