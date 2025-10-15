// Utilities Index
// Centralized initialization and cleanup for all utility modules

import smoothScroll from './smoothScroll.js'
import dynamicYear from './dynamicYear.js'
import navBanner from './navBanner.js'
import createSplitTexts from './createSplitTexts.js'
import hubspotCTA from './hubspotCTA.js'

// List of all utility modules
const UTILITIES = [
  smoothScroll,
  dynamicYear,
  navBanner,
  createSplitTexts,
  hubspotCTA,
]

// Global state
let isInitialized = false

function init() {
  if (isInitialized) {
    console.warn('Utilities already initialized')
    return
  }

  try {
    UTILITIES.forEach(utility => {
      if (utility && typeof utility.init === 'function') {
        utility.init()
      } else {
        console.warn('Invalid utility module:', utility)
      }
    })

    isInitialized = true
  } catch (error) {
    console.error('Error initializing utilities:', error)
  }
}

function cleanup() {
  if (!isInitialized) {
    console.warn('Utilities not initialized, nothing to clean up')
    return
  }

  try {
    UTILITIES.forEach(utility => {
      if (utility && typeof utility.cleanup === 'function') {
        utility.cleanup()
      }
    })

    isInitialized = false
  } catch (error) {
    console.error('Error cleaning up utilities:', error)
  }
}

function getInitializationStatus() {
  return isInitialized
}

export default {
  init,
  cleanup,
  getInitializationStatus,
}