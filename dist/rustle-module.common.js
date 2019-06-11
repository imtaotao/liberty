'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length) {
    code = path.charCodeAt(i);
    } else if (code === 47 )
      break;
    else
      code = 47 ;
    if (code === 47 ) {
      if (lastSlash === i - 1 || dots === 1) ; else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46  || res.charCodeAt(res.length - 2) !== 46 ) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46  && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}
var posix = {
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;
    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined) {
          cwd  = '/';
        }
        path = cwd;
      }
      assertPath(path);
      if (path.length === 0) {
        continue;
      }
      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 ;
    }
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },
  normalize: function normalize(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var isAbsolute = path.charCodeAt(0) === 47 ;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 ;
    path = normalizeStringPosix(path, !isAbsolute);
    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';
    if (isAbsolute) return '/' + path;
    return path;
  },
  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 ;
  },
  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },
  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return '';
    from = posix.resolve(from);
    to = posix.resolve(to);
    if (from === to) return '';
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 )
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 )
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 ) {
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 ) {
            lastCommonSep = i;
          } else if (i === 0) {
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 )
        lastCommonSep = i;
    }
    var out = '';
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 ) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 )
        ++toStart;
      return to.slice(toStart);
    }
  },
  _makeLong: function _makeLong(path) {
    return path;
  },
  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 ;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 ) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        matchedSlash = false;
      }
    }
    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },
  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);
    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 ) {
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                end = i;
              }
            } else {
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }
      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 ) {
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          matchedSlash = false;
          end = i + 1;
        }
      }
      if (end === -1) return '';
      return path.slice(start, end);
    }
  },
  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 ) {
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 ) {
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end === -1 ||
        preDotState === 0 ||
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },
  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },
  parse: function parse(path) {
    assertPath(path);
    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 ;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;
    var preDotState = 0;
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 ) {
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 ) {
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        preDotState = -1;
      }
    }
    if (startDot === -1 || end === -1 ||
    preDotState === 0 ||
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';
    return ret;
  },
  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

var config = {
  init: false,
  useStrict: true,
  defaultExname: '.js',
};

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
const getLegalName = name => {
  if (!window[name]) return name
  return getLegalName(name + '1')
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
  map.add('.js', jsPlugin);
}

class Cache {
  constructor () {
    this.Modules = new Map();
  }
  cache (path, Module, update) {
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
const responseURLModules = new Cache();

function request (url, isAsync) {
  const getCache = xhr => {
    const responseURL = xhr.responseURL;
    if (responseURLModules.has(responseURL)) {
      xhr.abort();
      return {
        responseURL,
        resource: null,
        haveCache: true,
      }
    }
    return null
  };
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, isAsync);
  xhr.send();
  if (isAsync) {
    return new Promise((resolve, reject) => {
      xhr.onreadystatechange = () => {
        const cache = getCache(xhr);
        cache && resolve({ target: cache });
      };
      xhr.onload = resolve;
      xhr.onerror = reject;
    })
  }
  return getCache(xhr) || xhr
}
function dealWithResponse (url, xhr) {
  if (xhr.haveCache) return xhr
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

const PROTOCOL = /\w+:\/\/?/g;
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
  importModule(url, {}, this.config, true);
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
function importModule (path, parentInfo, config, isAsync) {
  if (typeof path !== 'string') {
    throw TypeError('"path" must be a string')
  }
  const pathOpts = getRealPath(path, parentInfo, config);
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
function getRealPath (path, parentInfo, config) {
  let realPath = path;
  let exname = posix.extname(path);
  if (!exname) {
    exname = config.defaultExname;
    path += config.defaultExname;
  }
  if (!posix.isAbsolute(path) && !PROTOCOL.test(path)) {
    realPath = posix.join(parentInfo.envPath || '/', path);
  }
  return {
    exname,
    path: realPath,
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
function getModuleResult (Module) {
  return typeof Module === 'object' && Module.__rustleModule
    ? Module.exports
    : Module
}
function processResource (path, exname, config, {resource, responseURL}) {
  const Module = responseURLModules.has(responseURL)
    ? responseURLModules.get(responseURL)
    : runPlugins(exname, {
        path,
        exname,
        config,
        resource,
        responseURL,
      });
  cacheModule.cache(path, Module);
  responseURLModules.cache(responseURL, Module);
  return getModuleResult(Module)
}
function runPlugins (type, opts) {
  opts = map.run('*', opts);
  return map.run(type, opts).resource
}

function run (scriptCode, rigisterWindowObject, windowModuleName) {
  const node = document.createElement('script');
  node.text = scriptCode;
  node.name = 'fsdfds';
  window[windowModuleName] = rigisterWindowObject;
  document.body.append(node);
  document.body.removeChild(node);
  delete window[windowModuleName];
}
function getRegisterParams (config, responseURL) {
  const Module = { exports: {} };
  const envInfo = posix.parse(responseURL);
  const envPath = (new URL(envInfo.dir)).pathname;
  const parentInfo = { envPath };
  readOnly(Module, '__rustleModule', true);
  const require = path => importModule(path, parentInfo, config, false);
  const requireAsync = path => importModule(path, parentInfo, config, true);
  return {
    Module,
    require,
    requireAsync,
    dirname: envInfo.dir,
  }
}
function runInThisContext (code, path, responseURL, config) {
  if (config.useStrict) {
    code = "'use strict';\n" + code;
  }
  const windowModuleName = getLegalName('__rustleModuleObject');
  const parmas = ['require', 'requireAsync', 'module', 'exports', '__filename', '__dirname'];
  const { dirname, Module, require, requireAsync } = getRegisterParams(config, responseURL);
  const rigisterWindowObject = {
    require,
    requireAsync,
    module: Module,
    __dirname: dirname,
    exports: Module.exports,
    __filename: responseURL,
  };
  const scriptCode =
    `(function ${getLegalName(path.replace(/[\/.:]/g, '_'))} (${parmas.join(',')}) {` +
    `\n${code}` +
    `\n})(${windowModuleName}.${parmas.join(`,${windowModuleName}.`)})`;
  cacheModule.cache(path, Module);
  responseURLModules.cache(responseURL, Module);
  run(scriptCode, rigisterWindowObject, windowModuleName);
  cacheModule.clear(path);
  return Module
}
function jsPlugin ({resource, path, config, responseURL}) {
  return runInThisContext(resource, path, responseURL, config)
}

var index = {
  init,
  path: posix,
  addPlugin,
  plugins: {
    jsPlugin,
  }
};

module.exports = index;
