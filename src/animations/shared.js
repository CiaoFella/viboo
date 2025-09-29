import footer from './general/footer.js'
import hero from './shared/hero.js'
import scrollLines from './shared/scrollLines.js'
import testimonialSlider from './shared/testimonialSlider.js'
import calculator from './shared/calculator.js'
import logoCarousel from './shared/logoCarousel.js'
import logoMarquee from './shared/logoMarquee.js'
import videoLightbox from './shared/videoLightbox.js'
import navbar from './general/navbar.js'
import accordion from './shared/accordion.js'
import caseStudiesSlider from './shared/caseStudiesSlider.js'

function init() {
  hero.init()
  footer.init()
  scrollLines.init()
  testimonialSlider.init()
  calculator.init()
  logoCarousel.init()
  logoMarquee.init()
  videoLightbox.init()
  navbar.init()
  accordion.init()
  caseStudiesSlider.init()
}

function cleanup() {
  hero.cleanup()
  footer.cleanup()
  scrollLines.cleanup()
  testimonialSlider.cleanup()
  calculator.cleanup()
  logoCarousel.cleanup()
  logoMarquee.cleanup()
  videoLightbox.cleanup()
  navbar.cleanup()
  accordion.cleanup()
  caseStudiesSlider.cleanup()
}

export default {
  init,
  cleanup,
}
