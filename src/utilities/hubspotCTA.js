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
    console.log('HubSpot cookies not found - allowing normal link behavior')
    return
  }

  e.preventDefault()
  e.stopPropagation()

  const target = e.currentTarget
  console.log('HubSpot CTA triggered (cookies present):', target)

  // Check if clicked element or current target has href
  const href = target.href || target.querySelector('a')?.href
  if (href) {
    console.log('Prevented navigation to:', href)
  }
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
        console.log('Prevented child link navigation (cookies present):', link.href)
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
        console.log('Prevented child button action (cookies present)')
      }
      button.addEventListener('click', buttonHandler, true)
      listeners.push({ element: button, handler: buttonHandler, capture: true })
    })
  })

  if (ctaElements.length > 0) {
    const cookieStatus = hasHubSpotCookies() ? 'cookies present' : 'cookies not present'
    console.log(`HubSpot CTA: Initialized ${ctaElements.length} trigger buttons (${cookieStatus})`)
  }
}

function cleanup() {
  listeners.forEach(({ element, handler, capture = false }) => {
    element.removeEventListener('click', handler, capture)
  })
  listeners = []
  console.log('HubSpot CTA: Cleaned up event listeners')
}

export default {
  init,
  cleanup,
}