/* Offline, read-only review of the decisions actually retained in this save. */
(function(root){
  'use strict';
  const AXES=['stay','social','comfort'],HOMES=['chen','students','lin','ali','kumar','rahman'];
  const finite=value=>value!=null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
  const count=value=>Math.max(0,finite(value)||0);
  const yearOf=value=>Number.isInteger(Number(value))&&Number(value)>=1&&Number(value)<=7?Number(value):null;
  function analyze(state={},options={}){
    const en=options.language==='en',w=(zh,english)=>en?english:zh;
    const axis={stay:w('住得下','Room to stay'),social:w('处得来','Getting along'),comfort:w('住得舒服','Living well')};
    const kind={community:w('社区协调','community coordination'),service:w('专业服务','contracted services'),capital:w('长期投资','long-term investment')};
    const translate=(value,fallback='')=>{const raw=String(value??'');if(!en)return raw||fallback;const line=root.CM_YEAR_POLICY_ENGLISH?.[raw]||root.CM_I18N?.t?.(raw)||raw;return /[㐀-鿿]/.test(line)?fallback:line||fallback;};
    const resident=id=>{const p=root.CM_COMMUNITY?.personas?.[id];return p?.name?.[en?'en':'zh']||({chen:w('陈玉英','Mdm Chen'),students:w('合租学生','the student housemates'),lin:w('林家','the Lin family'),ali:w('阿丽','Ali'),kumar:w('库马尔与德薇','Kumar and Devi'),rahman:w('拉赫曼与努尔','Rahman and Noor')}[id])||w('受影响的居民','the affected residents');};
    const map=new Map(),currentYear=yearOf(state.year)||7;
    for(const report of [...(Array.isArray(state.reports)?state.reports:[]),state.report]){
      const year=yearOf(report?.year);if(!year||year>currentYear||!Array.isArray(report?.results))continue;
      if(!map.has(year)||map.get(year).results.length<=report.results.length)map.set(year,report);
    }
    const reports=[...map.entries()].sort((a,b)=>a[0]-b[0]).map(([year,report])=>{
      const seen=new Set(),results=[];
      for(const [index,r]of report.results.entries()){
        if(!r||!['community','service','capital'].includes(r.policyId))continue;
        const key=r.issueId||r.residentId||'row-'+index;if(seen.has(key))continue;seen.add(key);
        results.push({year,issueId:String(r.issueId||''),residentId:String(r.residentId||''),policyId:r.policyId,assetId:r.assetId||null,
          title:translate(r.policyTitle,w('已记录的'+kind[r.policyId]+'方案','A recorded '+kind[r.policyId]+' decision')),
          result:translate(r.text,w('这项安排已列入该年的实施记录。','This arrangement appears in that year’s implementation record.')),
          effects:Object.fromEntries(AXES.map(k=>[k,finite(r.effects?.[k])||0])),cost:finite(r.cost),urgent:/urgent/.test(String(r.issueId||''))||/^urgent-/.test(String(r.residentId||''))});
      }
      return {year,results,before:report.before||{},after:report.after||{},finance:report.finance||null};
    });
    const actions=reports.flatMap(r=>r.results),types={community:0,service:0,capital:0};actions.forEach(a=>types[a.policyId]++);
    const normal=actions.filter(a=>HOMES.includes(a.residentId)),covered=[...new Set(normal.map(a=>a.residentId))],urgent=actions.filter(a=>a.urgent);
    const investments=actions.filter(a=>a.policyId==='capital'),services=actions.filter(a=>a.policyId==='service');
    const ledgers=reports.filter(r=>r.finance&&finite(r.finance.policySpending)!=null),spending=ledgers.reduce((sum,r)=>sum+count(r.finance.policySpending),0);
    const maintenance=reports.filter(r=>finite(r.finance?.maintenanceCosts)!=null).reduce((sum,r)=>sum+count(r.finance.maintenanceCosts),0);
    const exactSeven=reports.length===7&&reports.every((r,i)=>r.year===i+1);
    const dominant=Object.entries(types).sort((a,b)=>b[1]-a[1])[0],majority=actions.length&&dominant[1]/actions.length>=.5?dominant[0]:'mixed';
    const priced=actions.filter(a=>a.cost!=null&&a.cost>=0),completePrices=priced.length===actions.length&&actions.length>0,choiceCosts={community:0,service:0,capital:0};priced.forEach(a=>choiceCosts[a.policyId]+=a.cost);
    const recordedChoiceCost=priced.reduce((sum,a)=>sum+a.cost,0),resourcePriority=completePrices&&recordedChoiceCost>0?['capital','service'].find(type=>types[type]>=3&&new Set(actions.filter(a=>a.policyId===type).map(a=>a.year)).size>=2&&choiceCosts[type]/recordedChoiceCost>=.55):null;
    const titles={community:w('先把日常接起来的人','Connecting everyday life'),service:w('把专业支持带进社区的人','Bringing support within reach'),capital:w('为往后的日子铺路的人','Making room for the years ahead'),mixed:w('在眼前与长远之间搭桥','Bridging today and tomorrow')};
    const title=!actions.length?w('留下的记录，等待被补全','A record waiting to be completed'):titles[resourcePriority||majority];
    const target=finite(root.CM_YEARS?.goalTarget?.())||70,metrics=Object.fromEntries(AXES.map(k=>[k,finite(state.metrics?.[k])])),knownAxes=AXES.filter(k=>metrics[k]!=null);
    const unmet=knownAxes.filter(k=>metrics[k]<target),lowest=knownAxes.slice().sort((a,b)=>metrics[a]-metrics[b])[0];
    const labelList=list=>list.join(w('、',', ')),choice=a=>w('第'+a.year+'年，你选择了「'+a.title+'」','In year '+a.year+', you chose “'+a.title+'”');
    const intro=!actions.length?w('当前存档没有保留可核对的年度方案，无法据此重建你的任期。现有指标仍可查看；以下不补写没有留下记录的经历。','This save contains no verifiable annual decisions, so it cannot reconstruct your term. The current goals remain visible; missing experiences are not filled in.'):
      w((exactSeven?'七年之后，再看这片社区：':'从留下的'+reports.length+'份年报回看：')+'你落实了'+actions.length+'项安排，涉及'+covered.length+'户探访住户'+(urgent.length?'，也处理了'+urgent.length+'项紧急情况':'')+'。这份回顾沿着你实际选过的方案，看看日常怎样被一步步改变。',
      (exactSeven?'Seven years on, look back at the neighbourhood. ':'Looking back through the '+reports.length+' retained annual reports, ')+(exactSeven?'You put ':'you put ')+actions.length+' arrangements in place, involving '+covered.length+' of the six visited households'+(urgent.length?' and '+urgent.length+' urgent situations':'')+'. This review follows the choices you actually made and the changes recorded along the way.');
    const paragraphs=[];
    if(actions.length){
      const method=majority==='community'?w('你最常先让人把需要说清楚，再协调现有资源。这样的做法让相处规则和日常安排有了落点；继续跟进这些约定，是下一任需要接住的工作。','You most often began by hearing people out and coordinating resources already available. Shared rules and everyday arrangements gained a practical form; keeping those arrangements going is work for the next term.'):
        majority==='service'?w('你最常把问题接到针对性的专业服务上，让住户不必只靠自己寻找下一步。服务委托解决了联系与执行的入口；具体资格、个案结果和长期跟进仍各有自己的程序。','You most often connected problems to targeted professional services, giving households a clearer route to the next step. Commissioned services provided contact and delivery; individual eligibility, outcomes and continuing follow-up still have their own processes.'):
        majority==='capital'?w('你更愿意为持续使用的设施和长期安排投入资源，让改善在任期之后仍有承接。新设施也带来运营、维护和常设岗位；建成以后，日常工作才刚刚开始。','You tended to invest in facilities and arrangements that can keep serving people beyond the term. Those facilities also require operations, upkeep and continuing staff; delivery is the beginning of their everyday work.'):
        w('你没有只沿着一种办法往前走：有时先协调眼前的日常，有时委托服务，有时为长期设施留出资源。社区的改变来自这些不同节奏的安排能否接在一起。','You used more than one route: coordinating everyday needs, commissioning services and reserving resources for longer-term facilities. The neighbourhood’s change depends on how those different timescales connect.');
      const funding=resourcePriority?w(' 从资金安排看，'+kind[resourcePriority]+'用了全部方案投入中的 '+choiceCosts[resourcePriority]+' / '+recordedChoiceCost+' 资金'+(resourcePriority!==dominant[0]?'，这也留下了与你最常使用的办法不同的资源重心。':'。'),
        ' In the funding allocation, '+kind[resourcePriority]+' accounted for '+choiceCosts[resourcePriority]+' of '+recordedChoiceCost+' funds spent on decisions'+(resourcePriority!==dominant[0]?', showing a resource priority different from your most frequent method.':'.')):'';
      paragraphs.push({heading:w('你怎样接手这片社区','How you worked'),text:w('社区协调 '+types.community+' 次，专业服务 '+types.service+' 次，长期投资 '+types.capital+' 次。','Community coordination: '+types.community+'; contracted services: '+types.service+'; long-term investment: '+types.capital+'. ')+method+funding});
      const firstInvestment=investments[0],latest=actions[actions.length-1],example=firstInvestment||services[0]||actions[0];
      paragraphs.push({heading:w('改变落在了哪些日常里','Where the changes reached daily life'),text:choice(example)+w('，面向'+resident(example.residentId)+'的处境。年报留下的结果是：'+example.result,' for '+resident(example.residentId)+'. The report records: '+example.result)+(latest!==example?w(' 到第'+latest.year+'年，「'+latest.title+'」又把关注带到'+resident(latest.residentId)+'身边。',' By year '+latest.year+', “'+latest.title+'” brought attention to '+resident(latest.residentId)+'.'):'')});
      const tradeoffs=actions.filter(a=>AXES.some(k=>a.effects[k]>0)&&AXES.some(k=>a.effects[k]<0)),residual=urgent.filter(a=>AXES.some(k=>a.effects[k]<0)&&!AXES.some(k=>a.effects[k]>0)),exampleCost=tradeoffs[0],largest=ledgers.slice().sort((a,b)=>count(b.finance.policySpending)-count(a.finance.policySpending)||a.year-b.year)[0];
      let price=exampleCost?w('有'+tradeoffs.length+'项方案在推动一方面时，也接受了另一项指标的下降。'+choice(exampleCost)+'，其方案代价包括'+labelList(AXES.filter(k=>exampleCost.effects[k]<0).map(k=>axis[k]+' '+exampleCost.effects[k]))+'。','In '+tradeoffs.length+' choices, progress in one direction came with a decrease in another goal. '+choice(exampleCost)+', whose stated trade-off included '+labelList(AXES.filter(k=>exampleCost.effects[k]<0).map(k=>axis[k]+' '+exampleCost.effects[k]))+'. '):w('这份记录没有显示以一项指标下降换取另一项提升的方案；预算和后续执行仍需要持续安排。','This record contains no choice that trades a decrease in one goal for an increase in another. Budgets and continuing delivery still need attention. ');
      if(residual.length)price+=w(' 另有'+residual.length+'项紧急响应在实施后仍记录了指标损失，这些事件留下的余波也需要继续跟进。',' A further '+residual.length+' urgent response'+(residual.length===1?' still records':'s still record')+' goal losses after implementation, leaving effects of those events to follow up.');
      if(largest)price+=w(' 政策投入最多的是第'+largest.year+'年，使用'+count(largest.finance.policySpending)+'资金。',' Policy spending was highest in year '+largest.year+', at '+count(largest.finance.policySpending)+' funds.');
      if(maintenance)price+=w(' 已保留账目中，设施维护累计投入'+maintenance+'资金。',' The retained accounts include '+maintenance+' funds spent on facility upkeep.');
      paragraphs.push({heading:w('你接受的取舍','The trade-offs you accepted'),text:price});
      const late=reports.filter(r=>r.year===7).flatMap(r=>Array.isArray(r.finance?.newAssets)?r.finance.newAssets:[]).filter(a=>Number(a.activeFromYear)>7);
      let future=knownAxes.length===3?(unmet.length?w('任期末，'+labelList(unmet.map(k=>axis[k]))+'还未达到本局目标。可以从这些日常再走一遍，核对哪些已经安排的支持仍未接上。','At the end of the term, '+labelList(unmet.map(k=>axis[k]))+' remained below this game’s target. A further walk through those routines could reveal where planned support still needs a connection.'):
        w('三项指标都达到本局目标，说明这次资源配置在游戏规则下保持了平衡。接下来仍值得留意'+axis[lowest]+'，以及谁能持续使用、谁来维护你留下的安排。','All three goals reached this game’s target, showing that this allocation kept them balanced under the simulation’s rules. '+axis[lowest]+' still deserves attention, together with who can keep using the arrangements and who will maintain them.')):w('现有记录不足以判断全部目标的变化；后续可以先补齐年报，再回访使用这些安排的人。','The retained record cannot establish every goal’s change. The next step is to complete the accounts and revisit the people using these arrangements.');
      if(late.length)future+=w(' 第7年还有'+late.length+'项设施新建或升级安排要到下一年才开始计入年度收益，它们留下的是接下来的责任与可能。',' A further '+late.length+' facility investment'+(late.length===1?' starts':'s start')+' contributing to annual returns after year 7, leaving responsibilities and possibilities for the next term.');
      if(covered.length<6)future+=w(' 六户中，'+labelList(HOMES.filter(id=>!covered.includes(id)).map(resident))+'没有出现在这份正式方案记录里；这也是下一次回访可以补上的视角。',' '+labelList(HOMES.filter(id=>!covered.includes(id)).map(resident))+' do not appear in the retained formal decisions, leaving perspectives for a future visit.');
      paragraphs.push({heading:w('交给下一任的那一页','The page you leave for the next term'),text:future});
    }
    const highlightActions=[];const add=a=>{if(a&&!highlightActions.some(b=>b.year===a.year&&b.issueId===a.issueId))highlightActions.push(a);};
    add(investments[0]||services[0]||actions[0]);
    const biggest=reports.filter(r=>AXES.every(k=>finite(r.before[k])!=null&&finite(r.after[k])!=null)).slice().sort((a,b)=>AXES.reduce((n,k)=>n+Number(b.after[k])-Number(b.before[k]),0)-AXES.reduce((n,k)=>n+Number(a.after[k])-Number(a.before[k]),0)||a.year-b.year)[0];
    add(biggest?.results.slice().sort((a,b)=>AXES.reduce((n,k)=>n+b.effects[k],0)-AXES.reduce((n,k)=>n+a.effects[k],0))[0]);add(actions[actions.length-1]);
    const highlights=highlightActions.slice(0,3).map(a=>({year:a.year,title:a.title,text:a.result}));
    const timeline=reports.map(r=>({year:r.year,title:w(r.results.length+'项安排',''+r.results.length+' arrangements'),detail:r.results.length?r.results.slice(0,2).map(a=>a.title).join(w('；','; '))+(r.results.length>2?w('，另有'+(r.results.length-2)+'项。','; plus '+(r.results.length-2)+' more.'):''):w('这份年报没有可核对的方案明细。','This report has no verifiable decision details.')}));
    const coverageNote=exactSeven?w('依据本机保存的第1—7年年报生成；方案名称与结果来自你的实际选择。','Generated from the locally saved reports for years 1–7. Decision names and outcomes come from your actual choices.'):
      w('当前只保留了'+reports.length+'份可核对年报'+(reports.length?'（第'+reports.map(r=>r.year).join('、')+'年）':'')+'。回顾仅覆盖这些记录，不补写缺失年份。','Only '+reports.length+' verifiable annual report'+(reports.length===1?' is':'s are')+' retained'+(reports.length?' (years '+reports.map(r=>r.year).join(', ')+')':'')+'. This review covers those records without filling in missing years.');
    return {title,kicker:w(exactSeven?'七年任期 · 你的社区回顾':'已保存的任期回顾',exactSeven?'Seven-year term · Your neighbourhood review':'Your retained term record'),intro,paragraphs,highlights,timeline,coverageNote,
      metricNote:w('70 是本局的三项目标线；社区的经历还需要连同实际选择、取舍和后续工作一起阅读。','70 is this game’s target for each goal. Read the community’s experience alongside the decisions, trade-offs and work that remains.'),
      stats:[{label:w('已记录的安排','Recorded arrangements'),value:actions.length,detail:w('协调 '+types.community+' · 服务 '+types.service+' · 投资 '+types.capital,'Coordination '+types.community+' · Services '+types.service+' · Investment '+types.capital)},
        {label:w('涉及探访住户','Households in decisions'),value:covered.length+'/6',detail:w('另有 '+urgent.length+' 项紧急情况','Plus '+urgent.length+' urgent situations')},
        {label:w('政策累计投入','Recorded policy spending'),value:ledgers.length?spending:'—',detail:w('来自 '+ledgers.length+' 份年度账目','From '+ledgers.length+' annual accounts')},
        {label:w('长期投资决定','Long-term investment choices'),value:investments.length,detail:w('含新建与升级安排','Includes new facilities and upgrades')}],
      facts:{reportYears:reports.map(r=>r.year),decisions:actions.length,types,households:covered.slice(),urgent:urgent.length,policySpending:ledgers.length?spending:null,resourcePriority:resourcePriority||null,recordedChoiceCost:completePrices?recordedChoiceCost:null}};
  }
  root.CM_YEAR_ENDING={analyze};
})(typeof window!=='undefined'?window:globalThis);
