(function () {
  'use strict';
  const E = window.Downstairs, A = window.GameArt;
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cardById = Object.fromEntries(E.cards.map(c => [c.id, c]));
  const needs = {'🪑':'Rest','🤝':'Connection','🍜':'Meals','🧒':'Childcare','🚌':'Travel','🎊':'Celebration'};
  const extras = {retrofit:{id:'retrofit',name:'Energy Retrofit',description:'An energy retrofit approved through this decade’s community letters.',needs:[],stars:{green:1}},soundproof:{id:'soundproof',name:'Sound Insulation',description:'Sound insulation for households on the lower floors.',needs:[],stars:{}}};
  const SAVE = 'downstairs-sunset-save-en-v1', PREFS = 'downstairs-sunset-prefs-en-v1';
  let state = E.initialState(), tab = 'facility', selected = null, toastTimer, returnFocus;
  const mailUI = { state: null, id: null, phase: 'closed', timer: null, pending: null };
  const reducedMailMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let prefs = {sound:false,remember:false};
  try { prefs = {...prefs,...JSON.parse(localStorage.getItem(PREFS) || '{}')}; if(prefs.remember){const saved=JSON.parse(localStorage.getItem(SAVE)||'null');if(validSave(saved))state=saved;} } catch (_) { /* Storage can be unavailable in private browsing. */ }
  function ensureScene(){if(!state.scene)state.scene={placed:state.round>1||state.log.length>0,landIndex:0,view:'overview'};if(state.scene.placed&&state.scene.view==='overview'&&state.round===1&&state.log.length===0)state.scene.view='neighborhood';}
  ensureScene();
  function validSave(s){return !!(s && s.version===1 && Number.isInteger(s.round) && s.round>=1 && s.round<=10 && s.plots?.length===7 && s.photos && s.flags && s.visited && s.stars && Array.isArray(s.letters) && Array.isArray(s.log));}
  function store(){if(!prefs.remember)return;try{localStorage.setItem(SAVE,JSON.stringify(state));}catch(_){}}
  function storePrefs(){try{localStorage.setItem(PREFS,JSON.stringify(prefs));}catch(_){}}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
  let audio;
  function chime(mode='click'){if(!prefs.sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const times=mode==='build'?[0,.09,.18]:[0];times.forEach((t,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=[523.25,659.25,783.99][i];g.gain.setValueAtTime(0,audio.currentTime+t);g.gain.linearRampToValueAtTime(.055,audio.currentTime+t+.015);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+t+.23);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+t);o.stop(audio.currentTime+t+.25);});}catch(_){}}
  function starsText(stars){const entries=Object.entries(stars).filter(([,n])=>n!==0);return entries.length?entries.map(([key,n])=>`${E.badges[key].icon} ${n>0?'+':''}${n}`).join('　'):'No badge stars';}
  function available(){return E.availableCards(state);}
  function accessStrip(c){return '<div class="card-access">'+E.residents.map(r=>{const a=E.access(state,c.id,r.id);const cls=a.unknown?'unknown':a.ok?'ok':'blocked';return `<span class="mini-face ${cls}" title="${esc(r.name+': '+(a.reason||'Accessible'))}">${A.portrait(r.id)}</span>`;}).join('')+'</div>';}
  function renderCards(){
    document.querySelectorAll('.tab').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.disabled=!state.scene.placed&&b.dataset.tab!=='facility';});
    const content=$('cards');
    if(!state.scene.placed){
      $('tool-caption').textContent='Step 1 · Place an entire HDB neighbourhood';
      content.innerHTML='<button class="card hdb-placement-tool selected" data-action="arm-placement"><span class="hdb-tool-art"><span class="hdb-mini-building"><i></i><i></i><i></i><i></i><i></i><i></i></span></span><span class="card-content"><span class="card-name">Sunset HDB Neighbourhood</span><span class="card-stars">A complete interactive neighbourhood</span><span class="card-needs">Homes · Void deck · Courtyard · Neighbours</span></span></button><div class="placement-help"><b>Give this community a place to begin.</b><p>Choose an empty site in the scene. Once placed, click on households, spaces and facilities to begin 99 years of neighbourhood life.</p><p>Placing the neighbourhood is part of setting up. It does not use a Build, Policy or Visit action.</p></div>';
      $('tool-footer').textContent='Place the HDB first, then build and meet your neighbours.';return;
    }
    if(tab==='visit'){
      $('tool-caption').textContent='One visit · 1 action · Discover lives and memories';
      content.innerHTML=E.residents.map(r=>`<button class="card visit-card" data-visit="${r.id}"><span class="card-illustration">${A.portrait(r.id)}</span><span class="card-content"><span class="card-name">${esc(r.name)}</span><span class="card-needs">Needs ${r.needs.map(n=>n+' '+needs[n]).join(' · ')}</span><span class="card-stars">${state.visited[r.id]?'Visited · See how life is going':'Not visited · Go and say hello'}</span></span></button>`).join('');
      $('tool-footer').textContent='You can check on neighbours you have already visited at any time.';return;
    }
    $('tool-caption').textContent=tab==='facility'?'Choose a facility, then click a courtyard space.':'No plot needed · Each policy uses 1 action';
    const list=available().filter(c=>c.kind===tab);
    content.innerHTML=list.map(c=>`<button class="card ${c.used?'used':''} ${c.kind==='policy'?'policy-card':''} ${selected===c.id?'selected':''}" data-card="${c.id}" ${c.disabled?'disabled':''} aria-pressed="${selected===c.id}"><span class="card-illustration">${c.kind==='policy'?c.icon:A.facility(c.id)}</span><span class="card-content"><span class="card-name">${esc(c.name)}${c.unlockResident&&!c.used?'<span class="new-card">Request</span>':''}</span><span class="card-stars">${starsText(c.stars)}</span><span class="card-needs">${c.needs.length?'Supports '+c.needs.map(n=>n+' '+needs[n]).join(' · '):c.kind==='policy'?'Community policy':'Environmental facility'}</span>${c.kind==='facility'?accessStrip(c):''}</span>${c.used?'<span class="card-stamp">'+(c.kind==='policy'?'Enacted':'Built')+'</span>':''}</button>`).join('')||'<div class="empty-state">Visit your neighbours.<br>They may open up new choices.</div>';
    $('tool-footer').textContent=tab==='facility'?`Plots ${state.plots.filter(Boolean).length}/${state.unlocked} · Building is permanent`:'Up to 3 stars per badge · Policies leave their mark';
  }
  function renderPlots(){
    const placed=state.scene.placed,overview=state.scene.view==='overview';
    $('world-caption').innerHTML=`<span class="map-dot"></span>${placed?'BLK 317A':'SUNSET NEIGHBOURHOOD'} <b> / </b> ${overview?'Site overview':'Neighbourhood view'}`;
    $('overview-button').hidden=!placed||overview;$('enter-button').hidden=!placed||!overview;
    $('plots').innerHTML=placed&&!overview&&selected?state.plots.map((p,i)=>`<button class="slot-shortcut ${p?'built':''}" data-plot="${i}" ${i>=state.unlocked?'disabled':''} aria-label="${esc(p?(cardById[p.cardId]||extras[p.cardId]).name:'Open space '+(i+1))}" title="${p?esc((cardById[p.cardId]||extras[p.cardId]).name):'Build on space '+(i+1)+' using this shortcut'}">${i>=state.unlocked?'🔒':p?'●':'＋'} ${i+1}</button>`).join(''):'';
    $('placement-card').hidden=placed;
    if(!placed)$('placement-card').innerHTML='<span>Place an entire HDB neighbourhood</span><small>Click an empty site, or choose one below</small><div class="land-shortcuts">'+[0,1,2,3].map(i=>`<button data-land="${i}">Site ${String.fromCharCode(65+i)}</button>`).join('')+'</div>';
    $('map-instruction').textContent=!placed?'Choose an empty site for your HDB neighbourhood.':overview?'Click your HDB to enter the neighbourhood.':state.ended?'After 99 years, look back at life downstairs.':state.letters.length?'Reply to the letters before starting this decade.':selected?`Choose a neighbourhood space for ${cardById[selected].name}.`:state.actions===0?'This decade is complete. The next one awaits.':'Click a household to visit, or build in the spaces downstairs.';
    const total=E.totalStars(state), next=[3,6,9].find(n=>total<n);
    $('map-note').textContent=!placed?'The entire HDB neighbourhood will be placed on the land as one interactive scene.':overview?'Explore the homes, neighbours, public spaces and facilities you build.':`Drag to rotate · Scroll to zoom · ${state.unlocked===7?'All 7 building spaces approved':`Badges: ${total}/12 stars · ${next?next+' stars unlock the next space':'All additional spaces approved'}`}`;
    if(window.HDBScene?.ready)window.HDBScene.sync(state,{...state.scene,selected,tab});
  }
  function renderResidents(){
    const count=E.residents.filter(r=>state.visited[r.id]).length;
    $('visited-count').textContent=`Visited ${count}/5`;
    $('residents').innerHTML=E.residents.map(r=>{const s=E.residentStatus(state,r.id);return `<button class="resident" data-visit="${r.id}"><span class="resident-avatar">${A.portrait(r.id)}</span><span class="resident-copy"><span class="resident-name">${esc(r.name)}</span><span class="resident-subtitle">${esc(r.subtitle)}</span><span class="resident-needs">${r.needs.map(n=>`<span class="${s.met.includes(n)?'met':''}">${n}</span>`).join('　')} <span style="font-size:9px;color:#827c73">${r.needs.map(n=>needs[n]).join(' / ')}</span></span></span><span class="resident-face">${s.face}<small>${s.unknown?'Unseen':'Update'}</small></span></button>`;}).join('');
  }
  function renderLetter(){
    const panel=$('letter-panel'),l=state.letters[0];
    panel.classList.add('envelope-panel');panel.setAttribute('tabindex','-1');
    const newEnvelope=mailUI.state!==state||mailUI.id!==(l?.id||null);
    if(newEnvelope){
      clearTimeout(mailUI.timer);mailUI.timer=null;mailUI.pending=null;
      mailUI.state=state;mailUI.id=l?.id||null;mailUI.phase='closed';
    }
    if(l&&!newEnvelope&&panel.querySelector('[data-mail-toggle]')){
      panel.querySelector('.counter').textContent=state.letters.length;
      panel.querySelectorAll('[data-letter]').forEach(button=>{
        const choice=l.options.find(o=>o.id===button.dataset.option);
        button.disabled=!!mailUI.pending||!choice||!!choice.disabled;
      });
      applyMailPhase(mailUI.phase);return;
    }
    const folds='<div class="mail-shadow" aria-hidden="true"></div><div class="mail-back" aria-hidden="true"></div><div class="mail-flap" aria-hidden="true"></div>';
    const front='<div class="mail-fold-left" aria-hidden="true"></div><div class="mail-fold-right" aria-hidden="true"></div><div class="mail-front" aria-hidden="true"></div>';
    if(!l){
      panel.innerHTML=`<div class="panel-title"><span>✉</span> Community Post <small style="margin-left:auto">All caught up</small></div><div class="mail-stage mail-empty" data-mail-phase="closed">${folds}${front}<div class="mail-toggle mail-delivered"><span class="mail-seal" aria-hidden="true">✓</span><span class="mail-address">Community Post</span><span class="mail-caption">All letters answered</span></div></div><p class="mail-idle-note">${state.ended?'Downstairs lives on in memory.':'More post may arrive next decade.'}</p>`;
      panel.setAttribute('aria-busy','false');return;
    }
    panel.innerHTML=`<div class="panel-title"><span>✉</span> Letters <span class="counter">${state.letters.length}</span><small style="margin-left:auto">Replies use no actions</small></div><div class="mail-stage" data-mail-phase="${mailUI.phase}">${folds}<article class="mail-sheet letter-paper" id="mail-paper" tabindex="-1" aria-labelledby="mail-subject" aria-hidden="true" inert><div class="letter-meta">From ${esc(l.from)} · Decade ${state.round}</div><div class="letter-title" id="mail-subject">${esc(l.title)}</div><p class="letter-text">${esc(l.text)}</p><div class="letter-options">${l.options.map(o=>`<button class="letter-option" data-letter="${esc(l.id)}" data-option="${esc(o.id)}" ${o.disabled?'disabled':''} title="${esc(o.hint||'')}">${esc(o.label)}</button>`).join('')}</div></article>${front}<button class="mail-toggle" data-mail-toggle aria-expanded="false" aria-controls="mail-paper" aria-label="Open letter from ${esc(l.from)}"><span class="mail-seal" aria-hidden="true">✉</span><span class="mail-address">From ${esc(l.from)}</span><span class="mail-caption">Open letter</span></button></div>`;
    applyMailPhase(mailUI.phase);
  }
  function applyMailPhase(phase){
    mailUI.phase=phase;
    const panel=$('letter-panel'),stage=panel.querySelector('.mail-stage'),sheet=panel.querySelector('.mail-sheet'),toggle=panel.querySelector('[data-mail-toggle]');
    if(!stage||!toggle)return;
    const expanded=phase==='opening'||phase==='open',busy=phase==='opening'||phase==='closing';
    stage.dataset.mailPhase=phase;stage.classList.toggle('is-open',expanded);
    panel.setAttribute('aria-busy',String(busy));
    if(sheet){sheet.inert=phase!=='open';sheet.setAttribute('aria-hidden',String(phase!=='open'));}
    toggle.disabled=busy;toggle.setAttribute('aria-expanded',String(expanded));
    toggle.setAttribute('aria-label',(expanded?'Close':'Open')+' letter from '+(state.letters[0]?.from||'Community Post'));
    toggle.querySelector('.mail-caption').textContent=phase==='closing'?(mailUI.pending?'Sending reply…':'Closing envelope…'):phase==='opening'?'Opening letter…':expanded?'Close envelope':'Open letter';
  }
  function toggleEnvelope(){
    if(!state.letters.length||mailUI.pending||!['closed','open'].includes(mailUI.phase))return;
    clearTimeout(mailUI.timer);
    const opening=mailUI.phase==='closed',letterId=mailUI.id,replyState=state;
    applyMailPhase(opening?'opening':'closing');chime();
    const finish=()=>{
      mailUI.timer=null;if(state!==replyState||state.letters[0]?.id!==letterId)return;
      applyMailPhase(opening?'open':'closed');
      const focusTarget=$('letter-panel').querySelector(opening?'.mail-sheet':'[data-mail-toggle]');if($('modal').hidden)focusTarget?.focus({preventScroll:true});
    };
    if(reducedMailMotion?.matches)finish();else mailUI.timer=setTimeout(finish,650);
  }
  function replyFromEnvelope(letterId,optionId){
    if(mailUI.phase!=='open'||mailUI.pending||state.letters[0]?.id!==letterId)return;
    const letter=state.letters[0],choice=letter.options.find(o=>o.id===optionId);
    if(!choice||choice.disabled)return;
    const replyState=state,token={letterId,optionId};mailUI.pending=token;
    clearTimeout(mailUI.timer);applyMailPhase('closing');
    $('letter-panel').querySelectorAll('[data-letter]').forEach(button=>{button.disabled=true;});
    const send=()=>{
      mailUI.timer=null;
      if(state!==replyState||mailUI.pending!==token||state.letters[0]?.id!==letterId)return;
      mailUI.pending=null;
      const result=E.respond(state,letterId,optionId);
      if(!result.ok){applyMailPhase('open');renderLetter();toast(result.message);return;}
      run(result);
      if(result.reveal)visitModal(result.reveal.residentId||result.reveal.id||'chen');
      else if($('modal').hidden)($('letter-panel').querySelector('[data-mail-toggle]')||$('letter-panel')).focus({preventScroll:true});
    };
    if(reducedMailMotion?.matches)send();else mailUI.timer=setTimeout(send,650);
  }
  function renderMemories(){
    const count=E.residents.filter(r=>state.photos[r.id].known).length;
    $('photo-count').textContent=`${count}/5`;
    $('memories').innerHTML=E.residents.map(r=>{const p=state.photos[r.id];return `<button class="memory" data-memory="${r.id}" title="${esc(p.known?p.name:'A memory waiting to be discovered')}"><span class="polaroid ${!p.known?'unknown':p.faded?'faded':''}">${p.known?A.photo(r.id):'<span>?</span>'}</span><small>${p.known?esc(r.short):'Undiscovered'}</small></button>`;}).join('');
  }
  function render(){
    const min=(state.round-1)*10,max=state.round===10?99:state.round*10;
    $('turn-hud').innerHTML=`<span class="hud-item"><i>▦</i> Round <strong>${state.round}</strong></span><span class="hud-divider"></span><span class="hud-item"><i>🌳</i> Years ${min}–${max}</span><span class="hud-divider"></span><span class="hud-item"><i>⚡</i> Actions <strong>${state.actions}</strong>/2</span>`;
    $('time-track').innerHTML=Array.from({length:10},(_,i)=>`<span class="${i<state.round-1?'done':i===state.round-1?'now':''}"></span>`).join('');
    $('badges').innerHTML=Object.entries(E.badges).map(([key,b])=>`<div class="badge" title="${esc(b.name+': '+state.stars[key]+' stars out of 3')}"><span class="badge-icon">${b.icon}</span><span class="badge-name">${b.name}</span><div class="stars">${Array.from({length:3},(_,i)=>`<span class="${i<state.stars[key]?'':'off'}">${i<state.stars[key]?'★':'☆'}</span>`).join('')}</div></div>`).join('');
    renderCards();renderPlots();renderResidents();renderLetter();renderMemories();
    $('advisor').textContent=E.advisor(state).text;
    $('round-hint').innerHTML=`<strong>${esc(state.turnLabel)}</strong><br>${state.ended?'99 years of life, held in one shared picture.':state.letters.length?`${state.letters.length} letter${state.letters.length===1?'':'s'} awaiting a reply`:state.actions>0?`${state.actions} action${state.actions===1?'':'s'} left this decade`:'Both actions complete.'} `;
    $('next-round').disabled=!state.scene.placed||(!state.ended&&(state.letters.length>0||state.actions>0));
    $('next-round').innerHTML=state.ended?'Look back <span>↗</span>':state.round===10?'End the lease <span>→</span>':'End this decade <span>→</span>';
    store();
  }
  function showModal(html){returnFocus=document.activeElement;$('modal-body').innerHTML=html;$('modal').hidden=false;document.body.style.overflow='hidden';document.querySelector('.modal-dialog').focus();}
  function closeModal(){$('modal').hidden=true;document.body.style.overflow='';if(returnFocus?.isConnected)returnFocus.focus();}
  function run(result,mode){if(!result.ok){toast(result.message);return false;}chime(mode);render();toast(result.message);return true;}
  function visit(id){
    const r=E.residents.find(r=>r.id===id);if(!r)return;
    if(!state.scene.placed){toast('Place the HDB on an empty site, then enter the neighbourhood to visit residents.');return;}
    if(!state.visited[id]&&!state.ended){const result=E.visit(state,id);if(!run(result))return;}
    visitModal(id);
  }
  function visitModal(id){
    const r=E.residents.find(r=>r.id===id);let s=E.residentStatus(state,id);if(state.ended)s=E.ending(state).facts.residentStatuses.find(x=>x.id===id);
    const known=state.visited[id]||state.ended,p=state.photos[id];
    const list=state.plots.filter(Boolean).map(x=>cardById[x.cardId]).filter(c=>c&&c.needs.some(n=>r.needs.includes(n)));
    const unlocked=E.cards.filter(c=>c.unlockResident===id);
    showModal(`<div class="modal-kicker">${state.ended?'Life after 99 years':'Neighbourhood visit · At street level'} / BLK 317A</div><h2>Downstairs with ${esc(r.name)}</h2><div class="visit-stage"><div class="visit-window"></div><div class="visit-picture">${A.photo(id)}</div><div class="visit-bench"></div><div class="visit-person">${A.portrait(id)}</div></div><div class="visit-quote">“${esc(r.quote)}”</div><div class="visit-status">${r.needs.map(n=>`<span class="need-tag ${s.met.includes(n)?'':'missing'}">${n} ${needs[n]} · ${s.met.includes(n)?'Supported':'Not yet supported'}</span>`).join('')}</div>${state.flags.trapped&&id==='aisyah'?'<p>The housing quota still leaves this family unable to complete their sale.</p>':''}${list.length?`<div class="visit-access"><h3>Can they use the places you have built?</h3>${list.map(c=>{const a=E.access(state,c.id,id);return `<div class="access-row"><span>${esc(c.name)}</span><span class="${a.ok?'':'blocked'}">${a.ok?'Accessible':esc(a.reason)}</span></div>`;}).join('')}</div>`:'<p>No facilities currently address these needs.</p>'}${unlocked.length&&known?`<div class="unlock-note">${unlocked.map(c=>c.icon+' '+c.name).join('　')}<br><span style="font-size:10px;color:#c5bfad">Unlocked. Look for these in Build or Policy.</span></div>`:''}<p style="margin-top:13px;font-size:11px">Memory: “${esc(p.name)}” · ${p.faded?'Faded':'Still clear'}</p><div class="modal-actions"><button class="subtle-button" data-close>Back to the neighbourhood</button>${!state.ended?'<button class="gold-button" data-revisit="'+id+'">Visit again · 1 action</button>':''}</div>`);
  }
  function facilityModal(index){
    const p=state.plots[index],c=cardById[p.cardId]||extras[p.cardId];
    showModal(`<div class="modal-kicker">Plot ${index+1} / Built in round ${p.builtRound}</div><h2>${esc(c.name)}</h2><div class="facility-detail"><div class="facility-detail-art">${A.facility(c.id)}</div><div><p>${esc(c.description)}</p><p>${starsText(c.stars)}</p><p>${c.needs.length?'Supports '+c.needs.map(n=>n+' '+needs[n]).join(', '):'This place supports the shared environment.'}</p></div></div>${cardById[c.id]?`<div class="visit-access"><h3>Who can use it?</h3>${E.residents.map(r=>{const a=E.access(state,c.id,r.id);return `<div class="access-row"><span>${esc(r.name)}</span><span class="${a.ok?'':'blocked'}">${a.unknown?'Not yet visited':a.ok?'Accessible':esc(a.reason)}</span></div>`;}).join('')}</div>`:''}<div class="modal-actions"><button class="gold-button" data-close>Back downstairs</button></div>`);
  }
  function placeHDB(index){
    if(state.scene.placed){state.scene.view='neighborhood';render();return;}
    if(!Number.isInteger(index)||index<0||index>3)return;
    state.scene={placed:true,landIndex:index,view:'neighborhood'};selected=null;tab='facility';
    chime('build');render();toast('HDB placed on site '+String.fromCharCode(65+index)+'. Click the households, block and spaces downstairs to explore.');
  }
  function scenePlot(index){
    if(!state.scene.placed){toast('Place the HDB neighbourhood on an empty site first.');return;}
    if(state.plots[index]){facilityModal(index);return;}
    if(index>=state.unlocked){toast(`This building space is approved once your badges total ${[3,6,9][index-4]} stars.`);return;}
    if(!selected){toast('Choose a facility in Build, then click a building space in the neighbourhood.');return;}
    if(run(E.build(state,selected,index),'build')){selected=null;render();}
  }
  function enterNeighborhood(){if(!state.scene.placed)return;state.scene.view='neighborhood';render();}
  function buildingModal(){
    if(state.scene.view==='overview'){enterNeighborhood();return;}
    showModal(`<div class="modal-kicker">Homes in the neighbourhood / Site ${String.fromCharCode(65+state.scene.landIndex)}</div><h2>BLK 317A · Sunset Neighbourhood</h2><p>This HDB neighbourhood includes homes, corridors, a void deck, courtyard and rooftop. The facilities you build and the people who live here are all part of this community.</p><p>Click a door sign to visit a household. Click a facility downstairs to see who can use it. To build, choose a facility and click an empty space in the scene.</p><div class="building-residents">${E.residents.map(r=>`<button class="resident" data-visit="${r.id}"><span class="resident-avatar">${A.portrait(r.id)}</span><span class="resident-copy"><span class="resident-name">${esc(r.name)}</span><span class="resident-subtitle">${esc(r.subtitle)}</span></span><span class="resident-face">${E.residentStatus(state,r.id).face}</span></button>`).join('')}</div><div class="modal-actions"><button class="gold-button" data-close>Keep exploring</button></div>`);
  }
  function memoriesModal(){
    showModal(`<div class="modal-kicker">The everyday lives beyond the dashboard</div><h2>Memory Wall</h2><p>Visit a household to collect a photograph. Some decisions make photographs fade. Leaving space open can restore one of them.</p><div class="memory-grid">${E.residents.map(r=>{const p=state.photos[r.id];return `<div class="memory-big"><div class="polaroid ${!p.known?'unknown':p.faded?'faded':''}">${p.known?A.photo(r.id):'<span>?</span>'}</div><p>${p.known?esc(p.name):'A life not yet seen'}</p><small>${p.known?esc(r.name)+' · '+(p.faded?'Faded':'Clear'):'Visit to collect this photograph'}</small></div>`;}).join('')}</div><div class="modal-actions"><button class="gold-button" data-close>Back to the neighbourhood</button></div>`);
  }
  function settingsModal(){
    showModal(`<div class="modal-kicker">DOWNSTAIRS / An interactive HDB neighbourhood</div><h2>A little town. Ninety-nine years.</h2><p>Place a complete HDB neighbourhood on the land, then enter it. Explore the block, households and facilities downstairs. Drag to rotate; use the scroll wheel or buttons to zoom.</p><div class="rules-grid"><div class="rule-box"><b>⚒ Build · ▤ Policy · ⌕ Visit</b><p>Take two actions each decade. Select a facility and click an open space to build. Click a household’s door sign to visit. Policies use no building space.</p></div><div class="rule-box"><b>✉ Reply to letters first</b><p>Reply to the letters before taking actions each decade. Replies use no actions. Their consequences emerge through later letters and residents’ lives.</p></div><div class="rule-box"><b>★ Four badges, seven spaces</b><p>Each badge holds up to three stars. Your HDB starts with four building spaces. Earn three, six and nine stars in total to unlock one additional space at each milestone.</p></div><div class="rule-box"><b>▧ Photographs and lived experience</b><p>Unvisited neighbours have question marks over their portraits and photographs. Photographs can fade. Even a tidy neighbourhood contains complicated lives.</p></div></div><p style="font-size:10px">Placing the HDB at the start uses no actions. This ten-round prototype follows version 3 of the game proposal. The planning assistant and retrospective use local rules and factual templates; they do not score your choices.</p><label class="checkline"><input type="checkbox" id="sound-setting" ${prefs.sound?'checked':''}> Click sounds</label><label class="checkline"><input type="checkbox" id="remember-setting" ${prefs.remember?'checked':''}> Remember my progress on this device</label><div class="modal-actions"><button class="subtle-button" data-action="history">View community record</button><button class="subtle-button" data-action="export">Export this game’s record</button><button class="subtle-button" data-action="restart">Start again</button><button class="gold-button" data-close>Continue this decade</button></div>`);
  }
  function historyModal(){showModal(`<div class="modal-kicker">99 years of everyday life / Round ${state.round}</div><h2>Community Record</h2><div class="history-list">${state.log.length?state.log.map(e=>`<div class="history-row"><span>Round ${e.round}</span>${esc(e.message)}</div>`).join(''):'<p>The neighbourhood has just been built. Its first letter has arrived.</p>'}</div><div class="modal-actions"><button class="gold-button" data-close>Back to the neighbourhood</button></div>`);}
  function restartModal(){showModal('<div class="modal-kicker">Another possible life downstairs</div><h2>Begin another 99 years</h2><p>This will restart your current game. You can export its record first to keep the story of this neighbourhood.</p><div class="modal-actions"><button class="subtle-button" data-action="export">Export record</button><button class="subtle-button" data-close>Keep playing</button><button class="gold-button" data-action="confirm-restart">Start a new game</button></div>');}
  function exportRecord(){const data={game:'Downstairs · 99 Years of Everyday Life',rulesVersion:E.version,state,recap:state.ended?E.ending(state):null};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='downstairs-community-record-en.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Game record exported.');}
  function endingModal(){
    const e=E.ending(state),f=e.facts;
    showModal(`<div class="modal-kicker">Years 0–99 / The last day of the lease</div><h2>${esc(e.title)}</h2><div class="ending-stats"><div class="ending-stat"><b>${f.unlockedPlots}</b><span>Approved plots / 7</span></div><div class="ending-stat"><b>${f.visitCount}</b><span>Neighbourhood visits</span></div><div class="ending-stat"><b>${f.letters}</b><span>Letters and replies</span></div></div><div class="ending-residents">${f.residentStatuses.map(r=>`<div class="ending-resident">${A.portrait(r.id)}<strong>${r.face}</strong>${esc(E.residents.find(x=>x.id===r.id).short)}<small>${state.visited[r.id]?'Visited':'Never visited'}</small></div>`).join('')}</div><div class="ending-prose">${e.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="ending-question">${esc(e.question)}</div><p style="font-size:10px;text-align:center">This retrospective reflects your actions and the final state of this neighbourhood.</p><div class="modal-actions"><button class="subtle-button" data-action="export">Keep the community record</button><button class="subtle-button" data-close>Look around downstairs</button><button class="gold-button" data-action="restart">Try another everyday life</button></div>`);
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-mail-toggle')){toggleEnvelope();return;}
    if(b.hasAttribute('data-land')){placeHDB(Number(b.dataset.land));return;}
    if(b.hasAttribute('data-tab')){tab=b.dataset.tab;selected=null;render();chime();return;}
    if(b.hasAttribute('data-card')){
      if(state.ended){endingModal();return;}if(state.letters.length){toast('Reply to the community letters at the bottom left first.');return;}if(!state.actions){toast('Both actions are complete. Click End this decade.');return;}
      const c=cardById[b.dataset.card];if(c.kind==='policy'){if(run(E.enact(state,c.id),'build'))selected=null;}else{state.scene.view='neighborhood';selected=selected===c.id?null:c.id;render();chime();}return;
    }
    if(b.hasAttribute('data-plot')){
      scenePlot(Number(b.dataset.plot));return;
    }
    if(b.hasAttribute('data-visit')){visit(b.dataset.visit);return;}
    if(b.hasAttribute('data-revisit')){const id=b.dataset.revisit;if(run(E.visit(state,id))){visitModal(id);}return;}
    if(b.hasAttribute('data-letter')){
      replyFromEnvelope(b.dataset.letter,b.dataset.option);return;
    }
    if(b.hasAttribute('data-memory')){memoriesModal();return;}
    if(b.hasAttribute('data-close')){closeModal();return;}
    if(b.hasAttribute('data-action')){
      const action=b.dataset.action;
      if(action==='arm-placement'){state.scene.view='overview';render();toast('Click an empty site in the scene to place your HDB neighbourhood.');}
      if(action==='restart')restartModal();if(action==='export')exportRecord();if(action==='history')historyModal();
      if(action==='confirm-restart'){state=E.initialState();ensureScene();selected=null;tab='facility';closeModal();render();toast('Place the HDB to begin another possible life downstairs.');}
    }
  });
  $('next-round').addEventListener('click',()=>{if(state.ended){endingModal();return;}selected=null;const result=E.nextRound(state);if(run(result,'build')&&result.ended)endingModal();});
  $('settings-button').addEventListener('click',settingsModal);$('memory-button').addEventListener('click',memoriesModal);$('modal-close').addEventListener('click',closeModal);document.querySelector('.modal-shade').addEventListener('click',closeModal);
  $('overview-button').addEventListener('click',()=>{state.scene.view='overview';selected=null;render();});
  $('enter-button').addEventListener('click',enterNeighborhood);
  $('rotate-left').addEventListener('click',()=>window.HDBScene?.rotate(-1));$('rotate-right').addEventListener('click',()=>window.HDBScene?.rotate(1));
  $('zoom-in').addEventListener('click',()=>window.HDBScene?.zoom(.15));$('zoom-out').addEventListener('click',()=>window.HDBScene?.zoom(-.15));$('reset-camera').addEventListener('click',()=>window.HDBScene?.reset());
  document.addEventListener('change',event=>{if(event.target.id==='sound-setting'){prefs.sound=event.target.checked;storePrefs();chime();}if(event.target.id==='remember-setting'){prefs.remember=event.target.checked;storePrefs();if(prefs.remember){store();toast('Progress saved in this device’s browser.');}else{try{localStorage.removeItem(SAVE);}catch(_){}toast('Saving progress on this device is now off.');}}});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!$('modal').hidden){closeModal();return;}
    if(event.key==='Escape'&&mailUI.phase==='open'&&!mailUI.pending){toggleEnvelope();return;}
    if(event.key==='Tab'&&!$('modal').hidden){const focusable=[...$('modal').querySelectorAll('button:not(:disabled),input')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===document.querySelector('.modal-dialog'))){last.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first.focus();event.preventDefault();}}
  });
  $('fireflies').innerHTML=Array.from({length:14},(_,i)=>`<i class="firefly" style="left:${20+(i*37%67)}%;top:${43+(i*13%48)}%;animation-delay:-${(i*1.13)%7}s"></i>`).join('');
  window.DownstairsUI={get state(){return state;},get selected(){return selected;},get tab(){return tab;},render,sceneLand:placeHDB,scenePlot,sceneResident:visit,sceneBuilding:buildingModal,appSceneReady:render,sceneHover(text){$('world-hover').textContent=text||'';$('world-hover').hidden=!text;}};
  render();
})();
