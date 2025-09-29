import { gsap, Swiper, Autoplay, FreeMode } from '../../vendor.js'

let ctx
let swiper

function init() {
  ctx = gsap.context(() => {
    initSwiper()
  })
}

function initSwiper() {
  const swiperElement = document.querySelector('[data-anm-case-studies="teaser"]')
  if (!swiperElement) return

  // Clone slides for seamless looping on desktop
  const slides = swiperElement.querySelectorAll('.swiper-slide')
  const isDesktop = window.innerWidth >= 992

  // Clone slides for better infinite loop effect
  if (isDesktop && slides.length > 0) {
    slides.forEach(slide => {
      const clone = slide.cloneNode(true)
      swiperElement.querySelector('.swiper-wrapper').appendChild(clone)
    })
  }

  // Configure swiper options for marquee effect
  const swiperOptions = {
    modules: [Autoplay, FreeMode],
    loop: true,
    loopedSlides: slides.length, // Match number of original slides
    centeredSlides: false,
    slidesPerGroup: 1,
    speed: 1000,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
      reverseDirection: false,
    },
    freeMode: {
      enabled: true,
      sticky: false,
      momentum: false,
    },
    allowTouchMove: true,
    breakpoints: {
      // Mobile: 1-2 slides visible
      320: {
        slidesPerView: 1.2,
        spaceBetween: 0,
        speed: 5000,
      },
      480: {
        slidesPerView: 1.5,
        spaceBetween: 0,
        speed: 5000,
      },
      640: {
        slidesPerView: 2,
        spaceBetween: 0,
        speed: 7500,
      },
      // Tablet
      768: {
        slidesPerView: 2.5,
        spaceBetween: 0,
        speed: 10000,
      },
      992: {
        slidesPerView: 3,
        spaceBetween: 0,
        speed: 10000,
      },
      // Desktop: show more slides
      1280: {
        slidesPerView: 3.5,
        spaceBetween: 0,
        speed: 10000,
      },
      1440: {
        slidesPerView: 4,
        spaceBetween: 0,
        speed: 10000,
      },
    },
    grabCursor: true,
    cssMode: false,
    watchSlidesProgress: true,
    resistance: false,
    resistanceRatio: 0,
  }

  // Initialize swiper
  swiper = new Swiper(swiperElement, swiperOptions)
}

function cleanup() {
  // Destroy swiper
  if (swiper && !swiper.destroyed) {
    swiper.destroy(true, true)
    swiper = null
  }

  // Revert GSAP context
  ctx && ctx.revert()
}

export default {
  init,
  cleanup,
}
