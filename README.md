## 自用的 module 加载器
学习和自用，没什么别的用途。因为是通过 xhr 去加载静态资源，所以必须有个服务器，而且不能跨域

## CDN
```html
  <script src="https://cdn.jsdelivr.net/gh/imtaotao/liberty/dist/liberty-0.0.1.min.js"></script>
```

## [Demo](./demo)
```html
  <script src="https://cdn.jsdelivr.net/gh/imtaotao/liberty/dist/liberty-0.0.1.min.js"></script>
  <script>
    Liberty.init()('/entry.js')
  </script>
```

```js
  // entry.js
  for (let i = 0; i < 5; i++) {
    console.log(require('https://cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.common.dev.js'));
  }
```

## API
### init(options?: Object) : Function
这个方法会初始化整个模块加载器，只有在初始化后才能正常工作，返回一个 start 函数，用于启动模块加载。返回的 start 函数有个参数，入口文件的**绝对路径**，此处只能填写**绝对路径**

```js
  const start = Liberty.init({
    exname: '.json',
    sourcemap: false, 
  })

  // start 函数用于指定启动文件，只能是绝对路径
  // 所以你可以在一个合适的时机来调用这个函数，比如所有的静态资源加载完成，或者页面某些节点渲染完成后
  start('/dev/entry.js')
```

初始化的 options
- `exname` - 默认补充的文件后缀名，默认为 `.js`
- `sourcemap` - 是否生成 sourcemap，用于定位控制台中源码信息, 只能定位到行（还需要改进），默认为 `ture`
- `alias` - 路径别名，简化 require 的时候路径的填写，以 `@` 开头的路径会被认为是使用了别名
- `hoos` - 设置钩子函数
  + `ready` - 当预备资源加载完成后，会触发此钩子，会传入两个参数，`set` 和 `start` 函数，你可以检测 set 集合中有哪些模块的静态资源没有被加载完成，可以通过 `Liberty.ready` 方法手动添加静态资源，然后再调用 start 函数启动整个应用。这样可以让运行时的模块通过手动的方式添加。
- `staticOptimize` - 是否启动静态解析模块文件，这将会导致一个深度遍历检测所有的模块依赖，等所有资源加载完毕后才会执行整个应用的代码，可以配合与 `Liberty.ready` 方法和 `hooks.ready` 配合使用，当然，如果没有运行时的模块加载，则只需要配置为 `true` 就好了，默认为 `true`

```js
  // 运行时的 require 不会被静态资源解析检测到，那这些模块你就可以在 hooks.ready 钩子中手动加载静态资源
  
  // 这种写法不会被检测到
  const urls = ['/a.js', '/b.js']
  urls.forEach(v => require('/dev' + v))


  // 而下面这种纯字符串路径是可以被检测到的
  require('/dev/a.js')
  require('/dev/b.js')
``` 

ready 钩子的使用
```html
<script>
  const start = Liberty.init({
    hooks: {
      ready (set, start) {
        // 假如我们需要检测 /dev/a.js，但是在代码中 a.js 是通过运行时的模式加载的，例如
        // 这样静态解析就会过滤掉此模块，导致最终以同步 xhr 的方式加载，所以我们可以在 ready 钩子中手动指定
        // const a = '/a.js'
        // require('/dev' + a)

        if (!set.has('/dev/a.js')) {
          Liberty.ready(['/dev/a.js']).then(start)
        } else {
          start()
        }
      }
    }
  })
  start('/dev/index')
</script>
```

Alias demo
```js
  Liberty.init({
    alias: {
      @: '/dev/',
      common: '/dev/common'
    }
  })

  // other js
  require('@@/a.js') // 会被转化为 '/dev/@/a.js'
  require('@common/index.js')  // 会被转化为 '/dev/common/index.js'
```

### addPlugin(exname: string, callback: Function) : void
这个方法用于添加插件，在整个模块的加载过程中，会请求到源文件的源码字符串，在添加特定的插件后，此种类型的文件会经过这个插件的处理，插件的回调需要返回源码字符串，否则会导致模块不被处理。（所以如果有 ts 插件，那么都可以使用这种方式处理 ts 文件了 O(∩_∩)O~）

```js
  Liberty.addPlugin('.json', res => JSON.parse(res.resource))

  // other module
  // require 到的 data 就是经过上述插件 parse 过后的数据
  const data = require('./demo.json')
```

另外一种使用方法，同时添加多种文件类型的插件
```js
  // 不同的文件类型用空格符分开，这个插件会同时处理 .js 和 .grs 后缀名的文件
  Liberty.addPlugin('.js .grs', res => {
    ...
    return res.resource
  })
```

### ready(urls: string[], entry?: string) : Promise<string | void>
由于 require 方法需要同步请求资源（已经做了资源的预加载，但是运行时的代码没法获取），这个库内部使用同步的 xhr 去获取资源，但是同步 xhr 会很影响用户体验，而且同步的 xhr 已经从标准中移除了，所以我们需要一种办法来等待资源加载完成后再执行代码。这个方法只能在 init 方法调用之后 start 方法调用之前使用。当所有的静态资源请求后，再执行代码，就不会因为网络请求的时长而阻塞代码的执行。

```js
  const start = Liberty.init()

  // ready 请求的静态资源只能是绝对路径，相对路径是不被允许的
  const urls = ['/dev/index.js', '/dev/a.js', '/dev/b.json']

  // ready 方法只能在 init 方法后 start 方法调用前使用
  Liberty.ready(urls, urls[0]).then(start)
  // 下面这种方式同上
  Liberty.ready(urls).then(() => start(urls[0]))
```
> 后面考虑先对所有文件源码进行过滤，遍历出需要的文件，先把所有静态资源准备好再执行代码，这样就可以避免手动调用 ready 方法。但是，基于运行时做，很难过滤出需要的文件，除非给个特定的语法限制（现在已经做了，配置 staticOptimize 为 true 就好）

### plugins: Object
plugins 属性存放着默认的一些插件方法（暂时只有一个）

- `jsPlugin` - 默认的 js 插件，所有的 js 文件都会默认经过这个插件处理，但是如果有其他类型的文件，也要经过这个插件处理，也可以使用。

```js
  Liberty.addPlugin('.vue', res => {
    ...
    return res.resource
  }

  // 所有的内置插件都应该作为终端插件（最后一个）来使用，因为他可能输出的不是源码字符串
  Liberty.addPlugin('.vue', Liberty.plugins.jsPlugin)
```

## Module
一个模块中有 5 个全局变量可用 `require, module, exports, __filename, __dirname`。所有的模块代码都只会被执行一次。对于循环引用，如果代码没有被执行到，则 require 到的可能为空。处理原则为，能获取到什么就是什么，参考 ejs

- `require` - 用于加载模块，接受一个相对或绝对路径
  + `async` - `require.async` 用于异步加载模块，接受一个相对或绝对路径，返回一个 promise
  + `all` - `require.all` 用于异步加载多个模块，接受一个包含相对或绝对路径的 url 数组，返回一个 promise
- `module` - 模块的根 object
- `exports` - 暴露给其他模块的对象
- `__filename` - 当前文件的文件路径
- `__dirname` - 当前文件的文件夹路径

```js
  // 循环引用的处理

  // a.js
  const bm = require('./b')
  const am = require('./a')
  console.log(am.a) // undefined
  setTimeout(() => {
    console.log(am.a) // 1
  })
  exports.a = 1
  console.log(require('./a').a) // 1


  // b.js
  const am = require('./a')
  console.log(am.a) // undefined
  setTimeout(() => {
    console.log(am.a) // 1
  })
```

<h2>
  <a download=liberty href=https://raw.githubusercontent.com/imtaotao/liberty/master/dist/liberty-0.0.1.min.js>Download</a>
<h2>