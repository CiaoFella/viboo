import { gsap, ScrollTrigger, DrawSVGPlugin } from '../../vendor.js'

let ctx

function init() {
  ctx = gsap.context(() => {
    const fillElements = document.querySelectorAll('.g_scroll_svg_fill')

    if (fillElements.length === 0) return

    fillElements.forEach(fillElement => {
      const tagName = fillElement.tagName.toLowerCase()

      // Skip non-drawable elements like groups
      if (tagName === 'g' || tagName === 'svg') {
        console.log('Skipping non-drawable element:', fillElement)
        return
      }

      const isPath = tagName === 'path'
      const isCircle = tagName === 'circle'
      const hasHorizontalClass = fillElement.classList.contains('is-horizontal')
      const pathData = isPath ? fillElement.getAttribute('d') || '' : ''
      let fromState = '0% 0%' // default for lines
      let toState = '0% 100%' // default end state

      if (isPath) {
        // Check if it's a simple vertical line (starts with M and has only V or L commands going down)
        const isVerticalLine = pathData.match(/^M[\d\s.,]+V[\d\s.,]+$/i) || pathData.match(/^M[\d\s.,]+L[\d\s.,]+$/i)

        // Check if it's a simple horizontal line (by class or path data)
        const isHorizontalLine = hasHorizontalClass || pathData.match(/^M[\d\s.,]+H[\d\s.,]+$/i)

        if (isHorizontalLine) {
          // Horizontal lines should draw from left to right
          fromState = '0%'
          toState = '100%'
        } else if (isVerticalLine) {
          // Vertical lines should draw from top to bottom
          fromState = '0% 0%'
          toState = '0% 100%'
        } else {
          // Complex paths (rectangles, shapes) should start from center
          fromState = '50% 50%'
          toState = '0% 100%'
        }
      } else if (isCircle) {
        // Circles should draw from start to end
        fromState = '0%'
        toState = '100%'
      }

      // Clear any existing inline stroke-dash styles that might interfere
      fillElement.style.strokeDashoffset = ''
      fillElement.style.strokeDasharray = ''

      // Ensure the element is visible for DrawSVGPlugin to calculate path length
      gsap.set(fillElement, { visibility: 'visible' })

      // Get delay from data attribute
      const delay = parseFloat(fillElement.getAttribute('data-anm-delay')) || 0

      // Create timeline to handle delay properly with scrub
      const tl = gsap.timeline()

      // Add delay as empty space at the start
      if (delay > 0) {
        tl.to({}, { duration: delay })
      }

      // Add the actual drawing animation
      tl.fromTo(
        fillElement,
        {
          drawSVG: fromState,
        },
        {
          drawSVG: toState,
          duration: 1,
          ease: 'none',
          onStart: () => {
            // Debug: log the path length calculation
            console.log('Animating element:', fillElement, 'Path length detected:', fillElement.getTotalLength?.())
          },
        }
      )

      // Adjust ScrollTrigger settings for horizontal lines
      const isHorizontalLine = hasHorizontalClass || (isPath && pathData.match(/^M[\d\s.,]+H[\d\s.,]+$/i))

      ScrollTrigger.create({
        trigger: fillElement,
        start: 'top center',
        end: isHorizontalLine ? 'bottom top+=40%' : 'bottom center',
        scrub: true,
        animation: tl,
      })
    })
  })
}

function cleanup() {
  ctx && ctx.revert()
}

export default {
  init,
  cleanup,
}
