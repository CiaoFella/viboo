// Dynamic Year Utility
// Updates elements with data-dynamic-year attribute to show current year

function init() {
  const yearElements = document.querySelectorAll('[data-dynamic-year]')
  const currentYear = new Date().getFullYear()

  yearElements.forEach(element => {
    element.textContent = currentYear
  })
}

function cleanup() {
  // No cleanup needed for this utility
}

export default {
  init,
  cleanup,
}