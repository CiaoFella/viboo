import { cursor, magneticCursor } from './utilities/customCursor/customCursor.js'
import { closeMenu, updateCurrentNavLink } from './utilities/helper.js'
import { proxy } from './utilities/pageReadyListener.js'
import { isDesktop } from './utilities/variables.js'
import { gsap, barba, ScrollTrigger } from './vendor.js'
import navbar from './animations/general/navbar.js'

gsap.registerPlugin(ScrollTrigger)

const mm = gsap.matchMedia()

barba.hooks.before(data => {
  data.next.container.classList.add('is-animating')
})

barba.hooks.after(data => {
  data.next.container.classList.remove('is-animating')

  // Update language switcher links to reflect current page
  updateLanguageSwitcher()
})

// Function to update language switcher hrefs based on current URL
function updateLanguageSwitcher() {
  const currentUrl = window.location.pathname
  const isCurrentlyEnglish = currentUrl.startsWith('/en/') || currentUrl === '/en'

  // Find all language switcher links (they have hreflang attribute)
  const languageSwitcherLinks = document.querySelectorAll('.w-locales-item a[hreflang]')

  languageSwitcherLinks.forEach(link => {
    const lang = link.getAttribute('hreflang')

    if (lang === 'en') {
      // English link: add /en prefix if not already there
      if (isCurrentlyEnglish) {
        link.href = currentUrl
      } else {
        link.href = currentUrl === '/' ? '/en' : `/en${currentUrl}`
      }
    } else if (lang === 'de') {
      // German link: remove /en prefix if present
      if (isCurrentlyEnglish) {
        if (currentUrl === '/en') {
          link.href = '/'
        } else {
          link.href = currentUrl.replace(/^\/en/, '')
        }
      } else {
        link.href = currentUrl
      }
    }
  })
}

barba.init({
  preventRunning: false,
  prevent: ({ href }) => {
    // Detect language switch between default and English
    const currentUrl = window.location.pathname
    const nextUrl = new URL(href).pathname

    // Check if URL is in English (starts with /en/ or is exactly /en)
    const currentIsEnglish = currentUrl.startsWith('/en/') || currentUrl === '/en'
    const nextIsEnglish = nextUrl.startsWith('/en/') || nextUrl === '/en'

    // If language is changing, prevent Barba and allow browser's default navigation
    // Webflow's language switcher already provides the correct translated URLs
    if (currentIsEnglish !== nextIsEnglish) {
      return true
    }

    return false
  },
  transitions: [
    {
      name: 'fade-transition',
      sync: true,
      async leave(data) {
        navbar.resetToDefaultState()
        updateCurrentNavLink()

        proxy.pageReady = false
        closeMenu()

        // Fade out current container
        await gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
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
          ease: 'power2.in',
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
