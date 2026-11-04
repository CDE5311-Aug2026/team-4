'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dist=path.join(__dirname,'..','dist'),elements={},snapshots=[];
class Element{
  constructor(id){this.id=id;this.hidden=false;this.dataset={};this.handlers={};this.attributes={};this.textContent='';}
  set innerHTML(value){this.html=value;snapshots.push(value);}get innerHTML(){return this.html||'';}
  addEventListener(type,handler){this.handlers[type]=handler;}
  setAttribute(key,value){this.attributes[key]=value;}
  contains(){return true;}
}
const document={readyState:'complete',querySelector:()=>true,querySelectorAll:()=>[],getElementById:id=>elements[id]||null,createElement:()=>new Element(''),head:{appendChild(){}},body:{appendChild(el){elements[el.id]=el;}},dispatchEvent(){}};
let currentLanguage='zh',entry;
const ctx={document,CM_ENGINE:{},CM_ART:{portrait:id=>'<svg data-portrait="'+id+'"></svg>'},CM_SG_MAP:{polygons:[[[103.6,1.2],[104.0,1.2],[104,1.5]]]},HDBScene:{ready:true},CM_I18N:{getLanguage:()=>currentLanguage,setLanguage(lang){currentLanguage=lang;}},setInterval:()=>1,clearInterval(){},setTimeout:fn=>fn(),addEventListener(){},CustomEvent:function(){},matchMedia:()=>({matches:true})};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const file of ['data.js','engine.js','community.js','flow.js'])vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),ctx,{filename:file});
const C=ctx.CM_COMMUNITY,D=ctx.CM_DATA;
assert.equal(C.demographics.ageGroups.reduce((sum,g)=>sum+g.count,0),C.demographics.total);
assert.equal(C.demographics.total,104830);assert.equal(C.demographics.sourceRows,1638);assert.equal(C.demographics.subzones,9);
assert(Math.abs(C.demographics.ageGroups.reduce((sum,g)=>sum+g.percent,0)-100)<0.0001);
assert(C.demographics.method.en.includes('rounded'));assert(C.demographics.definition.en.includes('permanent residents'));
assert.equal(Object.keys(C.personas).length,8);
for(const r of D.residents){const p=C.personas[r.id];assert(p,`Persona ${r.id}`);for(const key of ['name','role','gender','home','tenure','family','routine','evidence']){assert(p[key].zh&&p[key].en,`Bilingual ${r.id}/${key}`);}assert(p.evidence.en.toLowerCase().includes('fictional')||p.evidence.en.includes('character design'));}
ctx.CM_FLOW.start({onEnter(value){entry=value;},hasSave:()=>false});
const stage=elements['entry-flow'];assert(stage.innerHTML.includes('开始新游戏'));
function click(action,extra={}){const target={dataset:{flowAction:action,...extra},closest(){return this;}};stage.handlers.click({target});}
click('map');assert(stage.innerHTML.includes('选择一片社区'));
click('details');assert(stage.innerHTML.includes('flow-detail-tabs'));assert(stage.innerHTML.includes('历史'));
assert(stage.innerHTML.includes('104,830'));assert.equal((stage.innerHTML.match(/data-flow-action="age-group" data-id=/g)||[]).length,5);
assert(!stage.innerHTML.includes('data-flow-action="person"'),'Fictional people stay on their own page');
click('history-step',{index:'1'});assert(stage.innerHTML.includes('2011'));assert(stage.innerHTML.includes('住房、商业与交通连接起来'));
click('history-step',{index:'2'});assert(stage.innerHTML.includes('Clementi Peaks 于2022年7月竣工'));
click('detail-tab',{id:'existing'});assert.equal((stage.innerHTML.match(/data-flow-action="amenity"/g)||[]).length,5);
assert(stage.innerHTML.includes('第448座'));
click('amenity',{id:'homes'});assert(stage.innerHTML.includes('66.9%'));assert(stage.innerHTML.includes('28,560'));
click('amenity',{id:'clinic'});assert(stage.innerHTML.includes('第451座二楼'));assert(stage.innerHTML.includes(C.sources.clinic.url));
click('amenity',{id:'space'});assert(stage.innerHTML.includes('12公顷'));
click('detail-tab',{id:'challenges'});assert(stage.innerHTML.includes('21.8%'));assert(stage.innerHTML.includes('19.5%'));assert(stage.innerHTML.includes(C.sources.upgrading.url));
click('challenge',{index:'1'});assert(stage.innerHTML.includes('2032年完工为目标'));assert(stage.innerHTML.includes(C.sources.rail.url));
click('challenge',{index:'2'});assert(stage.innerHTML.includes('停车需求还未稳定'));assert(stage.innerHTML.includes(C.sources.peaks.url));
click('age-group',{id:'0-14'});assert(stage.innerHTML.includes('居民约有14,270人'));assert(!stage.innerHTML.includes('data-flow-action="person"'));
click('language',{language:'en'});assert(stage.innerHTML.includes('Current challenges'));assert(stage.innerHTML.includes('About 14,270 residents'));
for(const id of ['history','existing','challenges']){
  click('detail-tab',{id});
  const factualEnglish=stage.innerHTML.split(/<[^>]*>/g).join(' ').replace(/中文/g,'');
  assert(!/[\u3400-\u9fff]/.test(factualEnglish),'English factual pages contain no leftover Chinese prose');
  assert(!stage.innerHTML.includes('data-flow-action="person"'),'Factual pages contain no character controls');
}
click('language',{language:'zh'});click('detail-tab',{id:'people'});assert(stage.innerHTML.includes('虚构人物'));
click('person',{id:'ali'});assert(stage.innerHTML.includes('轮班护士'));
click('language',{language:'en'});assert(stage.innerHTML.includes('Fictional characters'));assert(stage.innerHTML.includes('Shift-working nurse'));
const english=stage.innerHTML.split(/<[^>]*>/g).join(' ').replace(/中文/g,'');
assert(!/[\u3400-\u9fff]/.test(english),'English introduction contains no leftover Chinese prose');
for(const id of ['punggol','geylang']){
  click('map');click('select-case',{case:id});click('details');assert(stage.innerHTML.includes('disabled'));assert(!stage.innerHTML.includes('data-flow-action="enter"'));
  assert.equal((stage.innerHTML.match(/class="flow-concept-card"/g)||[]).length,3);assert(stage.innerHTML.includes('Facility concepts'));
}
click('map');click('select-case',{case:'clementi'});click('details');click('enter');assert.equal(entry.caseId,'clementi');assert.equal(entry.resume,false);assert.equal(ctx.CM_FLOW.isActive(),false);
console.log('PASS community: official local figures and sources, five real amenity topics, three real challenges, separate bilingual characters, concept cards and Clementi entry.');
