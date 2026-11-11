'use strict';
// Regression coverage for the three UI changes, using the actual return action and engine.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const dist=path.join(__dirname,'..','dist');
const app=fs.readFileSync(path.join(dist,'year-app.js'),'utf8');
const css=fs.readFileSync(path.join(dist,'year-hud.css'),'utf8');
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const ctx={};ctx.globalThis=ctx;vm.createContext(ctx);
for(const file of ['data.js','year-translations.js','year-content.js','year-policy-content.js','year-policy-english.js','i18n.js','year-engine.js']){
  assert(fs.existsSync(path.join(dist,file)),'required current browser script exists: '+file);
  vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),ctx,{filename:file});
}
const E=ctx.CM_YEARS,state=E.create({seed:17});
const homes=E.additionalVisits(state).filter(i=>E.canVisit(state,i.residentId));
assert(homes.length>=3);
assert(E.learn(state,homes[0].id).ok);
assert(E.summarize(state).ok&&E.beginPolicies(state).ok);
assert(E.choose(state,homes[0].id,'capital').ok);
const preserved=JSON.stringify({year:state.year,selected:state.selected,metrics:state.metrics,cash:state.cash,staff:state.staffTotal,assets:state.assets,report:state.report});
let closed=0,saved=null,rendered=0,focused=0;
Object.assign(ctx,{state,phase:()=>state.ux?.stage==='enact'?'enact':state.phase,
  ux:()=>state.ux||(state.ux={year:state.year,stage:null}),close:()=>closed++,
  save:()=>{saved=JSON.parse(JSON.stringify(state));},render:()=>rendered++,
  $:()=>({focus:()=>focused++}),needOpen:'some-need',flipped:'some-card',dealtFor:'some-case'});
const returnSource=app.match(/  function returnToVisits\(\)\{[^\r\n]+/);
assert(returnSource,'return action exists');
vm.runInContext(returnSource[0]+'\nreturnToVisits();',ctx);
assert.equal(state.phase,'visit');
assert.equal(JSON.stringify({year:state.year,selected:state.selected,metrics:state.metrics,cash:state.cash,staff:state.staffTotal,assets:state.assets,report:state.report}),preserved,'back only changes presentation/phase');
assert.equal(closed,1);assert.equal(rendered,1);assert.equal(focused,1);
assert.equal(saved.phase,'visit');
const restored=E.migrate(saved);
assert.equal(restored.phase,'visit');
assert.equal(restored.selected[homes[0].id],'capital','save/reload keeps the reservation');
assert(E.learn(state,homes[1].id).ok,'another home can still be visited');
assert(E.summarize(state).ok&&E.beginPolicies(state).ok);
assert.equal(E.choices(state).find(p=>p.issueId===homes[0].id).policyId,'capital','resuming decisions keeps the old choice');
assert(E.choose(state,homes[0].id,'service').ok,'the retained choice can be adjusted');
const economy=JSON.stringify([state.year,state.metrics,state.cash,state.staffTotal,state.assets,state.report]);
for(const blocked of ['enact','report','ended']){
  state.ux.stage=blocked==='enact'?'enact':null;state.phase=blocked==='enact'?'policy':blocked;
  const previous=JSON.stringify(state),calls=[closed,rendered];
  vm.runInContext('returnToVisits();',ctx);
  assert.equal(JSON.stringify(state),previous,'no going back after execution: '+blocked);
  assert.deepEqual([closed,rendered],calls);
}
assert.equal(JSON.stringify([state.year,state.metrics,state.cash,state.staffTotal,state.assets,state.report]),economy,'navigation never resolves a year');

// Both visible controls use the same guarded action, including the empty-needs panel.
assert.match(app,/policyControlsHTML\(\)[\s\S]*?btn\('back-visits',icon\('back'\)/);
assert.match(app,/btn\('back-visits',icon\('x'\)/);
assert.match(app,/yr-policy-main/);
assert.match(css,/\.yr-policy-controls\{[^}]*position:sticky;[^}]*z-index:6/);
assert.match(app,/content\.innerHTML='<section class="yr-panel yr-policy">'\+policyControlsHTML\(\)/);

// API configuration is behind More and still invokes the original optional settings dialog.
const nav=html.match(/<nav class="year-tools[\s\S]*?<\/nav>/)[0];
assert.match(nav,/data-year-action="more"/);assert(!nav.includes('data-year-action="settings"'));
assert.match(app,/function moreMenu\(\)[\s\S]*?item\('settings','chat'/);
assert.match(app,/case'settings':root\.CM_YEAR_TALK\.settingsModal\(\)/);

// Base/delta have flat shared edges and round outside caps for either sign; a lone delta rounds both ends.
assert.match(app,/diff>0\?' has-change'/);assert.match(app,/base===0\?' has-zero-base'/);
assert.match(css,/\.yr-report-track\.has-change \.yr-report-base\{border-radius:8px 0 0 8px\}/);
assert.match(css,/\.yr-report-delta\{[^}]*border-radius:0 8px 8px 0/);
assert.match(css,/\.yr-report-track\.has-zero-base \.yr-report-delta\{border-radius:8px\}/);
assert.match(css,/\.yr-report-track:not\(\.has-change\) \.yr-report-delta\{display:none\}/);

// Execute the actual helper used by both the needs board and the decision gold quote.
// Old voiceNeed entries must not override the approved text for a later household-year.
const quoteSource=app.match(/  function needQuote\(i\)\{[^\r\n]+/);
const trSource=app.match(/  const tr=[^\r\n]+/),keySource=app.match(/  const caseKey=[^\r\n]+/);
assert(quoteSource&&trSource&&keySource,'actual quote helper and its dependencies exist');
ctx.lang=()=>ctx.CM_I18N.getLanguage();
vm.runInContext('const root=globalThis;\n'+trSource[0]+'\n'+keySource[0]+'\n'+quoteSource[0],ctx);
let quoteChecks=0,urgentChecks=0;
for(const language of ['zh','en']){
  ctx.CM_I18N.setLanguage(language);
  for(let year=1;year<=7;year++){
    const visitState=E.create({seed:year});visitState.year=year;E.availability(visitState);
    for(const issue of E.additionalVisits(visitState)){
      const authored=ctx.CM_YEAR_POLICY_CONTENT.get(year,issue.residentId);assert(authored);
      const expected=language==='en'?ctx.CM_I18N.t(authored.need):authored.need;
      if(language==='en')assert(!/[㐀-鿿]/.test(expected),'authored need has complete English: '+year+' '+issue.residentId);
      ctx.quoteIssue=issue;
      assert.equal(vm.runInContext('needQuote(quoteIssue)',ctx),expected,'board and decision use approved need: '+year+' '+issue.residentId+' '+language);
      quoteChecks++;
    }
    for(const issue of E.urgent(visitState)){
      const key=issue.id.replace(/^y\d+-/,''),oldVoice=ctx.CM_YEAR_CONTENT.voiceNeed[key];
      const expected=oldVoice?(oldVoice[language]||oldVoice.zh):(language==='en'?ctx.CM_I18N.t(issue.need):issue.need);
      ctx.quoteIssue=issue;
      assert.equal(vm.runInContext('needQuote(quoteIssue)',ctx),expected,'real urgent quote is retained: '+year+' '+issue.id+' '+language);
      // Even if an urgent actor ID collides with a household, urgent must win over authoredFor().
      ctx.quoteIssue={...issue,residentId:'chen'};
      assert.equal(vm.runInContext('needQuote(quoteIssue)',ctx),expected,'urgent is not overwritten by household policy text');
      urgentChecks++;
    }
  }
}
assert.equal(quoteChecks,84,'42 household-year quotes are checked in both languages');
assert(urgentChecks>=10,'urgent quotes are checked throughout their original years');
console.log('Approved UI regression checks passed: back/resume/save/guards, More → AI settings, report joins, 84 authored board/decision quotes and '+urgentChecks+' urgent quotes.');
