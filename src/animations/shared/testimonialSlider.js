import { gsap, Swiper, Navigation, Pagination } from '../../vendor.js'

let ctx
let swiperInstance = null

function init() {
  ctx = gsap.context(() => {
    initTestimonialSlider()
  })
}

function initTestimonialSlider() {
  const sliderElement = document.querySelector('[data-anm-testimonial-slider="swiper"]')

  if (!sliderElement) return

  // Ensure proper dimensions before initialization
  setTimeout(() => {
    // Initialize Swiper
    swiperInstance = new Swiper(sliderElement, {
      modules: [Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 800,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      slideToClickedSlide: false,
      watchSlidesProgress: true,
      watchSlidesVisibility: true,

      // Navigation arrows
      navigation: {
        nextEl: '[data-anm-testimonial-slider="arrow"][data-anm-type="next"]',
        prevEl: '[data-anm-testimonial-slider="arrow"][data-anm-type="prev"]',
      },

      // Pagination bullets
      pagination: {
        el: '[data-anm-testimonial-slider="bullets"]',
        clickable: true,
        bulletClass: 'testimonials_slider_bullets_point',
        bulletActiveClass: 'testimonials_slider_bullets_point--active',
      },

      // Force recalculation
      on: {
        init: function () {
          this.update()
        },
        resize: function () {
          this.update()
        },
      },
    })
  }, 100)
}

function cleanup() {
  if (swiperInstance) {
    swiperInstance.destroy(true, true)
    swiperInstance = null
  }
  ctx && ctx.revert()
}

export default {
  init,
  cleanup,
}
