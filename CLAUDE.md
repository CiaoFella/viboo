# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Webflow + Barba.js + GSAP** starter project for creating smooth page transitions and rich animations in web applications. The project is built with modern JavaScript (ES6 modules), Webpack bundling, and SASS preprocessing, designed for deployment on Netlify.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on port 1235 with hot reload
- `npm run build` - Build for production (runs both JS and CSS builds)
- `npm run build-js` - Build JavaScript with Webpack
- `npm run build-css` - Compile SASS to CSS (outputs to both dist/ and src/)
- `npm run lint` - Run ESLint on JavaScript/TypeScript files
- `npm run format` - Format code with Prettier

### CSS Development
- `npm run watch-css` - Watch and compile SASS changes in real-time

## Architecture Overview

### Entry Points
- **src/index.js** - Empty webpack entry point
- **src/main.js** - Main application logic and initialization
- **src/vendor.js** - Third-party library exports (GSAP, Barba, Swiper, etc.)

### Core Systems

#### Page Transitions (Barba.js)
- **src/barba.js** - Barba configuration with page transition logic
- Page modules are dynamically loaded from `src/pages/` directory
- Each page has its own module (home.js, about.js, contact.js, etc.) with init/cleanup lifecycle

#### Animation System (GSAP)
- **src/animations/general/** - Global animations (menu, page loader, page enter)
- **src/animations/shared/** - Reusable animation components (scroll parallax, text effects, sliders)
- Uses GSAP ScrollTrigger, SplitText, and other premium plugins
- Responsive animations with `gsap.matchMedia()`

#### Utilities
- **src/utilities/helper.js** - General utility functions
- **src/utilities/smoothScroll.js** - Lenis smooth scrolling implementation
- **src/utilities/customCursor/** - Custom cursor system (cursor, magnetic effects)
- **src/utilities/createSplitTexts.js** - Text animation setup
- **src/utilities/variables.js** - Global JavaScript variables

### Styling (SASS)
- **src/styles/style.scss** - Main stylesheet entry point
- Modular SASS architecture with page-specific stylesheets
- **src/styles/variables.scss** - SASS variables and mixins
- Integrated with Webflow's generated styles

### Build Configuration
- **webpack.config.cjs** - Webpack configuration for ES modules
- Dual output: `index.js` and `vendor.js` bundles
- Development server on port 1235 with CORS headers
- File copying and asset optimization

## Key Architectural Patterns

### Page Module System
Each page has a corresponding module in `src/pages/` that exports:
```javascript
export default {
  init() {
    // Page-specific initialization
  },
  cleanup() {
    // Cleanup ScrollTriggers and event listeners
  }
}
```

### Animation Lifecycle
1. Page transitions managed by Barba.js hooks
2. ScrollTrigger cleanup on page exit
3. Dynamic module loading for page-specific animations
4. Webflow compatibility layer for CMS integration

### Responsive Development
- Uses `gsap.matchMedia()` with `isDesktop` breakpoint
- Custom cursor only on desktop devices
- Mobile-first responsive utilities

## Webflow Integration
- Maintains Webflow's `data-wf-page` attributes during transitions
- Reinitializes Webflow interactions (ix2) after page changes
- Compatible with Webflow's CMS and dynamic content

## Deployment
- Configured for Netlify deployment
- Build command: `npm run build`
- Publish directory: `dist`
- Custom headers configured in `_headers` file