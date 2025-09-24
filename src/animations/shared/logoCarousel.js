import { gsap, ScrollTrigger } from '../../vendor.js'
import { getNextContainer } from '../../utilities/helper.js'

// Configuration constants
const CONFIG = {
  CYCLE_DURATION: 5, // 3 seconds as requested
  ANIMATION_DURATION: 0.6,
  ANIMATION_EASE: 'power2.inOut',
  STAGGER_DELAY: 0.05,
}

// Global state
let ctx
let carouselManagers = new Map()

// Utility functions
const shuffleArray = arr => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const getLogoId = logoElement => {
  const img = logoElement.querySelector('img')
  if (img?.src) {
    return img.src.split('/').pop().split('.')[0]
  }
  return `logo_${Math.random().toString(36).substr(2, 9)}`
}

// Logo Carousel Manager Class
class LogoCarouselManager {
  constructor(root) {
    this.root = root
    this.elements = this.cacheElements()
    this.config = this.getConfig()
    this.state = this.initializeState()

    this.setup()
  }

  cacheElements() {
    const list = this.root.querySelector('[data-anm-logo-carousel="list"]')
    const cellNumberEl = this.root.querySelector('[data-anm-logo-carousel="cell-number"]')
    const allCells = Array.from(list?.querySelectorAll('[data-anm-logo-carousel="cell"]') || [])
    const visibleCount = parseInt(cellNumberEl?.textContent || '4')

    return {
      list,
      cellNumberEl,
      allCells,
      visibleCells: allCells.slice(0, visibleCount),
      hiddenCells: allCells.slice(visibleCount),
      originalLogos: Array.from(list?.querySelectorAll('[data-anm-logo-carousel="cell"] img') || []),
      visibleCount,
    }
  }

  getConfig() {
    return {
      cycleDuration: CONFIG.CYCLE_DURATION,
      animDuration: CONFIG.ANIMATION_DURATION,
      animEase: CONFIG.ANIMATION_EASE,
    }
  }

  initializeState() {
    return {
      currentCycleIndex: 0,
      allLogos: [],
      mainTimeline: null,
      isAnimating: false,
    }
  }

  setup() {
    this.cleanup()
    this.initializeLogoPool()
    this.setupTimeline()
    this.setupScrollTrigger()
  }

  cleanup() {
    if (this.state.mainTimeline) {
      this.state.mainTimeline.kill()
    }
  }

  initializeLogoPool() {
    // Create pool of all available logos
    this.state.allLogos = this.elements.originalLogos.map(img => ({
      src: img.src,
      alt: img.alt,
      id: getLogoId(img.parentElement),
    }))

    // Shuffle the pool for random distribution
    this.state.allLogos = shuffleArray(this.state.allLogos)
  }

  setupTimeline() {
    this.state.mainTimeline = gsap.timeline({
      repeat: -1,
      repeatDelay: this.config.cycleDuration,
      onRepeat: () => {
        this.cycleLogos()
      },
    })

    // Initial cycle
    this.state.mainTimeline.call(() => this.cycleLogos())
    this.state.mainTimeline.play()
  }

  cycleLogos() {
    if (this.state.isAnimating) return
    this.state.isAnimating = true

    const cycleTl = gsap.timeline({
      onComplete: () => {
        this.state.isAnimating = false
      },
    })

    // Get next set of logos to show
    const nextLogos = this.getNextLogos()

    // Animate each visible cell
    this.elements.visibleCells.forEach((cell, index) => {
      if (!nextLogos[index]) return

      const targetContainer = cell.querySelector('[data-anm-logo-carousel="target"]')
      const currentImg = targetContainer?.querySelector('img')
      const staggerDelay = index * CONFIG.STAGGER_DELAY

      if (targetContainer) {
        // Create new image element
        const newImg = document.createElement('img')
        newImg.src = nextLogos[index].src
        newImg.alt = nextLogos[index].alt
        newImg.className = currentImg?.className || 'u-contain-absolute'
        newImg.loading = 'lazy'

        // Set initial state for new image
        gsap.set(newImg, {
          yPercent: 100,
          autoAlpha: 0,
          filter: 'blur(5px)',
        })

        // Add new image to target container
        targetContainer.appendChild(newImg)

        // Animate out current image if it exists
        if (currentImg) {
          cycleTl.to(
            currentImg,
            {
              yPercent: -50,
              autoAlpha: 0,
              filter: 'blur(5px)',
              duration: this.config.animDuration,
              ease: this.config.animEase,
              onComplete: () => currentImg.remove(),
            },
            staggerDelay
          )
        }

        // Animate in new image
        cycleTl.to(
          newImg,
          {
            yPercent: 0,
            autoAlpha: 1,
            filter: 'blur(0px)',
            duration: this.config.animDuration,
            ease: this.config.animEase,
          },
          staggerDelay + 0.2
        )
      }
    })
  }

  getNextLogos() {
    const visibleCount = this.elements.visibleCount
    const totalLogos = this.state.allLogos.length

    // Calculate starting index for next cycle
    const startIndex = (this.state.currentCycleIndex * visibleCount) % totalLogos
    const nextLogos = []

    for (let i = 0; i < visibleCount; i++) {
      const logoIndex = (startIndex + i) % totalLogos
      nextLogos.push(this.state.allLogos[logoIndex])
    }

    this.state.currentCycleIndex++
    return nextLogos
  }

  setupScrollTrigger() {
    ScrollTrigger.create({
      trigger: this.root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => this.state.mainTimeline?.play(),
      onLeave: () => this.state.mainTimeline?.pause(),
      onEnterBack: () => this.state.mainTimeline?.play(),
      onLeaveBack: () => this.state.mainTimeline?.pause(),
    })

    // Pause when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.state.mainTimeline?.pause()
      } else {
        this.state.mainTimeline?.play()
      }
    })
  }

  destroy() {
    if (this.state.mainTimeline) {
      this.state.mainTimeline.kill()
    }
  }
}

function init() {
  ctx = gsap.context(() => {
    initLogoCarousels()
  })
}

function initLogoCarousels() {
  const container = getNextContainer()
  container.querySelectorAll('[data-anm-logo-carousel="wrap"]').forEach(root => {
    const manager = new LogoCarouselManager(root)
    carouselManagers.set(root, manager)
    root._logoCarouselManager = manager // Store reference for cleanup
  })
}

function cleanup() {
  // Clean up all carousel managers
  carouselManagers.forEach((manager, root) => {
    manager.destroy()
    delete root._logoCarouselManager
  })
  carouselManagers.clear()

  if (ctx) {
    ctx.revert()
  }
}

export default {
  init,
  cleanup,
}
