import { gsap, Swiper, Navigation, Pagination } from '../../vendor.js'

let ctx
let swiperInstance = null

function init() {
  ctx = gsap.context(() => {
    initTestimonialSlider()
  })
}

function initTestimonialSlider() {
  const sliderWrapper = document.querySelector('[data-anm-testimonial-slider="slider"]')
  if (!sliderWrapper) return

  const swiperContainer = sliderWrapper.querySelector('[data-anm-testimonial-slider="wrap"]')
  const prevButton = sliderWrapper.querySelector('[data-anm-testimonial-slider="arrow"][data-anm-type="prev"]')
  const nextButton = sliderWrapper.querySelector('[data-anm-testimonial-slider="arrow"][data-anm-type="next"]')
  const bulletsContainer = sliderWrapper.querySelector('[data-anm-testimonial-slider="bullets"]')

  if (!swiperContainer) return

  // Add Swiper classes to existing elements
  swiperContainer.classList.add('swiper')

  // Create swiper-wrapper if it doesn't exist, or use existing structure
  let swiperWrapper = swiperContainer.querySelector('.swiper-wrapper')
  if (!swiperWrapper) {
    swiperWrapper = document.createElement('div')
    swiperWrapper.className = 'swiper-wrapper'

    // Move all slide elements into the wrapper
    const slides = swiperContainer.querySelectorAll('[data-anm-testimonial-slider="slide"]')
    slides.forEach(slide => {
      slide.classList.add('swiper-slide')
      swiperWrapper.appendChild(slide)
    })

    swiperContainer.appendChild(swiperWrapper)
  }

  // Initialize Swiper
  swiperInstance = new Swiper(swiperContainer, {
    modules: [Navigation, Pagination],
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    speed: 800,
    effect: 'slide',

    // Custom navigation
    navigation: {
      nextEl: nextButton,
      prevEl: prevButton,
      disabledClass: 'swiper-button-disabled',
    },

    // Custom pagination
    pagination: {
      el: bulletsContainer,
      clickable: true,
      bulletClass: 'testimonials_slider_bullets_point',
      bulletActiveClass: 'testimonials_slider_bullets_point--active',
      renderBullet: function (index, className) {
        return `<div class="${className}"></div>`
      },
    },

    // Accessibility
    a11y: {
      prevSlideMessage: 'Previous testimonial',
      nextSlideMessage: 'Next testimonial',
      paginationBulletMessage: 'Go to testimonial {{index}}',
    },

    // Auto-update pagination bullets
    on: {
      init: function () {
        updatePaginationBullets(this)
      },
      slideChange: function () {
        updatePaginationBullets(this)
      },
    },
  })
}

function updatePaginationBullets(swiper) {
  const bullets = document.querySelectorAll('.testimonials_slider_bullets_point')
  bullets.forEach((bullet, index) => {
    if (index === swiper.realIndex) {
      bullet.classList.add('testimonials_slider_bullets_point--active')
    } else {
      bullet.classList.remove('testimonials_slider_bullets_point--active')
    }
  })
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
