/* Compile the approved Chinese review text. No gameplay values are generated here. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const sourcePath=path.resolve(__dirname,'../docs/policy-script-review-zh.md');
const outputPath=path.resolve(__dirname,'../dist/year-policy-content.js');
const source=fs.readFileSync(sourcePath,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
const names={'陈玉英':'chen','拉赫曼与努尔':'rahman','林家':'lin','库马尔与德薇':'kumar','合租学生':'students','阿丽':'ali'};
const types={'社区协调':'community','专业服务':'service','长期投资':'capital'};
function plain(text){return String(text||'').replace(/^\s*>\s?/gm,'').replace(/\*\*/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').trim();}
function unquote(text){return plain(text).replace(/^[“「『"]([\s\S]*)[”」』"]$/,'$1').trim();}
function paragraphs(text){return String(text||'').trim().split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);}
function speech(text){return unquote(String(text||'').replace(/^(?:你|陈玉英|拉赫曼|努尔|库马尔|德薇|林志豪|周佳颖|学生|合租学生|阿丽)[：:]\s*/,''));}
function field(block,label){const m=block.match(new RegExp('\\*\\*(?:'+label+')\\*\\*[：:]\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*|### |- \\*\\*)|$)'));return m?m[1].trim():'';}
function sources(text){const seen=new Set();return [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].filter(m=>!seen.has(m[2])&&seen.add(m[2])).map(m=>({title:m[1],url:m[2]}));}
function parseConversation(block,residentName){
  const beforeNeed=block.split(/\*\*(?:本人明确需要|明确需要|明确需求)\*\*/)[0];
  const questions=[];
  for(const m of beforeNeed.matchAll(/\*\*追问[一二]\*\*([\s\S]*?)(?=\*\*追问[一二]\*\*|$)/g)){
    const bits=paragraphs(m[1].replace(/^[：:]\s*/,''));
    const question=speech(bits.shift()||'');
    const reply=bits.filter(s=>!s.startsWith('〔政策旁注')).map(speech).join('\n\n');
    if(question&&reply)questions.push({question,reply});
  }
  const intro=beforeNeed.split(/\*\*追问[一二]\*\*/)[0];
  const sceneLabel=intro.match(/\*\*入户场景与开场\*\*[：:]\s*([^\n]*)/);
  const openingLabel=intro.match(/\*\*(?:开场|开场短对话|短对白|短对话)\*\*[：:]\s*([\s\S]*)/);
  const quoted=paragraphs(intro).filter(s=>s.startsWith('>')).map(unquote);
  let scene=sceneLabel?plain(sceneLabel[1]):'';
  let opening=quoted[0]||'';
  const dialogue=[];
  if(openingLabel){
    const raw=openingLabel[1].trim();
    const bits=paragraphs(raw);
    const named=bits.filter(s=>/^[^：:\n]{1,12}[：:]/.test(s));
    if(named.length>1){
      for(const line of named){const colon=line.search(/[：:]/);dialogue.push({speaker:line.slice(0,colon),line:speech(line)});}
      opening=dialogue.find(v=>v.speaker!=='你')?.line||opening;
      for(let i=0;i<dialogue.length-1;i++)if(dialogue[i].speaker==='你'&&dialogue[i+1].speaker!=='你')questions.push({question:dialogue[i].line,reply:dialogue[i+1].line});
    }else if(quoted.length){scene=plain(bits.filter(s=>!s.startsWith('>')).join('\n\n'));}
    else{
      // The later review uses compact narrated exchanges. Keep the exact text in
      // dialogue and split the first quotation for the resident-led opening.
      const quotes=[...raw.matchAll(/“([^”]+)”/g)].map(m=>m[1]);
      if(quotes.length){
        opening=quotes[0];
        const at=raw.indexOf('“');scene=plain(raw.slice(0,at)).replace(/[：:]$/,'');
        if(quotes.length>1){const q=raw.slice(raw.indexOf('”')+1).match(/你问([^，。；：]*[？?]?)/);if(q)questions.push({question:q[1].replace(/[？?]?$/,'？'),reply:quotes.slice(1).join('\n\n')});}
      }else opening=plain(raw);
      dialogue.push({speaker:residentName,line:plain(raw)});
    }
  }
  return {scene,opening:opening||questions[0]?.reply||'',questions,dialogue};
}
const annual=[...source.matchAll(/^## 第([1-7])年[：:]([^\n]+)\n([\s\S]*?)(?=^## 第[1-7]年|^## 事实与虚构|^## 七年结尾|$(?![\s\S]))/gm)];
const years=annual.map(match=>{
  const year=Number(match[1]),title=match[2].trim(),body=match[3];
  const people=[...body.matchAll(/^### (?:(?:重点人物[一二]|关联人物)｜)?(陈玉英|拉赫曼与努尔|林家|库马尔与德薇|合租学生|阿丽)[｜：]([^\n]+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)];
  const policyArea=body.slice(0,people[0]?.index||body.length);
  const openingMatch=policyArea.match(/(?:\*\*年度开场\*\*[：:]|### 年度开场)\s*([\s\S]*?)(?=### |$)/);
  // The setting is the labelled scene paragraph, not the following narrator
  // blockquote. Year 6 uses that single paragraph as its story instead.
  const setting=paragraphs(field(policyArea,'虚构年度铺垫')).filter(s=>!s.startsWith('>')).join('\n\n');
  const quotes=paragraphs(openingMatch?.[1]||policyArea).filter(s=>s.startsWith('>'));
  const story=quotes.length?quotes.map(unquote).join('\n\n'):plain(openingMatch?.[1]||setting);
  let policySummary=field(policyArea,'政策事实与来源|政策事实');
  if(!policySummary){const section=policyArea.split(/^### 政策事实与学习问题\s*$/m)[1]||policyArea;policySummary=paragraphs(section).find(s=>!s.startsWith('###')&&!s.startsWith('**'))||'';}
  const closingSection=body.match(/### (?:第[1-7]年收尾与下一年桥梁|本年结束[^\n]*)\n([\s\S]*)/);
  let closing='';
  if(closingSection){
    const end=closingSection[1],endQuotes=paragraphs(end).filter(s=>s.startsWith('>'));
    closing=endQuotes.length?endQuotes.map(unquote).join('\n\n'):plain(paragraphs(end).find(s=>s.startsWith('年报旁白'))||'').replace(/^年报旁白[：:]\s*/,'');
    const next=field(end,'升级到下一年');if(next)closing+='\n\n'+plain(next);
  }else closing=plain(field(body,'本年结尾／因果桥|本年结尾／新的政策理解'));
  const cases=people.map(person=>{
    const residentName=person[1],residentId=names[residentName],caseTitle=person[2].replace(/〔主故事〕/g,'').trim(),block=person[3];
    const need=unquote(field(block,'本人明确需要|明确需要|明确需求'));
    const options={};
    for(const card of block.matchAll(/^- \*\*(社区协调|专业服务|长期投资)｜(.+?)\*\*[：:]([\s\S]*?)\*\*结果\*\*[：:]([^\n]+)/gm))options[types[card[1]]]={name:card[2].trim(),description:plain(card[3]),result:plain(card[4])};
    const conversation=parseConversation(block,residentName);
    if(!need||Object.keys(options).length!==3||!conversation.opening)throw new Error('Incomplete approved case y'+year+'/'+residentId);
    return {residentId,title:caseTitle,...conversation,need,options,sourceText:block.trim()};
  });
  if(cases.length!==6||new Set(cases.map(c=>c.residentId)).size!==6||!story||!closing)throw new Error('Incomplete year '+year+': '+JSON.stringify({cases:cases.length,story,closing}));
  return {year,title,story,setting:plain(setting)===story?'':plain(setting),closing,policySummary:plain(policySummary),sources:sources(policyArea),cases};
});
if(years.length!==7)throw new Error('Expected seven annual sections, found '+years.length);
const endingSection=source.split('## 七年结尾：')[1]||'';
const endings={};
for(const [key,heading] of [['win','达成目标时'],['lose','尚未达成目标时']]){const section=endingSection.match(new RegExp('### '+heading+'\\s*([\\s\\S]*?)(?=### |## |$)'));endings[key]=paragraphs(section?.[1]).filter(s=>s.startsWith('>')).map(unquote).join('\n\n');if(!endings[key])throw new Error('Missing ending '+key);}
const data={source:'docs/policy-script-review-zh.md',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),years,endings};
const output='/* Generated by scripts/build-policy-content.cjs from the approved review. Text only; no game rules. */\n(function(root){\n  \'use strict\';\n  const data='+JSON.stringify(data,null,2)+';\n  function freeze(v){if(v&&typeof v===\'object\'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}\n  freeze(data);\n  root.CM_YEAR_POLICY_CONTENT=Object.freeze({...data,year:n=>data.years.find(y=>y.year===Number(n))||null,get:(n,id)=>data.years.find(y=>y.year===Number(n))?.cases.find(c=>c.residentId===id)||null});\n})(typeof window!==\'undefined\'?window:globalThis);\n';
fs.writeFileSync(outputPath,output,'utf8');
console.log(JSON.stringify({years:years.length,cases:years.reduce((n,y)=>n+y.cases.length,0),cards:years.reduce((n,y)=>n+y.cases.reduce((m,c)=>m+Object.keys(c.options).length,0),0),output:path.relative(path.dirname(sourcePath),outputPath)}));
