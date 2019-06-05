## 自用的 module 加载器

demo
```js
// index.js
RM.init('other.js')

// other.js
for(let i = 0; i < 5; i++) {
  console.log(require('https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.common.dev.js'));
}
```

一个模块中有 5 个全局变量可用
`'require', 'requireAsync', 'module', 'exports', '__filename'`

## plugin
默认内置了 js plugin，假如 require 了一个 json 文件
```js
  RM.addPlugin('json', opts => JSON.parse(opts.resource))
```
之后 require 的 json 文件都是 parse 过后的