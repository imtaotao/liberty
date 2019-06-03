## 自用的打包器

demo
```js
// index.js
RM.init('other.js')

// other.js
for(let i = 0; i < 5; i++) {
  console.log(require('https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.common.dev.js'));
}
```