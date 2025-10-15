let listeners = []

// Check if HubSpot cookies are present
function hasHubSpotCookies() {
  const cookies = document.cookie.split(';')
  const hubspotCookies = ['__hssc', '__hssrc', '__hstc', 'hubspotutk']

  for (let cookie of cookies) {
    const trimmedCookie = cookie.trim()
    for (let hsCookie of hubspotCookies) {
      if (trimmedCookie.startsWith(hsCookie + '=')) {
        return true
      }
    }
  }
  return false
}

function handleCTAClick(e) {
  // Only prevent default if HubSpot cookies are present
  if (!hasHubSpotCookies()) {
    return
  }

  e.preventDefault()
  e.stopPropagation()
}

function init() {
  const ctaElements = document.querySelectorAll('.hs-cta-trigger-button')

  ctaElements.forEach(element => {
    // Add click handler to the main element
    element.addEventListener('click', handleCTAClick, true)
    listeners.push({ element, handler: handleCTAClick, capture: true })

    // Also conditionally prevent default on any child links and buttons
    const childLinks = element.querySelectorAll('a')
    const childButtons = element.querySelectorAll('button')

    childLinks.forEach(link => {
      const linkHandler = (e) => {
        // Only prevent if HubSpot cookies are present
        if (!hasHubSpotCookies()) {
          return
        }
        e.preventDefault()
        e.stopPropagation()
      }
      link.addEventListener('click', linkHandler, true)
      listeners.push({ element: link, handler: linkHandler, capture: true })
    })

    childButtons.forEach(button => {
      const buttonHandler = (e) => {
        // Only prevent if HubSpot cookies are present
        if (!hasHubSpotCookies()) {
          return
        }
        e.preventDefault()
        e.stopPropagation()
      }
      button.addEventListener('click', buttonHandler, true)
      listeners.push({ element: button, handler: buttonHandler, capture: true })
    })
  })
}

function cleanup() {
  listeners.forEach(({ element, handler, capture = false }) => {
    element.removeEventListener('click', handler, capture)
  })
  listeners = []
}

export default {
  init,
  cleanup,
}