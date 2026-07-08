export const SNAPSHOT_DATE = "2026-07-08";

export const GLOBAL_SOURCES = [
  {
    id: "lta-tax",
    type: "official",
    title: "LTA vehicle tax structure",
    publisher: "Land Transport Authority",
    url: "https://onemotoring.lta.gov.sg/content/onemotoring/home/buying/upfront-vehicle-costs/tax-structure.html",
    checked: SNAPSHOT_DATE,
    note: "Road-tax formula, EV AFC, ARF tiers and the 2026 EEAI cap."
  },
  {
    id: "lta-parf",
    type: "official",
    title: "LTA PARF and COE rebates",
    publisher: "Land Transport Authority",
    url: "https://onemotoring.lta.gov.sg/content/onemotoring/home/buying/rebates/parf-coe-rebate.html",
    checked: SNAPSHOT_DATE,
    note: "Cars registered from the second February 2026 COE exercise receive 5% of ARF at age above 9 and not more than 10 years, capped at S$30,000."
  },
  {
    id: "coe-june",
    type: "market",
    title: "June 2026 COE bidding result",
    publisher: "Toyota Singapore",
    url: "https://www.toyota.com.sg/news-and-updates/local-news/coe-prices-and-latest-bidding-results",
    checked: "2026-06-17",
    note: "Context only. App vehicle prices are drive-away snapshots that already include COE unless marked otherwise."
  }
];

const common = {
  body: "SUV",
  seats: 5,
  purchaseIncludesCOE: true,
  priceConfidence: "medium",
  warrantyYears: 5,
  social: {
    confidence: "low",
    sampleLabel: "Limited Singapore owner evidence",
    positive: "Not enough consistent local owner evidence to claim a strong theme.",
    concern: "Treat brand-level quality scores as planning estimates until owner evidence deepens.",
    sources: []
  }
};

export const CARS = [
  {
    ...common,
    id: "tesla-model-y-rwd",
    brand: "Tesla",
    model: "Model Y",
    variant: "RWD 110",
    category: "A",
    powertrain: "EV",
    price: 222999,
    priceDate: "2026-07-07",
    priceConfidence: "high",
    priceNote: "Tesla estimated walk-away price with estimated COE; configuration can change the final price.",
    motorPowerKw: 110,
    rangeKm: 488,
    consumption: 16,
    consumptionUnit: "kWh/100km",
    cargoL: 2138,
    acceleration: 9.6,
    warrantyYears: 4,
    batteryWarrantyYears: 8,
    insuranceAnnual: 2600,
    maintenanceAnnual: 650,
    repairReserveAnnual: 1100,
    residualValue: 12000,
    scores: { reliability: 74, safety: 91, comfort: 84, technology: 97, performance: 67, service: 76, resale: 82, space: 94 },
    source: {
      type: "official", title: "Tesla Singapore Model Y", publisher: "Tesla Singapore",
      url: "https://www.tesla.com/en_sg/modely", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "official", title: "Tesla Singapore", publisher: "Tesla Singapore",
      url: "https://www.tesla.com/en_SG", checked: SNAPSHOT_DATE
    },
    social: {
      confidence: "medium",
      sampleLabel: "Singapore comparison threads",
      positive: "Software, charging integration and efficient packaging recur as reasons to choose it.",
      concern: "Touchscreen-first controls, insurance and repair experience divide owners.",
      sources: [
        { title: "Model Y or Sealion 7 discussion", url: "https://www.reddit.com/r/drivingsg/comments/1s2dzav/tesla_model_y_or_byd_sealion_7/" },
        { title: "Model Y vs Sealion 7 discussion", url: "https://www.reddit.com/r/drivingsg/comments/1r8z9z2/byd_sealion_7_or_tesla_model_y_2026/" }
      ]
    }
  },
  {
    ...common,
    id: "tesla-model-y-l",
    brand: "Tesla",
    model: "Model Y L",
    variant: "Premium",
    category: "B",
    powertrain: "EV",
    seats: 6,
    price: 265999,
    priceDate: "2026-07-07",
    priceConfidence: "high",
    priceNote: "Tesla estimated walk-away price with estimated COE.",
    motorPowerKw: 250,
    rangeKm: 681,
    consumption: 18.2,
    consumptionUnit: "kWh/100km",
    cargoL: 2539,
    acceleration: 5,
    warrantyYears: 4,
    batteryWarrantyYears: 8,
    insuranceAnnual: 3200,
    maintenanceAnnual: 750,
    repairReserveAnnual: 1250,
    residualValue: 15000,
    scores: { reliability: 75, safety: 92, comfort: 92, technology: 96, performance: 86, service: 76, resale: 82, space: 99 },
    source: {
      type: "official", title: "Tesla Singapore Model Y L", publisher: "Tesla Singapore",
      url: "https://www.tesla.com/en_sg/modely", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "official", title: "Tesla Singapore", publisher: "Tesla Singapore",
      url: "https://www.tesla.com/en_SG", checked: SNAPSHOT_DATE
    },
    social: {
      confidence: "low",
      sampleLabel: "New Singapore variant",
      positive: "Six-seat flexibility and exceptional range are the clearest early attractions.",
      concern: "Local long-run ownership evidence is still thin because the variant is new.",
      sources: []
    }
  },
  {
    ...common,
    id: "xpeng-g6-air",
    brand: "XPENG",
    model: "G6",
    variant: "Air 110kW",
    category: "A",
    powertrain: "EV",
    price: 192000,
    priceDate: "2026-03-06",
    priceConfidence: "low",
    priceNote: "Owner-reported transaction context, not a current dealer quote. Override before deciding.",
    motorPowerKw: 110,
    rangeKm: 470,
    consumption: 16.6,
    consumptionUnit: "kWh/100km",
    cargoL: 571,
    acceleration: 10.5,
    insuranceAnnual: 2400,
    maintenanceAnnual: 700,
    repairReserveAnnual: 1500,
    residualValue: 9000,
    scores: { reliability: 72, safety: 87, comfort: 91, technology: 93, performance: 56, service: 62, resale: 62, space: 91 },
    source: {
      type: "official", title: "XPENG G6 Singapore", publisher: "XPENG Singapore",
      url: "https://www.xpeng.com.sg/g6/", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "social", title: "Singapore owner price discussion", publisher: "r/drivingsg",
      url: "https://www.reddit.com/r/drivingsg/comments/1rmdp6k/to_all_xpeng_g6_owners_how_is_your_car_so_far/", checked: "2026-03-06"
    },
    social: {
      confidence: "medium",
      sampleLabel: "Recent Singapore owner threads",
      positive: "Owners repeatedly praise cabin comfort, equipment and aggressive value.",
      concern: "After-sales depth, resale uncertainty and differences between camera packages recur as watch-outs.",
      sources: [
        { title: "Singapore G6 owner check-in", url: "https://www.reddit.com/r/drivingsg/comments/1rmdp6k/to_all_xpeng_g6_owners_how_is_your_car_so_far/" },
        { title: "Singapore camera-package discussion", url: "https://www.reddit.com/r/Xpeng/comments/1u2h27d/g6_5_camera_version/" }
      ]
    }
  },
  {
    ...common,
    id: "byd-sealion-7-dynamic",
    brand: "BYD",
    model: "Sealion 7",
    variant: "Dynamic 100kW",
    category: "A",
    powertrain: "EV",
    price: 205388,
    priceDate: SNAPSHOT_DATE,
    priceConfidence: "medium",
    priceNote: "Guaranteed-COE dealer promotion with finance, insurance and trade-in conditions.",
    motorPowerKw: 100,
    rangeKm: 405,
    consumption: 19.9,
    consumptionUnit: "kWh/100km",
    cargoL: 500,
    acceleration: 11.5,
    batteryWarrantyYears: 10,
    insuranceAnnual: 2300,
    maintenanceAnnual: 700,
    repairReserveAnnual: 1200,
    residualValue: 10000,
    scores: { reliability: 78, safety: 87, comfort: 90, technology: 87, performance: 48, service: 80, resale: 71, space: 91 },
    source: {
      type: "official", title: "BYD Sealion 7 Singapore", publisher: "BYD Singapore",
      url: "https://www.byd.com/sg/car/sealion7", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "dealer", title: "Sealion 7 offer", publisher: "BYD by 1826",
      url: "https://byd.1826.sg/byd-sealion-7", checked: SNAPSHOT_DATE
    },
    social: {
      confidence: "medium",
      sampleLabel: "Singapore owner and buyer threads",
      positive: "Space, cabin equipment and a familiar local dealer footprint are recurring positives.",
      concern: "The Cat A tune is often described as adequate in Singapore but compromised for Malaysian highway overtaking.",
      sources: [
        { title: "Singapore Dynamic owner discussion", url: "https://www.reddit.com/r/drivingsg/comments/1q3gw8y/byd_sealion_7_dynamic/" },
        { title: "Dynamic trim experience", url: "https://www.reddit.com/r/drivingsg/comments/1np5ucd/anyone_have_experience_with_the_byd_sealion_7/" }
      ]
    }
  },
  {
    ...common,
    id: "kia-ev5-air",
    brand: "Kia",
    model: "EV5",
    variant: "Air Standard Range",
    category: "A",
    powertrain: "EV",
    price: 195999,
    priceDate: SNAPSHOT_DATE,
    priceConfidence: "high",
    priceNote: "Official starting price; confirm COE package and subsidies with dealer.",
    motorPowerKw: 100,
    rangeKm: 400,
    consumption: 18.2,
    consumptionUnit: "kWh/100km",
    cargoL: 513,
    acceleration: 10.9,
    warrantyYears: 7,
    batteryWarrantyYears: 7,
    insuranceAnnual: 2300,
    maintenanceAnnual: 750,
    repairReserveAnnual: 900,
    residualValue: 12000,
    scores: { reliability: 85, safety: 90, comfort: 89, technology: 84, performance: 52, service: 89, resale: 78, space: 94 },
    source: {
      type: "official", title: "Kia EV5 specifications", publisher: "Kia Singapore",
      url: "https://www.kia.com/sg/showroom/ev5/specification.html", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "official", title: "Kia EV5", publisher: "Kia Singapore",
      url: "https://www.kia.com/sg/showroom/ev5/features.html", checked: SNAPSHOT_DATE
    }
  },
  {
    ...common,
    id: "volvo-ex30-plus",
    brand: "Volvo",
    model: "EX30",
    variant: "Plus Single Motor",
    category: "A",
    powertrain: "EV",
    price: 189999,
    priceDate: SNAPSHOT_DATE,
    priceConfidence: "high",
    priceNote: "Official advertised offer; final configuration and COE terms may differ.",
    motorPowerKw: 110,
    rangeKm: 339,
    consumption: 17,
    consumptionUnit: "kWh/100km",
    cargoL: 318,
    acceleration: 8.6,
    insuranceAnnual: 2600,
    maintenanceAnnual: 850,
    repairReserveAnnual: 1000,
    residualValue: 12000,
    scores: { reliability: 82, safety: 96, comfort: 77, technology: 87, performance: 66, service: 87, resale: 77, space: 66 },
    source: {
      type: "official", title: "Volvo EX30 specifications", publisher: "Volvo Cars Singapore",
      url: "https://www.volvocars.com/sg/cars/ex30-electric/specifications/", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "official", title: "Volvo Singapore sales offers", publisher: "Volvo Cars Singapore",
      url: "https://www.volvocars.com/sg/l/sales-offers/", checked: SNAPSHOT_DATE
    }
  },
  {
    ...common,
    id: "honda-hrv-hybrid",
    brand: "Honda",
    model: "HR-V",
    variant: "HX e:HEV",
    category: "A",
    powertrain: "Hybrid",
    price: 200999,
    priceDate: SNAPSHOT_DATE,
    priceConfidence: "high",
    priceNote: "Official essential price, subject to appointed finance/insurance and COE package terms.",
    engineCc: 1498,
    rangeKm: null,
    consumption: 4.3,
    consumptionUnit: "L/100km",
    cargoL: 335,
    acceleration: 10.6,
    insuranceAnnual: 2000,
    maintenanceAnnual: 1100,
    repairReserveAnnual: 700,
    residualValue: 15000,
    scores: { reliability: 91, safety: 87, comfort: 81, technology: 69, performance: 52, service: 94, resale: 89, space: 74 },
    source: {
      type: "official", title: "Honda Singapore models", publisher: "Kah Motor",
      url: "https://www.honda.com.sg/models.html", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "official", title: "Honda Singapore price guide", publisher: "Kah Motor",
      url: "https://www.honda.com.sg/shopping-tools/price-guide.html", checked: SNAPSHOT_DATE
    }
  },
  {
    ...common,
    id: "honda-zrv-hybrid",
    brand: "Honda",
    model: "ZR-V",
    variant: "2.0 e:HEV",
    category: "B",
    powertrain: "Hybrid",
    price: 223999,
    priceDate: SNAPSHOT_DATE,
    priceConfidence: "high",
    priceNote: "Official essential price, subject to appointed finance/insurance and COE package terms.",
    engineCc: 1993,
    consumption: 5,
    consumptionUnit: "L/100km",
    cargoL: 370,
    acceleration: 8,
    insuranceAnnual: 2300,
    maintenanceAnnual: 1200,
    repairReserveAnnual: 750,
    residualValue: 16000,
    scores: { reliability: 90, safety: 90, comfort: 86, technology: 75, performance: 69, service: 94, resale: 87, space: 83 },
    source: {
      type: "official", title: "Honda Singapore models", publisher: "Kah Motor",
      url: "https://www.honda.com.sg/models.html", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "official", title: "Honda Singapore price guide", publisher: "Kah Motor",
      url: "https://www.honda.com.sg/shopping-tools/price-guide.html", checked: SNAPSHOT_DATE
    }
  },
  {
    ...common,
    id: "honda-crv-5",
    brand: "Honda",
    model: "CR-V",
    variant: "1.5 Turbo 5-Seater",
    category: "B",
    powertrain: "Petrol",
    price: 248999,
    priceDate: SNAPSHOT_DATE,
    priceConfidence: "high",
    priceNote: "Official essential price after anniversary discount; subject to finance/insurance and COE terms.",
    engineCc: 1498,
    consumption: 7.2,
    consumptionUnit: "L/100km",
    cargoL: 589,
    acceleration: 9.2,
    insuranceAnnual: 2400,
    maintenanceAnnual: 1400,
    repairReserveAnnual: 850,
    residualValue: 17000,
    scores: { reliability: 89, safety: 91, comfort: 93, technology: 73, performance: 67, service: 94, resale: 88, space: 97 },
    source: {
      type: "official", title: "Honda CR-V", publisher: "Kah Motor",
      url: "https://www.honda.com.sg/models.html", checked: SNAPSHOT_DATE
    },
    priceSource: {
      type: "official", title: "Honda Singapore price guide", publisher: "Kah Motor",
      url: "https://www.honda.com.sg/shopping-tools/price-guide.html", checked: SNAPSHOT_DATE
    }
  }
];

export const DEFAULT_PROFILE = {
  annualKm: 20000,
  years: 10,
  passengers: 4,
  homeCharging: true,
  powertrain: "Open",
  maxPurchasePrice: 240000,
  riskTolerance: 55,
  electricityPrice: 0.45,
  petrolPrice: 2.85,
  loanPercent: 60,
  loanRate: 2.48,
  loanYears: 7,
  parkingMonthly: 0,
  erpAnnual: 0,
  chargerCost: 0,
  weights: {
    reliability: 82,
    safety: 88,
    comfort: 72,
    technology: 91,
    performance: 54,
    value: 84,
    service: 72,
    space: 80
  }
};
