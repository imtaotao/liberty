exports.one = 1
exports.fn = () => {}
exports.word = v => v += '11'

const a = require('./index')

setTimeout(() => {
  console.log(a.index)
}, 1000)