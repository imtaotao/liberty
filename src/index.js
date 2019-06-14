import jsPlugin from './js-plugin'
import jsSourcemap from './sourcemap'
import { init, ready, addPlugin } from './api'

export default {
  init,
  ready,
  addPlugin,
  plugins: {
    jsPlugin,
  }
}