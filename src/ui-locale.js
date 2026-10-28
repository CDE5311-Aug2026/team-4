import { localizeGameText } from './game.js';

export const LANGUAGE_KEY = 'hdb-eco-community-language';
export function loadLanguage(storage) {
  try { return storage.getItem(LANGUAGE_KEY) === 'zh' ? 'zh' : 'en'; }
  catch { return 'en'; }
}

// Presentation copy stays separate from the saved simulation. The Chinese
// source strings also let existing saves and open dialogs change language.
const copy = {
  'AI 顾问': 'AI advisor', '打开社区规划 AI 顾问': 'Open the AI community advisor',
  '人': 'residents', '点': 'pts', '栋': 'blocks',
  '自动保存': 'Autosaved', '保存不可用': 'Save unavailable',
  '这项操作暂时无法执行': 'This action is currently unavailable.',
  '社区改造已完成': 'Community upgrade completed.',
  'HDB 绿意邻里主页': 'HDB Eco Community home', '绿意邻里': 'Eco Community',
  '玩法指南': 'How to play', '游戏设置': 'Settings',
  '可交互的三维社区地图': 'Interactive 3D neighbourhood map',
  '正在唤醒这片邻里…': 'Bringing the neighbourhood to life…',
  '我们的社区 · OUR NEIGHBOURHOOD': 'OUR NEIGHBOURHOOD',
  '让绿意，走进日常。': 'A greener everyday.', '盛港 · 新邻里': 'Sengkang · New neighbourhood',
  '地图图层': 'Map layers', '社区': 'Neighbourhood', '服务覆盖': 'Coverage', '热浪风险': 'Heat risk',
  '选择住宅与空地': 'Select a block or plot', '复位视角': 'Reset view', '缩小地图': 'Zoom out', '放大地图': 'Zoom in',
  '点击楼栋或空地，开始你的社区改造': 'Select a block or plot to start improving your community',
  '拖动平移 · 滚轮缩放': 'Drag to pan · Scroll to zoom',
  '每一个决定，都让社区变得更好': 'EVERY CHOICE SHAPES YOUR COMMUNITY',
  '政策手牌': 'Policy cards', '建设设施': 'Build', '绿色更新计划': 'GREEN RENEWAL PROGRAMME', '设计说明': 'Design notes',
  '社区财政': 'Funds', '政治点数': 'Political points', '本回合净收入': 'Net this turn',
  '每回合恢复 · 用于政策': 'Restored each turn · Spent on policies',
  '居住人口': 'Residents', '社区宜居度': 'Livability', '查看财政收支与融资': 'View income, upkeep and loans',
  '限时补救阶段': 'Remedial phase', '社区改造已结项': 'Project complete', '阶段 01 · 绿色新生': 'Stage 01 · Green renewal',
  '项目报告已生成': 'Project report ready', '最后的改造机会': 'Final chance to improve', '本回合的社区计划': 'THIS TURN’S PLAN',
  '成果值得被看见': 'See what you achieved', '准备好下一步了吗？': 'Ready for the next step?',
  '回顾这片邻里的变化': 'Review your community’s progress',
  '结算经营 · 更新入住人口': 'Settle finances · Update residents', '抽取新政策 · 恢复政治点': 'Draw policies · Restore points',
  '查看项目报告': 'Project report', '结束回合': 'End turn', '可在设置中开启新计划': 'Start a new plan in Settings',
  '选择需要绿化的住宅': 'Select a block to add greenery', '选择一块空地，预览建设效果': 'Select an empty plot to preview a facility', '取消': 'Cancel',
  '社区改造目标': 'Community goals', '阶段 01': 'STAGE 01', '一座更凉爽的': 'A cooler,', '绿色社区': 'greener community',
  '已服务': 'Serving', '重叠绿地只计一次，屋顶绿化仅服务本栋。': 'Overlapping green spaces count once. Rooftop greenery benefits its own block.',
  '查看阶段政策': 'View your strategy', '选择本阶段政策': 'Choose a strategy',
  '热浪已结束': 'Heatwave resolved', '气候预警': 'Climate alert', '报告已就绪': 'Report ready', '第 6 回合结束': 'End of turn 6',
  '准备，带来了改变。': 'Preparation made a difference.', '热浪正在靠近': 'A heatwave is approaching',
  '查看每栋住宅的室内与户外损失，了解你的改造如何发挥作用。': 'Review each block’s indoor and outdoor heat impacts to see how your upgrades helped.',
  '建筑绿化保护室内，公共绿地改善户外。现在的布局，会决定热浪中的表现。': 'Building greenery protects indoors. Public green spaces reduce outdoor exposure. Your layout matters.',
  '查看热浪报告': 'Heatwave report', '查看逐栋风险': 'View block risks', '社区日志': 'Community journal',
  '住宅档案': 'BLOCK DETAILS', '取消选择': 'Clear selection', '已绿化': 'Greened', '未绿化': 'Not greened', '待改造': 'Awaiting upgrade',
  '一片屋顶绿意，一份生活舒适。': 'Rooftop greenery, everyday comfort.', '让这栋住宅，成为改变的起点。': 'Let this block be the start of something better.',
  '现有居民': 'Residents', '住房容量': 'Capacity', '热浪准备情况': 'Heatwave readiness',
  '建筑自身绿化': 'Building greenery', '室内热损失减轻': 'Lower indoor heat impact', '屋顶尚未进行绿化': 'No rooftop greenery yet',
  '公共绿地服务': 'Public green space', '户外热暴露得到缓解': 'Lower outdoor heat exposure', '尚未位于服务范围内': 'Outside the service area',
  '已选政策': 'Selected policy', '对本栋使用': 'Apply to this block', '建筑绿化已投入使用': 'Building greenery is in use',
  '建筑绿化': 'Building greenery', '改善本栋居住环境': 'Improve comfort in this block',
  '不增加住房容量或公共覆盖': 'Does not add capacity or public coverage', '安装建筑绿化': 'Add building greenery',
  '地块档案': 'PLOT DETAILS', '绿色空间': 'Green space', '可规划土地': 'Available plot', '社区空地': 'Community plot',
  '已建设': 'Built', '可转换': 'Convertible', '空闲': 'Available',
  '这里的绿意，正在服务邻里。': 'This green space is serving the neighbourhood.',
  '停车用地转为绿地，另需 $800 转换费用。': 'Converting this car park adds $800 to the construction cost.',
  '选择设施，预览受益住宅与施工费用。': 'Select a facility to preview the blocks served and total cost.',
  '社区公园': 'Community park', '林荫步道': 'Shaded walkway',
  '公共覆盖按受益居民去重计算。': 'Public coverage counts each resident once.', '设施已投入使用': 'Facility is in use',
  '范围 15 米 · $3,200 起': '15 m radius · From $3,200', '范围 11 米 · $1,900 起': '11 m radius · From $1,900',
  '施工总费用': 'Total cost', '受益住宅': 'Blocks served', '无': 'None', '新增公共覆盖': 'Added coverage',
  '屋顶绿化不计入公共服务。': 'Rooftop greenery does not count as public coverage.',
  '费用含停车用地转换。': 'Includes the car park conversion fee.', '圆形范围按住宅中心距离判定。': 'Coverage uses the distance to each block’s centre.',
  '确认建设': 'Confirm build', '设施服务范围可在图层中查看': 'Use the Coverage layer to view the service area', '绿色圆圈表示设施服务范围': 'The green circle shows the service area',
  '当前政治点不足或项目已结束。': 'Not enough political points, or the project has ended.',
  '保留': 'Retained', '选择住宅': 'Select block', '选择地块': 'Select plot', '点击查看': 'View policy', '可跨回合': 'Keep for later', '本回合': 'This turn',
  '本回合的政策已执行': 'All policies played this turn', '仍可进行常规建设，或结束回合获取新政策。': 'You can still build, or end the turn to draw new policies.',
  '关闭窗口': 'Close dialog',
  'STRATEGIC POLICY · 阶段政策': 'STRATEGIC POLICY', '你的社区改造路线': 'Your renewal strategy',
  '每一片邻里，都有自己的路线。': 'Every neighbourhood has its own path.',
  '选择一张阶段政策加入手牌。它会保留到使用为止；使用仍需政治点数。': 'Choose one strategy card. It stays in your hand until played and costs political points to use.',
  '常规建设始终可用，政策帮你以不同方式完成目标。': 'Regular construction is always available. Policies offer different ways to reach your goals.',
  '政治点': 'political points', '已选择这条路线': 'Your chosen path', '其他路线': 'Other path', '选择这条路线': 'Choose this path',
  '已覆盖': 'Covered', '未覆盖': 'Not covered',
  'CLIMATE OUTLOOK · 气候展望': 'CLIMATE OUTLOOK', '热浪来临之前，还有时间。': 'There is still time to prepare.',
  '热浪在第 6 回合结束发生。以下是按照当前布局预测的热影响与社区宜居度损失。': 'The heatwave arrives at the end of turn 6. These estimates use your current layout.',
  '建筑绿化降低室内损失，公共覆盖降低户外损失；两者分别计算。': 'Building greenery lowers indoor heat impact; public coverage lowers outdoor impact. They are calculated separately.',
  '预计社区宜居度损失': 'Estimated livability loss', '已经绿化': 'Greened blocks', '公共服务覆盖': 'Public coverage',
  '住宅': 'Block', '居民': 'Residents', '公共绿地': 'Public green space', '室内热影响': 'Indoor impact', '户外热影响': 'Outdoor impact', '合计热影响': 'Total impact',
  '室内与户外热影响相加，按入住人口加权后乘以 0.65 得到宜居度损失。这是游戏化指标，不代表真实温度。': 'Livability loss is the resident-weighted indoor and outdoor impact multiplied by 0.65. This game indicator does not represent actual temperatures.',
  '回到社区，做好准备': 'Return and prepare', '邻里周报': 'Neighbourhood Post',
  '2028 · 第 6 回合　｜　社区气候特别报道': '2028 · TURN 6 | COMMUNITY CLIMATE REPORT',
  '热浪过后，': 'After the heatwave,', '让改变被看见。': 'see the difference.',
  '绿化的住宅与得到公共绿地服务的居民，承受了更小的热损失。': 'Greened blocks and residents served by public green spaces faced lower heat impacts.',
  '报告按热浪发生时的入住人口结算，保留当时的改造成果。': 'This report uses the resident count and upgrades present when the heatwave occurred.',
  '社区宜居度损失': 'Livability loss', '高温应对支出': 'Heat response cost', '迁出居民': 'Residents who moved out', '居民快照': 'Residents at event',
  '建筑绿化与公共绿地共同保护居民。未来的建设继续改善社区，但不会改写这次热浪记录。': 'Building greenery and public green spaces protect residents together. Later improvements do not change this historical report.',
  '继续社区计划': 'Continue your plan', 'COMMUNITY REVIEW · 项目验收': 'COMMUNITY REVIEW',
  '绿意，已经成为日常。': 'A greener everyday starts here.', '再给这片邻里一点时间。': 'A little more time to make a difference.', '这一次，我们学到了什么。': 'What can we learn from this plan?',
  '社区通过了绿色更新验收。每一处改造，都留下了你的选择。': 'Your community passed the green renewal review. Every improvement reflects your choices.',
  '原目标保留至第 10 回合结束。继续建设，完成最后的补救。': 'The same goals remain in place until the end of turn 10. Continue building to complete your remedial plan.',
  '项目期限已到。查看未达目标，下一次用更合适的布局重新出发。': 'Time is up. Review the unfinished goals and try a different layout next time.',
  '绿化住宅': 'Greened blocks', '已达标': 'Met', '待改善': 'Pending', '期末财政': 'Closing funds', '社区居民': 'Residents',
  '热浪在第 6 回合独立结算，补救不会改变历史结果。': 'The turn 6 heatwave is settled separately. Remedial work does not change that history. ',
  '项目在热浪发生前结束，尚未产生高温报告。': 'The project ended before the heatwave, so no heatwave report was generated. ',
  '热浪在第 6 回合独立结算，补救不会改变历史结果。所有参数为原型平衡值。': 'The turn 6 heatwave is settled separately. Remedial work does not change that history. All values are prototype balance settings.',
  '项目在热浪发生前结束，尚未产生高温报告。所有参数为原型平衡值。': 'The project ended before the heatwave, so no heatwave report was generated. All values are prototype balance settings.',
  '所有参数为原型平衡值。': 'All values are prototype balance settings.', '继续补救计划': 'Continue remedial work', '回到我的社区': 'Return to my community',
  'FIELD GUIDE · 社区管理手册': 'FIELD GUIDE', '从一栋楼，一片绿地开始。': 'Start with a block and a patch of green.',
  '在有限的土地与预算中，让这片已有居民的社区变得更宜居。': 'Make an established community more livable with limited land and funds.',
  '改造一栋住宅': 'Upgrade a block', '点击地图上的组屋，安装建筑绿化。它改善本栋的居住环境，减轻室内热损失。': 'Select an HDB block and add building greenery to improve comfort and reduce indoor heat impact.',
  '为居民建设公共绿地': 'Build public green spaces', '点击空地，选择公园或步道。先查看服务范围与受益楼号，再确认建设。': 'Select an empty plot and choose a park or walkway. Review the service area and blocks served before building.',
  '用政策改变你的路线': 'Shape your plan with policies', '选择阶段政策。点击手牌使用，目标牌须选择住宅。普通政策回合结束弃置，保留牌跨回合持有。': 'Choose a strategy, then select cards to use them. Targeted cards require a block. Ordinary cards expire at turn end; retained cards stay in your hand.',
  '为热浪与验收做好准备': 'Prepare for the heatwave and review', '第6回合结束触发热浪，第8回合结束检查三个目标。未达标可补救至第10回合。': 'The heatwave occurs at the end of turn 6. Three goals are checked after turn 8, with remedial work available through turn 10.',
  '鼠标点击选择 · 拖动地图平移 · 滚轮缩放 · Esc 取消选址': 'Click to select · Drag to pan · Scroll to zoom · Esc to cancel placement',
  '每回合收取居民收入和拨款、扣除维护，并将政治点恢复到 3。': 'Each turn collects income and grants, pays upkeep, and restores political points to 3.',
  '我准备好了': 'Ready to begin', 'POLICY BRIEF · 政策详情': 'POLICY BRIEF',
  '保留 · 可跨回合持有': 'Retained · Keep across turns', '仅本回合 · 未使用则弃置': 'This turn only · Discarded if unused', '实施这项政策': 'Apply policy',
  'NEIGHBOURHOOD DIRECTORY · 邻里名册': 'NEIGHBOURHOOD DIRECTORY', '每一栋住宅，每一处空间。': 'Every block. Every shared space.',
  '选择目标后，在右侧档案中查看状态与建设预览。': 'Select a block or plot to view its details and construction preview.',
  '已完成建筑绿化': 'Greened', '尚未改造': 'Not upgraded', '停车用地 · 转换费 $800': 'Car park · $800 conversion fee', '可规划空地': 'Available plot',
  'PLANNING DESK · 社区建设': 'PLANNING DESK', '把一处空间，变成一种可能。': 'Give a shared space a new possibility.',
  '常规建设无需政治点数。选择项目后，在地图上选择目标并确认费用。': 'Regular construction uses no political points. Choose a project, select a location, then confirm the cost.',
  '改善本栋住宅，减轻室内热损失。': 'Improve this block and lower indoor heat impact.',
  '服务半径15米，适合覆盖多栋住宅。': '15 m service radius, ideal for serving several blocks.', '服务半径11米，维护更低。': '11 m service radius with lower upkeep.',
  '基础费用': 'Base cost', '开始规划': 'Start planning', '先选择一张阶段政策，确定你的改造路线。': 'Choose a strategy card before ending the turn.',
  'FINANCIAL ALERT · 财政预警': 'FINANCIAL ALERT', '社区需要一次及时的调整。': 'Your community needs a timely adjustment.', '查看财政收支': 'View finances',
  'NEIGHBOURHOOD NEWS · 邻里消息': 'NEIGHBOURHOOD NEWS', 'COMMUNITY FINANCES · 社区财政': 'COMMUNITY FINANCES',
  '让每一份投入，都有计划。': 'Make every investment count.', '每次回合结束结算居民收入、拨款与维护。融资会在约定回合偿还。': 'Income, grants and upkeep are settled at turn end. Loan repayments follow their agreed schedule.',
  '当前余额': 'Current balance', '本回合收入（拨款 + 居民收入）': 'Income this turn (grants + residents)',
  '本回合维护（含基础运营 $450）': 'Upkeep this turn (includes $450 base cost)', '本回合融资偿还': 'Loan repayments this turn', '剩余融资待偿还': 'Outstanding debt',
  '高温可能产生额外应对支出。若连续两次结算余额低于 −$2,000，项目会终止。': 'Heat may create extra response costs. The project ends if funds fall below −$2,000 for two consecutive settlements.',
  '回到社区': 'Return to community', 'COMMUNITY JOURNAL · 社区日志': 'COMMUNITY JOURNAL', '改变，一步一步发生。': 'Change happens one step at a time.',
  'YOUR COMMUNITY · 游戏设置': 'YOUR COMMUNITY', '继续这片邻里的故事。': 'Continue your neighbourhood’s story.',
  '社区进度自动保存在当前浏览器中。重新开始会替换本地存档。': 'Progress is saved automatically in this browser. Starting again replaces your local save.',
  '当前浏览器不允许保存进度。本次会话可继续游戏，但刷新页面后进度会丢失。': 'This browser cannot save progress. You can play in this session, but refreshing will lose it.',
  '查看玩法指南': 'How to play', '重新开始改造计划': 'Restart your plan',
  '原型版本 1.0 · Three.js 3D 社区 · 中英双语': 'Prototype 1.0 · Three.js 3D community · English / Chinese',
  '画面为程序生成，玩法参数用于测试与迭代。': 'The scene is generated procedurally. Gameplay values are for testing and iteration.',
  'NEW BEGINNING · 新的开始': 'NEW BEGINNING', '开启新的社区计划？': 'Start a new community plan?',
  '这会替换当前浏览器的社区存档，从第 1 回合重新开始。': 'This replaces your community save in this browser and starts again from turn 1.',
  '开启新计划': 'Start new plan', '继续当前社区': 'Keep current community', '新的社区计划已经开启。': 'A new community plan has begun.',
  'DESIGN NOTES · 设计说明': 'DESIGN NOTES', '让每一份绿意，都有意义。': 'Make every green space meaningful.',
  '依据所提供的 GDD 制作的单情景可玩原型。概念图用于社区氛围参考。': 'A playable single-scenario prototype based on the supplied game design document. The concept image informed the neighbourhood atmosphere.',
  '空间选择，产生不同的结果': 'Placement changes the outcome',
  '公园与步道服务范围不同，重叠覆盖不叠加。建造前显示受益住宅；公共覆盖以真实入住人口加权，建筑绿化只改善本栋。': 'Parks and walkways have different service areas. Overlaps do not stack. A preview shows the blocks served before building; coverage is weighted by actual residents, while building greenery benefits only its own block.',
  '政策提供路线，常规建设提供底线': 'Policies guide the plan; construction keeps it moving',
  '固定获得一张可保留的阶段政策。其余政策每回合抽取并弃置，常规建设不依赖抽牌。融资会产生后续偿还，避免无成本的资金堆积。': 'Choose one retained strategy card. Other policies are drawn and discarded each turn. Regular construction is always available. Loans require later repayment.',
  '气候结果可以追溯，失败仍有补救': 'Clear climate results and a second chance',
  '热浪以各栋居民快照分别计算室内与户外损失。验收失败后保留两回合补救，历史热浪报告不会被后续施工改写。': 'Heatwave impacts are calculated indoors and outdoors using each block’s resident snapshot. An unsuccessful review allows two remedial turns. Later construction does not rewrite the heatwave report.',
  '原型范围与参数': 'Prototype scope and values',
  '6栋住宅、4块可规划土地、8回合主计划、2回合补救。能源、电网、新建住房与复杂交通留待后续版本。所有费用、半径、损失与门槛均为测试参数。': 'Six blocks, four plots, eight main turns and two remedial turns. Energy systems, new housing and complex transport are reserved for later versions. Costs, radii, impacts and thresholds are prototype settings.',
  '建筑绿化需要选择一栋住宅。': 'Select a residential block for building greenery.',
  '3D 地图暂时无法加载': 'The 3D map could not load', '请使用支持 WebGL 的浏览器，并启用硬件加速。': 'Use a WebGL-capable browser with hardware acceleration enabled.', '重新加载': 'Reload',
};

const replacements = Object.entries(copy).sort((a, b) => b[0].length - a[0].length);
export function localizeText(value, language = 'en') {
  const raw = String(value ?? '');
  if (language === 'zh') return localizeGameText(raw, 'zh');
  const trimmed = raw.trim();
  const disabledSuffix = ' 当前政治点不足或项目已结束。';
  if (trimmed.endsWith(disabledSuffix)) return `${localizeGameText(trimmed.slice(0, -disabledSuffix.length), 'en')} Not enough political points, or the project has ended.`;
  if (Object.hasOwn(copy, trimmed)) return raw.replace(trimmed, copy[trimmed]);
  const engine = localizeGameText(trimmed, 'en');
  if (engine !== trimmed) return raw.replace(trimmed, engine);
  let text = raw;
  // These fragments span numeric values or HTML elements in the UI.
  text = text
    .replace(/第 (\d+) 回合结束前完成以下目标/g, 'Complete these goals by the end of turn $1')
    .replace(/第 (\d+) 回合结束(触发热浪|进行验收|自动保存)/g, (_, n, action) => `After turn ${n}: ${({'触发热浪':'heatwave','进行验收':'project review','自动保存':'autosave'})[action]}`)
    .replace(/选择目标，使用「(.+)」/g, (_, name) => `Select a target for “${localizeGameText(name, 'en')}”`)
    .replace(/地图已选中 (\d+) 号组屋/g, 'Block $1 selected on the map')
    .replace(/查看政策：(.+)/g, (_, name) => `View policy: ${localizeGameText(name, 'en')}`)
    .replace(/融资：剩余 (\d+) 次，每次 \$([\d,]+)，从第 (\d+) 回合结束开始。/g, (_, n, amount, start) => `${n} loan payments remaining at $${amount} each, starting at the end of turn ${start}.`)
    .replace(/剩余融资 \$([\d,]+) · 期末净财政 \$(-?[\d,]+)/g, (_, debt, net) => `Outstanding debt: $${debt} · Closing net funds: $${net}`)
    .replace(/服务半径 (\d+) 米/g, 'Service radius: $1 m')
    .replace(/住房容量 ([\d,]+) 人/g, 'Capacity: $1 residents')
    .replace(/(\d+) 号组屋/g, 'Block $1')
    .replace(/(\d+) 号/g, 'Block $1')
    .replace(/(\d+) 条记录/g, (_, n) => `${n} ${n === '1' ? 'entry' : 'entries'}`)
    .replace(/(\d+) 张/g, (_, n) => `${n} ${n === '1' ? 'card' : 'cards'}`)
    .replace(/(\d+) 位居民/g, '$1 residents')
    .replace(/回合 (\d+)/g, 'Turn $1')
    .replace(/第 (\d+)/g, 'Turn $1')
    .replace(/\/ (\d+) 回合/g, '/ $1')
    .replace(/(\d+) 月/g, (_, n) => ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(n)] || n)
    .replace(/\/ 6 栋/g, '/ 6 blocks')
    .replace(/(\d+) 政治点/g, '$1 political points')
    .replace(/(\d+) 人/g, '$1 residents');
  text = text.replace(/(\d+)栋/g, '$1 blocks');
  for (const [zh, en] of replacements) text = text.split(zh).join(en);
  return text.replace(/位居民/g, 'residents').replace(/ 人/g, ' residents').replace(/ 点/g, ' pts').replace(/ 栋/g, ' blocks').replace(/ 回合/g, ' turns');
}

const originals = new WeakMap();
function translateValue(node, key, current, language, write) {
  let record = originals.get(node);
  if (!record) { record = new Map(); originals.set(node, record); }
  const prior = record.get(key);
  const source = prior?.output === current ? prior.source : current;
  const output = localizeText(source, language);
  record.set(key, { source, output });
  if (output !== current) write(output);
}

export function localizeDOM(root, language) {
  // Preserve original copy for instant switching without replacing interactive
  // nodes, losing focus, closing a dialog or recreating the Three.js canvas.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement?.closest('[data-language-toggle], [data-localized-copy], script, style')) {
      translateValue(node, 'text', node.data, language, text => { node.data = text; });
    }
  }
  for (const el of [root, ...root.querySelectorAll('[aria-label], [title]')]) {
    for (const attr of ['aria-label', 'title']) {
      if (el.hasAttribute(attr) && !el.closest('[data-language-toggle], [data-localized-copy]')) translateValue(el, attr, el.getAttribute(attr), language, text => el.setAttribute(attr, text));
    }
  }
}
