## 想法
应该有的 api

1. import
```js
  const m = await rm.import('./xx', context)
```

2. addPlugin
```js
  // 只能同步方式
  rm.add('.json', (...args) => {
    return ''
  })
```

3. rm.export
```js
  rm.export = {

  }
```