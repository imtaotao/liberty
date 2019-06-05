const m = require('dev/a.js')
const c = require('dev/a.js')

console.log(m, c, __filename);

require('dev/b').warn('fsadf')
console.log(require('dev/c.json'));

console.log(require('https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.common.dev.js'), 121)