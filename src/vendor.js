import gsap from 'gsap'
import SplitText from 'gsap/SplitText.js'
import ScrollTrigger from 'gsap/ScrollTrigger.js'
import Flip from 'gsap/Flip.js'
import MotionPathPlugin from 'gsap/MotionPathPlugin.js'
import DrawSVGPlugin from 'gsap/DrawSVGPlugin.js'
import barba from '@barba/core'
import LocomotiveScroll from 'locomotive-scroll'
import flickity from 'flickity'
import Swiper from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'

gsap.defaults({
  ease: 'power2.inOut',
  duration: 1,
})

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, Flip, DrawSVGPlugin)

export {
  gsap,
  ScrollTrigger,
  MotionPathPlugin,
  barba,
  LocomotiveScroll,
  Flip,
  SplitText,
  DrawSVGPlugin,
  flickity,
  Swiper,
  Navigation,
  Pagination,
}
