/* Urgent situations show on the map. Sky-wide effects (haze, rain, heat shimmer) are one canvas over the
 * 3D scene, never in the way of taps; standing water, fire and mosquito pools live in the scene itself.
 * Reads this year's urgent needs from the year engine; clears when the year's report opens. */
(function(root){
  'use strict';
  const doc=root.document;if(!doc)return;
  const E=()=>root.CM_YEARS,state=()=>root.CM_YEAR_APP?.getState?.()||null;
  const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  // kind: what is drawn. tint: a wash over the whole map. at: where on the map (fractions) local effects sit.
  const FX={
    haze:{kind:'haze',tint:'linear-gradient(180deg,#d9c99a8f,#b9ab8a70 55%,#a89c8452)'},
    flood:{kind:'rain',tint:'linear-gradient(180deg,#1f2f408c,#2a425a66 55%,#35698f80)'},
    heat:{kind:'heat',tint:'radial-gradient(circle at 80% 6%,#fff6c8e6,#ffd36e8c 22%,#ff9b4a52 52%,#ff6a2a3d 85%)'},
    fire:{kind:'smoke',tint:'linear-gradient(180deg,#2a1f1f40,#3a2a2224 60%,#ff6a1f1f)'},
    dengue:{kind:'swarm',tint:'linear-gradient(180deg,#4e5f2a38,#3f5a2a52)'},
  };
  let layer=null,canvas=null,g=null,tags=null,active=[],sig='',raf=0,parts=[],last=0,W=0,H=0;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  let forced=null;const NAMES={haze:['烟霾','Haze'],flood:['暴雨积水','Flooding'],heat:['高温','Heatwave'],fire:['火灾','Fire'],dengue:['骨痛热症','Dengue']};
  function keys(){const s=state(),Y=E();if(forced==='none')return [];if(forced&&FX[forced]){const en=root.CM_I18N?.getLanguage?.()==='en';return [{key:forced,title:(en?'Debug · ':'调试 · ')+NAMES[forced][en?1:0]}];}if(!s||!Y?.urgent||s.outcome)return [];if(!['visit','needs','policy'].includes(s.phase))return [];return Y.urgent(s).map(i=>({key:i.urgentKey,title:i.title})).filter(x=>FX[x.key]);}
  function mount(){
    const host=doc.getElementById('world-scene');if(!host)return false;if(layer&&layer.parentNode===host)return true;
    layer=doc.createElement('div');layer.className='yr-weather';layer.setAttribute('aria-hidden','true');
    canvas=doc.createElement('canvas');tags=doc.createElement('div');tags.className='yr-weather-tags';layer.append(canvas,tags);host.appendChild(layer);g=canvas.getContext('2d');return !!g;
  }
  function size(){const r=layer.getBoundingClientRect(),d=Math.min(1.5,root.devicePixelRatio||1);W=Math.max(1,r.width);H=Math.max(1,r.height);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);g.setTransform(d,0,0,d,0,0);}
  function seed(){
    parts=[];
    for(const {key} of active){const f=FX[key];
      if(f.kind==='haze')for(let i=0;i<14;i++)parts.push({k:'fog',x:rnd(0,W),y:rnd(0,H),r:rnd(160,360),v:rnd(4,12),a:rnd(.1,.2)});
      if(f.kind==='rain'){for(let i=0;i<260;i++)parts.push({k:'rain',x:rnd(0,W),y:rnd(0,H),l:rnd(14,30),v:rnd(700,1000)});}
      if(f.kind==='heat'){parts.push({k:'sun',p:0});for(let i=0;i<16;i++)parts.push({k:'wave',y:rnd(H*.15,H*.95),p:rnd(0,6.28),v:rnd(.5,1.1),a:rnd(.16,.28)});}
    }
  }
  function draw(now){
    raf=0;if(!active.length||!g)return;const still=reduced(),dt=still?0:Math.min(.05,(now-last)/1000||0);last=now;g.clearRect(0,0,W,H);
    for(const p of parts){
      if(p.k==='sun'){p.p+=dt;const x=W*.8,y=H*.06,r=Math.min(W,H)*(.42+.03*Math.sin(p.p*1.3)),c=g.createRadialGradient(x,y,0,x,y,r);c.addColorStop(0,'rgba(255,250,215,.75)');c.addColorStop(.25,'rgba(255,214,120,.35)');c.addColorStop(1,'rgba(255,160,80,0)');g.fillStyle=c;g.fillRect(x-r,y-r,r*2,r*2);continue;}
      if(p.k==='fog'){p.x+=p.v*dt;if(p.x-p.r>W)p.x=-p.r;const c=g.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);c.addColorStop(0,'rgba(222,208,160,'+p.a+')');c.addColorStop(1,'rgba(222,208,160,0)');g.fillStyle=c;g.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);}
      else if(p.k==='rain'){p.y+=p.v*dt;p.x-=p.v*.18*dt;if(p.y>H){p.y=-20;p.x=rnd(0,W+80);}g.strokeStyle='rgba(215,235,250,.7)';g.lineWidth=1.4;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-p.l*.18,p.y+p.l);g.stroke();}
      else if(p.k==='wave'){p.p+=p.v*dt;g.strokeStyle='rgba(255,226,160,'+p.a+')';g.lineWidth=2;g.beginPath();for(let x=0;x<=W;x+=24){const y=p.y+Math.sin(x*.012+p.p)*7+Math.sin(x*.031-p.p*1.7)*3;x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();p.y-=6*dt;if(p.y<H*.15)p.y=H*.95;}
    }
    if(!still&&!doc.hidden)raf=root.requestAnimationFrame(draw);
  }
  function apply(){
    const list=keys(),next=list.map(x=>x.key).join(',')+'|'+(root.CM_I18N?.getLanguage?.()||'');
    // Water, fire and mosquitoes are drawn inside the 3D map so they stay on the ground as the camera moves.
    root.HDBScene?.setWeather?.(list.map(x=>x.key));
    if(next===sig&&(!list.length||layer?.isConnected))return;if(!mount())return;sig=next;active=list;
    layer.hidden=!list.length;layer.style.backgroundImage=list.map(x=>FX[x.key].tint).join(',');layer.dataset.fx=list.map(x=>x.key).join(' ');
    const t=x=>root.CM_I18N?.t?.(x)||x;
    tags.innerHTML=list.map(x=>'<span>'+String(t(x.title)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</span>').join('');
    if(raf){root.cancelAnimationFrame(raf);raf=0;}
    if(list.length){size();seed();last=root.performance?.now?.()||0;raf=root.requestAnimationFrame(draw);}else g?.clearRect(0,0,W,H);
  }
  root.CM_YEAR_WEATHER={effects:()=>Object.keys(FX),active:()=>active.map(x=>x.key),kind:k=>FX[k]?.kind||null,refresh:apply,
    // Debug override from 更多 → 调试: a key from FX, 'none', or null to follow the game. Not saved.
    debug(key){if(arguments.length){forced=key==null||key==='none'||FX[key]?key:null;apply();}return forced;}};
  if(!root.setInterval)return;
  root.setInterval(apply,500);
  root.addEventListener?.('resize',()=>{if(active.length&&layer){size();seed();}});
  doc.addEventListener?.('visibilitychange',()=>{if(!doc.hidden&&active.length&&!raf)raf=root.requestAnimationFrame(draw);});
})(typeof window!=='undefined'?window:globalThis);
