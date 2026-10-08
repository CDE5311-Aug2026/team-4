import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, chooseStrategy, performAction, endTurn, localizeGameText } from '../src/game.js';
import { loadLanguage, localizeText } from '../src/ui-locale.js';

test('new players default to English; language preference is independent of the game save', () => {
  const keys = [];
  assert.equal(loadLanguage({ getItem: key => { keys.push(key); return null; } }), 'en');
  assert.deepEqual(keys, ['hdb-eco-community-language']);
  assert.equal(loadLanguage({ getItem: () => 'zh' }), 'zh');
  assert.equal(loadLanguage({ getItem: () => 'invalid' }), 'en');
  assert.equal(loadLanguage({ getItem: () => { throw new Error('blocked'); } }), 'en');
});

test('a historical Chinese save can switch languages without changing the simulation', () => {
  let state = chooseStrategy(createGame(), 'stage_funding').state;
  state = performAction(state, 'park', 'p1').state;
  while (state.turn < 7) state = endTurn(state).state;
  const before = structuredClone(state);
  const english = localizeGameText(state, 'en');
  assert.equal(/[\u3400-\u9fff]/.test(JSON.stringify(english)), false);
  assert.deepEqual(state, before);
  assert.deepEqual(localizeGameText(english, 'zh'), before);
  assert.equal(english.funds, state.funds);
  assert.deepEqual(english.buildings, state.buildings);
});

test('UI reports preserve amounts and turn numbers in English', () => {
  assert.equal(localizeText('融资：剩余 3 次，每次 $1,100，从第 4 回合结束开始。'), '3 loan payments remaining at $1,100 each, starting at the end of turn 4.');
  assert.equal(localizeText('剩余融资 $3,300 · 期末净财政 $-1,100'), 'Outstanding debt: $3,300 · Closing net funds: $-1,100');
  assert.equal(localizeText('第 8 回合结束进行验收'), 'After turn 8: project review');
  assert.equal(localizeText('第 10 回合结束前完成以下目标'), 'Complete these goals by the end of turn 10');
  assert.equal(localizeText(' / 3栋'), ' / 3 blocks');
  assert.equal(localizeText('建筑绿化', 'zh'), '建筑绿化');
  const history = localizeText('热浪在第 6 回合独立结算，补救不会改变历史结果。所有参数为原型平衡值。');
  assert.equal(/[\u3400-\u9fff]/.test(history), false);
  assert.match(history, /turn 6 heatwave/);
});
