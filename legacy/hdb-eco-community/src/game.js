/**
 * HDB Eco Community — deterministic, immutable rules for the playable scenario.
 * All numbers are game abstractions, not real temperature or government policy.
 * Public coverage uses the distance between the facility and building centres.
 */
export const GAME_VERSION = 1;
export const HEAT_TURN = 6;
export const FINAL_TURN = 8;
export const REMEDIATION_TURNS = 2;
import { BLOCK_LAYOUT, LOT_LAYOUT, LAYOUT_VERSION } from './layout.js';
export { migrateLayout } from './layout.js';
// Render text in either language without rewriting or migrating saved rules.
export { localizeGameText } from './engine-locale.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));
const copy = (value) => structuredClone(value);
const ACTIONS = {
  green: { name: '建筑绿化', cost: 1800, upkeep: 45 },
  park: { name: '社区公园', cost: 3200, upkeep: 120, radius: 15 },
  walk: { name: '林荫步道', cost: 1900, upkeep: 70, radius: 11 },
};

const NORMAL_CARDS = [
  { key: 'green_subsidy', name: '建筑绿化补贴', cost: 1, description: '本回合建筑绿化费用降低 30%，仅作用于逐栋施工。', target: 'none', art: 'roof' },
  { key: 'public_subsidy', name: '公共绿地补贴', cost: 1, description: '本回合公园和步道的建设费用降低 25%，土地转换费照常。', target: 'none', art: 'park' },
  { key: 'grant', name: '追加改造拨款', cost: 2, description: '立即获得 $1,800 改造拨款，无需偿还。', target: 'none', art: 'funds' },
  { key: 'outreach', name: '居民共创', cost: 1, description: '开展居民参与活动，宜居度提升 2 点。', target: 'none', art: 'people' },
  { key: 'mobilize', name: '社区施工队', cost: 2, description: '指定一栋尚未绿化的 HDB，以 $1,200 完成建筑绿化。', target: 'building', art: 'roof' },
  { key: 'financing', name: '过桥融资', cost: 1, description: '立即获得 $3,000；从下一回合开始，连续 3 次结算各偿还 $1,100。', target: 'none', art: 'funds' },
  { key: 'emergency', name: '应急降温支援', cost: 1, description: '支付 $600，下一次高温的室内和户外损失均降低 35%。高温过后失效，不增加永久覆盖。', target: 'none', art: 'heat' },
  { key: 'maintenance', name: '维护志愿队', cost: 1, description: '本回合及下一回合，绿色设施维护费用降低 50%；基础运营费用照常。', target: 'none', art: 'people' },
];

const STRATEGIES = [
  { key: 'batch_greening', name: '批量绿化改造', cost: 3, description: '保留。支付 $4,200，优先为热风险最高的 3 栋未改造 HDB 绿化；不足 3 栋时每栋 $1,400。', target: 'none', retained: true, art: 'roof' },
  { key: 'public_contract', name: '长期公共建设协议', cost: 2, description: '保留。打出后，本情景公园和步道的建设费用长期打 8 折；土地转换费照常。', target: 'none', retained: true, art: 'park' },
  { key: 'stage_funding', name: '生态项目专项拨款', cost: 1, description: '保留。立即获得 $3,500 专项拨款，无需偿还。', target: 'none', retained: true, art: 'funds' },
];

export function getCardDefinitions() {
  return copy([...NORMAL_CARDS, ...STRATEGIES]);
}

export function getStrategyDefinitions() {
  return copy(STRATEGIES);
}

function log(state, text) {
  state.logs.push({ turn: state.turn, text });
  if (state.logs.length > 80) state.logs.splice(0, state.logs.length - 80);
}

function fail(state, message) {
  return { ok: false, message, state };
}

function playable(state) {
  return state.status === 'playing' || state.status === 'remediation';
}

// A seeded generator makes the draw reproducible across replay and saved games.
function random(state) {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let value = state.rng;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function drawHand(state) {
  state.hand = state.hand.filter((card) => card.retained);
  const deck = NORMAL_CARDS.map((card) => card.key);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(state) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  for (const key of deck.slice(0, 3)) {
    state.cardSequence += 1;
    state.hand.push({ id: `card-${state.cardSequence}`, key, retained: false });
  }
}

export function createGame(seed = 2028) {
  const numericSeed = Number.isFinite(Number(seed)) ? Number(seed) : 2028;
  const state = {
    version: GAME_VERSION, layoutVersion: LAYOUT_VERSION, seed: numericSeed, rng: numericSeed >>> 0,
    turn: 1, funds: 12500, political: 3, livability: 56, population: 2050,
    buildings: [
      { id: '101', name: 'HDB 101', residents: 320, capacity: 360, green: false },
      { id: '102', name: 'HDB 102', residents: 360, capacity: 420, green: false },
      { id: '103', name: 'HDB 103', residents: 300, capacity: 360, green: true },
      { id: '104', name: 'HDB 104', residents: 390, capacity: 420, green: false },
      { id: '105', name: 'HDB 105', residents: 320, capacity: 360, green: false },
      { id: '106', name: 'HDB 106', residents: 360, capacity: 420, green: false },
    ],
    lots: [
      { id: 'p1', name: '南侧西区空地', type: null, conversionCost: 0 },
      { id: 'p2', name: '北侧中央空地', type: null, conversionCost: 0 },
      { id: 'p3', name: '南侧东区空地', type: null, conversionCost: 0 },
      { id: 'p4', name: '西侧停车用地', type: null, conversionCost: 800 },
    ],
    hand: [], cardSequence: 0, strategy: null,
    effects: { greenDiscount: 0, publicDiscount: 0, publicContract: false, heatShield: 0, maintenanceTurns: 0 },
    debts: [], heatReport: null, lastReport: null, logs: [], status: 'playing',
    heatTurn: HEAT_TURN, finalTurn: FINAL_TURN, remediationUntil: null,
    insolvencyStreak: 0, eventHistory: [],
  };
  state.buildings = state.buildings.map((building) => {
    const { x, z, rotation, scaleX, scaleZ } = BLOCK_LAYOUT.find((item) => item.id === building.id);
    return { ...building, x, z, rotation, scaleX, scaleZ };
  });
  state.lots = state.lots.map((lot) => {
    const { x, z, rotation } = LOT_LAYOUT.find((item) => item.id === lot.id);
    return { ...lot, x, z, rotation };
  });
  drawHand(state);
  log(state, '绿色更新计划启动：第 6 回合结束发生高温，第 8 回合验收。103 已完成示范绿化。');
  return state;
}

function servicesFor(state, building) {
  return state.lots.filter((lot) => {
    if (!lot.type || !ACTIONS[lot.type]) return false;
    return Math.hypot(lot.x - building.x, lot.z - building.z) <= ACTIONS[lot.type].radius + 1e-8;
  });
}

function forecastFor(state, building) {
  const services = servicesFor(state, building);
  const hasPark = services.some((lot) => lot.type === 'park');
  // Overlapping facilities never add their protection; use the best outdoor service.
  const indoor = building.green ? 3 : 10;
  const outdoor = hasPark ? 2 : services.length ? 4 : 8;
  const shield = clamp(state.effects.heatShield, 0, 0.35);
  return {
    id: building.id, name: building.name, residents: building.residents,
    green: building.green, covered: services.length > 0,
    serviceIds: services.map((lot) => lot.id),
    indoorBase: 10, outdoorBase: 8, indoor: round(indoor * (1 - shield), 2),
    outdoor: round(outdoor * (1 - shield), 2), shield,
    total: round((indoor + outdoor) * (1 - shield), 2),
  };
}

export function getMetrics(state) {
  const population = state.buildings.reduce((sum, building) => sum + building.residents, 0);
  const coveredBuildings = state.buildings.filter((building) => servicesFor(state, building).length > 0);
  const coveredResidents = coveredBuildings.reduce((sum, building) => sum + building.residents, 0);
  const upgraded = state.buildings.filter((building) => building.green).length;
  const greenUpkeep = upgraded * ACTIONS.green.upkeep + state.lots.reduce((sum, lot) => sum + (ACTIONS[lot.type]?.upkeep ?? 0), 0);
  const upkeep = 450 + Math.round(greenUpkeep * (state.effects.maintenanceTurns > 0 ? 0.5 : 1));
  const income = Math.round(420 + population * 0.55);
  const debtPayment = state.debts.reduce((sum, debt) => sum + (debt.remaining > 0 && state.turn >= debt.firstPayment ? debt.payment : 0), 0);
  const heatForecast = state.buildings.map((building) => forecastFor(state, building));
  const exposure = population ? heatForecast.reduce((sum, item) => sum + item.total * item.residents, 0) / population : 18;
  return {
    population, capacity: state.buildings.reduce((sum, building) => sum + building.capacity, 0),
    coverage: population ? round(coveredResidents / population * 100, 1) : 0,
    coverageExact: population ? coveredResidents / population * 100 : 0,
    coveredResidents, coveredBuildings: coveredBuildings.map((building) => building.id),
    upgraded, income, upkeep, greenUpkeep, debtPayment, netIncome: income - upkeep - debtPayment,
    debtOutstanding: state.debts.reduce((sum, debt) => sum + debt.payment * debt.remaining, 0),
    heatRisk: round(exposure / 18 * 100), heatExposure: round(exposure, 2), heatForecast,
    hasHeatOccurred: Boolean(state.heatReport),
  };
}

export function getTargets(state) {
  const metrics = getMetrics(state);
  return [
    { key: 'coverage', label: '公共绿地覆盖', current: metrics.coverageExact, target: 70, unit: '%', done: metrics.coverageExact >= 70, progress: clamp(metrics.coverageExact / 70, 0, 1) },
    { key: 'upgraded', label: '绿色 HDB 改造', current: metrics.upgraded, target: 4, unit: '栋', done: metrics.upgraded >= 4, progress: clamp(metrics.upgraded / 4, 0, 1) },
    { key: 'livability', label: '社区宜居度', current: state.livability, target: 75, unit: '', done: state.livability >= 75, progress: clamp(state.livability / 75, 0, 1) },
  ];
}

function actionCost(state, type, target) {
  if (type === 'green') return Math.round(ACTIONS.green.cost * (1 - state.effects.greenDiscount));
  const contractFactor = state.effects.publicContract ? 0.8 : 1;
  return Math.round(ACTIONS[type].cost * contractFactor * (1 - state.effects.publicDiscount)) + (target.conversionCost || 0);
}

export function getPreview(state, type, targetId) {
  const empty = { valid: false, cost: 0, beneficiaries: [], beneficiaryResidents: 0, newlyCovered: [], coverageGain: 0, livabilityGain: 0, radius: 0 };
  if (!playable(state)) return { ...empty, message: '项目已结算，请重新开始新的计划。' };
  if (!ACTIONS[type]) return { ...empty, message: '请选择有效的建设类型。' };
  const collection = type === 'green' ? state.buildings : state.lots;
  const target = collection.find((item) => item.id === String(targetId));
  if (!target) return { ...empty, message: type === 'green' ? '请选择一栋 HDB。' : '请选择可建设的空地。' };
  if (type === 'green' && target.green) return { ...empty, message: '这栋 HDB 已完成建筑绿化。' };
  if (type !== 'green' && target.type) return { ...empty, message: '这块土地已有公共设施。' };
  const cost = actionCost(state, type, target);
  const metrics = getMetrics(state);
  const radius = ACTIONS[type].radius || 0;
  const beneficiaries = type === 'green' ? [target] : state.buildings.filter((building) => Math.hypot(target.x - building.x, target.z - building.z) <= radius + 1e-8);
  const newlyCovered = type === 'green' ? [] : beneficiaries.filter((building) => !metrics.coveredBuildings.includes(building.id));
  const beneficiaryResidents = beneficiaries.reduce((sum, building) => sum + building.residents, 0);
  const coverageGain = metrics.population ? newlyCovered.reduce((sum, building) => sum + building.residents, 0) / metrics.population * 100 : 0;
  const livabilityGain = type === 'green' ? 3 : (type === 'park' ? 2 : 0.8) + coverageGain * 0.18;
  const sufficientFunds = state.funds >= cost;
  return {
    valid: sufficientFunds, message: sufficientFunds ? `${ACTIONS[type].name}将服务 ${beneficiaries.map((building) => building.id).join('、') || '暂无住宅'}。` : `财政不足，需 $${cost.toLocaleString()}。`,
    cost, beneficiaries: beneficiaries.map((building) => building.id), beneficiaryResidents,
    newlyCovered: newlyCovered.map((building) => building.id), coverageGain: round(coverageGain, 1),
    livabilityGain: round(livabilityGain, 1), radius, upkeep: ACTIONS[type].upkeep,
    conversionCost: target.conversionCost || 0,
  };
}

export function performAction(state, type, targetId) {
  const preview = getPreview(state, type, targetId);
  if (!preview.valid) return fail(state, preview.message);
  const next = copy(state);
  const target = (type === 'green' ? next.buildings : next.lots).find((item) => item.id === String(targetId));
  next.funds -= preview.cost;
  next.livability = round(clamp(next.livability + preview.livabilityGain, 0, 100), 2);
  if (type === 'green') target.green = true;
  else { target.type = type; target.builtTurn = next.turn; target.radius = ACTIONS[type].radius; }
  const message = `${target.name}完成${ACTIONS[type].name}，支出 $${preview.cost.toLocaleString()}${preview.coverageGain ? `，新增公共覆盖 ${preview.coverageGain}%` : ''}。`;
  log(next, message);
  return { ok: true, message, state: next, report: { type: 'construction', ...preview, targetId: String(targetId), action: type } };
}

export function chooseStrategy(state, strategyId) {
  if (!playable(state)) return fail(state, '项目已结束。');
  if (state.strategy) return fail(state, '本情景只能选择一张阶段策略。');
  const strategy = STRATEGIES.find((item) => item.key === strategyId);
  if (!strategy) return fail(state, '请选择有效的阶段策略。');
  const next = copy(state);
  next.strategy = strategy.key;
  next.cardSequence += 1;
  next.hand.push({ id: `card-${next.cardSequence}`, key: strategy.key, retained: true });
  const message = `已选择「${strategy.name}」，策略牌保留在手中，打出后生效。`;
  log(next, message);
  return { ok: true, message, state: next };
}

export function playCard(state, cardId, targetId) {
  if (!playable(state)) return fail(state, '项目已结束。');
  const card = state.hand.find((item) => item.id === String(cardId));
  if (!card) return fail(state, '这张政策牌已不在手中。');
  const definition = [...NORMAL_CARDS, ...STRATEGIES].find((item) => item.key === card.key);
  if (!definition) return fail(state, '政策牌定义不存在。');
  if (state.political < definition.cost) return fail(state, `政治点不足，需 ${definition.cost} 点。`);
  if (card.key === 'emergency' && state.heatReport) return fail(state, '高温已过去，应急降温支援无法追溯历史损失。');
  if (card.key === 'emergency' && state.effects.heatShield > 0) return fail(state, '社区已为下一次高温部署降温支援。');
  if (card.key === 'green_subsidy' && state.effects.greenDiscount) return fail(state, '本回合已启用建筑绿化补贴。');
  if (card.key === 'public_subsidy' && state.effects.publicDiscount) return fail(state, '本回合已启用公共绿地补贴。');
  let targets = [];
  let cashCost = 0;
  if (card.key === 'mobilize') {
    const building = state.buildings.find((item) => item.id === String(targetId));
    if (!building) return fail(state, '请选择一栋尚未绿化的 HDB。');
    if (building.green) return fail(state, '这栋 HDB 已完成建筑绿化。');
    targets = [building.id];
    cashCost = 1200;
  }
  if (card.key === 'batch_greening') {
    targets = getMetrics(state).heatForecast.filter((item) => !item.green).sort((a, b) => b.total - a.total || b.residents - a.residents).slice(0, 3).map((item) => item.id);
    if (!targets.length) return fail(state, '所有 HDB 已完成绿化，没有批量改造目标。');
    cashCost = targets.length * 1400;
  }
  if (card.key === 'emergency') cashCost = 600;
  if (state.funds < cashCost) return fail(state, `财政不足，这项政策另需 $${cashCost.toLocaleString()}。`);
  const next = copy(state);
  next.political -= definition.cost;
  next.funds -= cashCost;
  next.hand = next.hand.filter((item) => item.id !== card.id);
  let detail = '';
  switch (card.key) {
    case 'green_subsidy': next.effects.greenDiscount = 0.3; detail = '本回合逐栋绿化打 7 折'; break;
    case 'public_subsidy': next.effects.publicDiscount = 0.25; detail = '本回合公共建设打 75 折'; break;
    case 'grant': next.funds += 1800; detail = '获得 $1,800'; break;
    case 'stage_funding': next.funds += 3500; detail = '获得 $3,500'; break;
    case 'outreach': next.livability = round(clamp(next.livability + 2, 0, 100), 2); detail = '宜居度 +2'; break;
    case 'mobilize':
    case 'batch_greening':
      next.buildings.filter((item) => targets.includes(item.id)).forEach((item) => { item.green = true; });
      next.livability = round(clamp(next.livability + targets.length * 3, 0, 100), 2);
      detail = `${targets.join('、')} 完成建筑绿化，支出 $${cashCost.toLocaleString()}`;
      break;
    case 'financing':
      next.funds += 3000;
      next.debts.push({ id: card.id, payment: 1100, remaining: 3, firstPayment: next.turn + 1 });
      detail = '获得 $3,000，未来三回合共偿还 $3,300';
      break;
    case 'emergency': next.effects.heatShield = 0.35; detail = '支出 $600，下一次高温损失降低 35%'; break;
    case 'maintenance': next.effects.maintenanceTurns = Math.max(next.effects.maintenanceTurns, 2); detail = '本回合及下一回合绿色设施维护减半'; break;
    case 'public_contract': next.effects.publicContract = true; detail = '长期公共建设 8 折生效'; break;
    default: return fail(state, '暂不支持这张政策牌。');
  }
  const message = `实施「${definition.name}」：${detail}。`;
  log(next, message);
  return { ok: true, message, state: next, report: { type: 'policy', key: card.key, targets, cashCost } };
}

function settleHeat(state) {
  // Freeze the inhabitants before applying any migration. This report is history
  // and is never recalculated after later remedial construction.
  const metrics = getMetrics(state);
  const populationBefore = metrics.population;
  const buildings = metrics.heatForecast.map((item) => ({
    ...item,
    livabilityLoss: round(item.total * 0.65, 2),
    residentsLost: Math.min(item.residents, Math.round(item.residents * item.total / 18 * 0.045)),
    explanation: `${item.green ? '建筑绿化保护室内' : '室内尚无建筑绿化'}；${item.covered ? `公共设施 ${item.serviceIds.join('、')} 缓解户外暴露` : '户外无公共绿地服务'}${item.shield ? '；应急降温减损 35%' : ''}`,
  }));
  const weightedExposure = populationBefore ? buildings.reduce((sum, item) => sum + item.total * item.residents, 0) / populationBefore : 18;
  const livabilityLoss = round(weightedExposure * 0.65, 2);
  const cashLoss = Math.round(weightedExposure / 18 * 1400);
  const residentsLost = buildings.reduce((sum, item) => sum + item.residentsLost, 0);
  const report = {
    type: 'heat', turn: state.turn, title: '高温事件逐栋结算', buildings,
    populationBefore, residentsLost, livabilityBefore: state.livability,
    livabilityLoss, cashLoss, fundsLoss: cashLoss, weightedExposure: round(weightedExposure, 2),
    shield: state.effects.heatShield,
    avoidedExposure: round(18 - weightedExposure, 2),
  };
  state.livability = round(clamp(state.livability - livabilityLoss, 0, 100), 2);
  state.funds -= cashLoss;
  for (const result of buildings) state.buildings.find((item) => item.id === result.id).residents -= result.residentsLost;
  state.population = state.buildings.reduce((sum, building) => sum + building.residents, 0);
  state.effects.heatShield = 0;
  report.livabilityAfter = state.livability;
  report.populationAfter = state.population;
  state.heatReport = report;
  log(state, `高温检验：宜居度 -${livabilityLoss}，应对支出 $${cashLoss.toLocaleString()}，${residentsLost} 位居民迁出；逐栋报告已生成。`);
  return report;
}

function updateResidents(state) {
  for (const building of state.buildings) {
    const covered = servicesFor(state, building).length > 0;
    const localLivability = state.livability + (building.green ? 3 : 0) + (covered ? 2 : 0);
    const change = localLivability >= 72 ? Math.ceil((building.capacity - building.residents) * 0.07) : localLivability < 48 ? -Math.ceil(building.residents * 0.01) : 0;
    building.residents = clamp(building.residents + change, 0, building.capacity);
  }
  state.population = state.buildings.reduce((sum, building) => sum + building.residents, 0);
}

function stageReport(state, succeeded) {
  const metrics = getMetrics(state);
  const targets = getTargets(state);
  const score = Math.round(clamp(metrics.coverage * 0.35 + (metrics.upgraded / 6 * 100) * 0.25 + state.livability * 0.3 + clamp((state.funds - metrics.debtOutstanding) / 15000 * 100, 0, 100) * 0.1, 0, 100));
  return {
    type: 'inspection', turn: state.turn,
    title: succeeded ? '绿色社区验收通过' : state.turn === FINAL_TURN ? '验收未达标 · 启动两回合补救' : '补救期限结束',
    succeeded, targets, score, grade: score >= 88 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D',
    funds: state.funds, debtOutstanding: metrics.debtOutstanding, netFunds: state.funds - metrics.debtOutstanding,
    population: metrics.population, livability: round(state.livability, 1), coverage: metrics.coverage,
    upgraded: metrics.upgraded, heatReport: state.heatReport,
    missing: targets.filter((item) => !item.done).map((item) => `${item.label} ${item.current}${item.unit} / ${item.target}${item.unit}`),
  };
}

export function endTurn(state) {
  if (!playable(state)) return fail(state, '项目已结束，请查看验收报告或重新开始。');
  const next = copy(state);
  const metrics = getMetrics(next);
  const completedTurn = next.turn;
  const finances = { income: metrics.income, upkeep: metrics.upkeep, debtPayment: metrics.debtPayment, netIncome: metrics.netIncome };
  next.funds += metrics.netIncome;
  for (const debt of next.debts) if (debt.remaining > 0 && completedTurn >= debt.firstPayment) debt.remaining -= 1;
  next.debts = next.debts.filter((debt) => debt.remaining > 0);
  if (next.effects.maintenanceTurns > 0) next.effects.maintenanceTurns -= 1;
  // A modest recovery keeps one bad heat event recoverable without erasing it.
  const recovery = next.heatReport ? 0.8 : (metrics.upgraded >= 2 && metrics.coverage >= 30 ? 0.4 : 0);
  next.livability = round(clamp(next.livability + recovery, 0, 100), 2);
  log(next, `第 ${completedTurn} 回合财政结算：收入 $${metrics.income.toLocaleString()}，维护 $${metrics.upkeep.toLocaleString()}${metrics.debtPayment ? `，偿还融资 $${metrics.debtPayment.toLocaleString()}` : ''}，净收入 $${metrics.netIncome.toLocaleString()}。`);
  let report = { type: 'turn', turn: completedTurn, title: `第 ${completedTurn} 回合经营报告`, ...finances, recovery };
  if (completedTurn === 3) {
    const event = { turn: 3, title: '社区支持基金', text: '邻里组织为公共空间更新提供 $700 支持。', funds: 700 };
    next.funds += event.funds;
    next.eventHistory.push(event);
    report.event = event;
    log(next, event.text);
  }
  if (completedTurn === HEAT_TURN && !next.heatReport) {
    report = { ...settleHeat(next), finances };
  } else {
    updateResidents(next);
  }
  next.insolvencyStreak = next.funds < -2000 ? next.insolvencyStreak + 1 : 0;
  if (next.insolvencyStreak === 1) {
    log(next, '财政危机预警：余额低于 -$2,000。若下一回合结算仍低于该线，项目将终止；可使用拨款或融资补救。');
    report.financialWarning = '下一回合结算财政仍低于 -$2,000 将终止项目。';
  }
  if (next.insolvencyStreak >= 2) {
    next.status = 'lost';
    report = { ...stageReport(next, false), title: '财政持续危机 · 项目终止', reason: '连续两回合财政低于 -$2,000。' };
  } else if (completedTurn >= FINAL_TURN) {
    const achieved = getTargets(next).every((target) => target.done);
    if (achieved) {
      next.status = 'won';
      report = stageReport(next, true);
      log(next, '公共覆盖、建筑改造与宜居度全部达到要求，项目验收通过。');
    } else if (completedTurn === FINAL_TURN) {
      next.status = 'remediation';
      next.remediationUntil = FINAL_TURN + REMEDIATION_TURNS;
      next.funds += 1000;
      report = stageReport(next, false);
      report.remediationGrant = 1000;
      log(next, '验收未达标：获得 $1,000 补救支持，追加 2 回合。高温报告保留为历史记录。');
    } else if (completedTurn >= next.remediationUntil) {
      next.status = 'lost';
      report = stageReport(next, false);
      log(next, '两回合补救期限结束，项目未通过验收。');
    }
  }
  next.lastReport = report;
  next.effects.greenDiscount = 0;
  next.effects.publicDiscount = 0;
  if (playable(next)) {
    next.turn += 1;
    next.political = 3;
    drawHand(next);
  } else {
    next.hand = next.hand.filter((card) => card.retained);
  }
  const message = next.status === 'won' ? '绿色社区验收通过！' : next.status === 'lost' ? '项目结束，请查看验收报告。' : completedTurn === FINAL_TURN ? '进入两回合补救期，先完成尚未达标的目标。' : completedTurn === HEAT_TURN ? '高温事件已结算，请查看逐栋报告。' : `进入第 ${next.turn} 回合，政治点与普通手牌已更新。`;
  return { ok: true, message, state: next, report };
}
