(function(root){
  'use strict';
  const pair=(zh,en)=>({zh,en});
  const source=(label,english,url)=>({label:pair(label,english),url});
  const urls={
    history:'https://www.sg101.gov.sg/resources/archives/clementi/',
    northarc:'https://www.hdb.gov.sg/-/media/hdb-pulse/news/2025/whampoa-park-bags-hdbs-inaugural-landscape-award/20250919-Annex.pdf',
    emerald:'https://assets.hdb.gov.sg/residential/buying-a-flat/finding-a-flat/sales-brochure/25JULBTO_pdf_selection/clementi_emerald.pdf',
    market:'https://www.nea.gov.sg/docs/default-source/hawker-centres-documents/list-of-hcs_19-mar-2025.pdf',
    nature:'https://www.nparks.gov.sg/news/news-detail/nparks-announces-new-clementi-nature-corridor',
    clinic:'https://www.moh.gov.sg/newsroom/clementi-polyclinic-to-be-redeveloped-at-new-site-by-2027-new-polyclinic-in-taman-jurong-area-by-2028_1jun2022/',
    care:'https://www.moh.gov.sg/newsroom/enhancing-quality-and-coordination-of-care/',
    sup:'https://www.hdb.gov.sg/hdb-pulse/news/2026/close-to-29000-hdb-households-to-benefit-from-upgrading-projects-to-enhance-their-neighbourhoods',
    rail:'https://www.lta.gov.sg/content/ltagov/en/newsroom/2025/7/news-releases/construction_begins_on_crl2.html',
    planning:'https://www.hdb.gov.sg/hdb-pulse/news/2026/revised-plans-for-sunset-way-and-gillman-barracks-to-integrate-new-homes-with-more-greenery'
  };
  const history=[
    {id:'before',label:pair('成镇之前','Before the town'),title:pair('从甘榜与农地开始','Kampongs and farmland'),art:'history',body:pair('这里曾有甘榜、农地和家庭式小作坊，后来逐步发展为公共住房市镇。','Kampongs, farmland and cottage industries preceded the public-housing town.'),sources:[source('成镇历史 · SG101','Town history · SG101',urls.history)]},
    {id:'new-town',label:pair('1975–1979','1975–1979'),title:pair('HDB第八个新镇','HDB’s eighth new town'),art:'homes',body:pair('金文泰主要在这几年开发。较早开始的组屋建设，构成了今天成熟市镇的基础。','Clementi was mainly developed in these years, establishing the foundation of today’s mature town.'),sources:[source('新镇发展 · SG101','Town development · SG101',urls.history)]},
    {id:'centre',label:pair('2011','2011'),title:pair('镇中心加入综合发展','An integrated town centre'),art:'market',body:pair('Clementi Mall所在项目整合公共住房、商业设施与巴士转换站，为原有市镇加入新设施。','The Clementi Mall development combined public housing, shops and a bus interchange within the established town.'),sources:[source('镇中心发展 · SG101','Town-centre development · SG101',urls.history)]}
  ];
  const existing=[
    {id:'homes',label:pair('新旧住宅','Old and new homes'),title:pair('成熟街区，也有新增住房','New homes in a mature town'),art:'homes',body:pair('较早形成的组屋街区与已建成的NorthArc并存。2025年推出的Emerald规划753套组屋及幼儿园、食肆等配套。','Established blocks coexist with completed NorthArc. Emerald, launched in 2025, plans 753 flats with a preschool and other amenities.'),sources:[source('NorthArc · HDB','NorthArc · HDB',urls.northarc),source('Emerald规划 · HDB','Emerald plans · HDB',urls.emerald)]},
    {id:'food',label:pair('市场日常','Market life'),title:pair('第448座，镇中心的生活地标','Block 448, a town-centre landmark'),art:'market',body:pair('Clementi Avenue 3的第448座市场与熟食中心，与周边商铺和Clementi Mall共同构成镇中心的日常商业环境。','Block 448 Market and Food Centre on Clementi Avenue 3 sits alongside local shops and Clementi Mall in the town centre.'),sources:[source('市场名录 · NEA','Market directory · NEA',urls.market),source('镇中心背景 · SG101','Town-centre background · SG101',urls.history)]},
    {id:'nature',label:pair('林地连接','Woodland links'),title:pair('绿地之间，也有重要的联系','Connections between green spaces'),art:'nature',body:pair('Clementi、Maju和Toh Tuck林地与铁道走廊，属于金文泰自然廊道关注的生态网络，支持绿地间的野生动物活动。','Clementi, Maju and Toh Tuck woodlands and the Rail Corridor form part of the ecological network addressed by the Clementi Nature Corridor.'),sources:[source('自然廊道 · NParks','Nature Corridor · NParks',urls.nature)]},
    {id:'clinic',label:pair('公共设施','Public facilities'),title:pair('公共服务，也在逐步更新','Public facilities are being renewed'),art:'clinic',body:pair('1980年开设的金文泰综合诊疗所将迁址重建，扩大空间并改善适老与无障碍设施。最新安排列入2030年前重建名单。','Opened in 1980, Clementi Polyclinic is being redeveloped at a new site with more space and accessible facilities. The latest schedule lists redevelopment by 2030.'),sources:[source('诊疗所背景 · MOH','Polyclinic background · MOH',urls.clinic),source('2026年更新 · MOH','2026 update · MOH',urls.care)]}
  ];
  const challenges=[
    {id:'facilities',label:pair('设施更新','Facility renewal'),title:pair('较早建成的设施，要跟上今天的需要','Older facilities need to meet today’s needs'),art:'clinic',body:pair('卫生部将原金文泰综合诊疗所列为较旧、较小的诊疗所之一。迁址重建回应空间和使用条件的更新需要。','MOH describes the original Clementi Polyclinic as one of the oldest and smallest. Redevelopment addresses space and accessibility needs.'),metrics:[{value:pair('1980 → 2030','1980 → 2030'),label:pair('原所开设 → 最新重建目标','Original opening → latest redevelopment target')}],sources:[source('设施情况 · MOH','Facility background · MOH',urls.clinic),source('最新时间安排 · MOH','Latest schedule · MOH',urls.care)]},
    {id:'ageing',label:pair('适老环境','Age-friendly spaces'),title:pair('适老化，是明确的更新方向','Age-friendly renewal is a local priority'),art:'access',body:pair('HDB在2026年宣布，面向长者的SUP将扩展至金文泰。具体项目与时间待公布；更新也要兼顾其他年龄层的使用。','HDB announced in 2026 that SUP will extend to Clementi. Project details and timing are pending; renewal also needs to serve other age groups.'),metrics:[{value:pair('SUP','SUP'),label:pair('已宣布扩展至金文泰','Announced expansion to Clementi')}],sources:[source('适老更新 · HDB','Age-friendly renewal · HDB',urls.sup)]},
    {id:'rail',label:pair('持续建设','Ongoing construction'),title:pair('在已经运作的市镇里，继续建设','Building within a town already in use'),art:'rail',body:pair('跨岛线第二阶段已动工，金文泰将成为换乘站。增建和改造需与现有车站、住宅和日常使用衔接。','CRL Phase 2 construction has begun. Clementi will become an interchange, with additions and alterations alongside existing station use and homes.'),metrics:[{value:pair('2025 → 2032','2025 → 2032'),label:pair('工程动工 → 目标开放','Construction begins → target opening')}],sources:[source('跨岛线工程 · LTA','Cross Island Line works · LTA',urls.rail)]},
    {id:'planning',label:pair('住房与生态','Housing and ecology'),title:pair('增加住房，也要考虑森林保留','Housing needs and woodland retention'),art:'planning',body:pair('Sunset Way的Maju Forest修订概念方案，结合住房需要、环境研究与公众反馈。以下数字属于2026年10月公布的规划。','The revised Maju Forest concept at Sunset Way considers housing needs, environmental studies and public feedback. These are October 2026 planning figures.'),metrics:[{value:pair('约4,000套','~4,000 flats'),label:pair('拟建公共住房','Proposed public homes')},{value:pair('约45%','~45%'),label:pair('研究范围保留绿地（约10公顷）','Study area retained as greenery (~10 ha)')}],sources:[source('修订规划 · HDB','Revised plans · HDB',urls.planning)]}
  ];
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(tab,selection,language){
    const t=value=>value[language==='en'?'en':'zh']||value.zh;
    const records=tab==='history'?history:tab==='existing'?existing:challenges;
    const current=typeof selection==='number'?records[Math.max(0,Math.min(records.length-1,selection))]:records.find(item=>item.id===selection)||records[0];
    const action=tab==='history'?'history-step':tab==='existing'?'amenity':'challenge';
    const selectionHTML=records.map((item,index)=>'<button type="button" class="flow-context-choice '+(item===current?'selected':'')+'" data-flow-action="'+action+'" '+(action==='amenity'?'data-id="'+item.id+'"':'data-index="'+index+'"')+' aria-pressed="'+(item===current)+'">'+(tab==='history'?'<i aria-hidden="true"></i>':'')+'<span>'+escape(t(item.label))+'</span></button>').join('');
    const art=root.CM_COMMUNITY_ART?.render?.(current.art)||'';
    return '<div class="flow-context-options '+(tab==='history'?'is-timeline':'')+'" aria-label="'+escape(t(pair('选择背景主题','Choose a background topic')))+'">'+selectionHTML+'</div><article class="flow-context-story" aria-live="polite"><div class="flow-context-art">'+art+'<span>'+escape(t(pair('像素示意','Pixel illustration')))+'</span></div><h3>'+escape(t(current.title))+'</h3><p>'+escape(t(current.body))+'</p>'+(current.metrics?'<dl class="flow-context-metrics">'+current.metrics.map(metric=>'<div><dt>'+escape(t(metric.label))+'</dt><dd>'+escape(t(metric.value))+'</dd></div>').join('')+'</dl>':'')+'<div class="flow-context-sources">'+current.sources.map(ref=>'<a class="flow-source-link" href="'+escape(ref.url)+'" target="_blank" rel="noopener noreferrer">'+escape(t(ref.label))+' <span aria-hidden="true">↗</span></a>').join('')+'</div></article><p class="flow-context-note">'+escape(t(pair('资料截至2026年11月 · 详细出处见「内容从哪里来」','Sources checked November 2026 · Details in “Where the content comes from”')))+'</p>';
  }
  root.CM_COMMUNITY_INTRO={render};
})(typeof window!=='undefined'?window:globalThis);
