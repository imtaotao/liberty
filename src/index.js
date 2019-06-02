import config from './config'
import { init } from './api'
import { convertToReadOnly } from './utils'

const rustleModule = {
  init,
  config: convertToReadOnly(config),
}

export default rustleModule