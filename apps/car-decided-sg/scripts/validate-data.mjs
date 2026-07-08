import { CARS, GLOBAL_SOURCES } from "../data/cars.js";

const errors = [];
const ids = new Set();
const scoreKeys = ["reliability", "safety", "comfort", "technology", "performance", "service", "resale", "space"];

for (const car of CARS) {
  if (!car.id || ids.has(car.id)) errors.push(`Missing or duplicate id: ${car.id}`);
  ids.add(car.id);
  for (const key of ["brand", "model", "variant", "powertrain", "price", "priceDate", "consumption", "consumptionUnit", "source", "priceSource"]) {
    if (car[key] === undefined || car[key] === null || car[key] === "") errors.push(`${car.id}: missing ${key}`);
  }
  if (car.powertrain === "EV" && !Number.isFinite(car.motorPowerKw)) errors.push(`${car.id}: EV missing motorPowerKw`);
  if (car.powertrain !== "EV" && !Number.isFinite(car.engineCc)) errors.push(`${car.id}: combustion/hybrid missing engineCc`);
  for (const key of scoreKeys) {
    if (!Number.isFinite(car.scores?.[key]) || car.scores[key] < 0 || car.scores[key] > 100) errors.push(`${car.id}: invalid score ${key}`);
  }
  for (const source of [car.source, car.priceSource]) {
    if (!/^https:\/\//.test(source.url)) errors.push(`${car.id}: invalid source URL`);
    if (!source.checked) errors.push(`${car.id}: source missing checked date`);
  }
}

for (const source of GLOBAL_SOURCES) {
  if (!/^https:\/\//.test(source.url)) errors.push(`Global source ${source.id}: invalid URL`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${CARS.length} cars and ${GLOBAL_SOURCES.length} global sources.`);
}
