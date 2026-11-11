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
  const harness='\nwindow.__enactSceneTest={initialize,animate,animatePolicyPresentation,placeWalkingActor,actors,world,facilityGroup,projectNodes,policyForecourts,policyBoundsTouchRoad,geometryCache,materialCache,domLabels,get camera(){return camera;},get angle(){return angle;},get p(){return policyPresentation;},get fireworks(){return fireworks;}};';
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
  // Actual selected cards from all years, not a hand-written subset of sites.
  const policies=[];
  for(let year=1;year<=7;year++)for(const resident of E.households())for(const type of ['community','service','capital'])policies.push(choose(year,resident.id,type));
  const emergencies=new Set();
  for(let seed=0;seed<512&&emergencies.size<12;seed++){
    const s=E.create({seed});s.year=6;s.phase='policy';s.cash=100000;s.staffTotal=100;
    for(const issue of E.urgent(s))if(!emergencies.has(issue.residentId)){
      emergencies.add(issue.residentId);
      for(const option of issue.policies){assert(E.choose(s,issue.id,option.id).ok);policies.push({...clean(E.choices(s).find(p=>p.issueId===issue.id)),year:6,kind:option.id==='capital'?'build':'service'});}
    }
  }
  assert.equal(policies.length,162);
  function roadSafe(node,label){
    node.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(node);assert(!scene.policyBoundsTouchRoad(bounds),label+' remains clear of road strips and vehicle overhang: '+JSON.stringify({min:bounds.min.toArray(),max:bounds.max.toArray()}));
  }
  let nonbuild=0,roadside=0,frames=0;
  for(const policy of policies){
    const originalAngle=scene.angle;
    const originals=new Map();for(const [key,building]of scene.projectNodes)if(key.startsWith('building:'))building.traverse(node=>{if(node.isMesh)originals.set(node,{visible:node.visible,material:node.material,shadow:node.castShadow});});
    const p=start(policy);
    if(!p.isBuilding){nonbuild++;assert(p.staging.offsite);assert.equal(p.cutaway.length,0,'service scenes never erase the background building');}
    if(p.staging.offsite)roadside++;
    // The full activity geometry includes boards, tables, workers, planted
    // displays, scaffolds and mobility props, not just its centre point.
    roadSafe(p.group,policy.issueId+' props');
    if(!p.isBuilding){const stageBounds=new THREE.Box3().setFromObject(p.group);for(const [key,building]of scene.projectNodes)if(key.startsWith('building:'))assert(!stageBounds.intersectsBox(new THREE.Box3().setFromObject(building)),policy.issueId+' whole meeting footprint stays outside housing blocks: '+key);}
    for(const age of [0,.3,.6,.9,1.2,1.5,2,2.5,3,3.5,4.3]){
      atAge(age);for(const entry of p.participants)roadSafe(entry.actor.node,policy.issueId+' participant '+entry.actor.id+' at '+age);frames++;
    }
    if(!p.isBuilding){
      for(const [node,original]of originals){assert.equal(node.visible,original.visible);assert.equal(node.material,original.material,'meeting leaves existing architecture intact');}
      const direction=scene.camera.getWorldDirection(new THREE.Vector3());
      for(const entry of p.participants){const head=entry.destination.clone().add(new THREE.Vector3(0,1.8,0)),origin=head.clone().addScaledVector(direction,-140),ray=new THREE.Ray(origin,direction),hit=new THREE.Vector3();for(const [key,building]of scene.projectNodes)if(key.startsWith('building:')){const intersection=ray.intersectBox(new THREE.Box3().setFromObject(building),hit);assert(!intersection||origin.distanceTo(hit)>139.8,policy.issueId+' camera can see the resident without erasing '+key);}}
    }
    for(const item of p.cutaway){assert.equal(item.node.visible,item.visible,'architectural x-ray keeps full storeys visible');assert(item.ghosts?.length);assert(item.ghosts.every(m=>m.transparent&&m.opacity>0&&m.opacity<.3));}
    api.clearPolicyPresentation();for(const [node,original]of originals){assert.equal(node.visible,original.visible);assert.equal(node.material,original.material);assert.equal(node.castShadow,original.shadow);}
    assert.equal(scene.angle,originalAngle,'finishing restores the player’s prior view angle');
    assert.equal(JSON.stringify(model),stateBefore,'safe staging never applies game effects');
  }
  // A void-deck construction preserves the whole upper building as x-ray,
  // rather than the former bare-column cutaway seen in the user screenshot.
  const underBlock=start({policyId:'capital',kind:'build',visual:'corner',assetId:'corner',residentId:'students',year:4,title:'居民角更新'});
  assert(underBlock.cutaway.length,'the real ground-floor site uses an architectural x-ray when obstructed');
  assert(underBlock.cutaway.some(item=>item.node.position.y>3&&item.node.visible));
  api.clearPolicyPresentation();
  const originalTraffic=JSON.stringify(context.HDBScene.diagnostics().vehicles);assert.equal(JSON.stringify(model),stateBefore);assert.equal(originalTraffic,JSON.stringify(context.HDBScene.diagnostics().vehicles),'traffic is retained rather than hidden as a collision workaround');
  console.log('Safe policy staging: all '+policies.length+' selected cards, '+nonbuild+' nonconstruction forecourts, '+roadside+' off-road work/meeting stages and '+frames+' full participant frames pass road-buffer checks; complete buildings stay visible and x-ray materials restore.');
})().catch(error=>{console.error(error);process.exitCode=1;});
