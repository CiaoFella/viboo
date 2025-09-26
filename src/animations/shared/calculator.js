import { gsap } from '../../vendor.js'

let ctx

// Calculation constants and data - matching the old calculator exactly
const CALCULATION_DATA = {
  // Heating type price values (used as multipliers in energy savings formula)
  heatingTypes: {
    gas: 0.14,
    oil: 0.11,
    'district-heating': 0.12,
    'heat-pump': 0.08,
  },

  // Building age values (energy consumption base values)
  buildingAge: {
    1920: 200, // vor 1920
    1950: 140, // 1920-1950
    1980: 90, // 1950-1980
    2000: 70, // 1980-2000
    2020: 30, // nach 2000
  },

  // Renovation multipliers
  renovation: {
    no: 1, // Nein
    yes: 0.7, // Ja
  },
}

// State variables
let currentInputs = {
  heatingType: 0.14, // Default to Gas
  buildingPeriod: 200, // Default to "Vor 1920"
  renovated: false, // Default to "Nein"
  size: 2000, // Default size
}

// Range slider variables
let isDragging = false
let sliderWrap = null
let sliderCircle = null
let sliderText = null
const MIN_SIZE = 0
const MAX_SIZE = 15000

function init() {
  ctx = gsap.context(() => {
    initializeElements()
    setupRangeSlider()
    setupFormHandlers()
    initializeFromHTML()
    updateSliderPosition()
    updateResults()
  })
}

function initializeFromHTML() {
  // Initialize size from the HTML input value
  const rangeInput = document.querySelector('[data-anm-calculator="range-slider-input"]')
  if (rangeInput && rangeInput.value) {
    currentInputs.size = parseInt(rangeInput.value) || 2000
  }

  // Set default selections in the HTML
  // Select Gas (0.14) as default heating type
  const gasRadio = document.querySelector('input[name="heating-type"][value="0.14"]')
  if (gasRadio) {
    gasRadio.checked = true
  }

  // Select "vor 1920" (200) as default building age
  const selectElement = document.querySelector('[data-anm-calculator="select"]')
  if (selectElement) {
    selectElement.value = "200"
  }

  // Select "Nein" as default for renovation
  const noRenovationRadio = document.querySelector('input[name="last-10-years"][value="no"]')
  if (noRenovationRadio) {
    noRenovationRadio.checked = true
  }

  console.log('Initialized with defaults - Gas, vor 1920, Nein, size:', currentInputs.size)
}

function initializeElements() {
  sliderWrap = document.querySelector('[data-anm-calculator="range-slider"]')
  sliderCircle = document.querySelector('[data-anm-calculator="range-circle"]')
  sliderText = document.querySelector('[data-anm-calculator="range-text"]')

  if (!sliderWrap || !sliderCircle || !sliderText) {
    console.warn('Calculator elements not found')
    return
  }

  // Set initial position
  updateSliderPosition()
}

function setupRangeSlider() {
  if (!sliderWrap || !sliderCircle) return

  // Mouse events
  sliderCircle.addEventListener('mousedown', startDragging)
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDragging)

  // Touch events for mobile
  sliderCircle.addEventListener('touchstart', startDragging, { passive: false })
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('touchend', stopDragging)

  // Click on slider track
  sliderWrap.addEventListener('click', handleSliderClick)
}

function startDragging(e) {
  e.preventDefault()
  isDragging = true
  sliderCircle.style.cursor = 'grabbing'
}

function handleDrag(e) {
  if (!isDragging || !sliderWrap) return

  e.preventDefault()

  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const rect = sliderWrap.getBoundingClientRect()
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))

  updateSliderValue(percentage)
}

function handleSliderClick(e) {
  if (isDragging || !sliderWrap) return

  const rect = sliderWrap.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))

  updateSliderValue(percentage)
}

function stopDragging() {
  if (isDragging) {
    isDragging = false
    sliderCircle.style.cursor = 'grab'
  }
}

function updateSliderValue(percentage) {
  const size = Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * percentage)
  currentInputs.size = size

  updateSliderPosition()
  updateNumberInput()
  updateResults()
}

function updateSliderPosition() {
  if (!sliderCircle || !sliderWrap) return

  const percentage = (currentInputs.size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)
  const position = percentage * 100

  gsap.set(sliderCircle, { left: `${position}%` })
  sliderWrap.style.setProperty('--slider-progress', `${position}%`)

  // Update text if it exists (optional)
  if (sliderText) {
    sliderText.textContent = currentInputs.size.toLocaleString('de-CH')
  }
}

function setupFormHandlers() {
  // Radio button handlers
  const radioButtons = document.querySelectorAll('[data-anm-calculator="radio"]')
  radioButtons.forEach(radio => {
    radio.addEventListener('change', handleRadioChange)
  })

  // Select dropdown handler
  const selectElement = document.querySelector('[data-anm-calculator="select"]')
  if (selectElement) {
    selectElement.addEventListener('change', handleSelectChange)
  }

  // Range slider input handler (number input)
  const rangeInput = document.querySelector('[data-anm-calculator="range-slider-input"]')
  if (rangeInput) {
    rangeInput.addEventListener('input', handleRangeInputChange)
    rangeInput.addEventListener('change', handleRangeInputChange)
  }
}

function handleRadioChange(e) {
  const name = e.target.name
  const value = e.target.value

  if (name === 'heating-type') {
    // Store the heating type value directly as it appears in the old calculator
    currentInputs.heatingType = parseFloat(value)
  } else if (name === 'last-10-years') {
    currentInputs.renovated = value === 'yes'
  }

  updateResults()
}

function handleSelectChange(e) {
  // Store the age value directly as it appears in the old calculator
  currentInputs.buildingPeriod = e.target.value
  updateResults()
}

function handleRangeInputChange(e) {
  // Handle the new number input for building size
  const value = parseInt(e.target.value) || 0
  currentInputs.size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, value)) // Enforce min/max limits

  // Update the visual slider position to match
  updateSliderPosition()
  updateResults()
}

function updateNumberInput() {
  // Update the number input to match the slider value
  const rangeInput = document.querySelector('[data-anm-calculator="range-slider-input"]')
  if (rangeInput) {
    rangeInput.value = currentInputs.size
  }
}

function calculateResults() {
  const { heatingType, buildingPeriod, renovated, size } = currentInputs

  // Use default values for missing inputs to allow partial calculations
  const defaultHeatingType = heatingType || 0.14
  const defaultBuildingPeriod = buildingPeriod || 200
  const defaultRenovated = renovated !== null ? renovated : false

  // Get values exactly as in the old calculator
  const heatingTypeValue = defaultHeatingType
  const ageValue = parseInt(defaultBuildingPeriod)
  const retrofitValue = defaultRenovated ? 0.7 : 1

  // Debug logging
  console.log('Calculator inputs:', {
    heatingType: heatingTypeValue,
    buildingPeriod: ageValue,
    renovated: defaultRenovated,
    retrofitValue,
    size
  })

  // Old calculator formulas (exactly as in the HTML):
  // Energy Savings: [age] * [area] * [heatingtype1] * [retrofit1] * 0.25
  const energySavings = ageValue * size * heatingTypeValue * retrofitValue * 0.25

  // Investment Cost: [area] / 15 * 150
  const investmentCost = (size / 15) * 150

  // Yearly Cost (subscription): [area] / 15 * 18
  const yearlyCost = (size / 15) * 18

  // Amortization: [investmentcost] / ([energysavings] - [yearlycost])
  const netAnnualSavings = energySavings - yearlyCost
  const amortizationYears = netAnnualSavings > 0 ? investmentCost / netAnnualSavings : 0.0

  console.log('Calculator results:', {
    energySavings,
    investmentCost,
    yearlyCost,
    netAnnualSavings,
    amortizationYears: amortizationYears.toFixed(1)
  })

  return {
    amortizationYears: Math.max(0.1, amortizationYears),
    annualSavings: Math.max(0, energySavings), // Display gross energy savings, not net
    netSavings: Math.max(0, netAnnualSavings), // Keep net for calculation reference
  }
}

function updateResults() {
  const results = calculateResults()

  // Update result display elements
  const yearsElement = document.querySelector('[data-anm-calculator="result-years"]')
  const moneyElement = document.querySelector('[data-anm-calculator="result-money"]')

  if (yearsElement) {
    yearsElement.textContent = results.amortizationYears.toFixed(1)
  }

  if (moneyElement) {
    moneyElement.textContent = Math.round(results.annualSavings).toLocaleString('de-CH')
  }
}

function cleanup() {
  // Remove event listeners
  if (sliderCircle) {
    sliderCircle.removeEventListener('mousedown', startDragging)
    sliderCircle.removeEventListener('touchstart', startDragging)
  }

  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDragging)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('touchend', stopDragging)

  if (sliderWrap) {
    sliderWrap.removeEventListener('click', handleSliderClick)
  }

  const radioButtons = document.querySelectorAll('[data-anm-calculator="radio"]')
  radioButtons.forEach(radio => {
    radio.removeEventListener('change', handleRadioChange)
  })

  const selectElement = document.querySelector('[data-anm-calculator="select"]')
  if (selectElement) {
    selectElement.removeEventListener('change', handleSelectChange)
  }

  const rangeInput = document.querySelector('[data-anm-calculator="range-slider-input"]')
  if (rangeInput) {
    rangeInput.removeEventListener('input', handleRangeInputChange)
    rangeInput.removeEventListener('change', handleRangeInputChange)
  }

  ctx && ctx.revert()
}

export default {
  init,
  cleanup,
}
