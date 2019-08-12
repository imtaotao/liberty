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
    } else if (code === 47) break;else code = 47;

    if (code === 47) {
      if (lastSlash === i - 1 || dots === 1) ; else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
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
          if (res.length > 0) res += '/..';else res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += '/' + path.slice(lastSlash + 1, i);else res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }

      lastSlash = i;
      dots = 0;
    } else if (code === 46 && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }

  return res;
}

var posix = {
  normalize: function normalize(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var isAbsolute = path.charCodeAt(0) === 47;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeStringPosix(path, !isAbsolute);
    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';
    if (isAbsolute) return '/' + path;
    return path;
  },
  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
  },
  join: function join() {
    if (arguments.length === 0) return '.';
    var joined;

    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);

      if (arg.length > 0) {
        if (joined === undefined) joined = arg;else joined += '/' + arg;
      }
    }

    if (joined === undefined) return '.';
    return posix.normalize(joined);
  },
  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47;
    var end = -1;
    var matchedSlash = true;

    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);

      if (code === 47) {
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
  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var preDotState = 0;

    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);

      if (code === 47) {
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

      if (code === 46) {
        if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
      } else if (startDot !== -1) {
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }

    return path.slice(startDot, end);
  },
  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

function genMappings(source) {
  var lines = source.split('\n');

  var code = function code(l) {
    return "AA".concat(l, "A");
  };

  return code('D') + ';' + lines.map(function () {
    return code('C');
  }).join(';');
}

function sourcemap (resource, responseURL) {
  var content = JSON.stringify({
    version: 3,
    sources: [responseURL],
    mappings: genMappings(resource)
  });
  return "//@ sourceMappingURL=data:application/json;base64,".concat(btoa(content));
}

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var config = {
  alias: {},
  hooks: {},
  init: false,
  exname: '.js',
  sourcemap: true,
  staticOptimize: true
};

var Cache =
/*#__PURE__*/
function () {
  function Cache() {
    _classCallCheck(this, Cache);

    this.Modules = new Map();
  }

  _createClass(Cache, [{
    key: "cache",
    value: function cache(path, Module, update) {
      if (update || !this.has(path)) {
        this.Modules.set(path, Module);
      }
    }
  }, {
    key: "has",
    value: function has(path) {
      return this.Modules.has(path);
    }
  }, {
    key: "get",
    value: function get(path) {
      return this.Modules.get(path) || null;
    }
  }, {
    key: "clear",
    value: function clear(path) {
      return this.Modules["delete"](path);
    }
  }, {
    key: "clearAll",
    value: function clearAll() {
      return this.Modules.clear();
    }
  }]);

  return Cache;
}();

var cacheModule = new Cache();
var resourceCache = new Cache();
var responseURLModules = new Cache();

function request(url, envPath, isAsync) {
  var getCache = function getCache(xhr) {
    var responseURL = xhr.responseURL;

    if (responseURLModules.has(responseURL)) {
      xhr.abort();
      return {
        responseURL: responseURL,
        resource: null,
        haveCache: true
      };
    }

    if (!isAsync) {
      console.warn("The module [".concat(url, "] is requested by synchronization, please avoid using this method\n\n --> from [").concat(envPath, "]\n"));
    }

    return null;
  };

  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, isAsync);
  xhr.send();

  if (isAsync) {
    return new Promise(function (resolve, reject) {
      xhr.onreadystatechange = function () {
        var cache = getCache(xhr);
        cache && resolve({
          target: cache
        });
      };

      xhr.onload = resolve;
      xhr.onerror = reject;
    });
  }

  return getCache(xhr) || xhr;
}

function dealWithResponse(url, xhr, envPath) {
  if (xhr.haveCache) return xhr;

  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      if (typeof xhr.response === 'string') {
        return {
          resource: xhr.response,
          responseURL: xhr.responseURL
        };
      }
    } else if (xhr.status === 404) {
      throw Error("Module [".concat(url, "] not found.\n\n --> from [").concat(envPath, "]\n"));
    }
  }
}

function asyncRequest(_x, _x2) {
  return _asyncRequest.apply(this, arguments);
}

function _asyncRequest() {
  _asyncRequest = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(url, envPath) {
    var _ref, xhr;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return request(url, envPath, true);

          case 2:
            _ref = _context.sent;
            xhr = _ref.target;
            return _context.abrupt("return", dealWithResponse(url, xhr, envPath));

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _asyncRequest.apply(this, arguments);
}

function syncRequest(url, envPath) {
  var xhr = request(url, envPath, false);
  return dealWithResponse(url, xhr, envPath);
}

var PROTOCOL = /\w+:\/\/?/;
var readOnly = function readOnly(obj, key, value) {
  Object.defineProperty(obj, key, {
    value: value,
    writable: false
  });
};
var readOnlyMap = function readOnlyMap(obj) {
  var newObj = {};

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var val = obj[key];
      val && _typeof(val) === 'object' ? readOnly(newObj, key, readOnlyMap(val)) : readOnly(newObj, key, val);
    }
  }

  return newObj;
};
var getLegalName = function getLegalName(name) {
  return name in window ? getLegalName(name + '1') : name;
};
var PREFIX_RE = /(@[^\/]+)(\/.+)*/;

var applyAlias = function applyAlias(path, alias, envPath) {
  return path.replace(PREFIX_RE, function ($1, $2) {
    var $3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var prefix = $2.slice(1, $2.length);
    var aliasStr = alias[prefix];

    if (typeof aliasStr !== 'string') {
      throw Error("Alias [".concat(prefix, "] does not exist.\n\n ---> from ").concat(envPath, " \n"));
    }

    return PROTOCOL.test(aliasStr) ? aliasStr + $3 : posix.join(aliasStr, $3);
  });
};

var getParentConfig = function getParentConfig(envPath, responseURL) {
  var dirname = posix.dirname(responseURL);
  var envDir = new URL(dirname).pathname;
  return {
    envDir: envDir,
    envPath: envPath,
    dirname: dirname
  };
};
var realPath = function realPath(path, _ref, config) {
  var envPath = _ref.envPath,
      envDir = _ref.envDir;
  var alias = config.alias;

  if (alias && path[0] === '@') {
    path = applyAlias(path, alias, envPath);
  }

  if (path === '.' || path === './') path = envPath;
  var exname = posix.extname(path);

  if (!exname) {
    path += config.exname;
    exname = config.exname;
  }

  if (!posix.isAbsolute(path) && !PROTOCOL.test(path)) {
    path = posix.join(envDir, path);
  }

  return {
    path: path,
    exname: exname
  };
};

function getFilePaths(codeStr, set, processPath) {
  var res;
  var paths = [];
  codeStr = ' ' + codeStr.replace(/[^:]\/\/.*|\/\*[\w\W]*?\*\//g, '');
  var REG = /[^\w\.](require[\n\s]*)\(\s*\n*['"]([^'"]+)['"]\n*\s*\);*/g;

  while (res = REG.exec(codeStr)) {
    if (res[2]) {
      var path = processPath(res[2]).path;

      if (!paths.includes(path) && !set.has(path)) {
        paths.push(path);
      }
    }
  }

  return paths;
}

function getFileResult(envPath, paths) {
  return Promise.all(paths.map(
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(path) {
      var content;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(!cacheModule.has(path) && !resourceCache.has(path))) {
                _context.next = 6;
                break;
              }

              _context.next = 3;
              return asyncRequest(path, envPath);

            case 3:
              content = _context.sent;

              if (content.haveCache) {
                _context.next = 6;
                break;
              }

              return _context.abrupt("return", {
                path: path,
                content: content
              });

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }()));
}

function deepTraversal(_x2, _x3, _x4) {
  return _deepTraversal.apply(this, arguments);
}

function _deepTraversal() {
  _deepTraversal = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(paths, envPath, config) {
    var set,
        files,
        children,
        _args2 = arguments;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            set = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : new Set();
            paths.forEach(function (v) {
              return set.add(v);
            });
            _context2.next = 4;
            return getFileResult(envPath, paths);

          case 4:
            files = _context2.sent;
            children = files.map(function (fileInfo) {
              if (!fileInfo) return null;
              var path = fileInfo.path,
                  content = fileInfo.content;
              var parentConfig = getParentConfig(path, content.responseURL);
              resourceCache.cache(path, content);
              var paths = getFilePaths(content.resource, set, function (childPath) {
                return realPath(childPath, parentConfig, config);
              });
              return paths.length > 0 ? deepTraversal(paths, parentConfig.envPath, config, set) : null;
            });
            return _context2.abrupt("return", Promise.all(children).then(function () {
              return set;
            }));

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _deepTraversal.apply(this, arguments);
}

function staticOptimize (entrance, parentConfig, config) {
  var paths = realPath(entrance, parentConfig, config);
  return deepTraversal([paths.path], parentConfig.envPath, config);
}

var Plugins =
/*#__PURE__*/
function () {
  function Plugins(type) {
    _classCallCheck(this, Plugins);

    this.type = type;
    this.plugins = new Set();
  }

  _createClass(Plugins, [{
    key: "add",
    value: function add(fn) {
      this.plugins.add(fn);
    }
  }, {
    key: "forEach",
    value: function forEach(params) {
      var res = params;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.plugins.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var plugin = _step.value;
          res.resource = plugin(res);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return res;
    }
  }]);

  return Plugins;
}();

var map = {
  allPlugins: new Map(),
  add: function add(type, fn) {
    if (typeof type === 'string' && typeof fn === 'function') {
      if (!this.allPlugins.has(type)) {
        var pluginClass = new Plugins(type);
        pluginClass.add(fn);
        this.allPlugins.set(type, pluginClass);
      } else {
        this.allPlugins.get(type).add(fn);
      }
    } else {
      throw TypeError('The "parameter" does not meet the requirements');
    }
  },
  get: function get() {
    var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '*';
    return this.allPlugins.get(type);
  },
  run: function run(type, params) {
    var plugins = this.allPlugins.get(type);

    if (plugins) {
      return plugins.forEach(params);
    }

    return params;
  }
};
function addDefaultPlugins() {
  map.add('*', function (opts) {
    return opts.resource;
  });
  map.add('.js', jsPlugin);
}

var isStart = false;
function init() {
  var _this = this;

  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (this.config && this.config.init) {
    throw new Error('Can\'t repeat init.');
  }

  opts.init = true;
  readOnly(this, 'config', readOnlyMap(Object.assign(config, opts)));
  return function (entrance) {
    if (isStart) throw Error('Can\'t repeat start.');

    if (!entrance || !posix.isAbsolute(entrance) && !PROTOCOL.test(entrance)) {
      throw Error('The startup path must be an absolute path.');
    }

    var parentConfig = {
      envPath: entrance,
      envDir: posix.dirname(entrance) || '/'
    };

    var start = function start() {
      if (isStart) throw Error('Can\'t repeat start.');
      isStart = true;
      importModule(entrance, parentConfig, _this.config, true);
    };

    readOnly(_this.config, 'entrance', entrance);
    addDefaultPlugins();

    if (_this.config.staticOptimize) {
      staticOptimize(entrance, parentConfig, _this.config).then(function (set) {
        typeof _this.config.hooks.ready === 'function' ? _this.config.hooks.ready(set, start) : start();
      });
    } else {
      start();
    }
  };
}
function addPlugin(exname, fn) {
  if (this.config && this.config.init) {
    throw Error('Unable to add plugin after initialization.');
  } else {
    if (typeof exname === 'string') {
      var types = exname.split(' ');

      if (types.length) {
        if (types.length === 1) {
          map.add(types[0], fn);
        } else {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var type = _step.value;
              map.add(type, fn);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
      }
    }
  }
}
function ready() {
  return _ready.apply(this, arguments);
}

function _ready() {
  _ready = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var paths,
        entrance,
        config,
        _args = arguments;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            paths = _args.length > 0 && _args[0] !== undefined ? _args[0] : [];
            entrance = _args.length > 1 ? _args[1] : undefined;
            config = this.config;

            if (!(!config || !config.init)) {
              _context.next = 5;
              break;
            }

            throw Error('This method must be called after initialization.');

          case 5:
            if (!isStart) {
              _context.next = 7;
              break;
            }

            throw Error('Static resources must be loaded before the module is loaded.');

          case 7:
            _context.next = 9;
            return Promise.all(paths.map(function (p) {
              var isProtocolUrl = PROTOCOL.test(p);
              if (!isProtocolUrl) p = posix.normalize(p);

              if (!posix.isAbsolute(p) && !isProtocolUrl) {
                throw Error("The path [".concat(p, "] must be an absolute path.\n\n ---> from [ready method]\n"));
              }

              return resourceCache.has(p) ? null : asyncRequest(p, 'ready method').then(function (resource) {
                resourceCache.cache(p, resource);
              });
            }));

          case 9:
            return _context.abrupt("return", entrance);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _ready.apply(this, arguments);
}

function importAll(paths, parentInfo, config) {
  if (Array.isArray(paths)) {
    return paths.length === 0 ? Promise.resolve([]) : Promise.all(paths.map(function (path) {
      return importModule(path, parentInfo, config, true);
    }));
  }

  throw Error("Paths [".concat(paths, "] must be an array.\n\n ---> from [").concat(parentInfo.envPath, "]\n"));
}
function importModule(path, parentInfo, config, isAsync) {
  var envPath = parentInfo.envPath;

  if (!path || typeof path !== 'string') {
    throw TypeError("Require path [".concat(path, "] must be a string. \n\n ---> from [").concat(envPath, "]\n"));
  }

  var pathOpts = realPath(path, parentInfo, config);

  if (cacheModule.has(pathOpts.path)) {
    var Module = cacheModule.get(pathOpts.path);
    var result = getModuleResult(Module);
    return !isAsync ? result : Promise.resolve(result);
  }

  return isAsync ? getModuleForAsync(pathOpts, config, parentInfo) : getModuleForSync(pathOpts, config, envPath);
}

function getModuleForAsync(_x, _x2, _x3) {
  return _getModuleForAsync.apply(this, arguments);
}

function _getModuleForAsync() {
  _getModuleForAsync = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(_ref, config, parentInfo) {
    var path, exname, staticFile;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            path = _ref.path, exname = _ref.exname;
            staticFile = null;

            if (!resourceCache.has(path)) {
              _context2.next = 6;
              break;
            }

            staticFile = resourceCache.get(path);
            _context2.next = 9;
            break;

          case 6:
            _context2.next = 8;
            return staticOptimize(path, parentInfo, config);

          case 8:
            staticFile = resourceCache.get(path);

          case 9:
            return _context2.abrupt("return", genModule(path, exname, config, staticFile));

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _getModuleForAsync.apply(this, arguments);
}

function getModuleForSync(_ref2, config, envPath) {
  var path = _ref2.path,
      exname = _ref2.exname;
  var staticFile = resourceCache.has(path) ? resourceCache.get(path) : syncRequest(path, envPath);
  return genModule(path, exname, config, staticFile);
}

function getModuleResult(Module) {
  return Module && _typeof(Module) === 'object' && Module.__rustleModule ? Module.exports : Module;
}

function genModule(path, exname, config, staticFile) {
  var Module = processResource(path, exname, config, staticFile);
  resourceCache.clear(path);
  return Module;
}

function processResource(path, exname, config, _ref3) {
  var resource = _ref3.resource,
      responseURL = _ref3.responseURL;
  var Module = responseURLModules.has(responseURL) ? responseURLModules.get(responseURL) : runPlugins(exname, {
    path: path,
    exname: exname,
    config: config,
    resource: resource,
    responseURL: responseURL
  });
  cacheModule.cache(path, Module);
  responseURLModules.cache(responseURL, Module);
  return getModuleResult(Module);
}

function runPlugins(type, opts) {
  opts = map.run('*', opts);
  return map.run(type, opts).resource;
}

function run(scriptCode, rigisterObject, windowModuleName) {
  var node = document.createElement('script');
  node.text = scriptCode;
  node.style.display = 'none';
  window[windowModuleName] = rigisterObject;
  document.body.append(node);
  document.body.removeChild(node);
  delete window[windowModuleName];
}

function getRegisterParams(config, path, responseURL) {
  var Module = {
    exports: {}
  };
  var parentInfo = getParentConfig(path, responseURL);
  readOnly(Module, '__rustleModule', true);

  var require = function require(path) {
    return importModule(path, parentInfo, config, false);
  };

  require.async = function (path) {
    return importModule(path, parentInfo, config, true);
  };

  require.all = function (paths) {
    return importAll(paths, parentInfo, config);
  };

  return {
    Module: Module,
    require: require,
    dirname: parentInfo.dirname
  };
}

function generateObject(config, path, responseURL) {
  var _getRegisterParams = getRegisterParams(config, path, responseURL),
      dirname = _getRegisterParams.dirname,
      Module = _getRegisterParams.Module,
      require = _getRegisterParams.require;

  return {
    require: require,
    module: Module,
    __dirname: dirname,
    exports: Module.exports,
    __filename: responseURL
  };
}

function generateScriptCode(basecode, path, responseURL, parmas, config) {
  var randomId = Math.floor(Math.random() * 10000);
  var moduleName = getLegalName('__rustleModuleObject') + randomId;
  var scriptCode = "(function ".concat(getLegalName(path.replace(/[@#\/\.:-]/g, '_')), " (").concat(parmas.join(','), ") {") + "\n".concat(basecode) + "\n}).call(undefined, window.".concat(moduleName, ".").concat(parmas.join(",window.".concat(moduleName, ".")), ");");

  if (config.sourcemap) {
    scriptCode += "\n".concat(sourcemap(scriptCode, responseURL));
  }

  return {
    moduleName: moduleName,
    scriptCode: scriptCode
  };
}

function runInThisContext(code, path, responseURL, config) {
  var rigisterObject = generateObject(config, path, responseURL);
  var Module = rigisterObject.module;
  var parmas = Object.keys(rigisterObject);

  var _generateScriptCode = generateScriptCode(code, path, responseURL, parmas, config),
      moduleName = _generateScriptCode.moduleName,
      scriptCode = _generateScriptCode.scriptCode;

  cacheModule.cache(path, Module);
  responseURLModules.cache(responseURL, Module);
  run(scriptCode, rigisterObject, moduleName);
  cacheModule.clear(path);
  responseURLModules.clear(responseURL);
  return Module;
}

function jsPlugin(_ref) {
  var resource = _ref.resource,
      path = _ref.path,
      config = _ref.config,
      responseURL = _ref.responseURL;
  return runInThisContext(resource, path, responseURL, config);
}

var index = {
  init: init,
  path: posix,
  ready: ready,
  addPlugin: addPlugin,
  plugins: {
    jsPlugin: jsPlugin
  }
};

module.exports = index;
