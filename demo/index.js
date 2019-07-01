require('./global.css')
const UserList = require('./root/index')

localStorage.setItem('User', require('./test.json'))
UserList.$mount(document.getElementById('root'))