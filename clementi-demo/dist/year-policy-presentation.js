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
  // Each annual case has a distinct subject. The two entries describe community
  // coordination and contracted service; capital policies always stage a build.
  const cases={
    1:{
      chen:['access','maintenance','home-adaptation','route-west',pair('家门与雨天出行','Home access and rainy-day trips')],
      students:['access','access','clear-route','crossing-b',pair('共用无障碍路线','A shared accessible route')],
      lin:['access','access','pushchair-route','crossing-b',pair('推车的连续接驳','A continuous route for pushchairs')],
      ali:['consultation','maintenance','lighting','void',pair('夜间照明与导向','Night-time lighting and wayfinding')],
      kumar:['care','maintenance','pickup','room-b',pair('家门与接送的衔接','Connecting the home to the pickup point')],
      rahman:['access','access','rest-route','route-west',pair('平缓路线与休息处','Gentler routes and places to rest')]
    },
    2:{
      chen:['consultation','consultation','housing','room',pair('本人愿意的适老住屋选择','Age-friendly housing choices the resident wants')],
      students:['consultation','consultation','tenancy','room',pair('租住变化与提前安排','Tenancy changes and advance planning')],
      lin:['consultation','consultation','housing-budget','room',pair('家庭住房与实际负担','Family housing and everyday costs')],
      ali:['consultation','consultation','housing-journey','room',pair('租金与上班的完整开支','Rent and the full cost of getting to work')],
      kumar:['consultation','consultation','housing-care','room',pair('住屋与照护服务的区别','Housing and the scope of care services')],
      rahman:['consultation','consultation','retirement','room',pair('留居、搬迁与退休安排','Staying, moving and retirement arrangements')]
    },
    3:{
      chen:['consultation','consultation','policy-explanation','room',pair('融合政策与个案处境','Integration policy and individual circumstances')],
      students:['community','community','new-neighbours','void-b',pair('短期住户的参与','Participation by shorter-term residents')],
      lin:['consultation','consultation','housing-family','room',pair('家庭选房与亲人支持','Family housing choices and support nearby')],
      ali:['community','community','different-routines','void-b',pair('不同日程里的邻里交流','Neighbourly contact across different schedules')],
      kumar:['consultation','consultation','individual-case','room',pair('个别家庭的政策核对','Checking an individual household’s circumstances')],
      rahman:['consultation','consultation','sale-support','room',pair('出售限制与个案支持','Sale restrictions and individual support')]
    },
    4:{
      chen:['mediation','consultation','shared-rest','void-b',pair('停留与活动的空间共用','Sharing space for rest and activities')],
      students:['community','consultation','flexible-space','void-b',pair('租户也使用的多用途空间','Flexible spaces used by tenants too')],
      lin:['community','consultation','children-space','garden',pair('儿童活动与公共空间','Children’s activities and shared space')],
      ali:['consultation','consultation','phasing','room',pair('更新施工与现有用途的衔接','Phasing renewal around existing uses')],
      kumar:['care','consultation','inclusive-garden','garden',pair('未到场者与自主使用的需要','Absent voices and independent use')],
      rahman:['consultation','consultation','public-investment','room',pair('公共投入与设施互补','Public investment and complementary facilities')]
    },
    5:{
      chen:['environment','environment','cooling','void',pair('楼体与公共区域降温','Cooling buildings and shared areas')],
      students:['community','environment','vegetation','garden',pair('植被与活动边界','Vegetation and activity boundaries')],
      lin:['mediation','environment','shade','garden',pair('活动区的日晒与遮荫','Sun and shade in the activity area')],
      ali:['mediation','environment','cooling-energy','void-b',pair('避热空间与能源使用','Cool spaces and energy use')],
      kumar:['care','environment','accessible-greenery','garden',pair('能到达、能停留的绿地','Green spaces people can reach and use')],
      rahman:['community','environment','roof-greenery','garden',pair('共享绿化与照顾责任','Shared greenery and responsibility for upkeep')]
    },
    6:{
      chen:['environment','environment','recycling','void',pair('旧电器与分类回收','Old appliances and separate recycling streams')],
      students:['environment','environment','solar','void-b',pair('屋顶太阳能与公共用电','Rooftop solar and communal electricity')],
      lin:['environment','environment','rainwater','garden',pair('雨水收集与公共用水','Rainwater collection and communal water use')],
      ali:['community','access','green-mobility','crossing-b',pair('绿色出行与不同使用者','Green mobility for different users')],
      kumar:['care','maintenance','lift-energy','void',pair('电梯效率与运行保障','Lift efficiency and reliable operation')],
      rahman:['access','maintenance','smart-lighting','void',pair('感应照明的使用与检修','Using and maintaining sensor lighting')]
    },
    7:{
      chen:['consultation','consultation','renewal','room',pair('新建设施与旧区日常','New facilities and life in the existing estate')],
      students:['consultation','consultation','ecology','garden',pair('发展范围与生态连接','Development limits and ecological connections')],
      lin:['access','consultation','housing-phasing','room',pair('新增住房与日常配套','Additional housing and everyday amenities')],
      ali:['community','maintenance','operations','void-b',pair('发展方案的运营与维护','Operating and maintaining the development')],
      kumar:['care','consultation','service-capacity','room-b',pair('住房增加后的服务承接','Service capacity as housing grows')],
      rahman:['consultation','consultation','land-phasing','room',pair('候选用地与分期安排','Alternative sites and phased arrangements')]
    }
  };
  const urgent={
    lift:['care','maintenance','lift-access','void',['chen','lin'],pair('电梯停运期间的出行','Getting around during lift replacement')],
    dengue:['environment','environment','drainage','garden',['lin','kumar'],pair('清理积水与公共环境','Standing water and the shared environment')],
    flood:['access','maintenance','drainage','crossing-b',['chen','lin'],pair('暴雨后的安全通行','Safe access after heavy rain')],
    heat:['care','environment','cooling','void-b',['chen','ali'],pair('高温期间的清凉休息','Cool places to rest during hot weather')],
    fire:['care','consultation','temporary-housing','room-b',['lin','rahman'],pair('临时安置与修缮联系','Temporary accommodation and repair contacts')],
    layoff:['consultation','consultation','employment','room',['lin','kumar'],pair('就业与临时援助联系','Employment and interim support contacts')],
    hawker:['community','community','temporary-meeting','void-b',['chen','rahman','students'],pair('翻新期间的临时聚脚点','A temporary meeting place during renewal')],
    fall:['care','care','check-in','room-b',['chen','rahman'],pair('独居住户的问候与联系','Check-ins and contact for residents living alone')],
    bus:['community','access','school-journey','crossing-b',['lin'],pair('上学接送与结伴安排','School journeys and travelling together')],
    noise:['mediation','mediation','quiet-hours','void-b',['students','ali','lin'],pair('装修期间的邻里协调','Neighbourly arrangements during renovation')],
    scam:['community','consultation','scam-awareness','room',['chen','rahman'],pair('可疑来电的信息核实','Checking information about suspicious calls')],
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
    const emergency=urgent[urgentKey],normal=cases[year]?.[policy.residentId],spec=emergency||normal;
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
