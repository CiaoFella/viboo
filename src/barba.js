import { cursor, magneticCursor } from './utilities/customCursor/customCursor.js'
import { closeMenu } from './utilities/helper.js'
import { proxy } from './utilities/pageReadyListener.js'
import { isDesktop } from './utilities/variables.js'
import { gsap, barba, ScrollTrigger } from './vendor.js'

gsap.registerPlugin(ScrollTrigger)

const mm = gsap.matchMedia()

barba.hooks.before(data => {
  data.next.container.classList.add('is-animating')
})

barba.hooks.after(data => {
  data.next.container.classList.remove('is-animating')
})

barba.init({
  preventRunning: false,
  transitions: [
    {
      name: 'fade-transition',
      async leave(data) {
        proxy.pageReady = false
        closeMenu()

        // Fade out current container
        await gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut',
        })
      },
      async enter(data) {
        // Set initial state for new container
        gsap.set(data.next.container, {
          opacity: 0,
        })

        // Fade in new container
        await gsap.to(data.next.container, {
          opacity: 1,
          duration: 0.4,
          ease: 'power2.inOut',
        })
      },
      after(data) {
        mm.add(isDesktop, () => {
          const customCursor = document.querySelector('.cb-cursor')
          if (customCursor) customCursor.remove()
          cursor.init()
          magneticCursor()
        })
        proxy.pageReady = true
      },
    },
  ],
  views: [
    {
      namespace: 'home',
      beforeEnter({ next }) {
        // Additional logic for home page before entering
      },
    },
    {
      namespace: 'about',
      beforeEnter({ next }) {
        // Additional logic for about page before entering
      },
    },
    {
      namespace: 'contact',
      beforeEnter({ next }) {
        // Additional logic for contact page before entering
      },
    },
  ],
})

export default barba
