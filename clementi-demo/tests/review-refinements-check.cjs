'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),app=fs.readFileSync(path.join(root,'dist/year-app.js'),'utf8');
const sceneSource=fs.readFileSync(path.join(root,'scene-source.mjs'),'utf8');
function between(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b);}
const box={goals:[['stay','住得下','home'],['social','处得来','people'],['comfort','住得舒服','leaf']],pct:v=>Math.max(0,Math.min(1,(v-30)/50)),icon:()=>'',esc:String,goalLabel:String,w:a=>a,signed:v=>(v>0?'+':v<0?'−':'±')+Math.abs(v)};
vm.createContext(box);vm.runInContext(between(app,'  function goalsHTML(','  function resourcesHTML('),box);
let boundaries=0;
for(const value of [0,30,31,57,79,80,100])for(const future of [0,30,31,56,57,70,80,100]){
  box.metrics={stay:value,social:value,comfort:value};box.preview={after:{stay:future,social:future,comfort:future}};
  const html=vm.runInContext("goalsHTML('policy',metrics,preview)",box);
  for(const match of html.matchAll(/class="yr-goal-ghost[^\"]*" style="left:([\d.]+)%;width:([\d.]+)%"/g))assert(Number(match[1])+Number(match[2])<=100.11,'preview never overruns its track');
  assert.equal(html.includes('has-delta'),box.pct(value)!==box.pct(future),'only visible differences split the bar');boundaries++;
}
const menu={CM_SOUND:{muted:false,prefs(){return {muted:this.muted};},set(p){this.muted=p.muted;},settingsHTML(){return '<p>volume controls</p>';}}};
Object.assign(box,{root:menu,open:(...args)=>box.opened=args,btn:(action,label)=>'<button data-action="'+action+'">'+label+'</button>'});
vm.runInContext(between(app,'  function moreMenu(','  // Leaving the decision panel'),box);
vm.runInContext('moreMenu()',box);for(const action of ['settings','mute','sound','language'])assert(box.opened[1].includes('data-action="'+action+'"'));
vm.runInContext('toggleSound()',box);assert.equal(menu.CM_SOUND.muted,true);assert(box.opened[1].includes('取消静音'));
vm.runInContext('toggleSound()',box);assert.equal(menu.CM_SOUND.muted,false);
vm.runInContext('soundSettings()',box);assert(box.opened[1].includes('volume controls'));
const index=fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),nav=index.match(/<nav class="year-tools[\s\S]*?<\/nav>/)[0];
assert(!nav.includes('data-year-action="language"'),'language has moved out of the main header');
assert(index.includes('src="year-policy-dialogue.js"'));
(async()=>{
  const THREE=await import(require('node:url').pathToFileURL(path.join(root,'vendor/three.module.js')).href);
  const stage=new THREE.Scene(),world=new THREE.Group(),facilities=new THREE.Group();stage.add(world);world.add(facilities);world.position.set(7,0,-3);
  const facility=new THREE.Mesh(new THREE.BoxGeometry(4,8,4),new THREE.MeshBasicMaterial());facility.position.set(22,4,-15);facility.userData.plotId='plot-a';facilities.add(facility);
  const context={THREE,scene:stage,world,facilityGroup:facilities,plotIds:['plot-a'],state:{plots:[{cardId:'child',placement:{x:5,z:-2}}]},resolvedPlacement:()=>({x:22,z:-15}),window:{CM_YEAR_APP:{}},observedState:null,observedPlots:[],celebrateAt:()=>{context.calls++;},calls:0};
  vm.createContext(context);vm.runInContext(between(sceneSource,'function celebrationPosition(','function celebrateAt('),context);
  const location=vm.runInContext('celebrationPosition(0)',context),actual=new THREE.Vector3();facility.getWorldPosition(actual);
  assert.equal(location.x,actual.x);assert.equal(location.z,actual.z);assert(location.y>new THREE.Box3().setFromObject(facility).max.y,'burst is above its actual retained model');
  vm.runInContext(between(sceneSource,'function syncCelebrations(','function animateFireworks('),context);
  context.observedState=context.state;vm.runInContext('syncCelebrations()',context);assert.equal(context.calls,0,'annual settlement never launches bursts at every facility');
  context.window.CM_YEAR_APP=null;context.state.plots[0].cardId='corner';vm.runInContext('syncCelebrations()',context);assert.equal(context.calls,1,'legacy real-time completion still celebrates');
  const completion=sceneSource.match(/ if\(motion&&p\.isBuilding&&age>=3\.8[^\n]+/)[0];
  const owner={isBuilding:true,celebrated:false,celebrationAnchor:new THREE.Vector3(29,9,-18)};
  let bursts=0;const active={p:owner,motion:true,age:3.7,celebrateAt:(position,p)=>{assert.equal(position,owner.celebrationAnchor);assert.equal(p,owner);bursts++;}};
  vm.createContext(active);vm.runInContext(completion,active);assert.equal(bursts,0);active.age=3.9;vm.runInContext(completion,active);vm.runInContext(completion,active);assert.equal(bursts,1,'only the completed active project launches once');
  console.log('Review refinements: '+boundaries+' preview boundaries, More/sound actions, actual model coordinates and single-project fireworks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
