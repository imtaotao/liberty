import path from './path'
import jsPlugin from './js-plugin'
import { init, ready, addPlugin } from './api'

export default {
  init,
  path,
  ready,
  addPlugin,
  plugins: {
    jsPlugin,
  }
}