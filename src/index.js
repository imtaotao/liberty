import path from './path'
import jsPlugin from './js-plugin'
import { init, addPlugin } from './api'

export default {
  init,
  path,
  addPlugin,
  plugins: {
    jsPlugin,
  }
}