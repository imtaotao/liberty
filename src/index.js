import { init } from './api'
import plugins from './plugin'

const rustleModule = {
  init,
}

plugins.add('*', c => c + 2)
var a = plugins.run('*', '1')
console.log(a);

export default rustleModule