const a = require('./a.js')
const b = require('./b.js')


setTimeout(() => {
  console.log(a.v)
})

setTimeout(() => {
  exports.v = 122
  console.log(b.v, 'fdsfds')
}, 2000)
console.log(a.v, b === exports)