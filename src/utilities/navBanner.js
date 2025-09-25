// Navigation Banner and Skip Link Utilities
// Handles banner dismissal and skip link functionality

// Configuration
const STORAGE_KEY = 'hide-nav-banner'
const HTML_CLASS = 'hide-nav-banner'

function initBannerDismissal() {
  // Check session storage on page load
  if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
    document.documentElement.classList.add(HTML_CLASS)
  }

  // Setup close button handlers
  const closeButtons = document.querySelectorAll('.nav_banner_close_wrap')

  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      document.documentElement.classList.add(HTML_CLASS)
    })
  })
}

function initSkipLinks() {
  const skipLinks = document.querySelectorAll('.nav_skip_wrap')
  const mainTarget = document.querySelector('main')

  if (!mainTarget) {
    console.warn('Main element not found for skip links')
    return
  }

  skipLinks.forEach(link => {
    link.addEventListener('click', () => {
      mainTarget.setAttribute('tabindex', '-1')
      mainTarget.focus()
    })
  })
}

function init() {
  initBannerDismissal()
  initSkipLinks()
}

function cleanup() {
  // Remove HTML class if needed
  document.documentElement.classList.remove(HTML_CLASS)
}

export default {
  init,
  cleanup,
}