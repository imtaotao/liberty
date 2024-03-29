const base = require('./karma.base.config.js')

module.exports = function (config) {
  config.set(Object.assign(base, {
    browsers: ['Chrome'],
    reporters: ['progress', 'mocha'],
    colors: {
      success: 'blue',
      info: 'bgGreen',
      warning: 'cyan',
      error: 'bgRed'
    },
    singleRun: true,
    plugins: base.plugins.concat([
      'karma-chrome-launcher',
    ])
  }))
}