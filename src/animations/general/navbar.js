import { ScrollTrigger } from '../../vendor.js'
import { isDesktop } from '../../utilities/variables.js'

// Configuration constants
const CONFIG = {
  SCROLL_THRESHOLD: 100,
}

// Global state
let scrollTrigger
let navbarManager

// Navbar Manager Class
class NavbarManager {
  constructor() {
    this.elements = this.cacheElements()

    if (!this.elements.navbar || !this.elements.logo) {
      return
    }

    this.setup()
  }

  cacheElements() {
    return {
      navbar: document.querySelector('[data-anm-navbar="navbar"]'),
      navContainer: document.querySelector('[data-anm-navbar="container"]'),
      navMobileContainer: document.querySelector('[data-anm-navbar="mobile-container"]'),
      logo: document.querySelector('[data-anm-logo="logo"]'),
    }
  }

  setup() {
    this.initializeScrollBehavior()
  }

  getTargetContainer() {
    if (window.matchMedia(isDesktop).matches) {
      return this.elements.navContainer
    } else {
      return this.elements.navMobileContainer
    }
  }

  setTransparencyState(isTransparent) {
    const targetContainer = this.getTargetContainer()
    if (!targetContainer) return

    if (isTransparent) {
      targetContainer.classList.add('is-transparent')
    } else {
      targetContainer.classList.remove('is-transparent')
    }
  }

  initializeScrollBehavior() {
    // Set initial state
    if (window.scrollY <= CONFIG.SCROLL_THRESHOLD) {
      this.setTransparencyState(true)
    }

    // Create scroll trigger - CSS handles all animations
    scrollTrigger = ScrollTrigger.create({
      start: `top+=${CONFIG.SCROLL_THRESHOLD} top`,
      onUpdate: self => {
        // Navbar show/hide - CSS handles the animation
        if (self.direction === 1 && self.progress > 0) {
          // Scrolling down - hide navbar
          this.elements.navbar.classList.add('is-hidden')
          this.elements.logo.classList.add('is-small')
        } else if (self.direction === -1) {
          // Scrolling up - show navbar
          this.elements.navbar.classList.remove('is-hidden')
          this.elements.logo.classList.remove('is-small')
        }

        // Handle transparency
        this.setTransparencyState(window.scrollY <= CONFIG.SCROLL_THRESHOLD)
      },
    })
  }

  resetNavbarState() {
    // Reset to top-of-page state - CSS handles transitions
    this.elements.navbar?.classList.remove('is-hidden')
    this.elements.logo?.classList.remove('is-small')

    // Set transparency based on current scroll position
    const isAtTop = window.scrollY <= CONFIG.SCROLL_THRESHOLD
    this.setTransparencyState(isAtTop)
  }

  destroy() {
    // Reset all classes
    this.elements.navbar?.classList.remove('is-hidden')
    this.elements.logo?.classList.remove('is-small')
    this.elements.navContainer?.classList.remove('is-transparent')
    this.elements.navMobileContainer?.classList.remove('is-transparent')
  }
}

function init() {
  const navbarRoot = document.querySelector('[data-anm-navbar="navbar"]')

  if (navbarRoot) {
    navbarManager = new NavbarManager()
    navbarRoot._navbarManager = navbarManager
  }
}

function resetNavbarState() {
  if (navbarManager) {
    navbarManager.resetNavbarState()
  }
}

function cleanup() {
  // Clean up navbar manager
  if (navbarManager) {
    navbarManager.destroy()
    const navbarRoot = document.querySelector('[data-anm-navbar="navbar"]')
    if (navbarRoot) {
      delete navbarRoot._navbarManager
    }
    navbarManager = null
  }

  // Clean up ScrollTrigger
  if (scrollTrigger) {
    scrollTrigger.kill()
    scrollTrigger = null
  }
}

export default {
  init,
  cleanup,
  resetNavbarState,
}
