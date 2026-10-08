/**
 * Engine text translation is separate from the simulation. Existing Chinese
 * saves remain valid, and every translated message can be rendered back in
 * Chinese. Dynamic templates preserve monetary amounts, turns and block IDs.
 * `localizeGameText` also accepts plain objects/arrays and never mutates them.
 */
const PAIRS = [
  ['建筑绿化', 'Building greening'],
  ['社区公园', 'Community park'],
  ['林荫步道', 'Shaded walkway'],
  ['建筑绿化补贴', 'Building Greening Subsidy'],
  ['公共绿地补贴', 'Public Green Space Subsidy'],
  ['追加改造拨款', 'Additional Renewal Grant'],
  ['居民共创', 'Resident Co-design'],
  ['社区施工队', 'Community Works Team'],
  ['过桥融资', 'Bridge Financing'],
  ['应急降温支援', 'Emergency Cooling Support'],
  ['维护志愿队', 'Maintenance Volunteers'],
  ['批量绿化改造', 'Batch Greening'],
  ['长期公共建设协议', 'Long-term Public Works Agreement'],
  ['生态项目专项拨款', 'Green Renewal Grant'],
  ['本回合建筑绿化费用降低 30%，仅作用于逐栋施工。', 'Building greening costs 30% less this turn. Applies to individual upgrades only.'],
  ['本回合公园和步道的建设费用降低 25%，土地转换费照常。', 'Parks and shaded walkways cost 25% less this turn. Land conversion fees still apply.'],
  ['立即获得 $1,800 改造拨款，无需偿还。', 'Receive a $1,800 renewal grant immediately. No repayment required.'],
  ['开展居民参与活动，宜居度提升 2 点。', 'Invite residents to shape the renewal plan. Livability increases by 2 points.'],
  ['指定一栋尚未绿化的 HDB，以 $1,200 完成建筑绿化。', 'Green one HDB block that has not been upgraded for $1,200.'],
  ['立即获得 $3,000；从下一回合开始，连续 3 次结算各偿还 $1,100。', 'Receive $3,000 now. Starting next turn, repay $1,100 at each of the next 3 turn settlements.'],
  ['支付 $600，下一次高温的室内和户外损失均降低 35%。高温过后失效，不增加永久覆盖。', 'Pay $600 to reduce indoor and outdoor losses in the next heatwave by 35%. Expires after the heatwave and adds no permanent coverage.'],
  ['本回合及下一回合，绿色设施维护费用降低 50%；基础运营费用照常。', 'Green infrastructure upkeep costs 50% less this turn and next turn. Basic operating costs still apply.'],
  ['保留。支付 $4,200，优先为热风险最高的 3 栋未改造 HDB 绿化；不足 3 栋时每栋 $1,400。', 'Retained. Pay $4,200 to green the 3 unupgraded blocks with the highest heat risk. If fewer than 3 remain, pay $1,400 per block.'],
  ['保留。打出后，本情景公园和步道的建设费用长期打 8 折；土地转换费照常。', 'Retained. Once played, parks and shaded walkways cost 20% less for the rest of this scenario. Land conversion fees still apply.'],
  ['保留。立即获得 $3,500 专项拨款，无需偿还。', 'Retained. Receive a $3,500 project grant immediately. No repayment required.'],
  ['南侧西区空地', 'Southwest lot'],
  ['北侧中央空地', 'North central lot'],
  ['南侧东区空地', 'Southeast lot'],
  ['西侧停车用地', 'West car park'],
  ['公共绿地覆盖', 'Public green space coverage'],
  ['绿色 HDB 改造', 'Greened HDB blocks'],
  ['社区宜居度', 'Community livability'],
  ['栋', 'blocks'],
  ['绿色更新计划启动：第 6 回合结束发生高温，第 8 回合验收。103 已完成示范绿化。', 'Green renewal begins. A heatwave arrives at the end of turn 6; inspection follows at the end of turn 8. Block 103 is already greened as a demonstration project.'],
  ['项目已结算，请重新开始新的计划。', 'This project has been assessed. Start a new renewal plan to continue.'],
  ['请选择有效的建设类型。', 'Choose a valid construction type.'],
  ['请选择一栋 HDB。', 'Select an HDB block.'],
  ['请选择可建设的空地。', 'Select an available lot.'],
  ['这栋 HDB 已完成建筑绿化。', 'This HDB block is already greened.'],
  ['这块土地已有公共设施。', 'This lot already has a public facility.'],
  ['项目已结束。', 'This project has ended.'],
  ['本情景只能选择一张阶段策略。', 'Only one strategy can be chosen for this scenario.'],
  ['请选择有效的阶段策略。', 'Choose a valid scenario strategy.'],
  ['这张政策牌已不在手中。', 'This policy card is no longer in your hand.'],
  ['政策牌定义不存在。', 'This policy card could not be found.'],
  ['高温已过去，应急降温支援无法追溯历史损失。', 'The heatwave has passed. Emergency cooling cannot reverse past losses.'],
  ['社区已为下一次高温部署降温支援。', 'Emergency cooling is already in place for the next heatwave.'],
  ['本回合已启用建筑绿化补贴。', 'The building greening subsidy is already active this turn.'],
  ['本回合已启用公共绿地补贴。', 'The public green space subsidy is already active this turn.'],
  ['请选择一栋尚未绿化的 HDB。', 'Select an HDB block that has not been greened.'],
  ['所有 HDB 已完成绿化，没有批量改造目标。', 'All HDB blocks are already greened. There are no blocks left for a batch upgrade.'],
  ['本回合逐栋绿化打 7 折', 'individual building greening costs 30% less this turn'],
  ['本回合公共建设打 75 折', 'public construction costs 25% less this turn'],
  ['获得 $1,800', 'received $1,800'],
  ['获得 $3,500', 'received $3,500'],
  ['宜居度 +2', 'livability +2'],
  ['获得 $3,000，未来三回合共偿还 $3,300', 'received $3,000; repay a total of $3,300 over the next three turns'],
  ['支出 $600，下一次高温损失降低 35%', 'paid $600; losses in the next heatwave are reduced by 35%'],
  ['本回合及下一回合绿色设施维护减半', 'green infrastructure upkeep is halved this turn and next turn'],
  ['长期公共建设 8 折生效', 'the ongoing 20% public construction discount is now active'],
  ['暂不支持这张政策牌。', 'This policy card is not available.'],
  ['高温事件逐栋结算', 'Heatwave assessment by block'],
  ['绿色社区验收通过', 'Green community inspection passed'],
  ['验收未达标 · 启动两回合补救', 'Inspection incomplete · Two extra turns to recover'],
  ['补救期限结束', 'Recovery deadline reached'],
  ['项目已结束，请查看验收报告或重新开始。', 'This project has ended. Review the inspection report or start again.'],
  ['社区支持基金', 'Community Support Fund'],
  ['邻里组织为公共空间更新提供 $700 支持。', 'Neighbourhood groups contributed $700 towards public space renewal.'],
  ['财政危机预警：余额低于 -$2,000。若下一回合结算仍低于该线，项目将终止；可使用拨款或融资补救。', 'Financial warning: funds are below -$2,000. If they remain below this threshold at the next settlement, the project will end. A grant or financing can help you recover.'],
  ['下一回合结算财政仍低于 -$2,000 将终止项目。', 'The project will end if funds remain below -$2,000 at the next settlement.'],
  ['财政持续危机 · 项目终止', 'Persistent financial crisis · Project ended'],
  ['连续两回合财政低于 -$2,000。', 'Funds stayed below -$2,000 for two consecutive turn settlements.'],
  ['公共覆盖、建筑改造与宜居度全部达到要求，项目验收通过。', 'Public coverage, building greening and livability all meet the targets. The project has passed inspection.'],
  ['验收未达标：获得 $1,000 补救支持，追加 2 回合。高温报告保留为历史记录。', 'Inspection targets are incomplete. Receive $1,000 in recovery support and two extra turns. The heatwave report remains a record of the original event.'],
  ['两回合补救期限结束，项目未通过验收。', 'The two recovery turns have ended. The project did not pass inspection.'],
  ['绿色社区验收通过！', 'Green community inspection passed!'],
  ['项目结束，请查看验收报告。', 'The project has ended. Review the inspection report.'],
  ['进入两回合补救期，先完成尚未达标的目标。', 'Two recovery turns begin. Focus on the targets that are still incomplete.'],
  ['高温事件已结算，请查看逐栋报告。', 'The heatwave has been assessed. Review the report for each block.'],
];

const TO_EN = new Map(PAIRS);
const TO_ZH = new Map(PAIRS.map(([zh, en]) => [en, zh]));
const zhList = (text) => text.replace(/,\s*/g, '、');
const enList = (text) => text.replace(/、/g, ', ');
const NUMBER = '([-\\d,.]+)';

// Each bilingual template has an exact reverse, so switching language never
// requires changing stored logs, historical reports or future English saves.
const TEMPLATES = [
  {
    zh: /^(.+)将服务 (.+)。$/,
    en: /^(Building greening|Community park|Shaded walkway) (?:will serve HDB blocks (.+)|currently reaches no homes)\.$/,
    toEn: (m) => `${localizeGameText(m[1], 'en')} ${m[2] === '暂无住宅' ? 'currently reaches no homes' : `will serve HDB blocks ${enList(m[2])}`}.`,
    toZh: (m) => `${localizeGameText(m[1], 'zh')}将服务 ${m[2] ? zhList(m[2]) : '暂无住宅'}。`,
  },
  {
    zh: new RegExp(`^财政不足，需 \\$${NUMBER}。$`),
    en: new RegExp(`^Insufficient funds\\. Need \\$${NUMBER}\\.$`),
    toEn: (m) => `Insufficient funds. Need $${m[1]}.`,
    toZh: (m) => `财政不足，需 $${m[1]}。`,
  },
  {
    zh: /^(?!实施「)(.+)完成(建筑绿化|社区公园|林荫步道)，支出 \$([-\d,.]+)(?:，新增公共覆盖 ([\d.]+)%)?。$/,
    en: /^(Building greening|Community park|Shaded walkway) completed at (.+)\. Cost: \$([-\d,.]+)\.(?: Public coverage \+([\d.]+)%\.)?$/,
    toEn: (m) => `${localizeGameText(m[2], 'en')} completed at ${localizeGameText(m[1], 'en')}. Cost: $${m[3]}.${m[4] ? ` Public coverage +${m[4]}%.` : ''}`,
    toZh: (m) => `${localizeGameText(m[2], 'zh')}完成${localizeGameText(m[1], 'zh')}，支出 $${m[3]}${m[4] ? `，新增公共覆盖 ${m[4]}%` : ''}。`,
  },
  {
    zh: /^已选择「(.+)」，策略牌保留在手中，打出后生效。$/,
    en: /^Selected “(.+)”\. The strategy stays in hand and takes effect when played\.$/,
    toEn: (m) => `Selected “${localizeGameText(m[1], 'en')}”. The strategy stays in hand and takes effect when played.`,
    toZh: (m) => `已选择「${localizeGameText(m[1], 'zh')}」，策略牌保留在手中，打出后生效。`,
  },
  {
    zh: /^政治点不足，需 (\d+) 点。$/,
    en: /^Insufficient political points\. Need (\d+)\.$/,
    toEn: (m) => `Insufficient political points. Need ${m[1]}.`,
    toZh: (m) => `政治点不足，需 ${m[1]} 点。`,
  },
  {
    zh: /^财政不足，这项政策另需 \$([-\d,.]+)。$/,
    en: /^Insufficient funds\. This policy also requires \$([-\d,.]+)\.$/,
    toEn: (m) => `Insufficient funds. This policy also requires $${m[1]}.`,
    toZh: (m) => `财政不足，这项政策另需 $${m[1]}。`,
  },
  {
    zh: /^(.+) 完成建筑绿化，支出 \$([-\d,.]+)$/,
    en: /^HDB blocks (.+) greened; cost \$([-\d,.]+)$/,
    toEn: (m) => `HDB blocks ${enList(m[1])} greened; cost $${m[2]}`,
    toZh: (m) => `${zhList(m[1])} 完成建筑绿化，支出 $${m[2]}`,
  },
  {
    zh: /^实施「(.+)」：(.+)。$/,
    en: /^Implemented “(.+)”: (.+)\.$/,
    toEn: (m) => `Implemented “${localizeGameText(m[1], 'en')}”: ${localizeGameText(m[2], 'en')}.`,
    toZh: (m) => `实施「${localizeGameText(m[1], 'zh')}」：${localizeGameText(m[2], 'zh')}。`,
  },
  {
    zh: /^(建筑绿化保护室内|室内尚无建筑绿化)；(?:公共设施 (.+) 缓解户外暴露|(户外无公共绿地服务))(；应急降温减损 35%)?$/,
    en: /^(Building greening protects indoor spaces|Indoor spaces have no building greening); (?:facilities (.+) reduce outdoor exposure|(no public green space serves outdoor areas))(; emergency cooling reduces losses by 35%)?\.$/,
    toEn: (m) => `${m[1] === '建筑绿化保护室内' ? 'Building greening protects indoor spaces' : 'Indoor spaces have no building greening'}; ${m[2] ? `facilities ${enList(m[2])} reduce outdoor exposure` : 'no public green space serves outdoor areas'}${m[4] ? '; emergency cooling reduces losses by 35%' : ''}.`,
    toZh: (m) => `${m[1] === 'Building greening protects indoor spaces' ? '建筑绿化保护室内' : '室内尚无建筑绿化'}；${m[2] ? `公共设施 ${zhList(m[2])} 缓解户外暴露` : '户外无公共绿地服务'}${m[4] ? '；应急降温减损 35%' : ''}`,
  },
  {
    zh: /^高温检验：宜居度 -([\d.]+)，应对支出 \$([-\d,.]+)，(\d+) 位居民迁出；逐栋报告已生成。$/,
    en: /^Heatwave assessment: livability -([\d.]+); response cost \$([-\d,.]+); (\d+) residents moved out\. The block report is available\.$/,
    toEn: (m) => `Heatwave assessment: livability -${m[1]}; response cost $${m[2]}; ${m[3]} residents moved out. The block report is available.`,
    toZh: (m) => `高温检验：宜居度 -${m[1]}，应对支出 $${m[2]}，${m[3]} 位居民迁出；逐栋报告已生成。`,
  },
  {
    zh: /^第 (\d+) 回合财政结算：收入 \$([-\d,.]+)，维护 \$([-\d,.]+)(?:，偿还融资 \$([-\d,.]+))?，净收入 \$([-\d,.]+)。$/,
    en: /^Turn (\d+) finances: income \$([-\d,.]+); upkeep \$([-\d,.]+)(?:; loan repayment \$([-\d,.]+))?; net income \$([-\d,.]+)\.$/,
    toEn: (m) => `Turn ${m[1]} finances: income $${m[2]}; upkeep $${m[3]}${m[4] ? `; loan repayment $${m[4]}` : ''}; net income $${m[5]}.`,
    toZh: (m) => `第 ${m[1]} 回合财政结算：收入 $${m[2]}，维护 $${m[3]}${m[4] ? `，偿还融资 $${m[4]}` : ''}，净收入 $${m[5]}。`,
  },
  {
    zh: /^第 (\d+) 回合经营报告$/,
    en: /^Turn (\d+) operations report$/,
    toEn: (m) => `Turn ${m[1]} operations report`,
    toZh: (m) => `第 ${m[1]} 回合经营报告`,
  },
  {
    zh: /^进入第 (\d+) 回合，政治点与普通手牌已更新。$/,
    en: /^Turn (\d+) started\. Political points and ordinary policy cards have refreshed\.$/,
    toEn: (m) => `Turn ${m[1]} started. Political points and ordinary policy cards have refreshed.`,
    toZh: (m) => `进入第 ${m[1]} 回合，政治点与普通手牌已更新。`,
  },
  {
    zh: /^(公共绿地覆盖|绿色 HDB 改造|社区宜居度) ([\d.]+)(?:%|栋)? \/ ([\d.]+)(?:%|栋)?$/,
    en: /^(Public green space coverage|Greened HDB blocks|Community livability) ([\d.]+)(?:%| blocks)? \/ ([\d.]+)(?:%| blocks)?$/,
    toEn: (m) => `${localizeGameText(m[1], 'en')} ${m[2]}${m[1] === '公共绿地覆盖' ? '%' : m[1] === '绿色 HDB 改造' ? ' blocks' : ''} / ${m[3]}${m[1] === '公共绿地覆盖' ? '%' : m[1] === '绿色 HDB 改造' ? ' blocks' : ''}`,
    toZh: (m) => `${localizeGameText(m[1], 'zh')} ${m[2]}${m[1] === 'Public green space coverage' ? '%' : m[1] === 'Greened HDB blocks' ? '栋' : ''} / ${m[3]}${m[1] === 'Public green space coverage' ? '%' : m[1] === 'Greened HDB blocks' ? '栋' : ''}`,
  },
];

export function localizeGameText(value, lang = 'en') {
  const language = String(lang).toLowerCase().startsWith('zh') ? 'zh' : 'en';
  if (Array.isArray(value)) return value.map((item) => localizeGameText(item, language));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeGameText(item, language)]));
  }
  if (typeof value !== 'string') return value;
  const dictionary = language === 'en' ? TO_EN : TO_ZH;
  if (dictionary.has(value)) return dictionary.get(value);
  for (const template of TEMPLATES) {
    const match = value.match(language === 'en' ? template.zh : template.en);
    if (match) return language === 'en' ? template.toEn(match) : template.toZh(match);
  }
  // Names such as "HDB 103", stable IDs and player-authored notes pass through.
  return value;
}
