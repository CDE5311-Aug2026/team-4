import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCommunity } from '../src/advisor.js';
import { createGame, getMetrics, performAction, playCard, endTurn } from '../src/game.js';

function replay(state, recommendation) {
  let result = state;
  for (const step of recommendation.steps) {
    const action = step.type === 'build'
      ? performAction(result, step.action, step.target)
      : playCard(result, step.cardId, step.target);
    assert.equal(action.ok, true, action.message);
    result = action.state;
  }
  return result;
}

test('bounded search returns diverse legal current-turn plans without changing the player state', () => {
  const state = createGame();
  const original = JSON.stringify(state);
  const advice = analyzeCommunity(state, { maxDepth: 3 });
  assert.equal(advice.method, 'local-search');
  assert.equal(advice.scope, 'current-turn');
  assert.equal(advice.recommendations.length, 3);
  assert.deepEqual(new Set(advice.recommendations.map((plan) => plan.objective)), new Set(['heat', 'coverage', 'finance']));
  assert.ok(advice.search.expanded <= advice.search.limit);
  assert.ok(advice.search.reachedDepth <= 3);
  assert.equal(JSON.stringify(state), original);
  for (const plan of advice.recommendations) {
    assert.ok(plan.steps.length <= 3);
    const after = replay(state, plan);
    assert.equal(after.turn, state.turn);
    assert.ok(after.funds >= 0);
    assert.ok(after.political >= 0);
    assert.equal(plan.evidence.after.funds, after.funds);
    assert.equal(plan.evidence.after.livability, after.livability);
    const metrics = getMetrics(after);
    assert.equal(plan.evidence.after.coverage, metrics.coverageExact);
    assert.equal(plan.evidence.after.coveredResidents, metrics.coveredResidents);
    assert.equal(plan.evidence.after.upkeep, metrics.upkeep);
    assert.equal(plan.evidence.after.netIncome, metrics.netIncome);
    assert.equal(plan.evidence.after.debtOutstanding, metrics.debtOutstanding);
  }
});

test('evidence counts newly served residents once and reports coverage in percentage points', () => {
  let state = createGame();
  state = performAction(state, 'park', 'p1').state;
  const advice = analyzeCommunity(state, { focus: 'coverage', maxDepth: 2 });
  assert.equal(advice.recommendations[0].objective, 'coverage');
  const plan = advice.recommendations[0];
  const before = getMetrics(state);
  const after = getMetrics(replay(state, plan));
  assert.equal(plan.evidence.newlyServedResidents, after.coveredResidents - before.coveredResidents);
  assert.equal(plan.evidence.coverageGain, Number((after.coverageExact - before.coverageExact).toFixed(2)));
  assert.match(plan.rationale, /percentage points/);
  assert.match(plan.rationale, /once/);
});

test('recommendations are deterministically reproducible and do not depend on future random draws', () => {
  const state = createGame(33);
  const futureChanged = structuredClone(state);
  futureChanged.rng = 1;
  futureChanged.seed = 999;
  const advice = analyzeCommunity(state, { focus: 'heat', maxDepth: 2 });
  assert.deepEqual(advice, analyzeCommunity(state, { focus: 'heat', maxDepth: 2 }));
  assert.deepEqual(advice, analyzeCommunity(futureChanged, { focus: 'heat', maxDepth: 2 }));
});

test('multi-step search uses policy discounts through actual game rules', () => {
  const state = createGame();
  state.funds = 5000;
  state.hand = [{ id: 'discount', key: 'public_subsidy', retained: false }];
  const advice = analyzeCommunity(state, { focus: 'coverage', maxDepth: 3 });
  const coverage = advice.recommendations.find((plan) => plan.objective === 'coverage');
  assert.ok(coverage.steps.some((step) => step.type === 'card' && step.cardId === 'discount'));
  const after = replay(state, coverage);
  assert.equal(coverage.evidence.after.funds, after.funds);
  assert.equal(coverage.evidence.cost, state.funds - after.funds);
});

test('finance reasoning accounts for scheduled debt and offers a real reserve option', () => {
  const state = createGame();
  state.hand = [{ id: 'loan', key: 'financing', retained: false }];
  const advice = analyzeCommunity(state, { focus: 'finance', maxDepth: 2 });
  const reserve = advice.recommendations[0];
  assert.equal(reserve.objective, 'finance');
  assert.equal(reserve.evidence.after.debtOutstanding, 0);
  assert.equal(reserve.steps.length, 0);
  const borrowed = playCard(state, 'loan').state;
  const practice = analyzeCommunity(borrowed, { maxDepth: 2 }).learning;
  assert.equal(practice.concept, 'finance');
  assert.equal(practice.practice, true);
  assert.match(practice.question, /3,300/);
});

test('adaptive practice reflects unmet coverage, imminent heat and later recovery', () => {
  const initial = createGame();
  assert.equal(analyzeCommunity(initial, { maxDepth: 2 }).learning.concept, 'coverage');
  const hot = { ...initial, turn: 5 };
  assert.equal(analyzeCommunity(hot, { maxDepth: 2 }).learning.concept, 'heat');
  let recovery = createGame();
  for (let i = 0; i < 8; i += 1) recovery = endTurn(recovery).state;
  const history = JSON.stringify(recovery.heatReport);
  const advice = analyzeCommunity(recovery, { maxDepth: 2 });
  assert.equal(advice.learning.concept, 'livability');
  assert.equal(JSON.stringify(recovery.heatReport), history);
  for (const plan of advice.recommendations) assert.equal(JSON.stringify(replay(recovery, plan).heatReport), history);
});

test('English and Chinese rendering preserves the same decisions and exactly one practice answer', () => {
  const state = createGame();
  const en = analyzeCommunity(state, { language: 'en', maxDepth: 2 });
  const zh = analyzeCommunity(state, { language: 'zh', maxDepth: 2 });
  assert.equal(/[\u3400-\u9fff]/.test(JSON.stringify(en)), false);
  assert.equal(zh.learning.options.filter((option) => option.correct).length, 1);
  assert.equal(en.learning.options.filter((option) => option.correct).length, 1);
  assert.ok(/[\u3400-\u9fff]/.test(zh.summary));
  assert.deepEqual(en.recommendations.map((plan) => plan.steps.map(({ label, ...step }) => step)), zh.recommendations.map((plan) => plan.steps.map(({ label, ...step }) => step)));
  assert.deepEqual(en.recommendations.map((plan) => plan.evidence), zh.recommendations.map((plan) => plan.evidence));
});

test('low resources and terminal games produce only truthful feasible advice', () => {
  const poor = { ...createGame(), funds: 0, political: 0, hand: [] };
  const advice = analyzeCommunity(poor, { maxDepth: 2 });
  assert.equal(advice.recommendations.length, 1);
  assert.equal(advice.recommendations[0].steps.length, 0);
  assert.equal(advice.recommendations[0].evidence.cost, 0);
  assert.equal(advice.learning.concept, 'finance');
  const done = analyzeCommunity({ ...poor, status: 'lost' });
  assert.equal(done.recommendations.length, 0);
  assert.match(done.summary, /ended/);
});
