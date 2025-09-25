import { gsap, ScrollTrigger } from '../../vendor.js'

// Configuration constants
const CONFIG = {
  ANIMATION_DURATION: 0.6,
  ANIMATION_EASE: 'power2.inOut',
}

// Global state
let accordionManagers = []

// Accordion Manager Class
class AccordionManager {
  constructor(component, listIndex) {
    this.component = component
    this.listIndex = listIndex
    this.elements = this.cacheElements()
    this.state = this.initializeState()

    if (!this.elements.list) {
      console.warn('Missing accordion list element:', component)
      return
    }

    this.setup()
  }

  cacheElements() {
    return {
      list: this.component.querySelector('.accordion_list'),
      accordions: this.component.querySelectorAll('.accordion_component'),
    }
  }

  initializeState() {
    return {
      closePrevious: this.component.getAttribute('data-close-previous') !== 'false',
      closeOnSecondClick: this.component.getAttribute('data-close-on-second-click') !== 'false',
      openOnHover: this.component.getAttribute('data-open-on-hover') === 'true',
      openByDefault: this.getDefaultOpenIndex(),
      previousIndex: null,
      closeFunctions: [],
      timelines: [],
    }
  }

  getDefaultOpenIndex() {
    const defaultValue = this.component.getAttribute('data-open-by-default')
    return defaultValue !== null && !isNaN(+defaultValue) ? +defaultValue : false
  }

  setup() {
    this.processCMSList()
    this.initializeAccordions()
  }

  processCMSList() {
    const dynList = Array.from(this.elements.list.children).find(child =>
      child.classList.contains('w-dyn-list')
    )

    if (!dynList) return

    const nestedItems = dynList?.firstElementChild?.children
    if (!nestedItems) return

    const staticWrapper = [...this.elements.list.children]
    ;[...nestedItems].forEach(el => {
      if (el.firstElementChild) {
        this.elements.list.appendChild(el.firstElementChild)
      }
    })

    staticWrapper.forEach(el => el.remove())

    // Update accordion elements after processing CMS
    this.elements.accordions = this.component.querySelectorAll('.accordion_component')
  }

  initializeAccordions() {
    this.elements.accordions.forEach((card, cardIndex) => {
      this.setupAccordionCard(card, cardIndex)
    })
  }

  setupAccordionCard(card, cardIndex) {
    const elements = this.cacheCardElements(card)

    if (!elements.button || !elements.content || !elements.icon) {
      console.warn('Missing accordion elements:', card)
      return
    }

    this.setupAccessibility(elements, cardIndex)
    this.setupAnimation(elements, card, cardIndex)
    this.setupEventListeners(elements, card, cardIndex)

    // Open by default if specified
    if (this.state.openByDefault === cardIndex + 1) {
      this.openAccordion(card, cardIndex, true)
    }
  }

  cacheCardElements(card) {
    return {
      button: card.querySelector('.accordion_toggle_button'),
      content: card.querySelector('.accordion_content_wrap'),
      icon: card.querySelector('.accordion_toggle_icon'),
    }
  }

  setupAccessibility(elements, cardIndex) {
    const buttonId = `accordion_button_${this.listIndex}_${cardIndex}`
    const contentId = `accordion_content_${this.listIndex}_${cardIndex}`

    elements.button.setAttribute('aria-expanded', 'false')
    elements.button.setAttribute('id', buttonId)
    elements.content.setAttribute('id', contentId)
    elements.button.setAttribute('aria-controls', contentId)
    elements.content.setAttribute('aria-labelledby', buttonId)
    elements.content.style.display = 'none'
  }

  setupAnimation(elements, card, cardIndex) {
    const refresh = () => {
      this.state.timelines[cardIndex].invalidate()
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh()
      }
    }

    const tl = gsap.timeline({
      paused: true,
      defaults: {
        duration: CONFIG.ANIMATION_DURATION,
        ease: CONFIG.ANIMATION_EASE,
      },
      onComplete: refresh,
      onReverseComplete: refresh,
    })

    tl.set(elements.content, { display: 'block' })
    tl.fromTo(elements.content, { height: 0 }, { height: 'auto' })
    tl.fromTo(elements.icon, { rotate: 0 }, { rotate: -135 }, '<')

    this.state.timelines[cardIndex] = tl

    // Setup close function
    this.state.closeFunctions[cardIndex] = () => {
      if (card.classList.contains('is-opened')) {
        card.classList.remove('is-opened')
        tl.reverse()
        elements.button.setAttribute('aria-expanded', 'false')
      }
    }
  }

  setupEventListeners(elements, card, cardIndex) {
    // Click event
    elements.button.addEventListener('click', () => {
      if (card.classList.contains('is-opened') && this.state.closeOnSecondClick) {
        this.closeAccordion(cardIndex)
        this.state.previousIndex = null
      } else {
        this.openAccordion(card, cardIndex)
      }
    })

    // Hover event (if enabled)
    if (this.state.openOnHover) {
      elements.button.addEventListener('mouseenter', () => {
        this.openAccordion(card, cardIndex)
      })
    }
  }

  openAccordion(card, cardIndex, instant = false) {
    // Close previous accordion if enabled
    if (
      this.state.closePrevious &&
      this.state.previousIndex !== null &&
      this.state.previousIndex !== cardIndex
    ) {
      this.state.closeFunctions[this.state.previousIndex]?.()
    }

    this.state.previousIndex = cardIndex
    const elements = this.cacheCardElements(card)

    elements.button.setAttribute('aria-expanded', 'true')
    card.classList.add('is-opened')

    if (instant) {
      this.state.timelines[cardIndex].progress(1)
    } else {
      this.state.timelines[cardIndex].play()
    }
  }

  closeAccordion(cardIndex) {
    this.state.closeFunctions[cardIndex]?.()
  }

  destroy() {
    // Kill all timelines
    this.state.timelines.forEach(tl => {
      if (tl) {
        tl.kill()
      }
    })

    // Reset accordion states
    this.elements.accordions.forEach(card => {
      card.classList.remove('is-opened')
      const button = card.querySelector('.accordion_toggle_button')
      if (button) {
        button.setAttribute('aria-expanded', 'false')
      }
    })

    // Clear state
    this.state.closeFunctions = []
    this.state.timelines = []
  }
}

function init() {
  const accordionComponents = document.querySelectorAll('.accordion_wrap')

  accordionComponents.forEach((component, listIndex) => {
    // Skip if already initialized
    if (component.dataset.scriptInitialized) return

    component.dataset.scriptInitialized = 'true'

    const manager = new AccordionManager(component, listIndex)
    accordionManagers.push(manager)

    // Store reference on element for potential external access
    component._accordionManager = manager
  })
}

function cleanup() {
  // Clean up all accordion managers
  accordionManagers.forEach(manager => {
    if (manager) {
      manager.destroy()

      // Remove reference from element
      const component = manager.component
      if (component) {
        delete component._accordionManager
        delete component.dataset.scriptInitialized
      }
    }
  })

  accordionManagers = []
}

export default {
  init,
  cleanup,
}