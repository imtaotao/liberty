import path from './path'
import cache from './cache'
import jsPlugin from './js-plugin'
import jsSourcemap from './sourcemap'
import { init, ready, addPlugin } from './api'

export default {
  init,
  path,
  cache,
  ready,
  addPlugin,
  plugins: {
    jsPlugin,
    jsSourcemap,
  }
}