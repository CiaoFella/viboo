import { isMobile } from '../../utilities/variables.js'
import { gsap, ScrollTrigger } from '../../vendor.js'

let ctx
let mm = gsap.matchMedia()

function init() {
  const marqueeItems = document.querySelectorAll('[data-marquee-scroll-direction-target]')

  if (marqueeItems.length === 0) return

  marqueeItems.forEach(marquee => {
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]')
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]')
    if (!marqueeContent || !marqueeScroll) return

    const { marqueeSpeed: speed, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset

    const marqueeSpeedAttr = parseFloat(speed)
    const marqueeDirectionAttr = -1
    const duplicateAmount = parseInt(duplicate || 0)
    const scrollSpeedAttr = parseFloat(scrollSpeed)
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1

    let viewportMultiplier

    mm.add(isMobile, () => {
      viewportMultiplier = 2
    })

    mm.add(`(not ${isMobile})`, () => {
      viewportMultiplier = 1
    })

    let marqueeSpeed =
      marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier * viewportMultiplier

    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`
    marqueeScroll.style.width = `${scrollSpeedAttr * 2 + 100}%`

    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment()
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true))
      }
      marqueeScroll.appendChild(fragment)
    }

    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]')
    const animation = gsap
      .to(marqueeItems, {
        xPercent: -100,
        repeat: -1,
        duration: marqueeSpeed,
        ease: 'linear',
      })
      .totalProgress(0.5)

    gsap.set(marqueeItems, { xPercent: -100 })
    animation.timeScale(marqueeDirectionAttr)
    animation.play()

    marquee.setAttribute('data-marquee-status', 'normal')

    // Remove all scroll-based effects entirely - no more timeline or ScrollTrigger needed
  })
}

function cleanup() {
  ctx && ctx.revert()
}

export default {
  init,
  cleanup,
}
