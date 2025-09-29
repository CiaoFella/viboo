# Calculator Configuration Guide for Webflow

## How to Configure Calculator Values in Webflow

The calculator now supports configuring all values directly in your Webflow markup without modifying the JavaScript code. Since Webflow doesn't support JSON in attributes, use individual data attributes.

## Configuration Options

### 1. Add Configuration Container
Add a div element in your Webflow page with the attribute `data-calculator-config` and individual data attributes for each value:

```html
<div data-calculator-config
     data-price-gas="0.14"
     data-price-oil="0.11"
     data-price-district-heating="0.12"
     data-price-heat-pump="0.08"
     data-consumption-1920="200"
     data-consumption-1950="140"
     data-consumption-1980="90"
     data-consumption-2000="70"
     data-consumption-2020="30"
     data-viboo-savings-rate="0.27"
     data-viboo-m2-per-device="20"
     data-viboo-device-cost="150"
     data-viboo-yearly-subscription="18"
     data-renovation-factor="0.7"
     style="display: none;">
</div>
```

### 2. Configurable Values

#### Heating Types (CHF/kWh)
- `gas`: 0.14
- `oil`: 0.11
- `district-heating`: 0.12
- `heat-pump`: 0.08

#### Building Age (kWh/m²·a)
- `1920`: 200 (Vor 1920)
- `1950`: 140 (1920-1950)
- `1980`: 90 (1950-1980)
- `2000`: 70 (1980-2000)
- `2020`: 30 (Nach 2000)

#### Viboo Configuration
- `savingsRate`: 0.27 (viboo-Sparrate)
- `m2PerDevice`: 20 (m² pro Gerät)
- `deviceCost`: 150 (Gerätekosten CHF)
- `yearlySubscription`: 18 (Abo pro Gerät/Jahr CHF)

#### Renovation Factor
- `data-renovation-factor`: 0.7 (Sanierung-Faktor)

### 3. Form Elements Required

Make sure your form includes these elements:

```html
<!-- Building Size Input -->
<input type="number"
       data-anm-calculator="range-slider-input"
       step="5"
       min="0"
       max="15000"
       value="2000">

<!-- Heating Type Radio Buttons -->
<input type="radio" name="heating-type" value="0.14" data-anm-calculator="radio"> Gas
<input type="radio" name="heating-type" value="0.11" data-anm-calculator="radio"> Heizöl
<input type="radio" name="heating-type" value="0.12" data-anm-calculator="radio"> Fernwärme
<input type="radio" name="heating-type" value="0.08" data-anm-calculator="radio"> Wärmepumpe

<!-- Building Age Select -->
<select data-anm-calculator="select">
  <option value="200">Vor 1920</option>
  <option value="140">1920-1950</option>
  <option value="90">1950-1980</option>
  <option value="70">1980-2000</option>
  <option value="30">Nach 2000</option>
</select>

<!-- Renovation Radio Buttons -->
<input type="radio" name="last-10-years" value="no" data-anm-calculator="radio"> Nein
<input type="radio" name="last-10-years" value="yes" data-anm-calculator="radio"> Ja

<!-- Viboo is always enabled - no user control needed -->

<!-- Result Display Elements -->
<span data-anm-calculator="result-years">0.0</span> Jahre
<span data-anm-calculator="result-money">0</span> CHF
```

## Example Calculation

With these inputs:
- Fläche: 10,000 m²
- Energieträger: Gas (0.14 CHF/kWh)
- Bauperiode: Vor 1920 (200 kWh/m²·a)
- Sanierung: Nein (factor 1.0)

The calculation will be:
1. Annual consumption: 200 × 10,000 × 1.0 = 2,000,000 kWh
2. Annual energy cost: 2,000,000 × 0.14 = 280,000 CHF
3. Viboo savings: 280,000 × 0.27 = 75,600 CHF
4. Number of devices: 10,000 ÷ 20 = 500
5. Investment: 500 × 150 = 75,000 CHF
6. Annual subscription: 500 × 18 = 9,000 CHF
7. Net savings: 75,600 - 9,000 = 66,600 CHF
8. Amortization: 75,000 ÷ 66,600 = 1.13 years

## Updating Values in Webflow

1. Select the configuration div in Webflow Designer
2. Go to Element Settings → Custom Attributes
3. Add each attribute individually with its value:
   - Name: `data-calculator-config` Value: (leave empty, just marks this as config element)
   - Name: `data-price-gas` Value: `0.14`
   - Name: `data-price-oil` Value: `0.11`
   - etc...
4. Publish your changes

The calculator will automatically read these values when the page loads.

## Attribute Reference

| Attribute Name | Description | Default Value |
|---------------|-------------|---------------|
| `data-price-gas` | Gas price (CHF/kWh) | 0.14 |
| `data-price-oil` | Oil price (CHF/kWh) | 0.11 |
| `data-price-district-heating` | District heating price (CHF/kWh) | 0.12 |
| `data-price-heat-pump` | Heat pump price (CHF/kWh) | 0.08 |
| `data-consumption-1920` | Consumption for buildings before 1920 (kWh/m²·a) | 200 |
| `data-consumption-1950` | Consumption for 1920-1950 buildings (kWh/m²·a) | 140 |
| `data-consumption-1980` | Consumption for 1950-1980 buildings (kWh/m²·a) | 90 |
| `data-consumption-2000` | Consumption for 1980-2000 buildings (kWh/m²·a) | 70 |
| `data-consumption-2020` | Consumption for buildings after 2000 (kWh/m²·a) | 30 |
| `data-viboo-savings-rate` | Viboo savings rate | 0.27 |
| `data-viboo-m2-per-device` | Square meters per device | 20 |
| `data-viboo-device-cost` | Cost per device (CHF) | 150 |
| `data-viboo-yearly-subscription` | Yearly subscription per device (CHF) | 18 |
| `data-renovation-factor` | Renovation factor | 0.7 |