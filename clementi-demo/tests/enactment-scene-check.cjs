'use strict';
// Execute the real scene graph and presentation code. Only rendering and DOM are
// doubled; the shipped Three.js geometry, transforms and game choices are real.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
class Element{
  constructor(tag='div'){this.tagName=tag;this.style={};this.dataset={};this.attributes={};this.children=[];this.listeners={};this.clientWidth=1440;this.clientHeight=900;this.hidden=false;this.textContent='';}
  append(...nodes){for(const node of nodes){node.parentNode=this;this.children.push(node);}}
  prepend(node){node.parentNode=this;this.children.unshift(node);}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(node=>node!==this);}
  addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  setPointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
  getContext(){return {createLinearGradient:()=>({addColorStop(){}}),fillRect(){}};}
}
class FakeRenderer{
  constructor(){this.domElement=new Element('canvas');this.shadowMap={};}
  setPixelRatio(value){this.pixelRatio=value;}
  setSize(w,h){this.domElement.width=w*this.pixelRatio;this.domElement.height=h*this.pixelRatio;}
  setAnimationLoop(fn){this.loop=fn;}
  render(){}
}
const clean=value=>JSON.parse(JSON.stringify(value));
const snapshotActor=actor=>({position:actor.node.position.toArray(),quaternion:actor.node.quaternion.toArray(),held:actor.node.userData.policyHeld,limbs:[...(actor.node.userData.limbs?.legs||[]),...(actor.node.userData.limbs?.arms||[])].map(limb=>limb.rotation.toArray())});
(async()=>{
  const THREE=await import(require('node:url').pathToFileURL(path.join(root,'vendor/three.module.js')).href);
  let clock=1000,reduceMotion=false;
  const container=new Element(),errorNode=new Element(),hoverNode=new Element();
  const context={THREE:{...THREE,WebGLRenderer:FakeRenderer},console,performance:{now:()=>clock},ResizeObserver:class{observe(){}},devicePixelRatio:1,CM_YEAR_APP:{},CM_I18N:{t:text=>text},
    matchMedia:()=>({get matches(){return reduceMotion;}}),
    document:{readyState:'loading',hidden:false,listeners:{},addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);},createElement:tag=>new Element(tag),getElementById:id=>id==='world-scene'?container:id==='world-error'?errorNode:id==='world-hover'?hoverNode:null}};
  context.window=context;context.globalThis=context;vm.createContext(context);
  for(const file of ['data.js','year-translations.js','year-content.js','year-policy-content.js','year-engine.js','year-policy-presentation.js','scene-adapter.js'])vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),context,{filename:file});
  const source=fs.readFileSync(path.join(root,'scene-source.mjs'),'utf8').replace(/^import \* as THREE from ['"]\.\/vendor\/three\.module\.js['"];\s*/,'');
  const harness='\nwindow.__enactSceneTest={initialize,animate,animatePolicyPresentation,placeWalkingActor,actors,world,facilityGroup,projectNodes,geometryCache,materialCache,domLabels,get p(){return policyPresentation;},get fireworks(){return fireworks;}};';
  vm.runInContext(source+harness,context,{filename:'scene-source.mjs'});
  const scene=context.__enactSceneTest,E=context.CM_YEARS,model=E.create({seed:7});
  for(const [site,id]of [['route-west','cover'],['void-b','corner'],['room-b','aac'],['garden','child']])model.plots[site]={cardId:id,status:'complete',remaining:0,placement:{x:0,z:0,rotation:0}};
  context.CM_APP={getState:()=>model,getSelection:()=>null};
  context.CM_SCENE.sync(model,{paused:true,suspended:false,simTime:0,showLand:false});scene.initialize();
  const api=context.HDBScene;assert(api.ready,api.diagnostics().error);
  const sync=extra=>context.CM_SCENE.sync(model,{paused:true,suspended:false,simTime:0,showLand:false,...extra});
  sync({});clock+=32;scene.animate(clock);
  const stateBefore=JSON.stringify(model),labelsBefore=scene.domLabels.length,facilitiesBefore=scene.facilityGroup.children.length;
  function advance(ms){const finish=clock+ms;while(clock<finish){clock=Math.min(finish,clock+32);scene.animate(clock);}}
  function atAge(age){const p=scene.p;assert(p);clock=p.born*1000+age*1000;scene.animatePolicyPresentation(clock/1000);}
  function start(policy){const answer=api.presentPolicy(policy);assert(answer.ok);for(let n=0;scene.p?.waiting&&n<60;n++)advance(32);assert(scene.p&&!scene.p.waiting,'camera arrives before the action begins');return scene.p;}
  function choose(year,resident,type,urgentKey){
    let candidate,s;
    for(let seed=0;seed<256;seed++){
      s=E.create({seed});s.year=year;s.cash=100000;s.staffTotal=100;E.availability(s);s.visitPlans['y'+year].accepted=E.households().map(h=>h.id);s.visitPlans['y'+year].reasons={};
      candidate=urgentKey?E.urgent(s).find(i=>i.urgentKey===urgentKey):E.additionalVisits(s).find(i=>i.residentId===resident);if(candidate)break;
    }
    assert(candidate);if(!urgentKey)assert(E.learn(s,candidate.id).ok);assert(E.summarize(s).ok);assert(E.beginPolicies(s).ok);assert(E.choose(s,candidate.id,type).ok);
    return {...clean(E.choices(s).find(p=>p.issueId===candidate.id)),year,issueTitle:candidate.title,issueNeed:candidate.need,kind:type==='capital'?'build':'service'};
  }
  const examples=[
    ['build',choose(1,'chen','capital')],['mediation',choose(6,null,'community','noise')],['consultation',choose(2,'rahman','service')],['care',choose(6,null,'service','fall')],
    ['community',choose(3,'students','service')],['access',choose(1,'lin','service')],['maintenance',choose(1,'ali','service')],['environment',choose(6,'students','service')]
  ];
  let sharedDisposals=0,ownedDisposals=0;
  const watched=new WeakSet();
  function watchShared(){for(const resource of [...scene.geometryCache.values(),...scene.materialCache.values()])if(!watched.has(resource)){watched.add(resource);resource.addEventListener('dispose',()=>sharedDisposals++);}}
  for(const [family,policy]of examples){
    const originalActors=new Map(scene.actors.map(actor=>[actor.id,snapshotActor(actor)])),input=JSON.stringify(policy);
    watchShared();const p=start(policy);watchShared();
    assert.equal(p.descriptor.family,family);assert.equal(p.plotId,p.descriptor.site);assert(p.participants.length,'named residents are physically present in every activity');
    assert(p.participants.every(entry=>entry.actor.node.userData.policyHeld));
    assert(p.activity.people.length+p.activity.workers.length>0,'each family includes a visible support actor or worker');
    p.ring.geometry.addEventListener('dispose',()=>ownedDisposals++);p.halo.geometry.addEventListener('dispose',()=>ownedDisposals++);
    const first=p.participants[0],firstSaved=first.saved.position.toArray();
    atAge(.6);assert.notDeepEqual(first.actor.node.position.toArray(),firstSaved,'participants walk in from their current map position: '+family);
    const heldPose=snapshotActor(first.actor);scene.placeWalkingActor(first.actor,9999);assert.deepEqual(snapshotActor(first.actor),heldPose,'normal wandering does not overwrite the presentation');
    atAge(1.6);const workingPose=snapshotActor(first.actor);atAge(2.2);
    assert.notDeepEqual(snapshotActor(first.actor),workingPose,'participants gesture or walk during the action: '+family);
    assert(p.participantBubbles.some(node=>node.visible)||p.activity.bubbles.some(node=>node.visible),'speaking turns are visible');
    atAge(4.3);assert.equal(p.stage,p.descriptor.stages[2].zh,'the scene visibly reaches its outcome stage');
    atAge(p.animSec+.1);assert.equal(api.policyDone(),true,'the app can advance after the action');
    api.clearPolicyPresentation();
    for(const entry of p.participants)assert.deepEqual(snapshotActor(entry.actor),originalActors.get(entry.actor.id),'ending restores the map actor including limbs: '+entry.actor.id);
    assert.equal(scene.p,null);assert.equal(scene.projectNodes.has('policy:active'),false);assert.equal(scene.domLabels.length,labelsBefore);
    assert.equal(JSON.stringify(policy),input,'presentation does not mutate its selected card');assert.equal(JSON.stringify(model),stateBefore,'presentation does not apply policy effects twice');
  }
  assert.equal(sharedDisposals,0,'cached world/actor geometry and materials remain usable');assert(ownedDisposals>=16,'owned effect geometry is released');
  assert.equal(scene.facilityGroup.children.length,facilitiesBefore,'presentations create no extra permanent facilities');

  // Skipping and replacing a scene must undo arrival and gestures, even midway.
  const mediation=examples.find(([family])=>family==='mediation')[1],consultation=examples.find(([family])=>family==='consultation')[1];
  const actorsBeforeSkip=new Map(scene.actors.map(actor=>[actor.id,snapshotActor(actor)]));let active=start(mediation);atAge(2);api.clearPolicyPresentation();
  for(const entry of active.participants)assert.deepEqual(snapshotActor(entry.actor),actorsBeforeSkip.get(entry.actor.id),'skip restores all participants');
  active=start(mediation);atAge(2);start(consultation);
  for(const entry of active.participants)if(!scene.p.participants.some(next=>next.actor===entry.actor))assert.deepEqual(snapshotActor(entry.actor),actorsBeforeSkip.get(entry.actor.id),'a new project cleans the previous participants');
  api.clearPolicyPresentation();

  // Upgrading an existing facility keeps it usable instead of shrinking it away.
  const built=scene.facilityGroup.children.find(node=>node.userData.facilityId==='cover'),scale=built.scale.clone();assert(built);
  active=start({...examples[0][1],upgrade:true});assert.equal(built.scale.y,scale.y);atAge(2);assert.equal(built.scale.y,scale.y);assert(active.parts.every(part=>part.node.visible===part.visible));api.clearPolicyPresentation();assert(built.scale.equals(scale));
  for(const visual of ['ease','nrp','appeal']){
    const retainedScales=scene.facilityGroup.children.map(node=>({node,scale:node.scale.clone()}));
    active=start({policyId:'capital',kind:'build',visual,assetId:visual,residentId:'chen',year:6,title:'公共设施更新'});assert.equal(active.isBuilding,true);assert(active.activity.workers.length>=2);atAge(2);
    for(const {node,scale:previous}of retainedScales)assert(node.scale.equals(previous),'a retrofit never shrinks an unrelated retained facility: '+visual);
    api.clearPolicyPresentation();
  }

  // Completion fireworks belong to this one project and launch exactly once.
  const initialBursts=api.diagnostics().fireworksLaunched;active=start(examples[0][1]);atAge(3.6);assert.equal(api.diagnostics().fireworksLaunched,initialBursts);atAge(3.9);assert.equal(api.diagnostics().fireworksLaunched,initialBursts+1);atAge(4.1);assert.equal(api.diagnostics().fireworksLaunched,initialBursts+1);
  assert(scene.fireworks.length&&scene.fireworks.every(effect=>effect.owner===active));assert(scene.fireworks[0].points.position.equals(active.celebrationAnchor));api.clearPolicyPresentation();assert.equal(scene.fireworks.length,0,'skip/end also removes the project fireworks');

  // Reduced-motion users see the completed arrangement without walking/building.
  reduceMotion=true;active=start(examples[0][1]);assert.equal(built.scale.y,scale.y);assert(active.parts.every(part=>part.node.visible===part.visible));assert.equal(active.stage,active.descriptor.stages[2].zh,'reduced motion shows the outcome immediately');
  const staticPose=active.participants.map(entry=>snapshotActor(entry.actor));advance(60);assert.deepEqual(active.participants.map(entry=>snapshotActor(entry.actor)),staticPose);api.clearPolicyPresentation();reduceMotion=false;

  // Reading a modal or hiding the game must not consume a cinematic offscreen.
  active=start(mediation);atAge(.6);const pausedPose=active.participants.map(entry=>snapshotActor(entry.actor)),stageBeforePause=active.stage;
  sync({suspended:true});advance(6500);assert.equal(api.policyDone(),false,'a suspended scene cannot finish behind an overlay');
  assert.equal(active.stage,stageBeforePause);assert.deepEqual(active.participants.map(entry=>snapshotActor(entry.actor)),pausedPose,'suspension holds actor poses');
  sync({suspended:false});assert.equal(api.policyDone(),false,'resuming preserves the remaining activity time');
  atAge(2.2);assert.notDeepEqual(active.participants.map(entry=>snapshotActor(entry.actor)),pausedPose,'the presentation resumes after closing the overlay');api.clearPolicyPresentation();

  // A reset/load clears an in-flight project before using the next scene model.
  active=start(mediation);atAge(2);const priorActors=new Map(active.participants.map(entry=>[entry.actor.id,clean({position:entry.saved.position.toArray(),quaternion:entry.saved.quaternion.toArray(),limbs:entry.saved.limbs.map(x=>x.rotation.toArray())})]));
  context.CM_SCENE.sync(clean(model),{paused:true,suspended:false,simTime:0,showLand:false});assert.equal(scene.p,null);
  for(const entry of active.participants){const restored=snapshotActor(entry.actor),expected=priorActors.get(entry.actor.id);assert.deepEqual(clean({position:restored.position,quaternion:restored.quaternion,limbs:restored.limbs}),expected);assert(!restored.held);}
  assert.equal(JSON.stringify(model),stateBefore);
  console.log('Enactment scene: all eight real Three.js activities, resident arrival/gesture/hold/restore, safe skip/replay/reset, shared-resource cleanup, upgrades/unrelated assets, capital retrofits, one owned firework burst, reduced motion, suspended/resumed timing and no game-state mutation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
