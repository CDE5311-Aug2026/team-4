'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dist=path.join(__dirname,'../dist'),box={};box.window=box;box.globalThis=box;vm.createContext(box);
for(const file of ['data.js','year-content.js','year-policy-content.js','year-policy-english.js','community.js','year-engine.js','year-ending.js'])vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),box,{filename:file});
const E=box.CM_YEARS,review=(state,language='zh')=>box.CM_YEAR_ENDING.analyze(state,{language}),plain=value=>JSON.parse(JSON.stringify(value));
const report=(year,type,title,extra={})=>({year,before:{stay:57,social:57,comfort:57},after:{stay:60,social:60,comfort:60},results:[{issueId:'y'+year+'-case',residentId:'chen',policyId:type,policyTitle:title,text:'实际记录的结果',cost:45,effects:{stay:2,social:type==='capital'?-1:1,comfort:7},assetId:type==='capital'?'cover':null}],finance:{policySpending:45,maintenanceCosts:3,newAssets:[]},...extra});
const common={year:7,phase:'ended',outcome:'win',metrics:{stay:76,social:84,comfort:71},cash:58,staffTotal:13,assets:{cover:{activeFromYear:2}}};

// Equal ending scores do not flatten different histories into the same verdict.
const coordinated={...plain(common),reports:Array.from({length:7},(_,n)=>report(n+1,'community','协调原有空间 '+(n+1)))};
const invested={...plain(common),reports:Array.from({length:7},(_,n)=>report(n+1,'capital','连通有盖路线 '+(n+1)))};
const a=review(coordinated),b=review(invested);
assert.notEqual(a.title,b.title);assert.notDeepEqual(plain(a.paragraphs),plain(b.paragraphs));
assert.equal(a.facts.types.community,7);assert.equal(b.facts.types.capital,7);assert.equal(b.facts.policySpending,315);
assert(b.paragraphs[2].text.includes('7项方案')&&b.paragraphs[2].text.includes('处得来 -1'),'trade-offs follow the recorded negative effects');
assert(a.metricNote.includes('本局')&&a.paragraphs[3].text.includes('游戏规则'),'reaching a game target is not a blanket claim about residents');
assert(!JSON.stringify(a).includes('一个更好的社区'));
// Many cheap coordination choices can accompany a materially build-heavy term.
// The title reflects that investment, while the method paragraph still reports
// the most frequent approach accurately.
const resourceHeavy={...plain(common),reports:Array.from({length:7},(_,n)=>{
  const r=report(n+1,'capital','长期投入 '+(n+1));
  r.results=Array.from({length:n===6?6:5},(_,i)=>({issueId:'y'+(n+1)+'-'+i,residentId:'chen',policyId:i===0?'capital':'community',policyTitle:i===0?'建设长期设施':'协调日常安排',text:'按方案记录',cost:i===0?45:2,effects:{stay:1,social:1,comfort:1}}));
  r.finance.policySpending=r.results.reduce((sum,a)=>sum+a.cost,0);return r;
})};
const materialReview=review(resourceHeavy);assert.equal(materialReview.facts.types.community,29);assert.equal(materialReview.facts.types.capital,7);assert.equal(materialReview.facts.resourcePriority,'capital');assert.equal(materialReview.title,'为往后的日子铺路的人');assert(materialReview.paragraphs[0].text.includes('你最常先让人把需要说清楚'),'frequency claim remains about coordination');assert(materialReview.paragraphs[0].text.includes('315 / 373'),'funding claim uses the exact recorded choice costs');
const cheapBuilds=plain(resourceHeavy);cheapBuilds.reports.forEach(r=>r.results.filter(a=>a.policyId==='capital').forEach(a=>a.cost=2));assert.notEqual(review(cheapBuilds).title,materialReview.title,'equal decision counts with different material priorities produce different titles');
const missingPrices=plain(resourceHeavy);missingPrices.reports[0].results[0].cost=null;const missingPriceReview=review(missingPrices);assert.equal(missingPriceReview.facts.resourcePriority,null);assert.equal(missingPriceReview.facts.recordedChoiceCost,null);assert(!missingPriceReview.paragraphs[0].text.includes('全部方案投入'),'incomplete costs do not fabricate a funding share');
const urgentOnly={...plain(common),reports:[report(6,'service','紧急事件应对',{results:[{issueId:'y6-urgent-heat',residentId:'urgent-heat',policyId:'service',policyTitle:'安排应对',text:'保留的事件结果',effects:{stay:-1,social:0,comfort:-1}}]})]};
const urgentReview=review(urgentOnly);assert.equal(urgentReview.facts.urgent,1);assert(urgentReview.paragraphs[2].text.includes('1项紧急响应'));assert(!urgentReview.paragraphs[2].text.includes('推动一方面'),'residual emergency losses are not described as progress elsewhere');

// Duplicate current report, malformed/future rows and empty old-save records.
const duplicated=plain(invested);duplicated.report=plain(duplicated.reports[6]);duplicated.reports.push(plain(duplicated.reports[0]),{year:8,results:[{policyId:'capital'}]});
assert.equal(review(duplicated).facts.decisions,7);assert.equal(review(duplicated).facts.policySpending,315);
const empty=review({...plain(common),reports:[]});assert.equal(empty.facts.decisions,0);assert.equal(empty.paragraphs.length,0);assert(!empty.intro.includes('七年之后'));
const partial=review({...plain(common),reports:[report(6,'service','尚存的一项服务',{finance:null})]});
assert(partial.coverageNote.includes('1份')&&partial.coverageNote.includes('第6年'));assert.equal(partial.facts.policySpending,null);assert(!/NaN|undefined/.test(JSON.stringify(partial)));
const unknown=review({reports:[{year:1,results:[]}],metrics:{stay:null,social:'',comfort:Infinity}});assert(!/NaN|undefined/.test(JSON.stringify(unknown)));

// The seventh-year handover never counts next-year facility returns as realized.
const late=plain(invested);late.reports[6].finance.newAssets=[{id:'cover',activeFromYear:8}];
assert(review(late).paragraphs[3].text.includes('下一年才开始计入年度收益'));
const gap=plain(coordinated);gap.metrics.comfort=65;assert(review(gap).paragraphs[3].text.includes('住得舒服还未达到本局目标'));

// Run the actual rules for a complete seven-year save, then analyze without any
// mutation or network. Availability itself is tested separately by its owner.
const game=E.create({seed:5311});game.cash=game.openingCash=10000;game.staffTotal=game.staffOpening=60;
for(let year=1;year<=7;year++){
  E.availability(game);const plan=game.visitPlans['y'+year];plan.accepted=E.households().map(h=>h.id);plan.reasons={};
  for(const issue of E.additionalVisits(game))assert(E.learn(game,issue.id).ok);
  assert(E.summarize(game).ok&&E.beginPolicies(game).ok);
  for(const [n,issue]of E.issues(game).entries()){
    const preferred=n===0?'capital':n%2?'service':'community',policy=[preferred,'service','community'].find(type=>E.canChoose(game,issue.id,type).ok);
    assert(policy);assert(E.choose(game,issue.id,policy).ok);
  }
  assert(E.resolveYear(game).ok);if(year<7)assert(E.nextYear(game).ok);
}
const before=JSON.stringify(game),actual=review(game),actualEnglish=review(game,'en');
assert.equal(JSON.stringify(game),before,'review does not change years, choices, finances, metrics, visits or dialogue');
assert.equal(actual.facts.decisions,game.reports.reduce((sum,r)=>sum+r.results.length,0));
assert.equal(actual.facts.policySpending,game.reports.reduce((sum,r)=>sum+r.finance.policySpending,0));
assert.equal(actual.facts.households.length,6);assert.equal(actual.timeline.length,7);assert.equal(actual.paragraphs.length,4);
assert(actual.coverageNote.includes('第1—7年'));assert(!/[㐀-鿿]/.test(JSON.stringify(actualEnglish)),'every English review field is English, including saved Chinese titles');
const seenTitles=new Set(game.reports.flatMap(r=>r.results.map(x=>x.policyTitle)));
for(const item of actual.highlights)assert(seenTitles.has(item.title),'milestones name real selected policies');
for(const item of actual.timeline)assert(item.detail.includes(game.reports.find(r=>r.year===item.year).results[0].policyTitle),'timeline comes from the corresponding year');

// Exercise the actual ending renderer: recorded names/results are plain text,
// the restart action remains, and the three target bars and current money stay.
const app=fs.readFileSync(path.join(dist,'year-app.js'),'utf8'),start=app.indexOf('  function endingHTML('),end=app.indexOf('  function reportFoot(',start);assert(start>=0&&end>start);
const hostile={...plain(common),reports:[report(1,'community','<img src=x onerror=alert(1)>',{results:[{issueId:'y1-x',residentId:'chen',policyId:'community',policyTitle:'<img src=x onerror=alert(1)>',text:'<script>bad()</script>',effects:{stay:1,social:1,comfort:0}}]})]};
let language='zh';const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui={root:box,state:hostile,lang:()=>language,w:(zh,en)=>language==='en'?en:zh,esc,icon:()=>'<svg></svg>',pct:v=>Math.max(0,Math.min(1,(v-30)/50)),goalLabel:key=>language==='en'?({stay:'Room to stay',social:'Getting along',comfort:'Living well'}[key]):({stay:'住得下',social:'处得来',comfort:'住得舒服'}[key]),goals:[['stay','住得下','home'],['social','处得来','people'],['comfort','住得舒服','leaf']],reportFoot:()=>'<button data-year-action="next">Restart</button>'};
vm.createContext(ui);vm.runInContext(app.slice(start,end),ui);ui.sum={metrics:hostile.metrics,cash:58,staffTotal:13,publicDepartments:1};
const html=vm.runInContext('endingHTML(sum)',ui);assert(html.includes('&lt;img')&&html.includes('&lt;script&gt;'));assert(!html.includes('<img src=')&&!html.includes('<script>bad'));
assert.equal((html.match(/class="yr-report-goal is-/g)||[]).length,3);assert(html.includes('data-year-action="next"')&&html.includes('58')&&html.includes('13'));
ui.state=game;language='en';const englishHTML=vm.runInContext('endingHTML(sum)',ui);assert(!/[㐀-鿿]/.test(englishHTML),'the full English ending renderer contains no Chinese text');
const index=fs.readFileSync(path.join(dist,'index.html'),'utf8');assert(index.indexOf('src="year-ending.js"')<index.indexOf('src="year-app.js"'),'ending module loads before the application');
console.log('Offline campaign ending: contrasting histories, recorded trade-offs/finances/milestones, seven-year real-engine run, old-save gaps, year-7 handover, bilingual output, escaping and nonmutation passed.');
