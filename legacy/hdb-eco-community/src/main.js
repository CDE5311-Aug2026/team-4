import './style.css';
import { CommunityScene } from './scene.js';
import { createGame, migrateLayout, getMetrics, getTargets, getPreview, performAction, playCard, chooseStrategy, endTurn, getCardDefinitions, getStrategyDefinitions } from './game.js';
import { icon, illustration } from './icons.js';
import { LANGUAGE_KEY, loadLanguage, localizeDOM } from './ui-locale.js';
import { analyzeCommunity } from './advisor.js';
import { advisorView } from './advisor-view.js';

const SAVE_KEY = 'hdb-eco-community-v1';
const money = n => Math.round(n || 0).toLocaleString('en-US');
const progressValue = t => t.key==='upgraded' ? String(t.current) : (Math.floor(t.current*10)/10).toFixed(1);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defs = getCardDefinitions();
const definitions = Array.isArray(defs) ? defs : Object.values(defs);
const stratDefs = getStrategyDefinitions();
const strategies = Array.isArray(stratDefs) ? stratDefs : Object.values(stratDefs);
let state = load();
let selected = '103';
let layer = 'normal';
let activeCard = null;
let buildType = null;
let scene;
let toastTimer;
let storageAvailable = true;
let modalView = null;
let advisorFocus = 'balanced';
let advisorAnalysis = null;
let language;
try { language = loadLanguage(localStorage); } catch { language = 'en'; }

function languageButton(modal = false) {
  return `<button class="language-toggle ${modal ? 'modal-language' : ''}" data-command="language" data-language-toggle aria-label="${language === 'en' ? 'Switch to Chinese' : '切换为英文'}" title="${language === 'en' ? 'Switch to Chinese' : '切换为英文'}"><span aria-hidden="true">A / 文</span><b>${language === 'en' ? '中文' : 'English'}</b></button>`;
}
function applyLanguage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.title = language === 'en' ? 'HDB · Eco Community' : 'HDB · 绿意邻里';
  document.querySelectorAll('[data-language-toggle]').forEach(button => {
    button.querySelector('b').textContent = language === 'en' ? '中文' : 'English';
    const label = language === 'en' ? 'Switch to Chinese' : '切换为英文';
    button.setAttribute('aria-label', label); button.title = label;
  });
  localizeDOM(document.querySelector('#app'), language);
  scene?.setLanguage(language);
}
function switchLanguage() {
  language = language === 'en' ? 'zh' : 'en';
  try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Keep the choice for this session. */ }
  applyLanguage();
  if (modalView === 'advisor' && document.querySelector('#modal').open) {
    openAdvisor();
    document.querySelector('#modal [data-language-toggle]')?.focus();
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (saved?.version === 1 && saved.state?.buildings?.length === 6 && saved.state?.lots?.length === 4 && saved.state.turn >= 1 && saved.state.turn <= 10 && Array.isArray(saved.state.hand) && Array.isArray(saved.state.logs) && Array.isArray(saved.state.debts) && ['playing','remediation','won','lost'].includes(saved.state.status)) {
      const metrics = getMetrics(saved.state);
      if ([saved.state.funds,saved.state.livability,saved.state.political,metrics.coverage,metrics.population,metrics.income].every(Number.isFinite)) return migrateLayout(saved.state);
    }
  } catch { /* Unavailable or stale storage falls back to a new scenario. */ }
  return createGame(2028);
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({version:1,state})); storageAvailable=true; }
  catch { storageAvailable=false; }
  const indicator=document.querySelector('.autosave');
  if(indicator) { indicator.innerHTML=`<i></i> ${storageAvailable?'自动保存':'保存不可用'}`;indicator.classList.toggle('unavailable',!storageAvailable); }
  if (indicator) localizeDOM(indicator, language);
}
function getDef(card) { return definitions.find(d => d.key === card?.key) || card; }
function artFor(d) {
  if (d.art) return d.art;
  const s = `${d.key} ${d.name}`;
  return /grant|fund|loan|拨款|融资|财政/.test(s) ? 'funds' : /outreach|resident|社区动员|居民/.test(s) ? 'people' : /heat|cool|应急|降温/.test(s) ? 'cool' : /park|subsidy|公共|补贴/.test(s) ? 'park' : 'green';
}
function notify(text, kind='success') {
  const el = document.querySelector('#toast');
  el.innerHTML = `${icon(kind === 'error' ? 'bell' : 'check')}<span>${esc(text)}</span>`;
  el.className = `toast visible ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 4200);
  localizeDOM(el, language);
}
function complete(result, feedback=true) {
  if (!result.ok) {
    const message=result.message || '这项操作暂时无法执行';
    notify(message, 'error');
    if(document.querySelector('#modal')?.open) {
      document.querySelector('#modal .inline-error')?.remove();
      const error=document.createElement('p');error.className='inline-error';error.setAttribute('role','alert');error.textContent=message;
      document.querySelector('#modal-content').append(error);
      localizeDOM(error, language);
    }
    return false;
  }
  state = result.state;
  activeCard = null;
  buildType = null;
  save();
  render();
  if (feedback) notify(result.message || '社区改造已完成');
  return true;
}

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="HDB 绿意邻里主页"><span class="brand-mark">${icon('leaf')}</span><span><b>HDB<span class="brand-dot">.</span></b><small>绿意邻里 <em>ECO COMMUNITY</em></small></span></a>
    <div id="stats" class="stats"></div>
    <div class="header-actions"><span class="autosave" role="status" aria-live="polite"><i></i> 自动保存</span><button class="advisor-button" data-command="advisor" title="打开社区规划 AI 顾问">${icon('spark')}<span>AI 顾问</span></button>${languageButton()}<button class="icon-button" data-command="help" aria-label="玩法指南" title="玩法指南">${icon('help')}</button><button class="icon-button" data-command="settings" aria-label="游戏设置" title="游戏设置">${icon('settings')}</button></div>
  </header>
  <main class="game-world">
    <div class="world-grain"></div>
    <div id="scene" aria-label="可交互的三维社区地图"></div>
    <div id="scene-loading" class="scene-loading"><span class="loader"></span><p>正在唤醒这片邻里…</p></div>
    <div class="place-heading"><div class="eyebrow">我们的社区 · OUR NEIGHBOURHOOD</div><h1>让绿意，走进日常。</h1><p>${icon('pin')} 盛港 · 新邻里 <span>01°23′ N &nbsp; 103°53′ E</span></p></div>
    <div id="season" class="season"></div>
    <aside id="left-panel" class="left-panel"></aside>
    <aside id="detail-panel" class="detail-panel"></aside>
    <div class="map-toolbar"><div class="layer-tabs" aria-label="地图图层"><button data-layer="normal" class="active">${icon('map')} 社区</button><button data-layer="coverage">${icon('leaf')} 服务覆盖</button><button data-layer="heat">${icon('sun')} 热浪风险</button></div><button class="icon-button" data-command="roster" title="选择住宅与空地" aria-label="选择住宅与空地">${icon('building')}</button><button class="icon-button" data-command="reset-view" title="复位视角" aria-label="复位视角">${icon('target')}</button><div class="zoom-group"><button data-command="zoom-out" aria-label="缩小地图">${icon('minus')}</button><button data-command="zoom-in" aria-label="放大地图">${icon('plus')}</button></div></div>
    <div id="map-hint" class="map-hint">${icon('home')} 点击楼栋或空地，开始你的社区改造 <span>拖动平移 · 滚轮缩放</span></div>
    <div id="action-banner" class="action-banner"></div>
    <section class="bottom-dock"><div class="dock-main"><div class="dock-heading"><div><span class="eyebrow">每一个决定，都让社区变得更好</span><h2>${icon('layers')} 政策手牌 <span id="hand-count"></span></h2></div><button class="build-button" data-command="build">${icon('plus')} 建设设施</button></div><div id="hand" class="hand"></div></div><div id="turn-control" class="turn-control"></div></section>
    <div class="world-footer"><span>HDB ECO COMMUNITY <i> / </i> 绿色更新计划</span><button data-command="design">设计说明 ${icon('arrow')}</button></div>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <dialog id="modal"><div id="modal-content"></div></dialog>
`;

function render() {
  const m = getMetrics(state);
  const finished = state.status === 'won' || state.status === 'lost';
  document.querySelector('#stats').innerHTML = [
    ['coins','社区财政',`<span class="currency">$</span> ${money(state.funds)}`,`本回合净收入 <b>${m.netIncome >= 0 ? '+' : ''}$${money(m.netIncome)}</b>`,'gold'],
    ['spark','政治点数',`${state.political} <small>/ 3</small>`,'每回合恢复 · 用于政策','purple'],
    ['people','居住人口',`${money(m.population ?? state.population)} <small>人</small>`,`住房容量 ${money(m.capacity)} 人`,'blue'],
    ['leaf','社区宜居度',`${Math.round(state.livability)} <small>/ 100</small>`,`<span class="stat-progress"><i style="width:${state.livability}%"></i></span>`,'green']
  ].map(([ic,label,v,sub,cl]) => `<${ic==='coins'?'button data-command="finance" title="查看财政收支与融资"':'div'} class="stat"><span class="stat-icon ${cl}">${icon(ic)}</span><div><span class="stat-label">${label}</span><strong>${v}</strong><small class="stat-sub">${sub}</small></div></${ic==='coins'?'button':'div'}>`).join('');
  document.querySelector('#season').innerHTML = `<span class="season-icon">${icon('calendar')}</span><div><small>${state.status === 'remediation' ? '限时补救阶段' : finished ? '社区改造已结项' : '阶段 01 · 绿色新生'}</small><strong>第 ${state.turn} <span>/ ${state.status === 'remediation' || state.turn > 8 ? 10 : 8} 回合</span></strong></div><span class="season-date">2028<br><b>${String(state.turn+2).padStart(2,'0')} 月</b></span>`;
  renderLeft(m);
  renderDetail(m);
  renderHand();
  document.querySelector('#turn-control').innerHTML = `<div class="turn-label">${icon('clock')} ${finished ? '项目报告已生成' : state.status === 'remediation' ? '最后的改造机会' : '本回合的社区计划'}</div><strong>${finished ? '成果值得被看见' : '准备好下一步了吗？'}</strong><p>${finished ? '回顾这片邻里的变化' : '结算经营 · 更新入住人口<br>抽取新政策 · 恢复政治点'}</p><button class="end-turn" data-command="${finished ? 'final-report' : 'end-turn'}">${finished ? '查看项目报告' : '结束回合'} ${icon('arrow')}</button><span class="turn-note">${finished ? '可在设置中开启新计划' : `第 ${state.turn} 回合结束${state.turn === 6 ? '触发热浪' : state.turn === 8 || state.turn === 10 ? '进行验收' : '自动保存'}`}</span>`;
  document.querySelector('#hand-count').textContent = `${state.hand.length} 张`;
  document.querySelector('#action-banner').innerHTML = activeCard ? `${icon('layers')} 选择目标，使用「${esc(getDef(state.hand.find(c=>c.id===activeCard))?.name)}」<button data-command="cancel">取消 ${icon('close')}</button>` : buildType ? `${icon('park')} ${buildType === 'green' ? '选择需要绿化的住宅' : '选择一块空地，预览建设效果'}<button data-command="cancel">取消 ${icon('close')}</button>` : '';
  document.querySelector('#action-banner').classList.toggle('visible', !!(activeCard || buildType));
  document.querySelector('#map-hint').style.opacity = activeCard || buildType ? '0' : '1';
  document.querySelectorAll('[data-layer]').forEach(el => el.classList.toggle('active', el.dataset.layer===layer));
  scene?.update(state);
  scene?.setSelected(selected);
  scene?.setMode(layer);
  const selectedLot = state.lots.find(l=>l.id===selected);
  if (buildType && selected) scene?.preview(buildType,selected,state);
  else if (selectedLot && !selectedLot.type) scene?.preview('park',selected,state);
  else scene?.clearPreview();
  applyLanguage();
}

function renderLeft(m) {
  const targets = getTargets(state);
  const heatDone = !!state.heatReport;
  document.querySelector('#left-panel').innerHTML = `
    <section class="mission panel"><div class="section-top"><span>${icon('target')} 社区改造目标</span><b>阶段 01</b></div><h2>一座更凉爽的<br>绿色社区</h2><p class="muted">第 ${state.status==='remediation'?10:8} 回合结束前完成以下目标</p><div class="targets">${targets.map((t,i) => `<div class="target-item"><div class="target-caption"><span>${icon(['park','building','leaf'][i])}${esc(t.label)}</span><b>${progressValue(t)}<small> / ${t.target}${t.unit || ''}</small></b></div><div class="progress ${t.done?'done':''}"><i style="width:${Math.min(100,t.progress > 1 ? t.progress : t.progress*100)}%"></i></div></div>`).join('')}</div><div class="coverage-note">已服务 <b>${money(m.coveredResidents ?? state.buildings.filter(b=>m.heatForecast?.find(h=>h.id===b.id)?.covered).reduce((s,b)=>s+b.residents,0))}</b> / ${money(m.population ?? state.population)} 位居民<br>重叠绿地只计一次，屋顶绿化仅服务本栋。</div><button class="strategy-button ${state.strategy ? 'chosen':''}" data-command="strategy">${icon('spark')} ${state.strategy ? '查看阶段政策' : '选择本阶段政策'} ${icon('chevron')}</button></section>
    <section class="climate panel ${heatDone?'resolved':''}"><div class="climate-title"><span>${icon(heatDone?'shield':'sun')} ${heatDone?'热浪已结束':'气候预警'}</span><span class="tiny-pill">${heatDone?'报告已就绪':`第 6 回合结束`}</span></div><div class="climate-art"><div class="sun-disc"></div><div class="skyline"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="climate-curve"></div></div><h3>${heatDone?'准备，带来了改变。':'热浪正在靠近'}</h3><p>${heatDone?'查看每栋住宅的室内与户外损失，了解你的改造如何发挥作用。':'建筑绿化保护室内，公共绿地改善户外。现在的布局，会决定热浪中的表现。'}</p><button data-command="${heatDone?'heat-report':'forecast'}">${heatDone?'查看热浪报告':'查看逐栋风险'} ${icon('arrow')}</button></section>
    <button class="journal-link" data-command="journal">${icon('book')} 社区日志 <span>${state.logs?.length || 0} 条记录</span>${icon('chevron')}</button>
  `;
}

function renderDetail(m) {
  const building = state.buildings.find(b => b.id === selected);
  const lot = state.lots.find(l => l.id === selected);
  const locked = state.status === 'won' || state.status === 'lost';
  const card = state.hand.find(c=>c.id===activeCard);
  if (!building && !lot) { document.querySelector('#detail-panel').innerHTML=''; return; }
  if (building) {
    const h = m.heatForecast?.find(h=>h.id===building.id);
    const preview = getPreview(state,'green',building.id);
    document.querySelector('#detail-panel').innerHTML = `<section class="property panel"><div class="section-top"><span>${icon('building')} 住宅档案</span><button class="small-icon" data-command="deselect" aria-label="取消选择">${icon('close')}</button></div><div class="property-art">${illustration(building.green?'green':'cool')}<span class="building-number">${esc(building.id)}</span></div><div class="property-heading"><h2>${esc(building.id)} 号组屋</h2><span class="tiny-pill ${building.green?'green-pill':''}">${building.green?'已绿化':'待改造'}</span></div><p class="property-sub">${building.green?'一片屋顶绿意，一份生活舒适。':'让这栋住宅，成为改变的起点。'}</p><div class="property-data"><span>${icon('people')} 现有居民<b>${money(building.residents)} 人</b></span><span>${icon('home')} 住房容量<b>${money(building.capacity)} 人</b></span></div><div class="protection"><h4>热浪准备情况</h4><div class="protection-row ${building.green?'protected':''}">${icon(building.green?'check':'plus')}<span>建筑自身绿化<small>${building.green?'室内热损失减轻':'屋顶尚未进行绿化'}</small></span></div><div class="protection-row ${h?.covered?'protected':''}">${icon(h?.covered?'check':'minus')}<span>公共绿地服务<small>${h?.covered?'户外热暴露得到缓解':'尚未位于服务范围内'}</small></span></div></div>${card ? `<div class="construction-preview"><small>已选政策</small><b>${esc(getDef(card).name)}</b><p>${esc(getDef(card).description)}</p><button class="primary" data-command="confirm-card" ${locked?'disabled':''}>对本栋使用 ${icon('arrow')}</button></div>` : building.green ? `<div class="completed-badge">${icon('leaf')} 建筑绿化已投入使用</div>` : `<div class="construction-preview"><div><small>建筑绿化</small><b>$${money(preview.cost)}</b></div><p>改善本栋居住环境<br>不增加住房容量或公共覆盖</p><button class="primary" data-action="green" data-target="${building.id}" ${!preview.valid || locked ?'disabled':''}>${icon('leaf')} 安装建筑绿化 ${icon('arrow')}</button>${!preview.valid?`<small class="unavailable">${esc(preview.message)}</small>`:''}</div>`}</section><div class="selection-footnote"><span class="selection-dot"></span> 地图已选中 ${esc(building.id)} 号组屋</div>`;
  } else {
    const type = buildType && buildType!=='green' ? buildType : 'park';
    const p = getPreview(state,type,lot.id);
    document.querySelector('#detail-panel').innerHTML = `<section class="property panel"><div class="section-top"><span>${icon('park')} 地块档案</span><button class="small-icon" data-command="deselect" aria-label="取消选择">${icon('close')}</button></div><div class="property-art">${illustration(lot.type==='walk'?'green':'park')}<span class="lot-label">${lot.type?'绿色空间':'可规划土地'}</span></div><div class="property-heading"><h2>${esc(lot.name || '社区空地')}</h2><span class="tiny-pill">${lot.type ? '已建设' : lot.id==='p4'?'可转换':'空闲'}</span></div><p class="property-sub">${lot.type?'这里的绿意，正在服务邻里。':lot.id==='p4'?'停车用地转为绿地，另需 $800 转换费用。':'选择设施，预览受益住宅与施工费用。'}</p>${lot.type ? `<div class="protection"><h4>${lot.type==='park'?'社区公园':'林荫步道'}</h4><p class="muted">服务半径 ${lot.type==='park'?15:11} 米<br>公共覆盖按受益居民去重计算。</p></div><div class="completed-badge">${icon('check')} 设施已投入使用</div>` : `<div class="facility-options"><button data-build="park" class="${type==='park'?'selected':''}">${icon('park')} 社区公园<small>范围 15 米 · $3,200 起</small></button><button data-build="walk" class="${type==='walk'?'selected':''}">${icon('tree')} 林荫步道<small>范围 11 米 · $1,900 起</small></button></div><div class="construction-preview"><div><small>施工总费用</small><b>$${money(p.cost)}</b></div><div class="preview-benefit"><span>受益住宅</span><b>${p.beneficiaries?.length?p.beneficiaries.join(' · '):'无'}</b><span>新增公共覆盖</span><b>+${Math.round(p.coverageGain||0)}%</b></div><p>屋顶绿化不计入公共服务。<br>${lot.id==='p4'?'费用含停车用地转换。':'圆形范围按住宅中心距离判定。'}</p><button class="primary" data-action="${type}" data-target="${lot.id}" ${!p.valid || locked ?'disabled':''}>确认建设 ${icon('arrow')}</button>${!p.valid?`<small class="unavailable">${esc(p.message)}</small>`:''}</div>`}</section><div class="selection-footnote"><span class="selection-dot"></span> ${lot.type?'设施服务范围可在图层中查看':'绿色圆圈表示设施服务范围'}</div>`;
    if (!lot.type && !buildType) scene?.preview(type,lot.id,state);
  }
}

function renderHand() {
  document.querySelector('#hand').innerHTML = state.hand.map(card => {
    const d=getDef(card); const unavailable=state.political<(d.cost ?? d.politicalCost ?? 0)||['won','lost'].includes(state.status);
    return `<button class="policy-card ${activeCard===card.id?'selected':''} ${unavailable?'unaffordable':''}" data-card="${esc(card.id)}" ${unavailable?'disabled':''} title="${esc(d.description)}${unavailable?' 当前政治点不足或项目已结束。':''}" aria-label="查看政策：${esc(d.name)}"><div class="card-art">${illustration(artFor(d))}<span class="political-cost">${d.cost ?? d.politicalCost ?? 0}${icon('spark')}</span>${card.retained?'<span class="retain">保留</span>':''}</div><div class="card-content"><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><div class="card-footer"><span>${d.target==='building'?'选择住宅':d.target==='lot'?'选择地块':'点击查看'}</span><span>${card.retained?'可跨回合': '本回合'} ${icon('arrow')}</span></div></div></button>`;
  }).join('') || `<div class="empty-hand">${icon('layers')}<div><b>本回合的政策已执行</b><p>仍可进行常规建设，或结束回合获取新政策。</p></div></div>`;
}

function openModal(content, cls='') {
  modalView = null;
  const dialog=document.querySelector('#modal');
  document.querySelector('#modal-content').innerHTML = `${languageButton(true)}<button class="modal-close icon-button" data-command="close-modal" aria-label="关闭窗口">${icon('close')}</button>${content}`;
  dialog.className = cls;
  if(!dialog.open) dialog.showModal();
  applyLanguage();
}
function closeModal() { modalView = null; document.querySelector('#modal').close(); }
function openAdvisor() {
  advisorAnalysis = analyzeCommunity(state, { focus: advisorFocus, language, maxDepth: 3 });
  openModal(advisorView(advisorAnalysis, {language, focus: advisorFocus, answers: state.learning?.answers, turn: state.turn, heatPassed: !!state.heatReport, icon, esc, money}), 'advisor-modal');
  modalView = 'advisor';
}
function answerReflection(optionId) {
  const learning = advisorAnalysis?.learning;
  const option = learning?.options.find(item => item.id === optionId);
  if (!option) return;
  const key = `${state.turn}-${learning.concept}`;
  if (state.learning?.answers?.[key]) return;
  state = {...state, learning: {answers: {...(state.learning?.answers || {}), [key]: {optionId, correct: option.correct, turn: state.turn, concept: learning.concept}}}};
  save();
  openAdvisor();
}
function inspectAdvice(id) {
  const step = advisorAnalysis?.recommendations.find(plan => plan.id === id)?.steps[0];
  if (!step) return;
  closeModal();
  activeCard = null; buildType = null;
  if (step.type === 'build') {
    selected = step.target; buildType = step.action; activeCard = null; render();
  } else if (step.type === 'card') {
    if (step.target) selected = step.target;
    render();
    document.querySelector(`[data-card="${step.cardId}"]`)?.click();
  }
}
function openStrategy() {
  openModal(`<div class="modal-eyebrow">STRATEGIC POLICY · 阶段政策</div><h2>${state.strategy?'你的社区改造路线':'每一片邻里，都有自己的路线。'}</h2><p class="modal-intro">选择一张阶段政策加入手牌。它会保留到使用为止；使用仍需政治点数。<br>常规建设始终可用，政策帮你以不同方式完成目标。</p><div class="strategy-options">${strategies.map(d=>`<button class="strategy-option ${state.strategy===d.key?'picked':''}" data-strategy="${esc(d.key)}" ${state.strategy?'disabled':''}>${illustration(artFor(d))}<span class="strategy-meta">${icon('spark')} ${d.cost ?? d.politicalCost ?? 0} 政治点 <em>保留</em></span><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><span class="strategy-select">${state.strategy===d.key?'已选择这条路线':state.strategy?'其他路线':'选择这条路线'} ${icon(state.strategy===d.key?'check':'arrow')}</span></button>`).join('')}</div>`,'wide-modal');
}
function rowsForHeat(rows=[]) {
  return rows.map(h=>`<tr><td>${esc(h.id)} 号</td><td>${money(h.residents)}</td><td>${h.green?'已绿化':'未绿化'}</td><td>${h.covered?'已覆盖':'未覆盖'}</td><td>${Number(h.indoor||0).toFixed(1)}</td><td>${Number(h.outdoor||0).toFixed(1)}</td><td><b>${Number(h.total||0).toFixed(1)}</b></td></tr>`).join('');
}
function financialWarning() {
  const warning=state.lastReport?.financialWarning || (state.status==='lost' ? state.lastReport?.reason : null);
  return warning ? `<p class="financial-warning">${icon('bell')} ${esc(warning)}</p>` : '';
}
function openForecast() {
  const m=getMetrics(state);
  openModal(`<div class="modal-eyebrow">CLIMATE OUTLOOK · 气候展望</div><h2>热浪来临之前，还有时间。</h2><p class="modal-intro">热浪在第 6 回合结束发生。以下是按照当前布局预测的热影响与社区宜居度损失。<br>建筑绿化降低室内损失，公共覆盖降低户外损失；两者分别计算。</p><div class="report-summary"><div><small>预计社区宜居度损失</small><strong>${Number((m.heatExposure||0)*0.65).toFixed(1)}<span> 点</span></strong></div><div><small>已经绿化</small><strong>${m.upgraded}<span> / 6 栋</span></strong></div><div><small>公共服务覆盖</small><strong>${Math.round(m.coverage)}<span>%</span></strong></div></div><div class="table-scroll"><table><thead><tr><th>住宅</th><th>居民</th><th>建筑绿化</th><th>公共绿地</th><th>室内热影响</th><th>户外热影响</th><th>合计热影响</th></tr></thead><tbody>${rowsForHeat(m.heatForecast)}</tbody></table></div><p class="report-note">室内与户外热影响相加，按入住人口加权后乘以 0.65 得到宜居度损失。这是游戏化指标，不代表真实温度。</p><button class="primary modal-primary" data-command="close-modal">回到社区，做好准备 ${icon('arrow')}</button>`,'wide-modal');
}
function openHeatReport() {
  const h=state.heatReport;
  if(!h) return openForecast();
  const rows=h.buildings||h.rows||h.details||[];
  openModal(`<div class="newspaper-masthead">邻里周报 <span>THE NEIGHBOURHOOD POST</span></div><div class="news-date">2028 · 第 6 回合　｜　社区气候特别报道</div><h2>热浪过后，<br>让改变被看见。</h2><p class="modal-intro">绿化的住宅与得到公共绿地服务的居民，承受了更小的热损失。<br>报告按热浪发生时的入住人口结算，保留当时的改造成果。</p><div class="report-summary"><div><small>社区宜居度损失</small><strong>−${Number(h.livabilityLoss||0).toFixed(1)}<span> 点</span></strong></div><div><small>高温应对支出</small><strong>$${money(h.cashLoss)}</strong></div><div><small>迁出居民</small><strong>${h.residentsLost || 0}<span> 人</span></strong></div></div><div class="table-scroll"><table><thead><tr><th>住宅</th><th>居民快照</th><th>建筑绿化</th><th>公共绿地</th><th>室内热影响</th><th>户外热影响</th><th>合计热影响</th></tr></thead><tbody>${rowsForHeat(rows)}</tbody></table></div>${financialWarning()}<div class="news-takeaway">${icon('leaf')} ${esc(h.message||h.summary||'建筑绿化与公共绿地共同保护居民。未来的建设继续改善社区，但不会改写这次热浪记录。')}</div><button class="primary modal-primary" data-command="close-modal">继续社区计划 ${icon('arrow')}</button>`,'wide-modal newspaper');
}
function openFinal() {
  const m=getMetrics(state);
  const won=state.status==='won';
  openModal(`<div class="modal-eyebrow">COMMUNITY REVIEW · 项目验收</div><div class="result-emblem">${icon(won?'leaf':'target')}</div><h2>${won?'绿意，已经成为日常。':state.status==='remediation'?'再给这片邻里一点时间。':'这一次，我们学到了什么。'}</h2><p class="modal-intro">${won?'社区通过了绿色更新验收。每一处改造，都留下了你的选择。':state.status==='remediation'?'原目标保留至第 10 回合结束。继续建设，完成最后的补救。':state.lastReport?.reason || '项目期限已到。查看未达目标，下一次用更合适的布局重新出发。'}</p><div class="report-summary"><div><small>公共服务覆盖</small><strong>${Math.round(m.coverage)}<span>%</span></strong></div><div><small>绿化住宅</small><strong>${m.upgraded}<span> / 6 栋</span></strong></div><div><small>社区宜居度</small><strong>${Math.round(state.livability)}<span> / 100</span></strong></div></div>${financialWarning()}<div class="final-targets">${getTargets(state).map(t=>`<div>${icon(t.done?'check':'clock')}<span>${esc(t.label)}</span><b>${progressValue(t)} / ${t.target}${t.unit||''}</b><em>${t.done?'已达标':'待改善'}</em></div>`).join('')}</div><div class="final-finance">期末财政 <b>$${money(state.funds)}</b><span>社区居民 <b>${money(m.population)} 人</b></span></div><p class="report-note">剩余融资 $${money(m.debtOutstanding)} · 期末净财政 $${money(state.funds-m.debtOutstanding)}</p><p class="report-note">${state.heatReport?'热浪在第 6 回合独立结算，补救不会改变历史结果。':'项目在热浪发生前结束，尚未产生高温报告。'}所有参数为原型平衡值。</p><button class="primary modal-primary" data-command="close-modal">${state.status==='remediation'?'继续补救计划':'回到我的社区'} ${icon('arrow')}</button>`,'wide-modal result-modal');
}
function openHelp() {
  openModal(`<div class="modal-eyebrow">FIELD GUIDE · 社区管理手册</div><h2>从一栋楼，一片绿地开始。</h2><p class="modal-intro">在有限的土地与预算中，让这片已有居民的社区变得更宜居。</p><div class="guide-grid">${[['01','building','改造一栋住宅','点击地图上的组屋，安装建筑绿化。它改善本栋的居住环境，减轻室内热损失。'],['02','park','为居民建设公共绿地','点击空地，选择公园或步道。先查看服务范围与受益楼号，再确认建设。'],['03','layers','用政策改变你的路线','选择阶段政策。点击手牌使用，目标牌须选择住宅。普通政策回合结束弃置，保留牌跨回合持有。'],['04','sun','为热浪与验收做好准备','第6回合结束触发热浪，第8回合结束检查三个目标。未达标可补救至第10回合。']].map(([n,i,t,p])=>`<div><span class="guide-number">${n}</span>${icon(i)}<h3>${t}</h3><p>${p}</p></div>`).join('')}</div><div class="control-guide">${icon('map')} 鼠标点击选择 · 拖动地图平移 · 滚轮缩放 · Esc 取消选址<br>${icon('coins')} 每回合收取居民收入和拨款、扣除维护，并将政治点恢复到 3。</div><button class="primary modal-primary" data-command="close-modal">我准备好了 ${icon('arrow')}</button>`,'wide-modal');
}

document.addEventListener('click', e => {
  const el=e.target.closest('button'); if(!el||el.disabled)return;
  if(el.dataset.advisorFocus) { advisorFocus=el.dataset.advisorFocus;openAdvisor();return; }
  if(el.dataset.advisorInspect) { inspectAdvice(el.dataset.advisorInspect);return; }
  if(el.dataset.reflection) { answerReflection(el.dataset.reflection);return; }
  if(el.dataset.layer) { layer=el.dataset.layer; render();return; }
  if(el.dataset.strategy) { if(complete(chooseStrategy(state,el.dataset.strategy)))closeModal(); return; }
  if(el.dataset.action) { complete(performAction(state,el.dataset.action,el.dataset.target));return; }
  if(el.dataset.build) { buildType=el.dataset.build;activeCard=null;render();return; }
  if(el.dataset.card) {
    const card=state.hand.find(c=>c.id===el.dataset.card); const d=getDef(card);
    if(d.target && d.target!=='none') { activeCard=activeCard===card.id?null:card.id;buildType=null;render(); }
    else openModal(`<div class="modal-eyebrow">POLICY BRIEF · 政策详情</div><div class="policy-detail-art">${illustration(artFor(d))}</div><h2>${esc(d.name)}</h2><p class="modal-intro">${esc(d.description)}</p><div class="policy-detail-meta">${icon('spark')} ${d.cost} 政治点 <span>${card.retained?'保留 · 可跨回合持有':'仅本回合 · 未使用则弃置'}</span></div><button class="primary modal-primary" data-use-card="${card.id}">实施这项政策 ${icon('arrow')}</button>`);
    return;
  }
  const command=el.dataset.command;
  if(command==='advisor') { openAdvisor();return; }
  if(command==='language') { switchLanguage(); return; }
  if(el.dataset.useCard) { if(complete(playCard(state,el.dataset.useCard)))closeModal();return; }
  if(el.dataset.selectTarget) { selected=el.dataset.selectTarget;closeModal();render();return; }
  if(command==='roster') openModal(`<div class="modal-eyebrow">NEIGHBOURHOOD DIRECTORY · 邻里名册</div><h2>每一栋住宅，每一处空间。</h2><p class="modal-intro">选择目标后，在右侧档案中查看状态与建设预览。</p><div class="roster-grid">${state.buildings.map(b=>`<button data-select-target="${b.id}">${icon('building')}<b>${b.id} 号组屋</b><small>${b.green?'已完成建筑绿化':'尚未改造'} · ${b.residents} 位居民</small>${icon('chevron')}</button>`).join('')}${state.lots.map(l=>`<button data-select-target="${l.id}">${icon('park')}<b>${l.name}</b><small>${l.type?l.type==='park'?'社区公园':'林荫步道':l.id==='p4'?'停车用地 · 转换费 $800':'可规划空地'}</small>${icon('chevron')}</button>`).join('')}</div>`,'wide-modal');
  if(command==='close-modal') closeModal();
  if(command==='help') openHelp();
  if(command==='strategy') openStrategy();
  if(command==='forecast') openForecast();
  if(command==='heat-report') openHeatReport();
  if(command==='final-report') openFinal();
  if(command==='reset-view') scene?.resetCamera();
  if(command==='zoom-in') scene?.zoom(1);
  if(command==='zoom-out') scene?.zoom(-1);
  if(command==='cancel') { activeCard=null;buildType=null;render(); }
  if(command==='deselect') { selected=null;activeCard=null;buildType=null;render(); }
  if(command==='confirm-card' && activeCard && selected) complete(playCard(state,activeCard,selected));
  if(command==='build') openModal(`<div class="modal-eyebrow">PLANNING DESK · 社区建设</div><h2>把一处空间，变成一种可能。</h2><p class="modal-intro">常规建设无需政治点数。选择项目后，在地图上选择目标并确认费用。</p><div class="strategy-options">${[['green','建筑绿化','green','1800','改善本栋住宅，减轻室内热损失。'],['park','社区公园','park','3200','服务半径15米，适合覆盖多栋住宅。'],['walk','林荫步道','people','1900','服务半径11米，维护更低。']].map(([key,name,art,cost,text])=>`<button class="strategy-option" data-plan="${key}">${illustration(art)}<h3>${name}</h3><span class="build-price">$${money(cost)} <small>基础费用</small></span><p>${text}</p><span class="strategy-select">开始规划 ${icon('arrow')}</span></button>`).join('')}</div>`,'wide-modal');
  if(el.dataset.plan) { buildType=el.dataset.plan;activeCard=null;closeModal();render(); }
  if(command==='end-turn') {
    if(!state.strategy) { openStrategy();notify('先选择一张阶段政策，确定你的改造路线。','error');return; }
    const hadHeat=!!state.heatReport;
    if(complete(endTurn(state))) { if(!hadHeat&&state.heatReport)openHeatReport();else if(['won','lost','remediation'].includes(state.status))openFinal();else if(state.lastReport?.financialWarning)openModal(`<div class="modal-eyebrow">FINANCIAL ALERT · 财政预警</div><h2>社区需要一次及时的调整。</h2><p class="modal-intro">${esc(state.lastReport.financialWarning)}</p><button class="primary modal-primary" data-command="finance">查看财政收支 ${icon('arrow')}</button>`);else if(state.lastReport?.event)openModal(`<div class="modal-eyebrow">NEIGHBOURHOOD NEWS · 邻里消息</div><h2>${esc(state.lastReport.event.title)}</h2><p class="modal-intro">${esc(state.lastReport.event.text)}</p><button class="primary modal-primary" data-command="close-modal">继续社区计划 ${icon('arrow')}</button>`); }
  }
  if(command==='finance') { const m=getMetrics(state); openModal(`<div class="modal-eyebrow">COMMUNITY FINANCES · 社区财政</div><h2>让每一份投入，都有计划。</h2><p class="modal-intro">每次回合结束结算居民收入、拨款与维护。融资会在约定回合偿还。</p><div class="finance-list"><div><span>当前余额</span><b>$${money(state.funds)}</b></div><div><span>本回合收入（拨款 + 居民收入）</span><b>+$${money(m.income)}</b></div><div><span>本回合维护（含基础运营 $450）</span><b>−$${money(m.upkeep)}</b></div><div><span>本回合融资偿还</span><b>−$${money(m.debtPayment)}</b></div><div><span>本回合净收入</span><b>${m.netIncome>=0?'+':''}$${money(m.netIncome)}</b></div><div><span>剩余融资待偿还</span><b>$${money(m.debtOutstanding)}</b></div></div>${state.debts.length?`<p class="report-note">${state.debts.map(d=>`融资：剩余 ${d.remaining} 次，每次 $${money(d.payment)}，从第 ${d.firstPayment} 回合结束开始。`).join('<br>')}</p>`:''}<p class="report-note">高温可能产生额外应对支出。若连续两次结算余额低于 −$2,000，项目会终止。</p><button class="primary modal-primary" data-command="close-modal">回到社区 ${icon('arrow')}</button>`); }
  if(command==='journal') openModal(`<div class="modal-eyebrow">COMMUNITY JOURNAL · 社区日志</div><h2>改变，一步一步发生。</h2><div class="journal">${[...(state.logs||[])].reverse().slice(0,40).map(l=>`<div><span>回合 ${l.turn}</span><p>${esc(l.text||l.message)}</p></div>`).join('')}</div>`);
  if(command==='settings') openModal(`<div class="modal-eyebrow">YOUR COMMUNITY · 游戏设置</div><h2>继续这片邻里的故事。</h2><p class="modal-intro">${storageAvailable?'社区进度自动保存在当前浏览器中。重新开始会替换本地存档。':'当前浏览器不允许保存进度。本次会话可继续游戏，但刷新页面后进度会丢失。'}</p><div class="settings-actions"><button class="primary" data-command="help">${icon('help')} 查看玩法指南</button><button class="secondary" data-command="restart-confirm">${icon('reset')} 重新开始改造计划</button></div><p class="report-note">原型版本 1.0 · Three.js 3D 社区 · 中英双语<br>画面为程序生成，玩法参数用于测试与迭代。</p>`);
  if(command==='restart-confirm') openModal(`<div class="modal-eyebrow">NEW BEGINNING · 新的开始</div><h2>开启新的社区计划？</h2><p class="modal-intro">这会替换当前浏览器的社区存档，从第 1 回合重新开始。</p><div class="settings-actions"><button class="primary" data-command="restart">开启新计划</button><button class="secondary" data-command="close-modal">继续当前社区</button></div>`);
  if(command==='restart') { state=createGame(2028);selected='103';activeCard=null;buildType=null;save();closeModal();render();scene?.resetCamera();notify('新的社区计划已经开启。'); }
  if(command==='design') openModal(`<div class="modal-eyebrow">DESIGN NOTES · 设计说明</div><h2>让每一份绿意，都有意义。</h2><p class="modal-intro">依据所提供的 GDD 制作的单情景可玩原型。概念图用于社区氛围参考。</p><div class="design-copy"><h3>空间选择，产生不同的结果</h3><p>公园与步道服务范围不同，重叠覆盖不叠加。建造前显示受益住宅；公共覆盖以真实入住人口加权，建筑绿化只改善本栋。</p><h3>政策提供路线，常规建设提供底线</h3><p>固定获得一张可保留的阶段政策。其余政策每回合抽取并弃置，常规建设不依赖抽牌。融资会产生后续偿还，避免无成本的资金堆积。</p><h3>气候结果可以追溯，失败仍有补救</h3><p>热浪以各栋居民快照分别计算室内与户外损失。验收失败后保留两回合补救，历史热浪报告不会被后续施工改写。</p><h3>原型范围与参数</h3><p>6栋住宅、4块可规划土地、8回合主计划、2回合补救。能源、电网、新建住房与复杂交通留待后续版本。所有费用、半径、损失与门槛均为测试参数。</p></div>`,'wide-modal');
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){activeCard=null;buildType=null;render();}});
document.querySelector('#modal').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});

render();
try {
  scene = new CommunityScene(document.querySelector('#scene'), {
    state,
    language,
    onSelect: id => { selected=String(id); if(buildType==='green'&&!state.buildings.some(b=>b.id===selected))notify('建筑绿化需要选择一栋住宅。','error');render(); if(buildType)scene.preview(buildType,selected,state); },
    onHover: id => { if(buildType && id) scene.preview(buildType,String(id),state); else if(!id && buildType && selected)scene.preview(buildType,selected,state); },
    onReady: () => document.querySelector('#scene-loading')?.classList.add('hidden')
  });
  scene.update(state);scene.setSelected(selected);
  document.querySelector('#scene-loading').classList.add('hidden');
} catch(err) {
  console.error('3D community initialization failed',err);
  document.querySelector('#scene-loading').innerHTML = `<div class="render-error">${icon('map')}<h3>3D 地图暂时无法加载</h3><p>请使用支持 WebGL 的浏览器，并启用硬件加速。</p><button class="primary" onclick="location.reload()">重新加载</button></div>`;
}
// Read-only inspection surface for local QA and accessibility tooling.
window.community = {getState:()=>structuredClone(state),getMetrics:()=>getMetrics(state),projectTarget:id=>scene?.projectTarget(String(id))};
save();
applyLanguage();
