// module.exports = 'indexFile'

const AM = require('/dev/a.grs')
// const BM = require('dev/b.js')

// requireAsync('dev/b.js').then(bm => {
//   console.assert(bm === BM, 'bm 不等')
//   console.assert(BM.fn === bm.fn, 'bm fn 不等')
// })

// console.assert(BM.one === 1, 'bm one 的值不对')
// console.assert(BM.word('a') === 'a11', 'bm word 方法返回错误')
// console.assert(AM.vue.name === 'Vue', 'vue 函数的名字不对')

require('./b.js')
require('./../dev/b.js')
require('./../../dev/b.js')

console.log(__filename)
exports.index = 'indexFile'