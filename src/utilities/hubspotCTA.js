let listeners = []

function handleCTAClick(e) {
  e.preventDefault()
  e.stopPropagation()

  const target = e.currentTarget
  console.log('HubSpot CTA triggered:', target)

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

    // Also prevent default on any child links and buttons
    const childLinks = element.querySelectorAll('a')
    const childButtons = element.querySelectorAll('button')

    childLinks.forEach(link => {
      const linkHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('Prevented child link navigation:', link.href)
      }
      link.addEventListener('click', linkHandler, true)
      listeners.push({ element: link, handler: linkHandler, capture: true })
    })

    childButtons.forEach(button => {
      const buttonHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('Prevented child button action')
      }
      button.addEventListener('click', buttonHandler, true)
      listeners.push({ element: button, handler: buttonHandler, capture: true })
    })
  })

  if (ctaElements.length > 0) {
    console.log(`HubSpot CTA: Initialized ${ctaElements.length} trigger buttons`)
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