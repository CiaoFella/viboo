import footer from './general/footer.js'
import hero from './shared/hero.js'
import scrollLines from './shared/scrollLines.js'
import testimonialSlider from './shared/testimonialSlider.js'
import calculator from './shared/calculator.js'
import logoCarousel from './shared/logoCarousel.js'

function init() {
  hero.init()
  footer.init()
  scrollLines.init()
  testimonialSlider.init()
  calculator.init()
  logoCarousel.init()
}

function cleanup() {
  hero.cleanup()
  footer.cleanup()
  scrollLines.cleanup()
  testimonialSlider.cleanup()
  calculator.cleanup()
  logoCarousel.cleanup()
}

export default {
  init,
  cleanup,
}
