import jsPlugin from './js-plugin'
import { init, ready, addPlugin } from './api'

export default {
  init,
  ready,
  addPlugin,
  plugins: {
    jsPlugin,
  }
}