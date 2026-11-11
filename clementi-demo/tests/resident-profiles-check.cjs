'use strict';
// Execute the shipped read-only profile helpers against the real persona and
// rules data. Browser layout is checked separately by the owning agent.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dist=path.join(__dirname,'../dist'),app=fs.readFileSync(path.join(dist,'year-app.js'),'utf8');
const start=app.indexOf('  // Resident backgrounds'),end=app.indexOf('  // Leaving the decision panel',start);
assert(start>=0&&end>start,'the actual profile helper block is present');
const context={};context.window=context;context.globalThis=context;vm.createContext(context);
for(const file of ['data.js','year-translations.js','year-content.js','year-policy-content.js','year-policy-english.js','i18n.js','community.js','year-engine.js'])vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),context,{filename:file});
const E=context.CM_YEARS,community=context.CM_COMMUNITY;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opened=[];let language='zh';
Object.assign(context,{root:context,E,esc:escape,lang:()=>language,w:(zh,en)=>language==='en'?en:zh,
  portrait:id=>'<svg data-person="'+escape(id)+'"></svg>',icon:name=>'<svg data-icon="'+escape(name)+'"></svg>',
  btn:(action,label,id='',cls='',extra='')=>'<button type="button" class="'+cls+'" data-year-action="'+action+'" data-id="'+escape(id)+'" '+extra+'>'+label+'</button>',
  open:(...args)=>opened.push(args)});
vm.runInContext(app.slice(start,end),context,{filename:'actual-profile-helpers.js'});
const invoke=(name,...args)=>{context.__profileArgs=args;return vm.runInContext(name+'(...__profileArgs)',context);};
const clean=value=>JSON.parse(JSON.stringify(value));
const ids=clean(invoke('profileIds'));
assert.equal(ids.length,8,'the six visit homes and two supporting neighbours have profiles');
assert.deepEqual(ids.slice(0,6),clean(E.households().map(h=>h.id)),'the six visit homes stay first');
assert.deepEqual(new Set(ids),new Set(Object.keys(community.personas)));
let bios=0;
for(const locale of ['zh','en']){
  language=locale;
  for(const id of ids){
    const p=community.personas[id],html=invoke('profileHTML',id);
    assert(html.includes('data-profile-resident="'+id+'"'));
    for(const field of ['name','gender','role','home','tenure','family','routine','evidence'])assert(html.includes(escape(p[field][locale])),id+' '+locale+' retains the existing '+field);
    const age=p.ageRange?p.ageRange.join('–'):p.ages?p.ages.join(' / '):String(p.age);
    assert(html.includes(escape(age)+' '+(locale==='zh'?'岁':'years')),id+' retains the starting age format');
    assert(html.includes(locale==='zh'?'年龄（开局）':'Age at the start'),'age is explicitly the starting age');
    assert(html.includes(escape(community.disclaimer[locale])),'existing fiction/evidence boundary remains visible');
    const source=id==='students'||id==='huang'?community.sources.history:community.sources.geography;
    assert(html.includes('href="'+escape(source.url)+'"'));
    if(locale==='en')assert(!/[㐀-鿿]/.test(html),'English profile contains no untranslated Chinese: '+id);
    context.state={year:1};const starting=invoke('profileHTML',id);context.state.year=7;
    assert.equal(invoke('profileHTML',id),starting,'later chapters do not silently invent new ages or biographical changes');
    const disclosure=invoke('profileDisclosure',id);
    assert.match(disclosure,/^<details class="yr-profile-disclosure"[^>]*><summary>/);
    assert(disclosure.includes(html),'the inline background reuses the same existing content');
    assert(!/data-year-action=|data-year-talk-|data-home-|\bmount\s*\(/.test(disclosure),'native disclosure cannot add a visit or dialogue action');
    bios++;
  }
}
assert.equal(invoke('profileHTML','unknown'),'');assert.equal(invoke('profileDisclosure','unknown'),'');

// Keep both an unobserved refusal and a reserved decision in the actual game.
// Looking up any bio must not learn needs, mark refusal seen, spend or resolve.
let state;for(let seed=1;seed<=100;seed++){const candidate=E.create({seed});candidate.year=2;E.availability(candidate);if(E.households().some(h=>!E.canVisit(candidate,h.id))){state=candidate;break;}}
assert(state,'a later-year fixture includes an unobserved refusal');
const accepted=E.additionalVisits(state).find(i=>E.canVisit(state,i.residentId));assert(accepted);
assert(E.learn(state,accepted.id).ok);assert(E.summarize(state).ok);assert(E.beginPolicies(state).ok);assert(E.choose(state,accepted.id,'capital').ok);
const refused=E.households().find(h=>!E.canVisit(state,h.id));assert(refused,'fixture contains an unavailable household');
context.state=state;const before=JSON.stringify(state),oldCommunity=JSON.stringify(community);
for(const locale of ['zh','en']){
  language=locale;
  for(const id of ids){
    assert.equal(invoke('showProfiles',id),true);const modal=opened.at(-1);
    assert.equal(modal[4].kind,'profiles');assert.equal(modal[4].id,id);
    assert(modal[1].includes('data-id="'+id+'" aria-pressed="true"')||new RegExp('data-id="'+id+'"[^>]*aria-pressed="true"').test(modal[1]),'selected resident is identified');
    assert.equal((modal[1].match(/data-year-action="profiles"/g)||[]).length,8,'all existing neighbours remain selectable');
    assert(!/data-year-action="(?:visit|next|choose|back-visits)"/.test(modal[1]),'directory is read-only');
    assert.equal(JSON.stringify(state),before,'reading '+id+' does not change saved game progress');
  }
}
assert.equal(invoke('showProfiles',refused.id),true,'unavailable neighbours still have a readable background');
const calls=opened.length;assert.equal(invoke('showProfiles','unknown'),false);assert.equal(opened.length,calls,'invalid IDs do not open an empty profile');
assert.equal(JSON.stringify(state),before);assert.equal(JSON.stringify(community),oldCommunity);
assert.equal(state.selected[accepted.id],'capital','reserved choices remain intact');

assert.match(app,/profileDisclosure\(i\.residentId\)/,'the home retains an inline native background');
assert.match(app,/profileDisclosure\(residentId\)/,'a refused visit still exposes its background');
assert.match(app,/previous\?\.kind==='profiles'\)showProfiles\(previous\.id\)/,'language changes reopen the same selected resident');
assert.match(app,/case'profiles':showProfiles\(id\)/,'the gameplay action opens the directory');
console.log('Resident profiles: '+bios+' exact existing bilingual bios, eight-neighbour directory, starting-age scope, native inline disclosures, refused access, selected-profile routing and unchanged investigation/economy/choices passed.');
