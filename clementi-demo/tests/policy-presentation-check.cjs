'use strict';
// Execute presentation mappings against actual authored engine choices, without
// a browser or network. The descriptor must remain independent of game rules.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dist=path.join(__dirname,'..','dist'),context={};context.window=context;context.globalThis=context;vm.createContext(context);
for(const file of ['data.js','year-translations.js','year-content.js','year-policy-content.js','year-engine.js','year-policy-presentation.js'])vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),context,{filename:file});
const E=context.CM_YEARS,P=context.CM_YEAR_PRESENTATION,plotIds=new Set(context.CM_DATA.plots.map(p=>p.id));
const residents=new Set(E.households().map(h=>h.id)),families=new Set(['build','mediation','consultation','care','community','access','maintenance','environment']);
const clean=value=>JSON.parse(JSON.stringify(value)),groups=new Map(),serviceFamilies=new Set(),urgentCases=new Map();
let normalCount=0,urgentCount=0;
function check(policy,issue,year){
  const payload={...clean(policy),year,issueTitle:issue.title,issueNeed:issue.need},snapshot=JSON.stringify(payload);
  const result=P.describe(payload);
  assert.equal(JSON.stringify(payload),snapshot,'presentation never mutates the selected policy');
  assert(families.has(result.family));assert(plotIds.has(result.site),'site exists: '+result.site);
  assert(result.activity&&result.subject.zh&&result.subject.en);
  assert.equal(result.stages.length,3);for(const stage of result.stages)assert(stage.zh&&stage.en);
  assert.equal(new Set(result.stages.map(s=>s.zh)).size,3,'stages advance rather than repeat');
  assert(result.participants.length);assert.equal(new Set(result.participants).size,result.participants.length);
  assert(result.participants.every(id=>residents.has(id)),'all participants exist in the playable cast');
  assert.equal(result.result,policy.result||'','the existing authored result remains authoritative');
  assert.equal(result.capital,policy.policyId==='capital');
  if(policy.policyId==='capital')assert.equal(result.family,'build','every capital policy has construction or retrofit feedback');
  if(residents.has(policy.residentId)){
    assert.equal(result.participants[0],policy.residentId,'the requesting household participates');
    if(result.family==='consultation')assert.equal(result.participants.length,1,'individual consultations do not include unrelated neighbours');
  }else{
    assert(result.representative,'urgent scenes use representatives rather than inventing affected household identities');
    assert(result.urgentKey);
  }
  assert.deepEqual(clean(P.describe({...payload,year:undefined})),clean(result),'old saved plans can infer the year from their real case identity');
  result.participants.push('test-only');result.stages[0].zh='test-only';
  const fresh=P.describe(payload);assert(!fresh.participants.includes('test-only'));assert.notEqual(fresh.stages[0].zh,'test-only','one animation cannot overwrite the next scene’s labels');
  groups.set(fresh.family,(groups.get(fresh.family)||0)+1);
  return fresh;
}
for(let year=1;year<=7;year++){
  const s=E.create({seed:7});s.year=year;s.cash=100000;s.staffTotal=100;E.availability(s);s.visitPlans['y'+year].accepted=E.households().map(h=>h.id);s.visitPlans['y'+year].reasons={};
  const issues=E.additionalVisits(s);assert.equal(issues.length,6);
  for(const issue of issues)assert(E.learn(s,issue.id).ok);
  assert(E.summarize(s).ok);assert(E.beginPolicies(s).ok);
  for(const issue of issues)for(const policy of issue.policies){
    assert(E.choose(s,issue.id,policy.id).ok);
    const selected=E.choices(s).find(p=>p.issueId===issue.id);assert(selected);
    const descriptor=check(selected,issue,year);
    if(policy.id==='service'){assert.equal(selected.visual,undefined);serviceFamilies.add(descriptor.family);}
    normalCount++;
  }
}
for(let seed=0;seed<512&&urgentCases.size<12;seed++){
  const s=E.create({seed});s.year=6;s.phase='policy';s.cash=100000;s.staffTotal=100;
  for(const issue of E.urgent(s))if(!urgentCases.has(issue.residentId)){
    urgentCases.set(issue.residentId,issue);
    for(const policy of issue.policies){assert(E.choose(s,issue.id,policy.id).ok);const selected=E.choices(s).find(p=>p.issueId===issue.id);check(selected,issue,6);urgentCount++;}
  }
}
assert.equal(normalCount,126);assert.equal(urgentCases.size,12);assert.equal(urgentCount,36);
assert(serviceFamilies.size>=5,'service policies receive several distinct kinds of activity');
assert.equal(groups.size,8,'all eight grounded presentation families are exercised');
for(const policy of [{title:'调解安静时段',policyId:'service'},{title:'检查回收安排',policyId:'community'},{title:'新的咨询',policyId:'service'},{title:'新建设施',policyId:'capital'}]){
  const descriptor=P.describe(policy);assert(families.has(descriptor.family));assert(plotIds.has(descriptor.site));assert(descriptor.participants.length);
}
console.log('Policy presentations: '+normalCount+' authored cards + '+urgentCount+' urgent cards; eight grounded families, '+serviceFamilies.size+' service families, real sites/cast, private consultations, saved-plan inference and nonmutation passed.');
