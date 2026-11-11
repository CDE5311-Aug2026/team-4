'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const demo=path.resolve(__dirname,'..'),repo=path.resolve(demo,'..');
const baseline=cp.execFileSync('git',['-c','safe.directory='+repo.replace(/\\/g,'/'),'show','af33ec4834bfb143ddd6cde81921860be134b968:clementi-demo/dist/year-engine.js'],{cwd:repo,encoding:'utf8'});
const revised=fs.readFileSync(path.join(demo,'dist/year-engine.js'),'utf8');
const content=fs.readFileSync(path.join(demo,'dist/year-policy-content.js'),'utf8');
function load(text,withContent){const box={console};if(withContent)vm.runInNewContext(content,box);vm.runInNewContext(text,box);return box;}
const old=load(baseline,false),next=load(revised,true),data=next.CM_YEAR_POLICY_CONTENT;
const plain=value=>JSON.parse(JSON.stringify(value));
const textKeys=new Set(['title','need','story','question','description','result','policyTitle','text','detail']);
function rules(value){if(Array.isArray(value))return value.map(rules);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!textKeys.has(key)).map(([key,v])=>[key,rules(v)]));return value;}
assert.equal(data.years.length,7);
assert.equal(data.years.reduce((n,y)=>n+y.cases.length,0),42);
const original=fs.readFileSync(path.join(demo,'docs/policy-script-review-zh.md'),'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
assert.equal(data.sourceSha256,crypto.createHash('sha256').update(original).digest('hex'));
let cards=0;
for(let year=1;year<=7;year++){
  const a=old.CM_YEARS.create({seed:5311}),b=next.CM_YEARS.create({seed:5311});a.year=b.year=year;
  const before=old.CM_YEARS.additionalVisits(a),after=next.CM_YEARS.additionalVisits(b);
  assert.deepEqual(plain(rules(after)),plain(rules(before)),'case IDs, economics, effects and asset metadata must match in year '+year);
  const revisedDraw=plain(next.CM_YEARS.availability(b));
  assert(revisedDraw.accepted.length>=3&&revisedDraw.accepted.length<=6,'revised visit schedule keeps the 3–6 bounds');
  for(const issue of after){
    const text=data.get(year,issue.residentId);assert.ok(text);
    assert.equal(issue.title,text.title);assert.equal(issue.need,text.need);assert.ok(text.opening);assert.ok(text.sourceText.includes(text.need));
    assert.equal(issue.policies.length,3);
    for(const policy of issue.policies){const option=text.options[policy.id];assert.ok(option);for(const key of ['name','description','result'])assert.ok(option[key],year+'/'+issue.residentId+'/'+policy.id+'/'+key);assert.equal(policy.title,option.name);assert.equal(policy.description,option.description);assert.equal(policy.result,option.result);cards++;}
  }
  assert.ok(data.year(year).story);assert.ok(data.year(year).closing);assert.ok(data.year(year).sources.length);
  assert.ok(!data.year(year).setting||!data.year(year).setting.includes(data.year(year).story),'annual setting must not duplicate the narrator story');
}
assert.equal(cards,126);
// A save from the GitHub baseline may already contain an optional discovered case.
// Only its prose is refreshed; the saved identifiers and numeric fields remain intact.
{
  const legacy=old.CM_YEARS.create({seed:4});
  const base=old.CM_YEARS.additionalVisits(legacy).find(i=>i.residentId==='rahman');
  legacy.discoveredNeeds={y1:[plain(base)]};legacy.learnedIssues[base.id]=true;
  const current=next.CM_YEARS.migrate(plain(legacy));
  const refreshed=next.CM_YEARS.visitIssue(current,base.id);
  assert.equal(refreshed.need,data.get(1,'rahman').need);
  assert.deepEqual(plain(rules(refreshed)),plain(rules(base)));
}
// Execute complete games with identical choices. This compares the consequences,
// random urgent situations, annual accounting and final outcome against GitHub.
for(const seed of [1,5311,20261110]){
  const a=old.CM_YEARS.create({seed}),b=next.CM_YEARS.create({seed});
  for(let year=1;year<=7;year++){
    const draw=old.CM_YEARS.availability(a);
    // Appointment pacing was deliberately revised. Hold the visited inputs
    // identical here so this comparison still isolates policy/economy rules.
    b.visitPlans['y'+year]=plain(draw);
    for(const id of draw.accepted){const left=old.CM_YEARS.additionalVisits(a).find(i=>i.residentId===id);const right=next.CM_YEARS.additionalVisits(b).find(i=>i.residentId===id);assert.equal(left.id,right.id);assert.equal(old.CM_YEARS.learn(a,left.id).ok,true);assert.equal(next.CM_YEARS.learn(b,right.id).ok,true);}
    for(const [engine,state] of [[old.CM_YEARS,a],[next.CM_YEARS,b]]){assert.equal(engine.summarize(state).ok,true);assert.equal(engine.beginPolicies(state).ok,true);}
    for(const issue of old.CM_YEARS.issues(a)){
      let chosen='community';for(const type of [['capital','service','community'],['service','community'],['community']][year%3]){const allowed=old.CM_YEARS.canChoose(a,issue.id,type);assert.equal(next.CM_YEARS.canChoose(b,issue.id,type).ok,allowed.ok);if(allowed.ok){chosen=type;break;}}
      assert.equal(old.CM_YEARS.choose(a,issue.id,chosen).ok,true);assert.equal(next.CM_YEARS.choose(b,issue.id,chosen).ok,true);
    }
    assert.deepEqual(plain(rules(next.CM_YEARS.preview(b))),plain(rules(old.CM_YEARS.preview(a))));
    assert.equal(old.CM_YEARS.resolveYear(a).ok,true);assert.equal(next.CM_YEARS.resolveYear(b).ok,true);
    assert.deepEqual(plain(rules(b)),plain(rules(a)),'gameplay state after year '+year+' seed '+seed);
    if(year<7){assert.equal(old.CM_YEARS.nextYear(a).ok,true);assert.equal(next.CM_YEARS.nextYear(b).ok,true);}
  }
  assert.equal(b.outcome,a.outcome);
}
assert.ok(data.endings.win);assert.ok(data.endings.lose);
console.log('Policy script: 7 years, 42 resident needs, 126 cards; saved-case refresh and complete-game numerical parity passed.');
