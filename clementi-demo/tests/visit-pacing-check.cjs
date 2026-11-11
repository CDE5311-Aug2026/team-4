'use strict';
// Test the whole-term pacing contract and preservation of existing appointments.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),box={};vm.createContext(box);
for(const file of ['data.js','year-content.js','year-engine.js'])vm.runInContext(fs.readFileSync(path.join(root,'dist',file),'utf8'),box,{filename:file});
const E=box.CM_YEARS,copy=value=>JSON.parse(JSON.stringify(value)),ids=copy(E.households().map(h=>h.id));
const orders=new Set(),firstCounts=new Set(),casts=new Set();
let checked=0;
for(let seed=0;seed<3000;seed++){
 const s=E.create({seed}),t=E.create({seed}),counts=[];
 for(let year=1;year<=7;year++){
  s.year=t.year=year;
  const a=copy(E.availability(s));E.availability(s);E.availability(s);
  const b=copy(E.availability(t));assert.deepEqual(a,b,'extra reads do not change seeded appointments');
  assert.equal(new Set(a.accepted).size,a.accepted.length,'each accepting household is unique');
  assert(a.accepted.length>=3&&a.accepted.length<=6,'annual refusals never exceed three');
  assert.equal(Object.keys(a.reasons).length,6-a.accepted.length,'only declined homes have refusal reasons');
  counts.push(a.accepted.length);casts.add(a.accepted.slice().sort().join(','));if(year===1)firstCounts.add(a.accepted.length);
  for(const id of ids)assert.equal(E.canVisit(s,id),a.accepted.includes(id));
  if(year===4){const before=JSON.stringify(s.visitPlans);const resumed=E.migrate(copy(s));assert.equal(JSON.stringify(resumed.visitPlans),before,'reload keeps all generated appointments');}
  checked++;
 }
 const threes=counts.filter(n=>n===3).length,sixes=counts.filter(n=>n===6).length;
 assert(threes>=1&&threes<=2,'only one or two years have three refusals');
 assert(sixes>=1&&sixes<=2,'one or two years have no refusals');
 assert.equal(counts.filter(n=>n===4).length,2);assert.equal(counts.filter(n=>n===5).length,2);
 orders.add(counts.join(','));
}
assert.equal(firstCounts.size,4,'the first year is not always a three-home year');
assert(orders.size>100,'low/high appointment years move around across seeds');
assert(casts.size>20,'accepting household identities are not a fixed cast');

function savedPlan(year,count){const accepted=ids.slice(0,count),reasons=Object.fromEntries(ids.slice(count).map((id,n)=>[id,n]));return {year,accepted,reasons,seen:{}};}
// A real old-save scenario: three earlier low-availability years and a current
// generated plan. The player has learned a need, reserved a card, and heard a refusal.
const legacy=E.create({seed:77});legacy.year=4;
for(let year=1;year<=4;year++)legacy.visitPlans['y'+year]=savedPlan(year,3);
const first=E.additionalVisits(legacy).find(i=>i.residentId===ids[0]);assert(E.learn(legacy,first.id).ok);
assert(E.summarize(legacy).ok);assert(E.beginPolicies(legacy).ok);assert(E.choose(legacy,first.id,'capital').ok);
assert(E.noteRefusal(legacy,ids[5]).ok);
const before=copy({visitPlans:legacy.visitPlans,learnedIssues:legacy.learnedIssues,selected:legacy.selected,year:legacy.year,cash:legacy.cash,metrics:legacy.metrics});
const resumed=E.migrate(copy(legacy));
assert.deepEqual(copy({visitPlans:resumed.visitPlans,learnedIssues:resumed.learnedIssues,selected:resumed.selected,year:resumed.year,cash:resumed.cash,metrics:resumed.metrics}),before,'do not overturn already-generated plans or progress');
const future=[];for(let year=5;year<=7;year++){resumed.year=year;const draw=E.availability(resumed);assert(draw.accepted.length>=4,'legacy future years add no more three-refusal years');future.push(draw.accepted.length);}
assert(future.includes(6),'a resumed term still receives an all-open year');
const finalChance=E.create({seed:22});finalChance.year=7;finalChance.visitPlans={};for(let year=1;year<=6;year++)finalChance.visitPlans['y'+year]=savedPlan(year,4);
assert.equal(E.availability(finalChance).accepted.length,6,'last ungenerated year opens all six if none were open before');

const formerlyFull=E.create({seed:11});formerlyFull.year=3;formerlyFull.visitPlans={y1:savedPlan(1,6),y2:savedPlan(2,6),y3:savedPlan(3,4)};
const kept=copy(formerlyFull.visitPlans);
for(let year=4;year<=7;year++){formerlyFull.year=year;assert(E.availability(formerlyFull).accepted.length<=5,'legacy future years do not add further all-open years after two');}
for(const key of Object.keys(kept))assert.deepEqual(copy(formerlyFull.visitPlans[key]),kept[key]);
console.log('Visit pacing: '+checked+' seeded annual plans across 3,000 terms; varied three/four/five/six-home years, one or two low/all-open years, stable reloads, refusal bounds and legacy progress preservation passed.');
