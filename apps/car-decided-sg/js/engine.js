export const DIMENSION_LABELS = {
  reliability: "reliability",
  safety: "safety",
  comfort: "comfort",
  technology: "technology",
  performance: "performance",
  service: "service support",
  resale: "resale confidence",
  space: "family space"
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function evRoadTaxAnnual(powerKw) {
  let base;
  if (powerKw <= 7.5) base = 200 * 0.782;
  else if (powerKw <= 30) base = (200 + 2 * (powerKw - 7.5)) * 0.782;
  else if (powerKw <= 230) base = (250 + 3.75 * (powerKw - 30)) * 0.782;
  else base = (1525 + 10 * (powerKw - 230)) * 0.782;
  return 2 * (base + 350);
}

export function petrolRoadTaxAnnual(engineCc) {
  let sixMonthly;
  if (engineCc <= 600) sixMonthly = 200 * 0.782;
  else if (engineCc <= 1000) sixMonthly = (200 + 0.125 * (engineCc - 600)) * 0.782;
  else if (engineCc <= 1600) sixMonthly = (250 + 0.375 * (engineCc - 1000)) * 0.782;
  else if (engineCc <= 3000) sixMonthly = (475 + 0.75 * (engineCc - 1600)) * 0.782;
  else sixMonthly = (1525 + (engineCc - 3000)) * 0.782;
  return 2 * sixMonthly;
}

export function annualRoadTax(car) {
  return car.powertrain === "EV"
    ? evRoadTaxAnnual(car.motorPowerKw)
    : petrolRoadTaxAnnual(car.engineCc);
}

export function calculateTco(car, profile, override = {}) {
  const years = Number(profile.years || 10);
  const price = Number(override.price ?? car.price);
  const insuranceAnnual = Number(override.insuranceAnnual ?? car.insuranceAnnual);
  const maintenanceAnnual = Number(override.maintenanceAnnual ?? car.maintenanceAnnual);
  const repairReserveAnnual = Number(override.repairReserveAnnual ?? car.repairReserveAnnual);
  const roadTaxAnnual = Number(override.roadTaxAnnual ?? annualRoadTax(car));
  const residualValue = Number(override.residualValue ?? car.residualValue);
  const loanPercent = clamp(Number(profile.loanPercent || 0), 0, 100) / 100;
  const loanYears = clamp(Number(profile.loanYears || 0), 0, years);
  const loanRate = Math.max(0, Number(profile.loanRate || 0)) / 100;
  const financing = price * loanPercent * loanRate * loanYears;
  const energyAnnual = car.powertrain === "EV"
    ? (Number(profile.annualKm) / 100) * car.consumption * Number(profile.electricityPrice)
    : (Number(profile.annualKm) / 100) * car.consumption * Number(profile.petrolPrice);
  const charger = car.powertrain === "EV" ? Number(profile.chargerCost || 0) : 0;
  const shared = Number(profile.parkingMonthly || 0) * 12 * years + Number(profile.erpAnnual || 0) * years;
  const breakdown = {
    purchase: price,
    financing,
    energy: energyAnnual * years,
    roadTax: roadTaxAnnual * years,
    insurance: insuranceAnnual * years,
    maintenance: maintenanceAnnual * years,
    repairs: repairReserveAnnual * years,
    charger,
    shared,
    residual: -residualValue
  };
  const total = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return { total, annual: total / years, monthly: total / years / 12, breakdown, assumptions: { price, insuranceAnnual, maintenanceAnnual, repairReserveAnnual, roadTaxAnnual, residualValue, energyAnnual } };
}

export function scoreCars(cars, profile, overrides = {}) {
  const withTco = cars.map(car => ({ car, tco: calculateTco(car, profile, overrides[car.id]) }));
  const totals = withTco.map(x => x.tco.total);
  const minTco = Math.min(...totals);
  const maxTco = Math.max(...totals);
  const spread = Math.max(1, maxTco - minTco);

  return withTco.map(({ car, tco }) => {
    const valueScore = 100 - ((tco.total - minTco) / spread) * 55;
    const dimensions = { ...car.scores, value: valueScore };
    const weights = profile.weights;
    const weightedKeys = ["reliability", "safety", "comfort", "technology", "performance", "value", "service", "space"];
    let numerator = 0;
    let denominator = 0;
    for (const key of weightedKeys) {
      numerator += dimensions[key] * Number(weights[key]);
      denominator += Number(weights[key]);
    }
    let fit = numerator / Math.max(1, denominator);
    const adjustments = [];
    if (profile.powertrain !== "Open" && car.powertrain !== profile.powertrain) {
      fit -= 11;
      adjustments.push("powertrain preference mismatch");
    }
    if (!profile.homeCharging && car.powertrain === "EV") {
      fit -= 8;
      adjustments.push("no home charging");
    }
    if (car.seats < Number(profile.passengers)) {
      fit -= 25;
      adjustments.push("insufficient seats");
    }
    if (car.price > Number(profile.maxPurchasePrice)) {
      const over = (car.price - Number(profile.maxPurchasePrice)) / Math.max(1, Number(profile.maxPurchasePrice));
      fit -= clamp(over * 55, 4, 20);
      adjustments.push("above purchase budget");
    }
    const emergingRisk = 100 - (car.scores.service * 0.55 + car.scores.resale * 0.45);
    const riskSensitivity = (100 - Number(profile.riskTolerance)) / 100;
    const riskPenalty = emergingRisk * riskSensitivity * 0.16;
    fit -= riskPenalty;
    if (riskPenalty > 3) adjustments.push("ownership-confidence penalty");

    const contributions = weightedKeys.map(key => ({
      key,
      label: key === "value" ? "10-year value" : DIMENSION_LABELS[key],
      score: dimensions[key],
      impact: dimensions[key] * Number(weights[key])
    })).sort((a, b) => b.impact - a.impact);
    const weakest = [...contributions].sort((a, b) => a.score - b.score)[0];
    return { car, tco, valueScore, dimensions, score: clamp(fit, 0, 100), contributions, weakest, adjustments };
  }).sort((a, b) => b.score - a.score);
}

export function selectRecommendations(scored) {
  const winner = scored[0];
  const remaining = scored.slice(1);
  const heart = [...remaining].sort((a, b) => {
    const aHeart = a.dimensions.technology * 0.58 + a.dimensions.performance * 0.42;
    const bHeart = b.dimensions.technology * 0.58 + b.dimensions.performance * 0.42;
    return bHeart - aHeart;
  })[0];
  const wildcard = remaining.find(item => item.car.powertrain !== winner.car.powertrain && item.car.id !== heart?.car.id)
    || remaining.find(item => item.car.id !== heart?.car.id)
    || remaining[0];
  return { winner, heart, wildcard };
}

export function explainRecommendation(result) {
  const top = result.contributions.slice(0, 3);
  return {
    headline: `${result.car.model} best balances ${top[0].label}, ${top[1].label} and ${top[2].label}.`,
    reasons: top.map(item => ({
      title: `${Math.round(item.score)}/100 for ${item.label}`,
      detail: `This mattered strongly because your ${item.label} weight is high.`
    })),
    caveat: `${result.weakest.label} is the clearest compromise at ${Math.round(result.weakest.score)}/100.`
  };
}

export const formatMoney = value => new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(value);
export const formatNumber = value => new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 }).format(value);
