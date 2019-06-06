// exports.one = 1
// exports.fn = () => {}
// exports.word = v => v += '11'
var a = require('dev/index')

console.log(a.index)
setTimeout(() => console.log(a.index), 1000)