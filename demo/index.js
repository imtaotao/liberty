const Grass = require('@grass')
const testJson = require('./test.json')
const UserList = require('./root/index')

const setCss = () => {
  const globalCss = require('./global.css')
  const listCss = require('./list/style.css')
  const changeUserCss = require('./change-user-infor/style.css')
  const addUserCss = require('./add-user/style.css')
  const rootCss = require('./root/style.css')

  const styleNode = document.createElement('style')
  styleNode.textContent = globalCss + listCss + changeUserCss + addUserCss + rootCss
  document.getElementsByTagName('head')[0].appendChild(styleNode)
}

setCss()

localStorage.setItem('User', testJson)
Grass.mount(document.getElementById('root'), UserList)