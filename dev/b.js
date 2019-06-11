// exports.one = 1
// exports.fn = () => {}
// exports.word = v => v += '11'
var a = require('./index')

console.log(a.index)
setTimeout(() => console.log(a.index), 1000)