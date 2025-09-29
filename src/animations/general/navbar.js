import { ScrollTrigger } from '../../vendor.js'
import { isDesktop } from '../../utilities/variables.js'

// Configuration constants
const CONFIG = {
  SCROLL_THRESHOLD: 100,
  COLOR_CHECK_INTERVAL: 150, // Check color every 150ms
  BRIGHTNESS_THRESHOLD: 120, // 0-255, lower = darker backgrounds trigger light text
}

// Global state
let scrollTrigger
let navbarManager

// Navbar Manager Class
class NavbarManager {
  constructor() {
    this.elements = this.cacheElements()
    this.state = this.initializeState()

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

  initializeState() {
    return {
      colorCheckInterval: null,
      canvas: null,
      ctx: null,
    }
  }

  setup() {
    this.initializeScrollBehavior()
    this.initializeColorDetection()
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
          // Also hide mobile container
          this.elements.navMobileContainer?.classList.add('is-hidden')
          this.elements.logo.classList.add('is-small')
        } else if (self.direction === -1) {
          // Scrolling up - show navbar
          this.elements.navbar.classList.remove('is-hidden')
          // Also show mobile container
          this.elements.navMobileContainer?.classList.remove('is-hidden')
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
    this.elements.navMobileContainer?.classList.remove('is-hidden')
    this.elements.logo?.classList.remove('is-small')

    // Set transparency based on current scroll position
    const isAtTop = window.scrollY <= CONFIG.SCROLL_THRESHOLD
    this.setTransparencyState(isAtTop)
  }

  initializeColorDetection() {
    // Create canvas for color sampling
    this.state.canvas = document.createElement('canvas')
    this.state.ctx = this.state.canvas.getContext('2d')
    this.state.canvas.width = 1
    this.state.canvas.height = 1

    // Start color checking
    this.startColorDetection()
  }

  startColorDetection() {
    this.state.colorCheckInterval = setInterval(() => {
      this.checkBackgroundColor()
    }, CONFIG.COLOR_CHECK_INTERVAL)

    // Initial check
    this.checkBackgroundColor()
  }

  stopColorDetection() {
    if (this.state.colorCheckInterval) {
      clearInterval(this.state.colorCheckInterval)
      this.state.colorCheckInterval = null
    }
  }

  checkBackgroundColor() {
    try {
      // Always remove is-light class after 50px scroll
      if (window.scrollY > 50) {
        this.updateNavbarTheme(false) // Always remove is-light class after 50px
        return
      }

      const navbarRect = this.elements.navbar.getBoundingClientRect()
      const samplePoints = [
        { x: navbarRect.left + navbarRect.width * 0.25, y: navbarRect.bottom + 10 },
        { x: navbarRect.left + navbarRect.width * 0.5, y: navbarRect.bottom + 10 },
        { x: navbarRect.left + navbarRect.width * 0.75, y: navbarRect.bottom + 10 },
      ]

      let totalBrightness = 0
      let validSamples = 0

      samplePoints.forEach(point => {
        const element = document.elementFromPoint(point.x, point.y)
        if (element && element !== this.elements.navbar && !this.elements.navbar.contains(element)) {
          const brightness = this.getElementBrightness(element, point)
          if (brightness !== null) {
            totalBrightness += brightness
            validSamples++
          }
        }
      })

      if (validSamples > 0) {
        const averageBrightness = totalBrightness / validSamples
        const isLightBackground = averageBrightness >= CONFIG.BRIGHTNESS_THRESHOLD

        // If background is DARK (low brightness), we need LIGHT text (add is-light class)
        // If background is LIGHT (high brightness), we need DARK text (don't add is-light class)
        this.updateNavbarTheme(!isLightBackground)
      }
    } catch (error) {
      console.warn('Color detection error:', error)
    }
  }

  getElementBrightness(element, point) {
    try {
      const styles = window.getComputedStyle(element)
      const backgroundColor = styles.backgroundColor
      const backgroundImage = styles.backgroundImage

      // Check if element has background image
      if (backgroundImage && backgroundImage !== 'none') {
        return this.getImageBrightness(element, backgroundImage)
      }

      // Parse background color
      if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
        return this.parseColorBrightness(backgroundColor)
      }

      // Check parent elements
      let parent = element.parentElement
      while (parent && parent !== document.body) {
        const parentStyles = window.getComputedStyle(parent)
        const parentBg = parentStyles.backgroundColor
        const parentImage = parentStyles.backgroundImage

        if (parentImage && parentImage !== 'none') {
          return this.getImageBrightness(parent, parentImage)
        }

        if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
          return this.parseColorBrightness(parentBg)
        }

        parent = parent.parentElement
      }

      // Default to white background
      return 255
    } catch (error) {
      return null
    }
  }

  parseColorBrightness(colorString) {
    // Parse RGB/RGBA color strings
    const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2])
      const b = parseInt(rgbMatch[3])
      // Calculate relative brightness (weighted for human perception)
      return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    }
    return null
  }

  getImageBrightness(element, backgroundImage) {
    try {
      // For images, we'll make an educated guess based on common patterns
      const imageUrl = backgroundImage.match(/url\(['"]?([^'"]*?)['"]?\)/)?.[1]

      if (imageUrl) {
        // Check for common dark image patterns
        if (imageUrl.includes('hero') || imageUrl.includes('banner') || imageUrl.includes('bg')) {
          return 40 // Most hero/banner images are quite dark
        }

        // General background images tend to be darker
        return 70 // General assumption for background images
      }

      return null
    } catch (error) {
      return null
    }
  }

  updateNavbarTheme(isLightBackground) {
    const targetContainer = this.getTargetContainer()
    if (!targetContainer) return

    if (isLightBackground) {
      targetContainer.classList.add('is-light')
    } else {
      targetContainer.classList.remove('is-light')
    }
  }

  resetToDefaultState() {
    const targetContainer = this.getTargetContainer()
    if (targetContainer) {
      targetContainer.classList.remove('is-light')
    }
  }

  destroy() {
    // Stop color detection
    this.stopColorDetection()

    // Reset all classes
    this.elements.navbar?.classList.remove('is-hidden')
    this.elements.logo?.classList.remove('is-small')
    this.elements.navContainer?.classList.remove('is-transparent', 'is-light')
    this.elements.navMobileContainer?.classList.remove('is-transparent', 'is-light')

    // Clean up canvas
    this.state.canvas = null
    this.state.ctx = null
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

function resetToDefaultState() {
  if (navbarManager) {
    navbarManager.resetToDefaultState()
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
  resetToDefaultState,
}
