'use strict';
// End-to-end authored-dialogue checks against the actual browser script order.
// Network responses are fixtures only; no request leaves this process.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const dist=path.join(__dirname,'..','dist'),sourcePath=path.join(__dirname,'..','docs','policy-script-review-zh.md');
const index=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const required=['data.js','year-translations.js','year-content.js','year-policy-content.js','year-policy-english.js','year-policy-dialogue.js','i18n.js','community.js','year-home.js','year-refusal.js','year-events.js','vendor/downstairs-ai/llm.js','year-engine.js','year-dialogue.js'];
const scripts=[...index.matchAll(/<script\s+defer\s+src="([^"]+)"/g)].map(m=>m[1]).filter(f=>required.includes(f));
for(const file of required)assert(scripts.includes(file),'actual index loads '+file);
assert(scripts.indexOf('year-policy-content.js')<scripts.indexOf('year-engine.js'));
assert(scripts.indexOf('year-policy-english.js')<scripts.indexOf('year-dialogue.js'));
const cjk=/[㐀-鿿]/,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const clean=value=>JSON.parse(JSON.stringify(value));
const normalize=value=>String(value||'').replace(/\s+/g,' ').trim();
const decode=value=>String(value).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const visibleText=html=>decode(String(html).replace(/<[^>]*>/g,' '));
const names={'陈玉英':'chen','拉赫曼与努尔':'rahman','林家':'lin','库马尔与德薇':'kumar','合租学生':'students','阿丽':'ali'};
const approved=fs.readFileSync(sourcePath,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
const approvedNeeds=new Map();
const yearSections=[...approved.matchAll(/^## 第([1-7])年[^\n]*\n([\s\S]*?)(?=^## 第[1-7]年|^## 事实与虚构的最终核对|^## 七年结尾|$(?![\s\S]))/gm)];
for(const y of yearSections){
  for(const section of y[2].split(/(?=^### )/m)){
    const heading=section.split('\n')[0],person=Object.entries(names).find(([name])=>heading.includes(name));
    if(!person)continue;
    const field=section.match(/\*\*(?:本人明确需要|明确需要|明确需求)\*\*[：:]\s*([\s\S]*?)(?=\n\s*(?:\*\*|- \*\*|###)|$)/);
    if(!field)continue;
    const need=field[1].replace(/^\s*>\s?/gm,'').replace(/\*\*/g,'').trim().replace(/^[“「『"]([\s\S]*)[”」』"]$/,'$1').trim();
    approvedNeeds.set(y[1]+':'+person[1],need);
  }
}
assert.equal(approvedNeeds.size,42,'the approved Markdown independently yields 42 household-year needs');

function fixture(year=1,language='zh',model=false){
  const elements=new Map(),handlers={},calls=[],opened=[],timers=new Set();
  const element=(id,dataset={})=>({id,dataset,innerHTML:'',textContent:'',value:'',disabled:false,querySelector:()=>null,querySelectorAll:()=>[],focus(){},hasAttribute(){return false;}});
  const doc={getElementById:id=>elements.get(id)||null,querySelector:()=>null,addEventListener(type,fn){(handlers[type]||=[]).push(fn);}};
  const context={document:doc,URL,matchMedia:()=>({matches:true}),localStorage:{getItem:()=>null,setItem(){}},location:model?{protocol:'http:',hostname:'127.0.0.1'}:{protocol:'file:',hostname:''},
    setTimeout(fn,ms,...args){const timer=setTimeout(fn,ms>=2000?ms:0,...args);timers.add(timer);if(ms>=2000)timer.unref?.();return timer;},
    clearTimeout(timer){timers.delete(timer);clearTimeout(timer);}};
  context.fetch=async(url,options={})=>{
    if(String(url).startsWith('/api/ai-check'))return {ok:true,json:async()=>({configured:true,ok:true})};
    if(url==='/api/dialogue'&&model){
      const {messages}=JSON.parse(options.body),body=JSON.parse(messages[1].content);calls.push({system:messages[0].content,body});
      const output={narration:language==='en'?'They pause beside the table.':'对方在桌边停了一下。',reply:language==='en'?'I am explaining this year’s situation.':'我在说今年遇到的情况。',needs:[{title:'MODEL_EARLY_NEED',detail:'MODEL_EARLY_NEED',quote:'MODEL_EARLY_NEED'}],options:(body.nextChoices||[]).map(c=>({tone:c.tone,text:c.example}))};
      if(model==='stall')output.reply=language==='en'?'I want to make the situation clear before we decide.':'我想先把这些具体情况说明白，再谈怎么安排。';
      return {ok:true,json:async()=>({text:JSON.stringify(output)})};
    }
    throw new Error('External/unexpected fetch blocked by test: '+url);
  };
  context.window=context;context.globalThis=context;vm.createContext(context);
  for(const file of scripts)vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),context,{filename:file});
  const E=context.CM_YEARS,ui=context.CM_YEAR_TALK,book=context.CM_YEAR_POLICY_CONTENT,state=E.create({seed:7});
  state.year=year;E.availability(state);const plan=state.visitPlans['y'+year];plan.accepted=E.households().map(h=>h.id);plan.reasons={};
  context.CM_I18N.setLanguage(language);
  ui.initialize({getState:()=>state,getLanguage:()=>language,canTalkTo:()=>true,save(){},render(){},toast(){},onLearned(){},approach(){},close(){},open(...args){opened.push(args);}});
  elements.set('modal',{open:true});
  const record=i=>state.caseTalks.find(r=>r.year===state.year&&r.issueId===i.id);
  async function mount(resident){
    const issue=E.issues(state).find(i=>i.residentId===resident)||E.additionalVisits(state).find(i=>i.residentId===resident);
    assert(issue,'current issue exists: '+year+' '+resident);
    const panel=element('year-talk-panel',{yearTalkIssue:issue.id});elements.set(panel.id,panel);panel.innerHTML=ui.panel(issue.id);ui.mount(issue.id);
    for(let n=0;n<100&&!record(issue)?.exchanges.length;n++)await wait(2);
    assert.equal(record(issue)?.exchanges.length,1,'resident actually mounts and speaks');return issue;
  }
  const translate=text=>language==='en'?(context.CM_YEAR_POLICY_ENGLISH[String(text)]||context.CM_I18N.t(String(text))):String(text);
  const renderEnglishText=html=>[...String(html).matchAll(/>([^<>]+)</g)].map(m=>context.CM_I18N.t(decode(m[1].trim()))).join(' ');
  return {context,E,ui,book,state,calls,opened,mount,record,translate,renderEnglishText,html:()=>elements.get('year-talk-panel')?.innerHTML||'',dispose(){ui.cancel();for(const timer of timers)clearTimeout(timer);}};
}

for(const language of ['zh','en']){
  test('all 42 authored household-year visits mount, follow their own QA, and reveal the exact approved need: '+language,async()=>{
    const languageFailures=[];
    for(let year=1;year<=7;year++){
      const f=fixture(year,language);
      try{
        assert.equal(f.book.sourceSha256,crypto.createHash('sha256').update(approved).digest('hex'));
        for(const h of f.E.households()){
          const label=year+' '+h.id+' '+language,authored=f.book.get(year,h.id),issue=await f.mount(h.id),r=f.record(issue);
          assert.equal(authored.need,approvedNeeds.get(year+':'+h.id),label+' matches the reviewed Markdown');
          assert.equal(issue.title,authored.title,label+' engine is on the current authored case');
          assert.equal(normalize(r.exchanges[0].reply),normalize(f.translate(authored.opening)),label+' does not use the old annual opening');
          assert(!f.E.learned(f.state,issue.id));
          assert(await f.ui.choose(1));assert.equal(r.event.node,'care');
          assert(await f.ui.choose(0));assert.equal(r.event.node,'story');
          assert(!f.E.learned(f.state,issue.id));assert(!f.html().includes('is-ready'),label+' two warm replies do not open the gate');
          assert(await f.ui.choose(1));assert.equal(r.event.node,'daily');
          const warming=r.exchanges.filter(x=>!x.opening).map(x=>x.reply);
          assert.equal(new Set(warming).size,3,label+' three replies add distinct content');
          assert(warming.every(line=>!/一下子说不清|再多问问|先把这些具体情况说明白|hard to explain all at once|make the situation clear before we decide/i.test(line)),label+' never stalls to fill the trust quota');
          assert(!f.E.learned(f.state,issue.id));assert(f.html().includes('is-ready'),label+' third warm reply opens the original gate');
          for(const q of authored.questions||[])assert(r.exchanges.some(x=>x.reply.includes(f.translate(q.reply))),label+' includes each authored QA reply');
          assert(await f.ui.choose(0));assert.equal(r.event.node,'reveal');assert(f.E.learned(f.state,issue.id));
          const expected=f.translate(approvedNeeds.get(year+':'+h.id)),reveal=r.exchanges.at(-1);
          assert.equal(reveal.clue,expected,label+' golden clue is exact');assert(reveal.reply.includes(expected));
          assert(f.html().includes('<mark class="year-talk-clue'),label+' need is visibly marked');
          if(language==='en'){
            for(const exchange of r.exchanges)if(cjk.test(exchange.reply+exchange.player+exchange.narration))languageFailures.push(label+': '+JSON.stringify({reply:exchange.reply,player:exchange.player,narration:exchange.narration}));
            if(cjk.test(f.renderEnglishText(f.html())))languageFailures.push(label+': rendered English dialogue contains Chinese text');
          }
        }
      }finally{f.dispose();}
    }
    assert.equal(languageFailures.length,0,'Every authored English exchange must be fully translated:\n'+[...new Set(languageFailures)].join('\n'));
  });

  test('early follow-ups do not learn; the existing linked-object route still learns across all 42 cases: '+language,async()=>{
    for(let year=1;year<=7;year++){
      const early=fixture(year,language),objects=fixture(year,language);
      try{
        for(const h of early.E.households()){
          const issue=await early.mount(h.id),r=early.record(issue);
          assert(await early.ui.choose(0));assert.equal(r.event.node,'story');
          assert(await early.ui.choose(0));assert.equal(r.event.node,'wait');
          assert(!early.E.learned(early.state,issue.id),'early ask remains unlearned: '+year+' '+h.id);
          assert(!r.exchanges.some(x=>x.clue));
          const oi=await objects.mount(h.id),or=objects.record(oi),key=oi.id.replace(/^y\d+-/,''),hints=objects.context.CM_HOME.hintProps(objects.state,h.id,key,language);
          assert(hints.length,'current authored case has a real linked room object: '+year+' '+h.id);
          assert(await objects.ui.choose(0));assert.equal(or.event.node,'story');
          const item=objects.context.CM_HOME.propById(objects.state,h.id,hints[0].id,language);
          assert(await objects.ui.askObject(item));assert(objects.context.CM_HOME.heard(objects.state,h.id).includes(item.id));
          assert(!objects.E.learned(objects.state,oi.id),'object alone does not reveal the need');
          assert(await objects.ui.choose(0));assert.equal(or.event.node,'reveal');
          assert(objects.E.learned(objects.state,oi.id),'two warm replies plus the linked object retain the original rule');
          assert.equal(or.exchanges.at(-1).clue,objects.translate(objects.book.get(year,h.id).need));
        }
      }finally{early.dispose();objects.dispose();}
    }
  });
}

test('a heard expiring student lease is explained on the next actual visit, once, in both languages',async()=>{
  for(const language of ['zh','en']){
    const f=fixture(3,language);try{
      const index=f.context.CM_YEAR_CONTENT.refusals.students.findIndex(r=>/租约.*到期/.test(r.short.zh));assert(index>=0);
      assert.equal(f.context.CM_YEAR_POLICY_DIALOGUE.leaseContinuation(f.state,'students'),null,'no invented refusal');
      f.state.visitPlans.y2={year:2,accepted:['chen','lin','ali'],reasons:{students:index},seen:{students:true}};
      const issue=await f.mount('students'),r=f.record(issue),opening=r.exchanges[0].reply;
      assert(language==='zh'?opening.includes('谈妥续租'):opening.includes('agreed on a renewal'));
      assert(await f.ui.choose(1));assert(!r.exchanges[1].reply.includes(language==='zh'?'谈妥续租':'agreed on a renewal'),'no repeated lease preface');
      f.state.year=4;assert.equal(f.context.CM_YEAR_POLICY_DIALOGUE.leaseContinuation(f.state,'students'),null,'a later visit does not retell the resolved lease');
    }finally{f.dispose();}
    const unseen=fixture(3,language);try{
      const index=unseen.context.CM_YEAR_CONTENT.refusals.students.findIndex(r=>/租约.*到期/.test(r.short.zh));
      unseen.state.visitPlans.y2={year:2,accepted:['chen','lin','ali'],reasons:{students:index},seen:{}};
      assert.equal(unseen.context.CM_YEAR_POLICY_DIALOGUE.leaseContinuation(unseen.state,'students'),null,'an unobserved refusal is not asserted');
    }finally{unseen.dispose();}
  }
});

test('resuming an existing visit replaces quota-filling replies without changing progress or choices',async()=>{
  for(const language of ['zh','en']){
    const f=fixture(2,language);
    try{
      const issue=await f.mount('students'),r=f.record(issue);
      assert(await f.ui.choose(1));assert(await f.ui.choose(0));
      const saved=clean(r),before=clean({year:f.state.year,metrics:f.state.metrics,cash:f.state.cash,event:r.event});
      r.exchanges[1].reply=language==='zh'?'这个……一下子说不清楚，你再多问问？':'It is hard to explain all at once. Could you ask more?';
      r.exchanges[2].reply=language==='zh'?'我想先把这些具体情况说明白，再谈怎么安排。':'I want to make the situation clear before we decide.';
      f.ui.refresh(issue.id);
      const after=clean(r),replies=after.exchanges.slice(1).map(x=>x.reply);
      assert.equal(new Set(replies).size,2,'replacement details are distinct');
      assert(replies.every(line=>!/一下子说不清|再多问问|先把这些具体情况说明白|hard to explain all at once|make the situation clear before we decide/i.test(line)));
      for(let n=0;n<saved.exchanges.length;n++){
        const original={...saved.exchanges[n]},updated={...after.exchanges[n]};delete original.reply;delete updated.reply;
        assert.deepEqual(updated,original,'player line, trust tone and clue remain unchanged');
      }
      assert.deepEqual(clean({year:f.state.year,metrics:f.state.metrics,cash:f.state.cash,event:r.event}),before);
      assert(!f.E.learned(f.state,issue.id));
      if(language==='en')assert(replies.every(line=>!cjk.test(line)));
    }finally{f.dispose();}
  }
});

test('an AI quota-filling reply falls back to the written story in both choice and typed dialogue',async()=>{
  for(const language of ['zh','en']){
    const f=fixture(2,language,'stall');await wait(2);
    try{
      const issue=await f.mount('students'),r=f.record(issue);
      assert.equal(r.exchanges[0].voiced,undefined,'AI filler never replaces the authored opening');
      assert(await f.ui.listen(issue.id,{question:language==='en'?'How is your daily routine?':'你们平时怎么安排生活？'}));
      assert.equal(r.exchanges.at(-1).source,'offline','typed conversation also rejects AI filler');
      assert(!f.E.learned(f.state,issue.id));
      for(const choice of [1,0,1])assert(await f.ui.choose(choice));
      assert(await f.ui.choose(0));assert(f.E.learned(f.state,issue.id));
      assert.equal(r.exchanges.at(-1).clue,f.translate(f.book.get(2,'students').need));
      assert(r.exchanges.every(x=>!/先把这些具体情况说明白|make the situation clear before we decide/i.test(x.reply)));
    }finally{f.dispose();}
  }
});

test('fake DeepSeek sees only the current household/year policy context; offered needs cannot bypass rules',async()=>{
  for(let year=1;year<=7;year++){
    const f=fixture(year,'zh',true);await wait(2);
    try{
      for(const h of f.E.households()){
        const authored=f.book.get(year,h.id),start=f.calls.length,issue=await f.mount(h.id),r=f.record(issue);
        assert.equal(r.exchanges[0].voiced,'deepseek');assert(!f.E.learned(f.state,issue.id),'model-supplied needs in opening are ignored');
        for(const choice of [1,0,1]){assert(await f.ui.choose(choice));assert(!f.E.learned(f.state,issue.id),'a model need before the gate cannot be recorded');}
        assert(await f.ui.choose(0));assert(f.E.learned(f.state,issue.id));assert.equal(r.exchanges.at(-1).clue,authored.need);
        const requests=f.calls.slice(start);assert.equal(requests.length,5);
        for(const {system,body} of requests){
          assert.equal(body.year,year);assert.equal(body.resident.id,h.id);assert.equal(body.request.title,authored.title);assert.equal(body.request.voiceNeed,authored.need);
          assert(body.policyStory.fictional);assert.equal(body.policyStory.household.opening,authored.opening);assert.equal(body.policyStory.household.need,authored.need);
          assert.equal(body.policyStory.yearContext.title,f.book.year(year).title);assert.equal(body.policyStory.yearContext.setting,f.book.year(year).setting);
          assert.equal(body.policyStory.yearContext.policySummary,f.book.year(year).policySummary);assert.deepEqual(body.policyStory.yearContext.sources,clean(f.book.year(year).sources));
          const forbidden=[];function inspect(value){if(!value||typeof value!=='object')return;for(const [key,next] of Object.entries(value)){if(['options','sourceText','closing','endings','years','cases','_gate','_object'].includes(key))forbidden.push(key);inspect(next);}}inspect(body);
          assert.deepEqual(forbidden,[],'no cards, full source, future chapters or private rule internals are transmitted');
          const payload=JSON.stringify(body);for(const later of f.book.years.filter(y=>y.year>year))for(const c of later.cases)assert(!payload.includes(c.need),'no future household need: '+later.year+' '+c.residentId);
          assert(system.includes('本年本户')&&system.includes('以本年为准'),'the current-year script takes priority over old background');
        }
        assert.equal(requests.at(-1).body.beat.needSentence,authored.need);
      }
    }finally{f.dispose();}
  }
});

test('a typed early question and a model-declared need cannot bypass the original trust gate',async()=>{
  for(const language of ['zh','en']){
    const f=fixture(3,language,true);await wait(2);
    try{
      const issue=await f.mount('rahman'),r=f.record(issue),before=JSON.stringify([f.state.year,f.state.metrics,f.state.cash,f.state.staffTotal,f.state.assets]);
      assert(await f.ui.listen(issue.id,{question:language==='en'?'What difficulty do you need help with?':'您有什么困难需要帮忙？'}));
      assert(!f.E.learned(f.state,issue.id),'a typed question plus a supplied model need is still too early');
      assert(!r.exchanges.some(x=>x.clue));assert.equal(r.exchanges.at(-1).source,'deepseek');
      assert.equal(f.calls.at(-1).body.patience.revealAllowed,false);
      assert.equal(JSON.stringify([f.state.year,f.state.metrics,f.state.cash,f.state.staffTotal,f.state.assets]),before);
    }finally{f.dispose();}
  }
});

for(const language of ['zh','en'])test('the existing notebook shows current context and official sources, only completed-year closings: '+language,()=>{
  const f=fixture(4,language);
  try{
    f.state.reports=[{year:1},{year:2},{year:3},{year:5}]; // a corrupt/future entry must not expose a later closing.
    f.ui.notesModal();const body=f.opened.at(-1)[1],text=normalize(visibleText(body)),current=f.book.year(4);
    assert(text.includes(normalize(f.translate(current.title))));
    if(current.setting)assert(text.includes(normalize(f.translate(current.setting))));
    assert(text.includes(normalize(f.translate(current.story))));
    for(const source of current.sources)assert(body.includes('href="'+source.url+'"'),'direct official source is available');
    for(const year of [1,2,3])assert(text.includes(normalize(f.translate(f.book.year(year).closing))),'completed-year closing is readable: '+year);
    for(const year of [4,5,6,7])assert(!text.includes(normalize(f.translate(f.book.year(year).closing))),'uncompleted/future closing remains hidden: '+year);
    if(language==='en')assert(!cjk.test(f.renderEnglishText(body)),'English notebook content has no Chinese text');
  }finally{f.dispose();}
});
