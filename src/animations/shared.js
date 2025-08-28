import footer from './general/footer.js'
import hero from './shared/hero.js'
import scrollLines from './shared/scrollLines.js'

function init() {
  hero.init()
  footer.init()
  scrollLines.init()
}

function cleanup() {
  hero.cleanup()
  footer.cleanup()
  scrollLines.cleanup()
}

export default {
  init,
  cleanup,
}
