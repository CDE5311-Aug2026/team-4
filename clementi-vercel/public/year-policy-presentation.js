/* Presentation-only descriptions for every policy. These do not decide results,
 * eligibility, spending or construction; the rules engine remains authoritative. */
(function(root){
  'use strict';
  const pair=(zh,en)=>({zh,en});
  const residents=['chen','students','lin','ali','kumar','rahman'];
  const assetSites={cover:'route-west',ramp:'crossing-b',corner:'void-b',aac:'room-b',child:'garden',appeal:'room',ease:'void',nrp:'garden'};
  const familySites={build:'void-b',mediation:'void-b',consultation:'room',care:'room-b',community:'void-b',access:'crossing-b',maintenance:'void',environment:'garden'};
  const familyStages={
    build:[pair('核对现场与施工范围','Checking the site and work area'),pair('按方案施工与更新','Building and updating the selected project'),pair('完成本次工程并交接','Handing over this stage of work')],
    mediation:[pair('相关居民到场','The neighbours involved arrive'),pair('轮流说明与协调安排','Hearing each side and discussing arrangements'),pair('记录约定与后续跟进','Recording the arrangement and follow-up')],
    consultation:[pair('当事人与工作人员到场','The household meets the adviser'),pair('核对资料和具体选择','Reviewing information and available choices'),pair('说明下一步与联系方式','Explaining the next step and contact details')],
    care:[pair('住户与支持人员会合','The household meets support staff'),pair('确认日常支持与联系安排','Reviewing everyday support and contact arrangements'),pair('登记后续跟进','Recording the follow-up')],
    community:[pair('参与住户会合','Participating neighbours come together'),pair('共同商议与使用公共空间','Discussing and trying the shared arrangements'),pair('记录使用和联系安排','Recording use and contact arrangements')],
    access:[pair('在出行现场会合','Meeting at the route'),pair('沿路线核对接驳与障碍','Checking connections and obstacles along the way'),pair('演示本次通行安排','Trying the access arrangement')],
    maintenance:[pair('工作人员与住户到场','Workers meet the household on site'),pair('检查与处理维护项目','Inspecting and carrying out the maintenance task'),pair('复核使用与交接','Checking use and handing over')],
    environment:[pair('到现场核对实际使用','Checking how the place is used'),pair('检查环境与资源安排','Reviewing the environment and resource arrangements'),pair('记录使用和持续维护','Recording use and ongoing upkeep')]
  };
  // Each annual case follows this branch's original needs (one per household and
  // year). The two entries describe community coordination and contracted
  // service; capital policies always stage a build. Years without a specific
  // need for a household use that household's ongoing concern in `generic`.
  const cases={
    1:{
      chen:['access','maintenance','rain-route','route-west',pair('雨天去食阁的那段路','The walk to the hawker centre in the rain')],
      students:['mediation','community','shared-hours','void-b',pair('相聚空间与邻居的休息时间','A place to meet and the neighbours’ rest hours')]
    },
    2:{
      lin:['care','access','pickup','crossing-b',pair('接送与儿童活动支持','School pickups and activities for children')],
      ali:['mediation','maintenance','quiet-hours','void-b',pair('轮班后的安静时段','Quiet hours after a night shift')]
    },
    3:{
      kumar:['consultation','care','care-referral','room-b',pair('正式照护服务的联系与申请','Contacting and applying for formal care services')],
      rahman:['community','community','daytime-gathering','void-b',pair('退休后白天的去处','Somewhere to go during the day after retiring')]
    },
    4:{
      ali:['community','consultation','first-aid','room',pair('急救与求助的正式途径','Formal first-aid and help channels')],
      rahman:['consultation','consultation','housing','room',pair('清楚可信的换房咨询','Clear, trustworthy advice on changing flats')]
    },
    5:{
      chen:['access','maintenance','level-route','crossing-b',pair('路线与入口的高差','Steps and level changes on the route and entrance')],
      students:['community','community','new-neighbours','void-b',pair('新租户与社区习惯','New tenants and neighbourhood routines')]
    },
    6:{
      chen:['community','community','meeting-place','void-b',pair('和老朋友见面的地方','A place to meet old friends')],
      lin:['access','care','after-school','garden',pair('课后活动空间与安全路线','After-school space and a safe route')]
    },
    7:{
      lin:['community','care','youth-space','garden',pair('孩子的课余去处','Somewhere for growing children after school')],
      rahman:['community','environment','chess-table','garden',pair('楼下的棋桌与休息处','The chess table and resting spot downstairs')]
    }
  };
  const generic={
    chen:['community','care','familiar-life','void-b',pair('在熟悉的社区安心生活','Living at ease in a familiar neighbourhood')],
    students:['community','community','mutual-understanding','void-b',pair('学生与邻居互相了解','Students and neighbours getting to know each other')],
    lin:['care','care','family-support','room-b',pair('家庭生活与附近支持','Family life and support nearby')],
    ali:['mediation','mediation','routines','void-b',pair('不同作息的互相体谅','Making room for different routines')],
    kumar:['care','care','care-support','room-b',pair('家里照护支持的衔接','Keeping care support at home connected')],
    rahman:['consultation','consultation','future-housing','room',pair('往后的住屋安排与联系途径','Future housing plans and who to contact')]
  };
  const urgent={
    dengue:['environment','environment','drainage','garden',['lin','kumar'],pair('清理积水与公共环境','Standing water and the shared environment')],
    flood:['access','maintenance','drainage','crossing-b',['chen','lin'],pair('暴雨后的安全通行','Safe access after heavy rain')],
    heat:['care','environment','cooling','void-b',['chen','ali'],pair('高温期间的清凉休息','Cool places to rest during hot weather')],
    fire:['care','consultation','temporary-housing','room-b',['lin','rahman'],pair('临时安置与修缮联系','Temporary accommodation and repair contacts')],
    haze:['care','maintenance','indoor-air','room-b',['chen','kumar','lin'],pair('烟霾期间的室内支持','Indoor support during haze')]
  };
  function subjectFromTitle(policy){const title=String(policy.title||policy.issueTitle||'');return pair(title||'本次公共安排',title||'This public arrangement');}
  function fallbackFamily(policy){
    const words=[policy.title,policy.issueTitle,policy.description,policy.issueNeed].filter(Boolean).join(' ');
    if(/调解|安静|作息|噪音|mediate|mediation|quiet|noise/i.test(words))return 'mediation';
    if(/照护|探访|问候|care|check.?in|befriend/i.test(words))return 'care';
    if(/回收|雨水|太阳能|生态|绿化|recycl|rainwater|solar|ecolog|greenery/i.test(words))return 'environment';
    if(/检修|维护|照明|电梯|repair|maintain|lighting|lift/i.test(words))return 'maintenance';
    if(/路线|无障碍|接驳|接送|通行|access|route|journey/i.test(words))return 'access';
    if(/住房|咨询|资料|退休|housing|consult|retire|information/i.test(words))return 'consultation';
    return policy.policyId==='community'||policy.id==='community'?'community':'consultation';
  }
  function participantsFor(id,family){
    if(!residents.includes(id))return ['chen','lin'];
    const related={chen:['lin','rahman'],students:['ali','lin'],lin:['chen','students'],ali:['students','chen'],kumar:['lin','rahman'],rahman:['chen','students']};
    const extra=family==='community'?related[id]:family==='mediation'?[related[id][0]]:family==='access'?[id==='lin'?'chen':'lin']:[];
    return [...new Set([id,...extra])];
  }
  function describe(policy={}){
    const policyId=policy.policyId||policy.id||'community',capital=policyId==='capital'||policy.kind==='build';
    const year=Number(policy.year)||Number(String(policy.issueId||'').match(/^y(\d+)-/)?.[1])||1;
    const urgentKey=String(policy.urgentKey||String(policy.residentId||'').replace(/^urgent-/,''));
    const emergency=urgent[urgentKey],normal=cases[year]?.[policy.residentId]||generic[policy.residentId],spec=emergency||normal;
    const family=capital?'build':spec?spec[policyId==='service'?1:0]:fallbackFamily(policy);
    const activity=spec?.[2]||'shared-arrangement';
    let site=capital?(policy.plotId||assetSites[policy.assetId]||assetSites[policy.visual]):spec?.[3];
    // An adviser meets a single household at the desk; access and support happen
    // at the route or support room. This avoids moving every task to one spot.
    if(!capital&&family==='consultation')site='room';
    if(!capital&&family==='care')site='room-b';
    if(!site)site=familySites[family]||'void-b';
    const participants=emergency?emergency[4].slice():participantsFor(policy.residentId,family);
    const subject=emergency?emergency[5]:normal?normal[4]:subjectFromTitle(policy);
    const stages=familyStages[family].map(stage=>({...stage}));
    return {family,activity,site,participants,stages,subject:{...subject},capital,year,urgentKey:emergency?urgentKey:null,representative:!!emergency,result:String(policy.result||'')};
  }
  root.CM_YEAR_PRESENTATION={describe};
})(typeof window!=='undefined'?window:globalThis);
