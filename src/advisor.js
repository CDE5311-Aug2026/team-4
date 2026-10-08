/**
 * Explainable planning AI for the serious-game prototype.
 * A bounded beam search compares legal current-turn plans through the actual
 * simulation rules. It does not inspect future draws, run a turn, or execute a
 * recommendation on the player's state. Forecasts are game estimates.
 */
import {
  getMetrics, getTargets, getPreview, performAction, playCard,
  getCardDefinitions, localizeGameText,
} from './game.js';

const BEAM_WIDTH = 24;
const EXPANSION_LIMIT = 1400;
const round = (value, digits = 2) => Number(value.toFixed(digits));
const choose = (language, en, zh) => language === 'zh' ? zh : en;
const number = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
const money = (value) => `${value < 0 ? '-' : ''}$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.abs(value))}`;

function snapshot(state) {
  const metrics = getMetrics(state);
  // Use the same frozen-population weighting and rounding as settleHeat.
  const exposure = metrics.population
    ? metrics.heatForecast.reduce((sum, block) => sum + block.total * block.residents, 0) / metrics.population
    : 18;
  return {
    funds: state.funds, coverage: metrics.coverageExact,
    coveredResidents: metrics.coveredResidents, population: metrics.population,
    coveredBuildings: [...metrics.coveredBuildings], upgraded: metrics.upgraded,
    livability: state.livability, upkeep: metrics.upkeep, netIncome: metrics.netIncome,
    income: metrics.income, debtOutstanding: metrics.debtOutstanding,
    heatLoss: round(exposure * 0.65), heatCashLoss: Math.round(exposure / 18 * 1400),
    heatRisk: metrics.heatRisk,
  };
}

function fingerprint(state) {
  // Ignore narrative logs, card order and IDs when their effects are equivalent.
  // No RNG or future-deck information enters a comparison.
  return JSON.stringify({
    funds: state.funds, political: state.political, livability: state.livability,
    green: state.buildings.map((block) => [block.id, block.green]),
    lots: state.lots.map((lot) => [lot.id, lot.type]),
    hand: state.hand.map((card) => card.key).sort(),
    effects: state.effects,
    debt: state.debts.map((debt) => [debt.payment, debt.remaining, debt.firstPayment]).sort(),
  });
}

function actionLabel(state, action, target, language) {
  if (action === 'green') return choose(language, `Green HDB ${target}`, `绿化 HDB ${target}`);
  const lot = state.lots.find((item) => item.id === target);
  const name = localizeGameText(lot?.name || target, language);
  return action === 'park'
    ? choose(language, `Build a community park at ${name}`, `在${name}建设社区公园`)
    : choose(language, `Build a shaded walkway at ${name}`, `在${name}建设林荫步道`);
}

function legalSuccessors(node, definitions, language) {
  const options = [];
  for (const building of node.state.buildings) {
    const preview = getPreview(node.state, 'green', building.id);
    if (preview.valid) options.push({
      type: 'build', action: 'green', target: building.id,
      label: actionLabel(node.state, 'green', building.id, language),
    });
  }
  for (const lot of node.state.lots) {
    for (const action of ['park', 'walk']) {
      const preview = getPreview(node.state, action, lot.id);
      if (preview.valid) options.push({
        type: 'build', action, target: lot.id,
        label: actionLabel(node.state, action, lot.id, language),
      });
    }
  }
  for (const card of node.state.hand) {
    const definition = definitions.get(card.key);
    if (!definition) continue;
    const targets = definition.target === 'building'
      ? node.state.buildings.map((item) => item.id)
      : definition.target === 'lot' ? node.state.lots.map((item) => item.id) : [undefined];
    for (const target of targets) {
      const name = localizeGameText(definition.name, language);
      options.push({
        type: 'card', cardId: card.id, ...(target ? { target } : {}),
        label: choose(language, `Play ${name}${target ? ` on HDB ${target}` : ''}`, `实施「${name}」${target ? `：HDB ${target}` : ''}`),
      });
    }
  }
  return options;
}

function evidence(before, node, initialState) {
  const after = node.metrics;
  const newlyServedBuildings = after.coveredBuildings.filter((id) => !before.coveredBuildings.includes(id));
  const newlyServedResidents = initialState.buildings
    .filter((building) => newlyServedBuildings.includes(building.id))
    .reduce((sum, building) => sum + building.residents, 0);
  return {
    before: { ...before, coveredBuildings: [...before.coveredBuildings] },
    after: { ...after, coveredBuildings: [...after.coveredBuildings] },
    cost: node.cost, politicalCost: initialState.political - node.state.political,
    budgetChange: after.funds - before.funds,
    coverageGain: round(after.coverage - before.coverage),
    newlyServedResidents, newlyServedBuildings,
    heatLossReduction: round(before.heatLoss - after.heatLoss),
    additionalUpkeep: after.upkeep - before.upkeep,
    temporaryUpkeepTurns: node.state.effects.maintenanceTurns,
    debtChange: after.debtOutstanding - before.debtOutstanding,
    upgradesAdded: after.upgraded - before.upgraded,
    livabilityGain: round(after.livability - before.livability),
  };
}

function score(node, before, focus) {
  const after = node.metrics;
  const coverage = after.coverage - before.coverage;
  const heat = before.heatLoss - after.heatLoss;
  const greens = after.upgraded - before.upgraded;
  const living = after.livability - before.livability;
  const spending = node.cost / 1000;
  const cash = (after.funds - before.funds) / 1000;
  const debt = (after.debtOutstanding - before.debtOutstanding) / 1000;
  const operation = (after.netIncome - before.netIncome) / 100;
  if (focus === 'coverage') return coverage * 1.4 + heat * 0.4 + greens * 0.5 + living * 0.1 - spending * 0.8 + cash * 0.2 - debt;
  if (focus === 'heat') return heat * 9 + coverage * 0.18 + greens + living * 0.2 - spending * 0.6 + cash * 0.15 - debt;
  if (focus === 'finance') return cash * 10 - debt * 13 + operation * 2 + coverage * 0.04 + greens * 0.2 + living * 0.08;
  return coverage * 0.6 + heat * 4 + greens * 4 + living * 0.5 - spending * 0.6 + cash * 0.4 - debt * 2 + operation * 0.2;
}

function rank(nodes, before, focus) {
  return [...nodes].sort((a, b) => score(b, before, focus) - score(a, before, focus)
    || a.steps.length - b.steps.length || a.key.localeCompare(b.key));
}

function boundedSearch(state, depth, focus, language) {
  const before = snapshot(state);
  const definitions = new Map(getCardDefinitions().map((card) => [card.key, card]));
  const initial = { state, metrics: before, steps: [], cost: 0, key: fingerprint(state) };
  const all = new Map([[initial.key, initial]]);
  let frontier = [initial];
  let expanded = 0;
  let evaluated = 0;
  let reachedDepth = 0;
  for (let level = 0; level < depth && frontier.length && expanded < EXPANSION_LIMIT; level += 1) {
    const layer = new Map();
    for (const node of frontier) {
      for (const step of legalSuccessors(node, definitions, language)) {
        if (expanded >= EXPANSION_LIMIT) break;
        expanded += 1;
        const result = step.type === 'build'
          ? performAction(node.state, step.action, step.target)
          : playCard(node.state, step.cardId, step.target);
        if (!result.ok) continue;
        const key = fingerprint(result.state);
        if (all.has(key)) continue;
        evaluated += 1;
        const child = {
          state: result.state, metrics: snapshot(result.state),
          steps: [...node.steps, step],
          cost: node.cost + (step.type === 'build' ? result.report.cost : result.report?.cashCost || 0),
          key,
        };
        all.set(key, child);
        layer.set(key, child);
      }
      if (expanded >= EXPANSION_LIMIT) break;
    }
    if (layer.size) reachedDepth = level + 1;
    // Preserve alternative objectives rather than filling the beam exclusively
    // with one preferred objective. Selection remains strictly bounded.
    const candidates = [...layer.values()];
    const next = new Map();
    for (const objective of [focus, 'coverage', 'heat', 'finance']) {
      for (const candidate of rank(candidates, before, objective).slice(0, BEAM_WIDTH / 4)) next.set(candidate.key, candidate);
    }
    frontier = [...next.values()].slice(0, BEAM_WIDTH);
  }
  return {
    before, nodes: [...all.values()],
    stats: { depth, reachedDepth, expanded, evaluated, beamWidth: BEAM_WIDTH, limit: EXPANSION_LIMIT, limitReached: expanded >= EXPANSION_LIMIT },
  };
}

function describePlan(node, objective, before, state, language) {
  const proof = evidence(before, node, state);
  const after = proof.after;
  const heatPassed = Boolean(state.heatReport);
  let rationale;
  if (objective === 'coverage') {
    rationale = choose(language,
      `Public coverage rises from ${number(before.coverage)}% to ${number(after.coverage)}% (+${number(proof.coverageGain)} percentage points), reaching ${number(proof.newlyServedResidents)} additional residents${proof.newlyServedBuildings.length ? ` in blocks ${proof.newlyServedBuildings.join(', ')}` : ''}. Overlapping services count each resident once.`,
      `公共覆盖从 ${number(before.coverage)}% 提升至 ${number(after.coverage)}%（增加 ${number(proof.coverageGain)} 个百分点），新增服务 ${number(proof.newlyServedResidents)} 位居民${proof.newlyServedBuildings.length ? `，对应 ${proof.newlyServedBuildings.join('、')} 栋` : ''}。重叠设施对同一居民只计算一次。`);
  } else if (objective === 'heat') {
    rationale = choose(language,
      `${heatPassed ? 'At the same population, modelled heat-related livability loss changes from' : 'At the current population, estimated heatwave livability loss falls from'} ${number(before.heatLoss)} to ${number(after.heatLoss)} points. Building greening protects indoor spaces; public green space reduces outdoor exposure.${heatPassed ? ' The recorded heatwave result stays unchanged.' : ' This is a forecast, not a guaranteed event outcome.'}`,
      `${heatPassed ? '按相同入住人数重新比较，热暴露模型预计损失从' : '按当前入住人数，预计高温宜居损失从'} ${number(before.heatLoss)} 降至 ${number(after.heatLoss)} 点。建筑绿化保护室内，公共绿地缓解户外暴露。${heatPassed ? '已发生的高温历史报告不会因此改变。' : '这是预测，不保证届时事件结果。'}`);
  } else {
    rationale = choose(language,
      `${node.steps.length ? 'This plan leaves' : 'Keeping the current plan leaves'} ${money(after.funds)} in funds, with ${money(after.netIncome)} net income at the next settlement. Outstanding scheduled repayments total ${money(after.debtOutstanding)}. Cash and debt are evaluated separately.`,
      `${node.steps.length ? '这套方案保留' : '暂缓新增工程可保留'} ${money(after.funds)} 财政，下一次结算净收入为 ${money(after.netIncome)}，尚未偿还的融资合计 ${money(after.debtOutstanding)}。现金与债务分别比较。`);
  }
  const tradeoff = node.steps.length
    ? choose(language,
      `Spends ${money(proof.cost)} and ${proof.politicalCost} political points now. Next-settlement upkeep changes by ${money(proof.additionalUpkeep)}.${proof.temporaryUpkeepTurns ? ` The upkeep discount lasts for ${proof.temporaryUpkeepTurns} settlements, including this turn.` : ''}${proof.debtChange > 0 ? ` Adds ${money(proof.debtChange)} in scheduled repayments.` : ''} Only current-turn effects are simulated; future draws, migration and turn settlement are excluded.`,
      `当前支出 ${money(proof.cost)}，消耗 ${proof.politicalCost} 点政治资源，本次结算维护费用变化 ${money(proof.additionalUpkeep)}。${proof.temporaryUpkeepTurns ? `维护优惠持续 ${proof.temporaryUpkeepTurns} 次结算，包含本回合。` : ''}${proof.debtChange > 0 ? `新增待偿还融资 ${money(proof.debtChange)}。` : ''}仅模拟当前回合效果，不含未来抽牌、迁入迁出和回合结算。`)
    : choose(language,
      'Preserves cash and political points, but adds no public coverage or building upgrades this turn. Waiting can leave exposed residents unprotected at the announced heatwave.',
      '保留现金与政治资源，但本回合不会增加公共覆盖或建筑改造。持续等待可能使居民在已预告的高温中缺少保护。');
  return {
    id: objective, objective,
    label: objective === 'coverage' ? choose(language, 'Extend green space access', '扩大公共绿地服务')
      : objective === 'heat' ? choose(language, heatPassed ? 'Improve residential comfort' : 'Reduce heat exposure', heatPassed ? '改善居住舒适性' : '降低高温暴露')
        : choose(language, node.steps.length ? 'Protect the operating budget' : 'Preserve financial headroom', node.steps.length ? '保障运营财政' : '保留财政余量'),
    steps: node.steps.map((step) => ({ ...step })), evidence: proof, rationale, tradeoff,
  };
}

function learningFor(state, metrics, language) {
  const targets = getTargets(state);
  const mostIncomplete = [...targets].filter((target) => !target.done).sort((a, b) => a.progress - b.progress)[0];
  const concept = metrics.funds < 2400 || metrics.netIncome < 0 || metrics.debtOutstanding > 0 ? 'finance'
    : !state.heatReport && state.turn >= state.heatTurn - 1 && metrics.heatRisk > 45 ? 'heat'
      : state.heatReport && state.status === 'remediation' ? 'livability'
        : mostIncomplete?.key === 'coverage' ? 'coverage'
          : mostIncomplete?.key === 'upgraded' ? 'upgrades'
            : mostIncomplete?.key === 'livability' ? 'livability' : 'heat';
  const banks = {
    coverage: {
      label: choose(language, 'Population-weighted public access', '按居民加权的公共服务'),
      question: choose(language, `Public green space currently reaches ${number(metrics.coverage)}% of residents. Which principle should guide the next facility?`, `公共绿地目前服务 ${number(metrics.coverage)}% 的居民。下一处设施应遵循哪项原则？`),
      options: [
        [true, choose(language, 'Reach residents who are not already served; count overlapping service only once.', '优先服务尚未覆盖的居民，对重叠服务只计算一次。'), choose(language, `Correct. ${number(metrics.coveredResidents)} residents are currently served. The coverage denominator is the whole community population, not the number of parks.`, `正确。目前服务 ${number(metrics.coveredResidents)} 位居民。覆盖率的分母是全社区居民人数，而非公园数量。`)],
        [false, choose(language, 'Add the residents served by every facility, including duplicates.', '将每处设施服务的居民相加，包括重复居民。'), choose(language, 'Overlapping facilities do not create additional unique residents. Double-counting would overstate public access.', '重叠设施不会增加独立受益居民。重复计数会夸大公共服务。')],
        [false, choose(language, 'Green a roof and count every nearby block as publicly served.', '绿化一栋屋顶，并将附近住宅都计入公共覆盖。'), choose(language, 'Building greening helps that block indoors. In this scenario it does not extend public service coverage.', '建筑绿化改善该栋住宅的室内环境，本情景不会因此扩大公共绿地覆盖。')],
      ],
    },
    heat: {
      label: choose(language, 'Complementary heat protection', '互补的高温保护'),
      question: choose(language, `${state.heatReport ? 'The heatwave report evaluates indoor and outdoor exposure separately.' : `The heatwave arrives at the end of turn ${state.heatTurn}. Indoor and outdoor exposure are evaluated separately.`} What gives complementary protection?`, `${state.heatReport ? '高温报告分别计算室内与户外暴露。' : `高温将在第 ${state.heatTurn} 回合结束时发生，室内与户外暴露分别计算。`}哪种做法提供互补保护？`),
      options: [
        [false, choose(language, 'Stack several parks over the same block and add every protection bonus.', '在同一住宅旁叠加多个公园，并累加全部保护。'), choose(language, 'Outdoor protection uses the best available public service, rather than stacking every overlapping facility.', '户外保护取可用公共设施中的最佳效果，不叠加每处重叠设施。')],
        [true, choose(language, 'Combine building greening with public green space serving exposed blocks.', '将建筑绿化与服务受热住宅的公共绿地结合。'), choose(language, `Correct. The current model estimates ${number(metrics.heatLoss)} livability points of heat loss. Roof greening addresses the indoor part; public facilities address the outdoor part.`, `正确。当前模型预计高温宜居损失 ${number(metrics.heatLoss)} 点。建筑绿化作用于室内部分，公共设施作用于户外部分。`)],
        [false, choose(language, 'Use emergency cooling as permanent public green space coverage.', '将应急降温视为永久公共绿地覆盖。'), choose(language, 'Emergency cooling reduces the next heatwave loss only. It creates no permanent coverage and expires after that event.', '应急降温只减轻下一次高温损失，不提供永久覆盖，并在事件后失效。')],
      ],
    },
    finance: {
      label: choose(language, 'Cash, upkeep and repayment', '现金、维护与偿还'),
      question: choose(language, `Funds are ${money(metrics.funds)} and scheduled repayments total ${money(metrics.debtOutstanding)}. What should a sustainable spending plan account for?`, `现有财政 ${money(metrics.funds)}，待偿还融资 ${money(metrics.debtOutstanding)}。可持续的支出计划应考虑什么？`),
      options: [
        [false, choose(language, 'Treat borrowed cash as a grant that never needs repayment.', '将融资现金视为无需偿还的拨款。'), choose(language, 'Financing increases cash now but creates scheduled repayments. A grant and a loan have different long-term costs.', '融资增加当前现金，同时产生未来偿还义务。拨款和借款的长期成本不同。')],
        [false, choose(language, 'Compare construction prices and ignore ongoing upkeep.', '只比较施工价格，忽略持续维护。'), choose(language, 'Facilities and greened buildings incur upkeep every turn. Ignoring it overstates the operating surplus.', '公共设施与绿化建筑每回合产生维护费用。忽略维护会夸大运营结余。')],
        [true, choose(language, 'Keep room for recurring upkeep and scheduled debt repayments.', '为持续维护与到期融资偿还保留财政空间。'), choose(language, `Correct. The next settlement currently predicts ${money(metrics.netIncome)} net income after upkeep and repayments due that turn. Later repayments still remain obligations.`, `正确。当前预计下一次结算扣除维护及该回合到期偿还后，净收入为 ${money(metrics.netIncome)}。后续偿还义务仍然存在。`)],
      ],
    },
    upgrades: {
      label: choose(language, 'Building upgrades versus public services', '建筑改造与公共服务的区别'),
      question: choose(language, `${metrics.upgraded} of the required 4 HDB blocks are greened. Which action directly advances that target?`, `已绿化 ${metrics.upgraded} 栋，目标为 4 栋。哪种行动直接推进建筑改造目标？`),
      options: [
        [true, choose(language, 'Green an existing HDB block that has not been upgraded.', '为尚未改造的既有 HDB 安装建筑绿化。'), choose(language, 'Correct. Only greened residential blocks count towards this target. Their housing capacity stays fixed.', '正确。只有完成建筑绿化的住宅计入此目标，住房容量保持不变。')],
        [false, choose(language, 'Build any park and count it as an upgraded residential block.', '建设任意公园，并将它计入已改造住宅。'), choose(language, 'A park improves public services, but does not green an HDB building.', '公园改善公共服务，但不会完成 HDB 建筑绿化。')],
        [false, choose(language, 'Increase housing capacity through a green roof.', '通过绿色屋顶增加住房容量。'), choose(language, 'This scenario changes the environment of existing homes. Building greening does not add housing capacity.', '本情景改善既有住宅的环境，建筑绿化不会增加住房容量。')],
      ],
    },
    livability: {
      label: choose(language, 'Recovery and evidence over time', '补救与不同时点的证据'),
      question: choose(language, `Livability is ${number(metrics.livability)}, against a target of 75. How should improvements made after a heatwave be interpreted?`, `宜居度为 ${number(metrics.livability)}，目标为 75。高温后进行的改造应如何解释？`),
      options: [
        [false, choose(language, 'Rewrite the past heatwave report as if the improvements had already existed.', '重写过去的高温报告，假设当时已有这些改造。'), choose(language, 'The event report records conditions at that event. Later actions cannot change those historical losses.', '事件报告记录事件发生时的条件，后续行动不能改变历史损失。')],
        [true, choose(language, 'Improve current comfort while keeping the past event report unchanged.', '提升当前舒适性，同时保留过去的事件报告。'), choose(language, 'Correct. Recovery can improve current livability and the inspection result. Comparing it with the unchanged heatwave report reveals the value of preparing earlier.', '正确。补救可提升当前宜居度及验收结果。与原高温报告比较，可以理解提前准备的价值。')],
        [false, choose(language, 'Assume any current-turn forecast guarantees inspection success.', '认为任何当前回合预测都保证验收成功。'), choose(language, 'This search evaluates immediate effects. Future settlement, population changes and inspection still follow the game rules.', '本次搜索只比较即时效果。未来结算、人口变化和验收仍按游戏规则执行。')],
      ],
    },
  };
  const selected = banks[concept];
  return {
    concept, conceptLabel: selected.label, question: selected.question, practice: true,
    options: selected.options.map(([correct, text, feedback], index) => ({ id: `${concept}-${index + 1}`, text, correct, feedback })),
  };
}

export function analyzeCommunity(state, { focus = 'balanced', language = 'en', maxDepth = 3 } = {}) {
  const lang = String(language).toLowerCase().startsWith('zh') ? 'zh' : 'en';
  const objective = ['balanced', 'heat', 'coverage', 'finance'].includes(focus) ? focus : 'balanced';
  const depth = maxDepth === 2 ? 2 : 3;
  const search = boundedSearch(state, depth, objective, lang);
  const before = search.before;
  const used = new Set();
  const recommendations = [];
  const priorities = objective === 'finance' ? ['finance', 'coverage', 'heat']
    : objective === 'coverage' ? ['coverage', 'heat', 'finance']
      : objective === 'heat' ? ['heat', 'coverage', 'finance']
        : score(rank(search.nodes, before, 'heat')[0], before, 'balanced') >= score(rank(search.nodes, before, 'coverage')[0], before, 'balanced')
          ? ['heat', 'coverage', 'finance'] : ['coverage', 'heat', 'finance'];
  const playable = state.status === 'playing' || state.status === 'remediation';
  if (playable) {
    for (const priority of priorities) {
      const candidates = rank(search.nodes, before, priority).filter((node) => {
        if (used.has(node.key)) return false;
        if (priority === 'coverage') return node.metrics.coverage > before.coverage + 1e-8;
        if (priority === 'heat') return state.heatReport
          ? node.metrics.livability > before.livability + 1e-8
          : node.metrics.heatLoss < before.heatLoss - 1e-8;
        return true;
      });
      if (!candidates.length) continue;
      const best = candidates[0];
      used.add(best.key);
      recommendations.push(describePlan(best, priority, before, state, lang));
    }
  }
  const summary = !playable
    ? choose(lang, 'The project has ended. Review the recorded outcomes; no new actions are recommended.', '项目已结束。请复盘已记录的结果；不推荐新的施工行动。')
    : choose(lang,
      `Compared ${search.stats.evaluated} distinct feasible plans with up to ${depth} current-turn actions. These are priority choices within a limited local search, not a global optimum or a promise of inspection success. All comparisons start from the same funds, population and turn.`,
      `比较了 ${search.stats.evaluated} 套不同可行方案，每套最多 ${depth} 个当前回合行动。这些是有限局部搜索内的优先选择，并非全局最优，也不保证验收成功。所有方案从相同财政、人口与回合时点开始比较。`);
  return {
    method: 'local-search', scope: 'current-turn', focus: objective,
    recommendations, summary, learning: learningFor(state, before, lang),
    search: { ...search.stats },
  };
}
