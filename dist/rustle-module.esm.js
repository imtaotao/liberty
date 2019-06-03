var config = {
  init: false,
  defaultType: 'js',
};

const cacheModules = Object.create(null);
function cacheModule (url, Module) {
  Object.defineProperty(cacheModules, url, {
    get () { return Module }
  });
}
function getModule (url) {
  return cacheModules[url]
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
    let res = null;
    for (const plugin of this.plugins.values()) {
      res = plugin(params);
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
        this.allPlugins.set(pluginClass);
      } else {
        this.allPlugins.get(type).add(fn);
      }
    }
  },
  get (type = '*') {
    return this.allPlugins.get(type)
  },
  run (type, params) {
    const plugins = this.get(type);
    if (plugins) {
      return plugins.forEach(params)
    }
    return null
  }
};
map.add('*', code => code);

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
function dealWithResponse (url, xhr, config) {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      if (typeof xhr.response === 'string') {
        return run(xhr.response, url, config)
      }
    } else if (xhr.status === 404) {
      throw Error(`${url} is not found.`)
    }
  }
}
async function asyncRequest (url, config) {
  const { target: xhr } = await request(url, true);
  return dealWithResponse(url, xhr, config)
}
function syncRequest (url, config) {
  const xhr = request(url, false);
  return dealWithResponse(url, xhr, config)
}

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
  importModule(url, this, true);
}
function importModule (url, Instance, isAsync) {
  if (typeof url !== 'string') {
    warn('url must be a string');
  }
  let exname = getExname(url);
  if (!exname) {
    exname = Instanceconfig.defaultType;
    url += ('.' + Instance.config.defaultType);
  }
  const Module = getModule(url);
  if (Module) {
    return isAsync
      ? Promise.resolve(Module.exports)
      : Module.exports
  }
  if (isAsync) {
    return asyncRequest(url, config).then(Module => {
      cacheModule(url, Module);
      return Module.exports
    })
  } else {
    const Module = syncRequest(url, config);
    cacheModule(url, Module);
    return Module.exports
  }
}

const rustleModule = {
  init,
};
var a = map.run('*', 'fdsf');
console.log(a);

export default rustleModule;
