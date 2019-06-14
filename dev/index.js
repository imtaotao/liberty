const AM = require('./a.grs')
const BM = require('./b')
const CJ = require('./c.json')

console.log(CJ);
require.async('./b.js').then(bm => {
  console.assert(bm === BM, 'bm 不等')
  console.assert(BM.fn === bm.fn, 'bm fn 不等')
})

console.assert(BM.one === 1, 'bm one 的值不对')
console.assert(BM.word('a') === 'a11', 'bm word 方法返回错误')
console.assert(AM.vue.name === 'Vue', 'vue 函数的名字不对')

require('./b.js')
require('./../dev/b.js')
require('./../../dev/b.js')

console.log(__filename, __dirname)
exports.index = 'indexFile'
exports.vue = require('https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.common.dev.js')

require.all(['./a.grs', './b']).then(res => {
  console.log(res)
})