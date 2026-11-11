'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dist=path.join(__dirname,'..','dist'),elements={},snapshots=[];
// This local review snapshot predates the bounded opening change. It is kept
// outside the shared source tree; when present, require exact preservation of
// the two protected sections and the campaign/tutorial/data/scene files.
const baselinePath=path.resolve(__dirname,'../../../../outputs/opening-baseline-20261111.json');
let preservation='snapshot not present';
if(fs.existsSync(baselinePath)){
  const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8')),flow=fs.readFileSync(path.join(dist,'flow.js'),'utf8');
  for(const [key,name] of Object.entries({demographics:'demographicsPanel',personaMatches:'personaMatches',neighbours:'neighboursPanel'})){
    const actual=flow.match(new RegExp('^  function '+name+'\\([^\\r\\n]*(?:\\r\\n|\\n|$)','m'))?.[0];
    assert.equal(actual,baseline[key],name+' remains byte-for-byte unchanged');
  }
  const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
  for(const [file,expected] of Object.entries(baseline.hashes))assert.equal(digest(fs.readFileSync(path.join(dist,file))),expected,file+' remains byte-for-byte unchanged');
  const previous=path.join(path.dirname(baselinePath),baseline.previousArtifact);
  assert.equal(digest(fs.readFileSync(previous)),baseline.previousArtifactHash,'previous review build stays available unchanged');
  preservation='protected functions, data, campaign, tutorial, scene and prior build verified';
}
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
for(const file of ['data.js','community.js','community-art.js','community-intro.js','flow.js'])vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),ctx,{filename:file});
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
assert(stage.innerHTML.includes('104,830'));assert.equal((stage.innerHTML.match(/data-flow-action="age-group" data-id=/g)||[]).length,6);
click('history-step',{index:'1'});assert(stage.innerHTML.includes('HDB第八个新镇'));
click('history-step',{index:'2'});assert(stage.innerHTML.includes('Clementi Mall'));assert(stage.innerHTML.includes('2011'));
click('detail-tab',{id:'existing'});assert.equal((stage.innerHTML.match(/data-flow-action="amenity"/g)||[]).length,4);
for(const [id,copy] of [['homes','753'],['food','448'],['nature','生态网络'],['clinic','2030']]){
  click('amenity',{id});assert(stage.innerHTML.includes(copy),'today topic '+id+' renders its own real-world context');
  assert(stage.innerHTML.includes('<svg'),'today topic '+id+' has pixel artwork');
  assert(/class="flow-source-link" href="https:\/\//.test(stage.innerHTML),'today topic '+id+' retains a clickable source');
}
click('detail-tab',{id:'challenges'});
for(const [index,copy] of [['0','较旧、较小'],['1','SUP'],['2','2032'],['3','约4,000套']]){
  click('challenge',{index});assert(stage.innerHTML.includes(copy),'challenge '+index+' renders the corresponding context');
  assert(stage.innerHTML.includes('<svg'),'challenge '+index+' has pixel artwork');
}
click('age-group',{id:'0-14'});assert(stage.innerHTML.includes('两个孩子，4岁和1岁'));
for(const [id,person] of [['15-24','students'],['25-44','lin'],['45-64','rahman'],['65+','chen']]){
  click('age-group',{id});assert(stage.innerHTML.includes('flow-persona-pick selected" data-flow-action="person" data-id="'+person+'"'),'age group '+id+' still selects its original related persona');
}
click('age-group',{id:'all'});assert(!stage.innerHTML.includes(' muted'),'show all still clears the age filter');
click('person',{id:'ali'});assert(stage.innerHTML.includes('轮班护士'));
click('language',{language:'en'});assert(stage.innerHTML.includes('Challenges'));assert(stage.innerHTML.includes('Shift-working nurse'));
for(const [tab,action,values] of [['history','history-step',['0','1','2']],['existing','amenity',['homes','food','nature','clinic']],['challenges','challenge',['0','1','2','3']]]){
  click('detail-tab',{id:tab});
  for(const value of values){
    click(action,action==='amenity'?{id:value}:{index:value});
    const english=stage.innerHTML.split(/<[^>]*>/g).join(' ').replace(/中文/g,'');
    assert(!/[\u3400-\u9fff]/.test(english),'English '+tab+'/'+value+' contains no leftover Chinese prose');
    assert(stage.innerHTML.includes('Who lives in Clementi?'));assert(stage.innerHTML.includes('Meet the neighbours'));
  }
}
click('map');click('select-case',{case:'punggol'});click('details');assert(stage.innerHTML.includes('disabled'));assert(!stage.innerHTML.includes('data-flow-action="enter"'));
click('map');click('select-case',{case:'clementi'});click('details');click('enter');assert.equal(entry.caseId,'clementi');assert.equal(entry.resume,false);assert.equal(ctx.CM_FLOW.isActive(),false);
console.log('PASS community: verified aggregation, bilingual eight personas, all background topics/art/source links, original age-to-persona links, English rendering, planned cases and Clementi entry; '+preservation+'.');
