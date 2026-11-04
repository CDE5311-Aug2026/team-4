(function (root) {
  'use strict';
  const doc = root.document;
  const copy = (zh,en) => ({zh:zh,en:en});
  const content = {
    clementi: { name:copy('金文泰','Clementi'), tag:copy('已建成的老镇','An established town'), point:[103.765,1.315], available:true,
      intro:copy('金文泰位于新加坡西南部，镇中心集中了组屋、巴刹熟食中心、综合诊疗所与地铁巴士服务。','Clementi is in south-western Singapore. Public housing, a market and food centre, a polyclinic, and MRT and bus services come together in its town centre.'),
      facts:[copy('金文泰地铁站 EW23，连接巴士与日常商业设施。','Clementi MRT (EW23), with bus connections and everyday shops.'),copy('金文泰购物中心于2011年启用，整合住房、商业和巴士转换站。','Clementi Mall opened in 2011 as an integrated development combining housing, retail and a bus interchange.'),copy('镇中心还有巴刹熟食中心与综合诊疗所。','The town centre also has a market and food centre and a polyclinic.')] },
    punggol: { name:copy('榜鹅','Punggol'), tag:copy('新镇与年轻家庭','A newer town and young families'),point:[103.902,1.405],available:false,
      intro:copy('榜鹅是企划中已确定的另外一个案例，方向是新镇与年轻家庭的日常。目前尚未实现可玩内容。','Punggol is one of the three selected settings in the project, focusing on newer neighbourhoods and young families. This case is not yet playable.'),
      facts:[copy('关注新镇家庭的日常与公共设施。','The case focuses on family life and shared amenities in a newer town.')] },
    geylang: { name:copy('芽笼','Geylang'),tag:copy('多元而流动的社区','A diverse and changing community'),point:[103.886,1.318],available:false,
      intro:copy('芽笼是企划中已确定的第三个案例，方向是多元居民与较高流动性的社区。目前尚未实现可玩内容。','Geylang is the third selected setting, focusing on a diverse community with greater resident turnover. This case is not yet playable.'),
      facts:[copy('关注不同背景、不同居住时长居民的相处。','The case explores how neighbours with different backgrounds and lengths of stay share everyday life.')] }
  };
  let detailTab='history',historyStep=0,selectedAmenity='food',selectedAge=null,selectedPerson='chen',selectedChallenge=0;
  let options={},element=null,active=false,view='loading',language='zh',selected='clementi',transitioning=false,poll=null,loadStarted=0,sceneFailure='',fallback=false,changingLanguage=false;
  function buildingShape(x,y,w,h,color){return '<g><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+color+'"/><rect x="'+(x-3)+'" y="'+(y-4)+'" width="'+(w+6)+'" height="6" fill="#f0ddbb"/>'+Array.from({length:Math.max(1,Math.floor(h/17))},(_,r)=>Array.from({length:Math.max(1,Math.floor(w/14))},(_,c)=>'<rect x="'+(x+5+c*14)+'" y="'+(y+7+r*17)+'" width="7" height="9" fill="'+((r+c)%3?'#edca83':'#4a5767')+'"/>').join('')).join('')+'</g>';}
  function neighbourhoodPicture(stage){return '<svg viewBox="0 0 620 230" aria-hidden="true" class="flow-pixel-neighbourhood"><defs><linearGradient id="flow-research-sky" x2="0" y2="1"><stop stop-color="#796b85"/><stop offset="1" stop-color="#e6ac89"/></linearGradient></defs><rect width="620" height="230" fill="url(#flow-research-sky)"/><rect y="155" width="620" height="75" fill="#89987e"/><path d="M0 202H620M420 160V230" stroke="#636777" stroke-width="22"/><path d="M0 202H410M433 202H620" stroke="#d9d1bd" stroke-width="2" stroke-dasharray="12 12"/>'+buildingShape(40,66,84,99,'#b9aaa9')+buildingShape(150,87,105,78,'#d2b8a4')+buildingShape(475,51,83,114,'#c38d7b')+(stage>0?buildingShape(280,32,70,133,'#a9bbb0'):'')+'<rect x="290" y="146" width="103" height="32" fill="#e3bc8e"/><path d="M278 148L339 123L405 148Z" fill="#bc7558"/><rect x="309" y="156" width="16" height="22" fill="#5e7774"/><rect x="340" y="155" width="37" height="12" fill="#4c5e69"/><g class="flow-picture-walker"><rect x="130" y="178" width="10" height="14" fill="#466d76"/><rect x="131" y="170" width="8" height="8" fill="#d7a47f"/><path d="M132 192V198M138 192V198" stroke="#28374b" stroke-width="3"/></g>'+(stage>1?'<rect x="235" y="175" width="43" height="5" fill="#70a59a"/><rect x="240" y="180" width="3" height="14" fill="#ede1c7"/><rect x="271" y="180" width="3" height="14" fill="#ede1c7"/>':'')+'<circle cx="578" cy="133" r="19" fill="#5e805f"/><rect x="575" y="145" width="6" height="30" fill="#856b5b"/></svg>';}
  function sectionHeading(icon, title, subtitle) {
    return '<div class="flow-section-heading"><span class="flow-section-icon" aria-hidden="true">' + icon +
      '</span><div><h2>' + escape(title) + '</h2><p>' + escape(subtitle) + '</p></div></div>';
  }
  function sourceLinks(keys) {
    const links = keys.map(key => {
      const source = root.CM_COMMUNITY.sources[key];
      return '<a class="flow-source-link" href="' + escape(source.url) +
        '" target="_blank" rel="noopener noreferrer">' + escape(t(source.title)) + ' ↗</a>';
    });
    return '<div class="flow-fact-sources">' + links.join('') + '</div>';
  }
  function historyPanel() {
    const steps = root.CM_COMMUNITY.profile.history;
    const current = steps[historyStep];
    const years = steps.map((step, index) => button('history-step', step.year, historyStep === index ? 'selected' : '',
      'data-index="' + index + '" aria-pressed="' + (historyStep === index) + '"'));
    return sectionHeading('◷', text('历史', 'History'), text('从新镇开发到镇中心发展', 'From the new town to its town centre')) +
      '<figure class="flow-fact-picture">' + neighbourhoodPicture(historyStep) +
      '<figcaption>' + text('历史街景插画', 'Illustration of the townscape') + '</figcaption></figure>' +
      '<div class="flow-history-buttons">' + years.join('') + '</div>' +
      '<div class="flow-fact-copy" aria-live="polite"><h3>' + escape(t(current.title)) + '</h3><p>' +
      escape(t(current.body)) + '</p></div>' + sourceLinks(current.sources);
  }
  function existingPanel() {
    const hotspots = root.CM_COMMUNITY.profile.conditions;
    const chosen = hotspots[selectedAmenity];
    const pins = Object.entries(hotspots).map(([id, spot]) => {
      const label = escape(t(spot.name));
      return '<button class="flow-amenity-pin ' + (id === selectedAmenity ? 'selected' : '') +
        '" style="left:' + spot.left + '%;top:' + spot.top + '%" data-flow-action="amenity" data-id="' + id +
        '" title="' + label + '" aria-label="' + label + '" aria-pressed="' + (id === selectedAmenity) + '">' + spot.icon + '</button>';
    });
    return sectionHeading('⌂', text('现有情况', 'Existing conditions'), text('住房、公共交通与日常设施', 'Housing, transport and everyday amenities')) +
      '<figure class="flow-fact-picture"><div class="flow-amenity-map">' + neighbourhoodPicture(2) + pins.join('') +
      '</div><figcaption>' + text('街景插画 · 点击图标查看各项设施', 'Townscape illustration · Select an icon to explore an amenity') + '</figcaption></figure>' +
      '<div class="flow-fact-copy" aria-live="polite"><h3>' + escape(t(chosen.name)) + '</h3><p>' +
      escape(t(chosen.body)) + '</p></div>' + sourceLinks(chosen.sources);
  }
  function challengesPanel() {
    const items = root.CM_COMMUNITY.profile.challenges;
    const item = items[selectedChallenge];
    const controls = items.map((challenge, index) =>
      '<button class="flow-challenge ' + (index === selectedChallenge ? 'selected' : '') +
      '" data-flow-action="challenge" data-index="' + index + '" aria-pressed="' + (index === selectedChallenge) +
      '"><span aria-hidden="true">' + challenge.icon + '</span>' + escape(t(challenge.title)) + '</button>');
    return sectionHeading('◇', text('现实挑战', 'Current challenges'),
      text('老住区更新、轨道工程和公共空间', 'Estate renewal, rail construction and shared space')) +
      '<div class="flow-challenge-options">' + controls.join('') + '</div>' +
      '<div class="flow-fact-copy flow-challenge-detail" aria-live="polite"><p>' + escape(t(item.body)) +
      '</p><p>' + escape(t(item.response)) + '</p></div>' + sourceLinks(item.sources);
  }
  function demographicsPanel() {
    const data = root.CM_COMMUNITY.demographics;
    const chosen = data.ageGroups.find(group => group.id === selectedAge);
    const ageLabel = group => language === 'en' ? group.labelEn : group.label;
    const formatCount = count => count.toLocaleString('en-US');
    const bars = data.ageGroups.map(group => {
      const isSelected = selectedAge === group.id;
      const label = ageLabel(group) + ' · ' + group.percent.toFixed(1) + '% · ≈ ' + formatCount(group.count);
      return '<button class="flow-age-bar ' + (isSelected ? 'selected' : '') +
        '" data-flow-action="age-group" data-id="' + group.id + '" aria-pressed="' + isSelected +
        '" aria-label="' + escape(label) + '"><span>' + escape(ageLabel(group)) + '</span><i aria-hidden="true"><b style="width:' +
        (group.percent / 30 * 100) + '%"></b></i><strong>' + group.percent.toFixed(1) + '%</strong><small>≈ ' +
        formatCount(group.count) + '</small></button>';
    });
    const current = chosen
      ? text(ageLabel(chosen) + '的居民约有' + formatCount(chosen.count) + '人，占' + chosen.percent.toFixed(1) + '%。',
        'About ' + formatCount(chosen.count) + ' residents in this group, or ' + chosen.percent.toFixed(1) + '% of the area.')
      : text('选择年龄组查看人数与占比。条形刻度上限为30%。', 'Select an age group for its count and share. Bars use a 0–30% scale.');
    return '<section class="flow-demographics">' + sectionHeading('▥', text('居民人口', 'Resident population'),
      text('2026年6月 · 金文泰规划区', 'June 2026 · Clementi Planning Area')) +
      '<p class="flow-population-total"><strong>≈ ' + formatCount(data.total) + '</strong> ' + text('名居民', 'residents') +
      '</p><div class="flow-age-bars">' + bars.join('') + '</div><p class="flow-age-summary" aria-live="polite">' +
      escape(current) + '</p><details class="flow-evidence"><summary>' + text('统计范围与取整说明', 'Scope and rounding') +
      '</summary><p>' + escape(t(data.definition)) + '</p><p>' + escape(t(data.method)) +
      '</p><p>' + escape(t(data.scope)) + ' ' + text('规划区采用 URA Master Plan 2025 的边界。', 'The planning area follows the URA Master Plan 2025 boundary.') +
      '</p></details>' + sourceLinks(['geography', 'definition']) + '</section>';
  }
  function neighboursPanel() {
    const community = root.CM_COMMUNITY;
    const people = Object.values(community.personas);
    const person = community.personas[selectedPerson] || people[0];
    const cards = people.map(profile => '<button class="flow-persona-pick ' + (profile.id === person.id ? 'selected' : '') +
      '" data-flow-action="person" data-id="' + profile.id + '" aria-pressed="' + (profile.id === person.id) +
      '"><span class="flow-persona-thumbnail">' + portrait(profile.id) + '</span><span><strong>' + escape(t(profile.name)) +
      '</strong><small>' + escape(t(profile.role)) + '</small></span></button>');
    const age = person.ageRange ? person.ageRange.join('–') : person.ages ? person.ages.join(' / ') : person.age;
    return '<section class="flow-neighbourhood-people flow-reality-people">' +
      sectionHeading('♟', text('虚构人物', 'Fictional characters'), text('八户角色的日常与家庭背景', 'Eight households and their daily lives')) +
      '<p class="flow-character-notice">' + escape(t(community.disclaimer)) + '</p><div class="flow-persona-grid">' +
      cards.join('') + '</div><section class="flow-persona-detail" aria-live="polite"><div class="flow-persona-heading">' +
      '<div class="flow-persona-art">' + portrait(person.id) + '</div><div><h3>' + escape(t(person.name)) +
      '</h3><span>' + escape(age) + ' ' + text('岁', 'years') + ' · ' + escape(t(person.gender)) +
      '</span><strong>' + escape(t(person.role)) + '</strong></div></div><div class="flow-persona-facts"><span>⌂ ' +
      escape(t(person.home)) + '</span><span>◷ ' + escape(t(person.tenure)) + '</span><span>♟ ' + escape(t(person.family)) +
      '</span></div><p class="flow-persona-routine">' + escape(t(person.routine)) +
      '</p><details class="flow-evidence"><summary>' + text('角色创作说明', 'Character notes') +
      '</summary><p>' + escape(t(person.evidence)) + '</p></details></section></section>';
  }
  function communityDetails() {
    if (selected !== 'clementi' || !root.CM_COMMUNITY?.profile) return details();
    const tabs = [
      ['history', '◷', text('历史', 'History')],
      ['existing', '⌂', text('现有情况', 'Existing conditions')],
      ['challenges', '◇', text('现实挑战', 'Current challenges')],
      ['people', '♟', text('虚构人物', 'Fictional characters')]
    ];
    const controls = tabs.map(([id, icon, label]) =>
      '<button class="flow-detail-tab ' + (id === detailTab ? 'selected ' : '') + (id === 'people' ? 'fiction-tab' : '') +
      '" data-flow-action="detail-tab" data-id="' + id + '" aria-pressed="' + (id === detailTab) +
      '"><span aria-hidden="true">' + icon + '</span>' + label + '</button>');
    const sections = {history:historyPanel, existing:existingPanel, challenges:challengesPanel};
    const body = detailTab === 'people' ? neighboursPanel() : '<div class="flow-research-layout flow-reality-layout">' +
      '<section class="flow-research-panel">' + sections[detailTab]() + '</section>' + demographicsPanel() + '</div>';
    return shell('<main class="flow-details improved-details"><div class="flow-kicker">SINGAPORE · CLEMENTI</div>' +
      '<div class="flow-details-title"><div><h1>' + text('金文泰', 'Clementi') + '</h1><p>' +
      escape(t(root.CM_COMMUNITY.profile.summary)) + '</p></div><span class="flow-case-emblem" aria-hidden="true">⌂</span></div>' +
      '<nav class="flow-detail-tabs" aria-label="' + text('社区资料', 'Community profile') + '">' + controls.join('') +
      '</nav>' + body + '<div class="flow-entry-bottom"><div class="flow-actions">' +
      button('map', text('← 返回地图', '← Back to map'), 'secondary') +
      button('enter', text('进入金文泰游戏 →', 'Enter the Clementi game →'), 'gold') + '</div></div></main>',
      'details-view', text('金文泰社区资料 · 各栏目附来源', 'Clementi community profile · Sources listed in each section'));
  }
  function handleEnhanced(event) {
    const target = event.target.closest('[data-flow-action]');
    if (!target || !element?.contains(target)) return;
    const {flowAction:action,id,index} = target.dataset;
    switch (action) {
      case 'detail-tab': detailTab = id; break;
      case 'history-step': historyStep = Number(index); break;
      case 'amenity': selectedAmenity = id; break;
      case 'challenge': selectedChallenge = Number(index); break;
      case 'person': selectedPerson = id; break;
      case 'age-group': selectedAge = selectedAge === id ? null : id; break;
      default: handle(event); return;
    }
    render();
    const key = id === undefined ? 'data-index="' + index + '"' : 'data-id="' + id + '"';
    element.querySelector?.('[data-flow-action="' + action + '"][' + key + ']')?.focus({preventScroll:true});
  }
  const escape = value => String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t = pair => pair[language] || pair.zh;
  const text = (zh,en) => language==='en'?en:zh;
  const button = (action,label,cls,extra) => '<button class="flow-button '+(cls||'')+'" data-flow-action="'+action+'" '+(extra||'')+'>'+escape(label)+'</button>';
  function switcher(){return '<div class="flow-language" aria-label="Language / 语言">'+button('language','中文',language==='zh'?'selected':'','data-language="zh" aria-pressed="'+(language==='zh')+'"')+button('language','English',language==='en'?'selected':'','data-language="en" aria-pressed="'+(language==='en')+'"')+'</div>';}
  function shell(body,cls,footer=text('金文泰单案例试玩 · 居民与故事均为虚构','Clementi playable prototype · Fictional residents and stories')) {
    return '<div class="flow-inner '+(cls||'')+'"><header class="flow-top"><span class="flow-wordmark">Downstairs <b>·</b> '+
      text('楼下','Clementi')+'</span>'+switcher()+'</header>'+body+'<footer class="flow-footer">'+escape(footer)+'</footer></div>';
  }
  function ensure(){
    if(!doc)return;
    if(!doc.querySelector('[data-entry-style]')&&!Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).some(l=>/\/flow\.css(?:\?|$)/.test(l.href))){const link=doc.createElement('link');link.rel='stylesheet';link.href='flow.css';link.dataset.entryStyle='true';doc.head.appendChild(link);}
    element=doc.getElementById('entry-flow');if(!element){element=doc.createElement('section');element.id='entry-flow';element.dataset.i18nIgnore='true';element.setAttribute('aria-label','Downstairs');doc.body.appendChild(element);element.addEventListener('click',handleEnhanced);element.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role="button"]')){event.preventDefault();event.target.click();}});}
  }
  function sceneState(){
    const err=doc.getElementById('world-error');
    let diag={};try{diag=root.CM_SCENE?.diagnostics?.()||root.HDBScene?.diagnostics?.()||{};}catch(error){diag={error:error.message};}
    const ready=!!(root.HDBScene?.ready||diag.ready);
    const visibleError=err&&!err.hidden?err.textContent.trim():'';
    return {ready:ready,error:diag.error||sceneFailure||visibleError};
  }
  function checks(){const scene=sceneState();return [
    {label:text('页面与界面','Page and interface'),ok:doc.readyState!=='loading'},
    {label:text('游戏与居民资料','Game and resident data'),ok:!!(root.CM_DATA&&root.CM_ENGINE)},
    {label:text('人物与设施插画','Resident and facility artwork'),ok:!!(root.CM_ART||root.GameArt)},
    {label:text('新加坡地理轮廓','Singapore geographic outline'),ok:!!root.CM_SG_MAP?.polygons?.length},
    {label:text('三维社区场景','3D neighbourhood'),ok:scene.ready||fallback,error:scene.error}
  ];}
  function hasSave(){try{return !!options.hasSave?.();}catch{return false;}}
  function loading(){
    const resources=checks(),complete=resources.filter(r=>r.ok).length,scene=sceneState(),coreReady=resources.slice(0,4).every(r=>r.ok);
    const timedOut=Date.now()-loadStarted>12000;
    if(coreReady&&(scene.ready||fallback)){clearInterval(poll);poll=null;view='title';render();return;}
    const broken=!!scene.error||timedOut;
    const issue=scene.error||text('尚未就绪：','Not ready: ')+resources.filter(r=>!r.ok).map(r=>r.label).join('、')+text('。请确认本地文件完整，或重新加载。','. Check the local files or reload.');
    element.innerHTML=shell('<main class="flow-loading"><div class="flow-kicker">DOWNSTAIRS · CLEMENTI</div><h1>'+text('社区正在醒来','The neighbourhood is waking up')+'</h1><p>'+text('正在检查实际资源，准备好后立即进入。','Checking the actual resources. We will continue as soon as they are ready.')+'</p><div class="flow-progress" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="'+complete+'"><i style="width:'+(complete/5*100)+'%"></i></div><ul class="flow-checks">'+resources.map(r=>'<li class="'+(r.ok?'ready':'')+'"><span>'+(r.ok?'✓':'○')+'</span>'+escape(r.label)+'<b>'+text(r.ok?'已就绪':'等待中',r.ok?'Ready':'Waiting')+'</b></li>').join('')+'</ul>'+(broken?'<div class="flow-load-error" role="alert"><strong>'+text('有一项资源未能准备好','A resource could not be prepared')+'</strong><p>'+escape(issue)+'</p><div class="flow-actions">'+button('retry',text('重新检查','Check again'),'secondary')+button('reload',text('重新载入','Reload'),'secondary')+(coreReady&&!scene.ready&&root.CM_WORLD?button('fallback',text('使用二维备用地图','Use the 2D fallback'),'gold'):'')+'</div></div>':'')+'</main>','loading-view');
  }
  function title(){return shell('<main class="flow-title"><div class="flow-kicker">A NEIGHBOURHOOD, ALREADY LIVED IN</div><h1>Downstairs</h1><h2>'+text('楼下，有人生活。','Everyday life, downstairs.')+'</h2><p>'+text('接手一片已经建成的组屋社区。<br>从一封来信、一段路、一次相遇开始。','Take care of a neighbourhood already full of lives.<br>Begin with a letter, a path, a neighbour.')+'</p><div class="flow-title-place">CLEMENTI <span>·</span> '+text('金文泰','SINGAPORE')+'</div><div class="flow-actions">'+button('map',text('开始新游戏 →','Start a new game →'),'gold')+(hasSave()?button('continue',text('继续上次的社区','Continue your neighbourhood'),'secondary'):'')+'</div><small>'+text('三个地点已确定；本次仅金文泰案例可玩。','Three settings are planned. Only Clementi is playable in this prototype.')+'</small></main>','title-view');}
  function geographicMap(){
    const polygons=root.CM_SG_MAP?.polygons||[];
    if(!polygons.length)return '<div class="flow-map-missing">'+text('新加坡地理轮廓尚未载入，请返回标题重新检查。','The Singapore outline is not loaded. Return to the title and check the resources.')+'</div>';
    const pts=polygons.flat().concat(Object.values(content).map(c=>c.point));
    const minX=Math.min(...pts.map(p=>p[0])),maxX=Math.max(...pts.map(p=>p[0])),minY=Math.min(...pts.map(p=>p[1])),maxY=Math.max(...pts.map(p=>p[1]));
    const sx=870/(maxX-minX),sy=410/(maxY-minY),scale=Math.min(sx,sy),offsetX=(1000-(maxX-minX)*scale)/2,offsetY=(550-(maxY-minY)*scale)/2;
    const project=p=>[offsetX+(p[0]-minX)*scale,550-offsetY-(p[1]-minY)*scale];
    const shapes=polygons.map(poly=>'<polygon points="'+poly.map(p=>project(p).map(n=>n.toFixed(2)).join(',')).join(' ')+'"/>').join('');
    const markers=Object.entries(content).map(([id,c])=>{const p=project(c.point),chosen=selected===id,dy=id==='punggol'?-62:23;return '<g class="flow-map-pin '+(chosen?'chosen':'')+' '+(!c.available?'planned':'')+'" role="button" tabindex="0" aria-label="'+escape(t(c.name))+'" data-flow-action="select-case" data-case="'+id+'" transform="translate('+p[0].toFixed(2)+' '+p[1].toFixed(2)+')"><circle class="pin-halo" r="27"/><circle class="pin-core" r="9"/><path d="M0 '+(dy<0?'-10':'10')+' V'+(dy<0?dy+37:dy)+'"/><rect x="-79" y="'+dy+'" width="158" height="39" rx="6"/><text y="'+(dy+25)+'" text-anchor="middle">'+escape(t(c.name))+(c.available?' •':'')+'</text></g>';}).join('');
    return '<svg viewBox="0 0 1000 550" class="flow-geographic-map" role="group" aria-label="'+text('新加坡真实地理轮廓，标有金文泰、榜鹅与芽笼的概略位置','Singapore geographic outline with approximate positions of Clementi, Punggol and Geylang')+'"><defs><linearGradient id="sg-land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#758a75"/><stop offset="1" stop-color="#536c67"/></linearGradient><pattern id="sg-sea" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M0 16H32M16 0V32" stroke="#a7c6cd" stroke-opacity=".055"/></pattern></defs><rect width="1000" height="550" fill="url(#sg-sea)"/><g class="flow-land">'+shapes+'</g><g class="flow-map-compass"><path d="M944 77V30M936 43L944 29L952 43"/><text x="944" y="20" text-anchor="middle">N</text></g>'+markers+'</svg>';
  }
  function map(){const c=content[selected];return shell('<main class="flow-map-view"><div class="flow-map-heading"><div><div class="flow-kicker">SINGAPORE · 3 NEIGHBOURHOODS</div><h1>'+text('选择一片社区','Choose a neighbourhood')+'</h1><p>'+text('地点的位置是真实的；各案例中的街区与居民为游戏示意。','The locations are real. The game neighbourhoods and residents are illustrative.')+'</p></div>'+button('title',text('← 返回标题','← Back to title'),'plain')+'</div><div class="flow-map-layout"><section class="flow-map-board">'+geographicMap()+'<div class="flow-map-legend"><span><i></i>'+text('本次可玩','Playable now')+'</span><span><i class="planned"></i>'+text('案例筹备中','In preparation')+'</span></div><p class="flow-map-source">'+text('真实地理轮廓 · 地点为概略定位','Geographic outline · Approximate location markers')+'</p></section><aside class="flow-case-list">'+Object.entries(content).map(([id,item])=>'<button class="flow-case '+(id===selected?'selected':'')+'" data-flow-action="select-case" data-case="'+id+'"><span><strong>'+escape(t(item.name))+'</strong><b>'+text(item.available?'本次可玩':'筹备中',item.available?'PLAYABLE':'IN PREPARATION')+'</b></span><small>'+escape(t(item.tag))+'</small></button>').join('')+'<div class="flow-case-preview"><h2>'+escape(t(c.name))+'</h2><p>'+escape(t(c.intro))+'</p>'+button('details',text('了解这个社区 →','Explore this neighbourhood →'),'gold')+'</div></aside></div></main>','map-view');}
  function portrait(id){try{return (root.CM_ART?.portrait?.(id)||'').replace(/aria-label="([^"]*)"/g,(_,label)=>'aria-label="'+escape(root.CM_I18N?.t?.(label)||label)+'"');}catch{return '';}}
  function conceptPreview() {
    const catalog = root.CM_ENGINE?.catalogFor?.(selected) || [];
    const cards = catalog.filter(card => card.previewOnly);
    if (!cards.length) return '';
    return '<section class="flow-concept-section">' + sectionHeading('◇', text('设施概念预览', 'Facility concepts'),
      text('本案例筹备中的设计草案', 'Design previews for this upcoming case')) +
      '<div class="flow-concept-grid">' + cards.map(card => {
        const title = language === 'en' ? card.titleEn : card.title;
        const description = language === 'en' ? card.descEn : card.desc;
        return '<article class="flow-concept-card"><small>' + text('概念设施', 'Concept facility') +
          '</small><h3>' + escape(title) + '</h3><p>' + escape(description) + '</p></article>';
      }).join('') + '</div></section>';
  }
  function details() {
    const place = content[selected];
    const label = place.available ? 'CLEMENTI · SINGAPORE' : text('案例筹备中', 'Case in preparation');
    const facts = place.facts.map(fact => '<li>' + escape(t(fact)) + '</li>').join('');
    const description = '<section class="flow-research-panel"><h2>' +
      (place.available ? text('社区资料', 'Community profile') : text('案例方向', 'Case focus')) +
      '</h2><ul class="flow-case-facts">' + facts + '</ul></section>';
    const entry = place.available ? button('enter', text('进入金文泰游戏 →', 'Enter the Clementi game →'), 'gold')
      : button('unavailable', text('案例筹备中', 'Case in preparation'), 'secondary', 'disabled');
    return shell('<main class="flow-details"><div class="flow-kicker">' + escape(label) + '</div><h1>' +
      escape(t(place.name)) + '</h1><p class="flow-intro">' + escape(t(place.intro)) + '</p>' +
      '<div class="flow-legacy-profile">' + description + (place.available ? '' : conceptPreview()) +
      '</div><div class="flow-actions">' + button('map', text('← 返回地图', '← Back to map'), 'secondary') + entry +
      '</div></main>', 'details-view');
  }
  function render(){if(!element)return;ensure();element.hidden=!active;element.setAttribute('lang',language==='en'?'en':'zh-CN');element.className='flow-stage-'+view+(fallback?' is-fallback':'');if(!active)return;if(view==='loading'){loading();return;}element.innerHTML=view==='title'?title():view==='map'?map():view==='details'?communityDetails():shell('<main class="flow-entering"><div class="flow-kicker">'+text('CLEMENTI · 金文泰','CLEMENTI · SINGAPORE')+'</div><h1>'+text('走到楼下','Going downstairs')+'</h1><p>'+text('先听听陈玉英的近况。','Begin by hearing from Mdm Chen.')+'</p></main>','entering-view');}
  function setLanguage(lang){const next=/^en/i.test(lang)?'en':'zh';language=next;if(changingLanguage)return;changingLanguage=true;try{if(root.CM_I18N?.getLanguage?.()!==next)root.CM_I18N?.setLanguage?.(next);}finally{changingLanguage=false;}if(active)render();}
  function enter(resume){if(transitioning)return;transitioning=true;view='entering';render();const reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;root.setTimeout(()=>{active=false;transitioning=false;element.hidden=true;if(fallback){const fallbackEl=doc.getElementById('world');if(fallbackEl)fallbackEl.hidden=false;const sceneEl=doc.getElementById('world-scene');if(sceneEl)sceneEl.hidden=true;}const callback=options.onEnter||(resume?options.onContinue:null);callback?.({caseId:'clementi',resume:!!resume});doc.dispatchEvent(new CustomEvent('cm:entered',{detail:{caseId:'clementi',resume:!!resume}}));},reduced?0:650);}
  function handle(event){const target=event.target.closest('[data-flow-action]');if(!target||!element.contains(target))return;const action=target.dataset.flowAction;if(action==='language'){setLanguage(target.dataset.language);return;}if(action==='select-case'){selected=target.dataset.case;view='map';render();return;}if(action==='map'){showMap();return;}if(action==='details'){view='details';render();return;}if(action==='title'){view='title';render();return;}if(action==='enter'){if(selected==='clementi')enter(false);return;}if(action==='continue'){if(hasSave())enter(true);return;}if(action==='retry'){loadStarted=Date.now();sceneFailure='';view='loading';clearInterval(poll);poll=root.setInterval(()=>{if(active&&view==='loading')loading();},150);render();return;}if(action==='reload'){root.location.reload();return;}if(action==='fallback'){fallback=true;view='title';clearInterval(poll);render();}}
  function showMap(){ensure();active=true;view='map';render();}
  function start(config){options=config||{};ensure();active=true;view='loading';transitioning=false;loadStarted=Date.now();sceneFailure='';try{language=/^en/i.test(root.CM_I18N?.getLanguage?.()||root.CM_I18N?.language||'zh')?'en':'zh';}catch{language='zh';}clearInterval(poll);poll=root.setInterval(()=>{if(active&&view==='loading')loading();},150);render();}
  if(root.addEventListener)root.addEventListener('error',event=>{if(/scene|three|WebGL|context/i.test((event.filename||'')+' '+(event.message||'')))sceneFailure=event.message||text('三维场景资源加载失败。','The 3D scene resource failed to load.');},true);
  if(root.addEventListener)root.addEventListener('localechange',event=>{language=event.detail?.language==='en'?'en':'zh';if(active&&!changingLanguage)render();});
  root.CM_FLOW={start:start,isActive:()=>active,showMap:showMap,setLanguage:setLanguage};
})(typeof window!=='undefined'?window:globalThis);
