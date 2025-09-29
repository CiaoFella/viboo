import { gsap } from '../../vendor.js'

let ctx

// Calculation constants and data - configurable via data attributes
const CALCULATION_DATA = {
  // Heating type price values (CHF/kWh)
  heatingTypes: {
    gas: 0.14,
    oil: 0.11,
    'district-heating': 0.12,
    'heat-pump': 0.08,
  },

  // Building age values (kWh/m²·a)
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
    yes: 0.7, // Ja (Sanierung-Faktor)
  },

  // Viboo specific constants
  viboo: {
    savingsRate: 0.27, // viboo-Sparrate
    m2PerDevice: 20, // m² pro Gerät
    deviceCost: 150, // Gerätekosten (CHF)
    yearlySubscription: 18, // Abo pro Gerät/Jahr (CHF)
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
    loadConfiguration()
    initializeElements()
    setupRangeSlider()
    setupFormHandlers()
    initializeFromHTML()
    updateSliderPosition()
    updateResults()
  })
}

// Load configuration from data attributes on the page
function loadConfiguration() {
  const configElement = document.querySelector('[data-calculator-config]')
  if (configElement) {
    // Load individual heating type values
    const gasPrice = configElement.getAttribute('data-price-gas')
    if (gasPrice) CALCULATION_DATA.heatingTypes.gas = parseFloat(gasPrice)

    const oilPrice = configElement.getAttribute('data-price-oil')
    if (oilPrice) CALCULATION_DATA.heatingTypes.oil = parseFloat(oilPrice)

    const districtHeatingPrice = configElement.getAttribute('data-price-district-heating')
    if (districtHeatingPrice) CALCULATION_DATA.heatingTypes['district-heating'] = parseFloat(districtHeatingPrice)

    const heatPumpPrice = configElement.getAttribute('data-price-heat-pump')
    if (heatPumpPrice) CALCULATION_DATA.heatingTypes['heat-pump'] = parseFloat(heatPumpPrice)

    // Load building age consumption values
    const age1920 = configElement.getAttribute('data-consumption-1920')
    if (age1920) CALCULATION_DATA.buildingAge[1920] = parseFloat(age1920)

    const age1950 = configElement.getAttribute('data-consumption-1950')
    if (age1950) CALCULATION_DATA.buildingAge[1950] = parseFloat(age1950)

    const age1980 = configElement.getAttribute('data-consumption-1980')
    if (age1980) CALCULATION_DATA.buildingAge[1980] = parseFloat(age1980)

    const age2000 = configElement.getAttribute('data-consumption-2000')
    if (age2000) CALCULATION_DATA.buildingAge[2000] = parseFloat(age2000)

    const age2020 = configElement.getAttribute('data-consumption-2020')
    if (age2020) CALCULATION_DATA.buildingAge[2020] = parseFloat(age2020)

    // Load viboo configuration
    const vibooSavingsRate = configElement.getAttribute('data-viboo-savings-rate')
    if (vibooSavingsRate) CALCULATION_DATA.viboo.savingsRate = parseFloat(vibooSavingsRate)

    const vibooM2PerDevice = configElement.getAttribute('data-viboo-m2-per-device')
    if (vibooM2PerDevice) CALCULATION_DATA.viboo.m2PerDevice = parseFloat(vibooM2PerDevice)

    const vibooDeviceCost = configElement.getAttribute('data-viboo-device-cost')
    if (vibooDeviceCost) CALCULATION_DATA.viboo.deviceCost = parseFloat(vibooDeviceCost)

    const vibooYearlySubscription = configElement.getAttribute('data-viboo-yearly-subscription')
    if (vibooYearlySubscription) CALCULATION_DATA.viboo.yearlySubscription = parseFloat(vibooYearlySubscription)

    // Load renovation factor
    const renovationFactor = configElement.getAttribute('data-renovation-factor')
    if (renovationFactor) CALCULATION_DATA.renovation.yes = parseFloat(renovationFactor)
  }
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
    selectElement.value = '200'
  }

  // Select "Nein" as default for renovation
  const noRenovationRadio = document.querySelector('input[name="last-10-years"][value="no"]')
  if (noRenovationRadio) {
    noRenovationRadio.checked = true
  }
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
  const rawSize = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * percentage
  // Round to nearest 5m² step
  const size = Math.round(rawSize / 5) * 5
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
  // Round to nearest 5m² step
  const roundedValue = Math.round(value / 5) * 5
  currentInputs.size = Math.max(MIN_SIZE, Math.min(MAX_SIZE, roundedValue)) // Enforce min/max limits

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

  // Get values from configuration
  const heatingTypeValue = defaultHeatingType // CHF/kWh
  const ageValue = parseInt(defaultBuildingPeriod) // kWh/m²·a
  const retrofitValue = defaultRenovated ? CALCULATION_DATA.renovation.yes : CALCULATION_DATA.renovation.no
  const vibooRate = CALCULATION_DATA.viboo.savingsRate // Always use viboo savings rate

  // Calculate energy consumption and savings
  // Verbrauch final: ageValue * retrofitValue (kWh/m²·a)
  const finalConsumption = ageValue * retrofitValue

  // Annual energy consumption: finalConsumption * size (kWh/Jahr)
  const annualEnergyConsumption = finalConsumption * size

  // Annual energy cost without viboo: annualEnergyConsumption * heatingTypeValue (CHF/Jahr)
  const annualEnergyCost = annualEnergyConsumption * heatingTypeValue

  // Energy Savings with viboo: annualEnergyCost * vibooRate
  const energySavings = annualEnergyCost * vibooRate

  // Number of devices: size / m2PerDevice
  const numberOfDevices = Math.ceil(size / CALCULATION_DATA.viboo.m2PerDevice)

  // Investment Cost: numberOfDevices * deviceCost
  const investmentCost = numberOfDevices * CALCULATION_DATA.viboo.deviceCost

  // Yearly subscription: numberOfDevices * yearlySubscription
  const yearlyCost = numberOfDevices * CALCULATION_DATA.viboo.yearlySubscription

  // Amortization: investmentCost / (energySavings - yearlyCost)
  const netAnnualSavings = energySavings - yearlyCost
  const amortizationYears = netAnnualSavings > 0 ? investmentCost / netAnnualSavings : 0.0


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
    yearsElement.textContent = results.amortizationYears.toFixed(2)
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
