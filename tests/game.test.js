import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, migrateLayout, getMetrics, getTargets, getPreview, performAction, chooseStrategy, playCard, endTurn, getCardDefinitions, getStrategyDefinitions } from '../src/game.js';
import { BLOCK_LAYOUT, LOT_LAYOUT, LAYOUT_VERSION } from '../src/layout.js';

function successful(result) {
  assert.equal(result.ok, true, result.message);
  return result.state;
}

function card(state, key) {
  // Fixtures can inject one policy to test a deterministic, focused rule.
  const next = structuredClone(state);
  next.hand.push({ id: `fixture-${key}`, key, retained: false });
  return next;
}

test('initial scenario is deterministic and card definitions resolve every hand entry', () => {
  const first = createGame(2028);
  assert.deepEqual(first, createGame(2028));
  assert.notDeepEqual(first.hand, createGame(2049).hand);
  assert.equal(getMetrics(first).population, 2050);
  assert.equal(getMetrics(first).capacity, 2340);
  assert.equal(getMetrics(first).upgraded, 1);
  assert.equal(getMetrics(first).coverage, 0);
  assert.equal(first.hand.length, 3);
  assert.equal(getStrategyDefinitions().length, 3);
  assert.equal(getCardDefinitions().length, 11);
  for (const entry of first.hand) assert.ok(getCardDefinitions().some((definition) => definition.key === entry.key));
});

test('weighted public coverage uses centre distance, deduplicates services, and roofs do not extend it', () => {
  let state = createGame();
  const first = getPreview(state, 'park', 'p1');
  assert.deepEqual(first.beneficiaries, ['104', '105']);
  assert.equal(first.beneficiaryResidents, 710);
  state = successful(performAction(state, 'park', 'p1'));
  const beforeRoof = getMetrics(state).coverage;
  state = successful(performAction(state, 'green', '102'));
  assert.equal(getMetrics(state).coverage, beforeRoof);
  const overlap = getPreview(state, 'park', 'p3');
  assert.deepEqual(overlap.beneficiaries, ['105', '106']);
  assert.deepEqual(overlap.newlyCovered, ['106']);
  state = successful(performAction(state, 'park', 'p3'));
  assert.equal(getMetrics(state).coveredResidents, 1070);
  assert.equal(getMetrics(state).coverage, 52.2);
  assert.equal(getMetrics(state).heatForecast.find((building) => building.id === '105').outdoor, 2);
});

test('the irregular layout has distinct orientations and separates every rotated site footprint', () => {
  const state = createGame();
  assert.equal(state.layoutVersion, LAYOUT_VERSION);
  assert.equal(new Set(state.buildings.map((building) => building.rotation)).size, 6);
  assert.equal(new Set(state.buildings.map((building) => building.z)).size, 6);
  const sites = [...state.buildings.map((item) => ({ ...item, halfX: 7.3 * item.scaleX / 2, halfZ: 6.5 * item.scaleZ / 2 })),
    ...state.lots.map((item) => ({ ...item, halfX: 7.15 / 2, halfZ: 5.7 / 2 }))];
  const axes = (site) => [[Math.cos(site.rotation), -Math.sin(site.rotation)], [Math.sin(site.rotation), Math.cos(site.rotation)]];
  const projectRadius = (site, axis) => {
    const [width, depth] = axes(site);
    return Math.abs(width[0] * axis[0] + width[1] * axis[1]) * site.halfX + Math.abs(depth[0] * axis[0] + depth[1] * axis[1]) * site.halfZ;
  };
  for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
    const a = sites[i], b = sites[j];
    const separated = [...axes(a), ...axes(b)].some((axis) =>
      Math.abs((b.x - a.x) * axis[0] + (b.z - a.z) * axis[1]) > projectRadius(a, axis) + projectRadius(b, axis));
    assert.ok(separated, `${a.id} and ${b.id} overlap`);
  }
  assert.deepEqual(getPreview(state, 'walk', 'p1').beneficiaries, ['104']);
  assert.deepEqual(getPreview(state, 'park', 'p1').beneficiaries, ['104', '105']);
});

test('legacy layout migration preserves decisions, finances, draw state, and historical heat outcomes', () => {
  let original = successful(performAction(createGame(77), 'park', 'p1'));
  original = successful(performAction(original, 'green', '104'));
  for (let i = 0; i < 6; i++) original = successful(endTurn(original));
  delete original.layoutVersion;
  original.buildings.forEach((building, index) => { building.x = (index % 3 - 1) * 10; building.z = index < 3 ? -8 : 4; delete building.rotation; });
  original.lots.forEach((lot, index) => { lot.x = [-10, 0, 10, -19][index]; lot.z = [15, -18, 15, 3][index]; delete lot.rotation; });
  const saved = JSON.stringify(original);
  const migrated = migrateLayout(original);
  assert.notEqual(migrated, original);
  assert.equal(JSON.stringify(original), saved);
  assert.equal(migrated.layoutVersion, LAYOUT_VERSION);
  for (const key of ['funds', 'turn', 'hand', 'rng', 'heatReport', 'logs', 'strategy', 'debts', 'effects']) assert.deepEqual(migrated[key], original[key]);
  for (const [collection, definitions] of [['buildings', BLOCK_LAYOUT], ['lots', LOT_LAYOUT]]) {
    migrated[collection].forEach((item, index) => {
      assert.equal(item.x, definitions[index].x);
      assert.equal(item.z, definitions[index].z);
      assert.equal(item.rotation, definitions[index].rotation);
      for (const key of collection === 'buildings' ? ['green', 'residents', 'capacity'] : ['type', 'conversionCost']) assert.equal(item[key], original[collection][index][key]);
    });
  }
  assert.equal(migrateLayout(migrated), migrated);
});

test('ordinary parks and roofs can pass without playing any random or strategy card', () => {
  let state = createGame(98);
  state = successful(performAction(state, 'park', 'p1'));
  state = successful(performAction(state, 'park', 'p2'));
  state = successful(performAction(state, 'green', '101'));
  state = successful(performAction(state, 'green', '102'));
  state = successful(performAction(state, 'green', '106'));
  assert.equal(state.funds, 700);
  for (let i = 1; i <= 8; i += 1) state = successful(endTurn(state));
  assert.equal(state.status, 'won');
  assert.equal(state.turn, 8);
  assert.ok(getTargets(state).every((target) => target.done));
  assert.ok(state.heatReport);
  assert.ok(state.funds >= 0);
});

test('invalid construction leaves the original state intact and preview matches the charged cost', () => {
  const state = createGame();
  const saved = JSON.stringify(state);
  const alreadyGreen = performAction(state, 'green', '103');
  assert.equal(alreadyGreen.ok, false);
  assert.equal(alreadyGreen.state, state);
  assert.equal(JSON.stringify(state), saved);
  const parking = getPreview(state, 'park', 'p4');
  assert.equal(parking.cost, 4000);
  assert.equal(parking.conversionCost, 800);
  const built = successful(performAction(state, 'park', 'p4'));
  assert.equal(state.funds - built.funds, parking.cost);
  assert.equal(performAction(built, 'walk', 'p4').ok, false);
  const poor = { ...state, funds: 1 };
  assert.equal(performAction(poor, 'park', 'p2').state, poor);
});

test('a retained strategy survives refresh while ordinary cards expire and political points reset', () => {
  let state = successful(chooseStrategy(createGame(), 'public_contract'));
  const strategyCard = state.hand.find((entry) => entry.retained);
  const oldOrdinaryIds = state.hand.filter((entry) => !entry.retained).map((entry) => entry.id);
  state = successful(endTurn(state));
  assert.equal(state.political, 3);
  assert.equal(state.hand.filter((entry) => !entry.retained).length, 3);
  assert.ok(state.hand.some((entry) => entry.id === strategyCard.id));
  assert.ok(state.hand.every((entry) => entry.retained || !oldOrdinaryIds.includes(entry.id)));
  assert.equal(chooseStrategy(state, 'stage_funding').ok, false);
  state = successful(playCard(state, strategyCard.id));
  assert.equal(state.political, 1);
  assert.equal(getPreview(state, 'park', 'p2').cost, 2560);
  assert.equal(getPreview(state, 'park', 'p4').cost, 3360);
  state = successful(endTurn(state));
  assert.equal(getPreview(state, 'park', 'p2').cost, 2560);
});

test('discounts have correct expiry and card failure does not spend funds or political points', () => {
  let state = card(createGame(), 'green_subsidy');
  state = successful(playCard(state, 'fixture-green_subsidy'));
  assert.equal(getPreview(state, 'green', '101').cost, 1260);
  state = successful(endTurn(state));
  assert.equal(getPreview(state, 'green', '101').cost, 1800);
  state = card({ ...state, funds: 500 }, 'mobilize');
  const snapshot = JSON.stringify(state);
  const failed = playCard(state, 'fixture-mobilize', '101');
  assert.equal(failed.ok, false);
  assert.equal(failed.state, state);
  assert.equal(JSON.stringify(state), snapshot);
});

test('financing has three scheduled repayments with interest, rather than free permanent money', () => {
  let state = card(createGame(), 'financing');
  state = successful(playCard(state, 'fixture-financing'));
  assert.equal(state.funds, 15500);
  assert.equal(getMetrics(state).debtOutstanding, 3300);
  assert.equal(getMetrics(state).debtPayment, 0);
  state = successful(endTurn(state));
  assert.equal(getMetrics(state).debtPayment, 1100);
  for (let i = 0; i < 3; i += 1) {
    const result = endTurn(state);
    assert.equal(result.report.debtPayment, 1100);
    state = successful(result);
  }
  assert.equal(getMetrics(state).debtOutstanding, 0);
  assert.equal(getMetrics(state).debtPayment, 0);
});

test('batch strategy chooses three vulnerable buildings and applies their real green state', () => {
  let state = successful(chooseStrategy(createGame(), 'batch_greening'));
  const retained = state.hand.find((entry) => entry.retained);
  const result = playCard(state, retained.id);
  state = successful(result);
  assert.equal(result.report.targets.length, 3);
  assert.equal(state.funds, 8300);
  assert.equal(state.political, 0);
  assert.equal(getMetrics(state).upgraded, 4);
  assert.equal(getMetrics(state).coverage, 0);
});

test('heat combines distinct indoor/outdoor effects, weights frozen inhabitants and keeps historical rows', () => {
  let state = createGame();
  state = successful(performAction(state, 'park', 'p2'));
  for (let i = 1; i <= 5; i += 1) state = successful(endTurn(state));
  const before = getMetrics(state);
  const result = endTurn(state);
  state = successful(result);
  const report = state.heatReport;
  assert.equal(report.turn, 6);
  assert.equal(report.populationBefore, before.population);
  const greenCovered = report.buildings.find((building) => building.id === '103');
  const bareCovered = report.buildings.find((building) => building.id === '102');
  const bareUncovered = report.buildings.find((building) => building.id === '106');
  assert.equal(greenCovered.indoor, 3);
  assert.equal(greenCovered.outdoor, 2);
  assert.equal(bareCovered.total, 12);
  assert.equal(bareUncovered.total, 18);
  const weighted = report.buildings.reduce((sum, building) => sum + building.total * building.residents, 0) / report.populationBefore;
  assert.equal(report.livabilityLoss, Number((weighted * 0.65).toFixed(2)));
  assert.equal(report.populationAfter, report.populationBefore - report.residentsLost);
  const history = JSON.stringify(report);
  state = successful(performAction(state, 'green', '106'));
  assert.equal(JSON.stringify(state.heatReport), history);
});

test('emergency cooling affects the next heat only and is rejected after the event', () => {
  let state = card(createGame(), 'emergency');
  state = successful(playCard(state, 'fixture-emergency'));
  assert.equal(getMetrics(state).heatForecast.find((building) => building.id === '101').total, 11.7);
  for (let i = 1; i <= 6; i += 1) state = successful(endTurn(state));
  assert.equal(state.heatReport.shield, 0.35);
  assert.equal(state.effects.heatShield, 0);
  state = card(state, 'emergency');
  assert.equal(playCard(state, 'fixture-emergency').ok, false);
});

test('missed inspection provides two playable remedial rounds and then ends', () => {
  let state = createGame();
  for (let i = 1; i <= 8; i += 1) state = successful(endTurn(state));
  assert.equal(state.status, 'remediation');
  assert.equal(state.turn, 9);
  assert.equal(state.remediationUntil, 10);
  assert.equal(state.lastReport.remediationGrant, 1000);
  const heatHistory = JSON.stringify(state.heatReport);
  state = successful(endTurn(state));
  assert.equal(state.turn, 10);
  assert.equal(state.status, 'remediation');
  state = successful(endTurn(state));
  assert.equal(state.status, 'lost');
  assert.equal(JSON.stringify(state.heatReport), heatHistory);
  assert.equal(endTurn(state).ok, false);
});

test('JSON save/restore resumes the same deterministic draw and economic result', () => {
  let original = successful(chooseStrategy(createGame(77), 'stage_funding'));
  original = successful(performAction(original, 'green', '104'));
  const restored = JSON.parse(JSON.stringify(original));
  assert.deepEqual(endTurn(restored), endTurn(original));
});

test('a severely unprepared community can complete basic construction during remediation and recover', () => {
  let state = createGame(19);
  for (let i = 1; i <= 8; i += 1) state = successful(endTurn(state));
  assert.equal(state.status, 'remediation');
  const heatHistory = JSON.stringify(state.heatReport);
  state = successful(performAction(state, 'park', 'p1'));
  state = successful(performAction(state, 'park', 'p2'));
  state = successful(performAction(state, 'green', '101'));
  state = successful(performAction(state, 'green', '102'));
  state = successful(performAction(state, 'green', '106'));
  state = successful(endTurn(state));
  if (state.status !== 'won') state = successful(endTurn(state));
  assert.equal(state.status, 'won');
  assert.equal(JSON.stringify(state.heatReport), heatHistory);
});

test('serious fiscal failure needs two consecutive settlements and warns before termination', () => {
  let state = { ...createGame(), funds: -6000 };
  const warning = endTurn(state);
  state = successful(warning);
  assert.equal(state.status, 'playing');
  assert.ok(warning.report.financialWarning);
  assert.equal(state.insolvencyStreak, 1);
  state = successful(endTurn(state));
  assert.equal(state.status, 'lost');
  assert.match(state.lastReport.reason, /连续两回合/);
});

test('target currents preserve precision immediately below coverage and livability thresholds', () => {
  const state = createGame();
  state.lots.find((lot) => lot.id === 'p2').type = 'park';
  // The north park covers exactly the first three buildings. A fractional
  // population fixture isolates presentation precision from migration rules.
  const northResidents = 699.99;
  const southResidents = 300.01;
  state.buildings.slice(0, 3).forEach((building) => { building.residents = northResidents / 3; });
  state.buildings.slice(3).forEach((building) => { building.residents = southResidents / 3; });
  state.livability = 74.999;
  const targets = getTargets(state);
  const coverage = targets.find((target) => target.key === 'coverage');
  const livability = targets.find((target) => target.key === 'livability');
  assert.ok(Math.abs(coverage.current - 69.999) < 1e-10);
  assert.equal(coverage.done, false);
  assert.ok(coverage.current < coverage.target);
  assert.equal(livability.current, 74.999);
  assert.equal(livability.done, false);
  assert.ok(livability.current < livability.target);
});
