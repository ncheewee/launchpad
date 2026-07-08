import test from "node:test";
import assert from "node:assert/strict";
import { CARS, DEFAULT_PROFILE } from "../data/cars.js";
import { calculateTco, evRoadTaxAnnual, petrolRoadTaxAnnual, scoreCars, selectRecommendations } from "../js/engine.js";

const profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

test("LTA EV road-tax formula includes the S$350 six-monthly AFC", () => {
  assert.equal(Math.round(evRoadTaxAnnual(100)), 1502);
  assert.equal(Math.round(evRoadTaxAnnual(110)), 1560);
});

test("LTA petrol road-tax formula handles a 1,498cc engine", () => {
  assert.equal(Math.round(petrolRoadTaxAnnual(1498)), 683);
});

test("TCO equals the sum of visible breakdown components", () => {
  const car = CARS.find(item => item.id === "tesla-model-y-rwd");
  const result = calculateTco(car, profile);
  const sum = Object.values(result.breakdown).reduce((total, value) => total + value, 0);
  assert.equal(result.total, sum);
  assert.equal(Math.round(result.monthly * 120), Math.round(result.total));
});

test("a purchase-price override flows through TCO", () => {
  const car = CARS[0];
  const baseline = calculateTco(car, profile);
  const cheaper = calculateTco(car, profile, { price: car.price - 10000 });
  const expectedSaving = 10000 + (10000 * profile.loanPercent / 100 * profile.loanRate / 100 * profile.loanYears);
  assert.equal(Math.round(baseline.total - cheaper.total), Math.round(expectedSaving));
});

test("no home charging reduces EV fit without changing hybrid fit", () => {
  const home = scoreCars(CARS, profile);
  const publicOnly = scoreCars(CARS, { ...profile, homeCharging: false });
  const evId = "tesla-model-y-rwd";
  const hybridId = "honda-hrv-hybrid";
  assert.equal(
    Math.round(home.find(item => item.car.id === evId).score - publicOnly.find(item => item.car.id === evId).score),
    8
  );
  assert.equal(
    Math.round(home.find(item => item.car.id === hybridId).score - publicOnly.find(item => item.car.id === hybridId).score),
    0
  );
});

test("recommendation selection returns three different cars", () => {
  const selected = selectRecommendations(scoreCars(CARS, profile));
  const ids = [selected.winner.car.id, selected.heart.car.id, selected.wildcard.car.id];
  assert.equal(new Set(ids).size, 3);
});
