import * as THREE from './vendor/three.module.js';

// A continuous illustrative Clementi neighbourhood; these are game-design
// positions, not surveyed parcels or approved sites for development.
const C={ground:0x7f846d,paving:0xcfb99b,road:0x555666,cream:0xe8d0ae,wall:0xb9aaa9,pale:0xd6b5a8,coral:0xc47568,teal:0x497f7b,mint:0x83a993,navy:0x303b57,dark:0x343548,amber:0xffc66d,orange:0xec9852,leaf:0x456c52,lightLeaf:0x779765,wood:0x805747,metal:0x6b7183,skin:0xd79e73};
const fallbackPlotIds=['route','void','room','garden','crossing','locked'];
const plotDefinitions=window.CM_DATA?.plots||[];
const plotIds=plotDefinitions.length?plotDefinitions.map(p=>p.id):fallbackPlotIds;
const fallbackPositions=[[-16,3],[-29,-3],[-11,-11],[6,27],[12.5,11.2],[34,-10]];
const plotPositions=plotIds.map((id,i)=>plotDefinitions[i]?.scenePosition||fallbackPositions[i]||[-44,5]);
const fallbackSizes=[[16,2.7],[9,3.5],[5.2,4.6],[8.5,8.5],[2.8,5.2],[5.8,23]];
const plotSizes=plotIds.map((id,i)=>plotDefinitions[i]?.sceneSize||fallbackSizes[i]||[6,4]);
const fallbackPlotNames=['食阁—车站步行段','A栋底层空间','社区空置房间','街角花园地块','旧组屋出口与过街处','既有建筑与规划保留区'];
const plotNames=plotIds.map((id,i)=>plotDefinitions[i]?.name||fallbackPlotNames[i]||id);
const residentNames={chen:'陈玉英',rahman:'拉赫曼夫妇',lin:'林家',kumar:'库马尔一家',students:'合租学生',huang:'黄美兰',zhang:'张叔',ali:'阿丽'};
const residentPositions={chen:[-27,0,1],rahman:[-12,0,-15],lin:[9,0,-36],kumar:[31,0,27],students:[-32,0,-18],huang:[-3,0,7],zhang:[-24,0,-2],ali:[35,0,-19]};
const issueAnchors={route:'route',noise:'void',neighbours:'void',housing:'rahman',waiting:'rahman',explain:'rahman',care:'kumar',carealt:'kumar',land:'garden',petition:'room',ballot:'room',stall:'huang',return:'chen'};
const scene=new THREE.Scene(),world=new THREE.Group(),facilityGroup=new THREE.Group(),storyGroup=new THREE.Group();
scene.add(world);world.add(facilityGroup,storyGroup);
const geometryCache=new Map(),materialCache=new Map(),projectNodes=new Map();
const staticHits=[],facilityHits=[],actors=[],walkers=[],traffic=[],clouds=[],domLabels=[],issueLabels=new Map(),plotLabels=[],selectionTiles=[],fireworks=[];
let renderer,camera,container,labelLayer,resizeObserver;
let state=null,options={placed:true,view:'neighborhood',selected:null,selectedPlot:null,validPlots:[],showLand:true,paused:true,simTime:0,language:'zh',issues:[]};
const defaultAngle=-Math.PI*.22,pointers=new Map(),panOffset=new THREE.Vector3();
let angle=defaultAngle,zoomLevel=1,gesture=null,lastMapTap=null,hoverTarget=null,signature='',storySignature='',ready=false,lastFrame=0,lastSync=0,simRate=1,previousSim=0,animationClock=0;
const cameraTarget=new THREE.Vector3(0,9,0),cameraPosition=new THREE.Vector3();
let focusTarget=null,focusedIssue=null,fireworksLaunched=0;
const celebratedEvents=new Set(),balconyResidents=[];
const workerActors=[],socialActors=[],cueEffects=[],constructionModels=[];
const constructionStarted=new Map();
const previewGroup=new THREE.Group();scene.add(previewGroup);let previewSelection=null,vehicleMinDistance=Infinity,vehicleOverlaps=0;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
function t(text){return window.CM_I18N?.t?window.CM_I18N.t(text):text;}
function bilingual(zh,en){return options.language==='en'?en:zh;}
function plotLocked(index){return plotIds[index]==='locked'||plotDefinitions[index]?.kind==='locked';}
function geo(type,args){const key=type+args.join(',');if(!geometryCache.has(key))geometryCache.set(key,type==='box'?new THREE.BoxGeometry(...args):type==='sphere'?new THREE.SphereGeometry(...args):new THREE.CylinderGeometry(...args));return geometryCache.get(key);}
function mat(color,{emissive=false,transparent=false,opacity=1}={}){const key=[color,emissive,transparent,opacity].join('|');if(!materialCache.has(key))materialCache.set(key,new THREE.MeshLambertMaterial({color,emissive:emissive?color:0,emissiveIntensity:emissive?.55:0,transparent,opacity}));return materialCache.get(key);}
function mesh(type,args,color,x,y,z,parent=world,extra={}){const m=new THREE.Mesh(geo(type,args),mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,color,x,y,z,parent=world,extra={}){return mesh('box',[w,h,d],color,x,y,z,parent,extra);}
function cylinder(r,h,color,x,y,z,parent=world,n=8){return mesh('cylinder',[r,r,h,n],color,x,y,z,parent);}
function sphere(r,color,x,y,z,parent=world){return mesh('sphere',[r,6,4],color,x,y,z,parent);}
function target(node,kind,id,hits=staticHits){node.traverse(o=>{if(o.isMesh){o.userData.kind=kind;o.userData.id=id;hits.push(o);}});projectNodes.set(kind+':'+id,node);return node;}
function getPlotIndex(id){return typeof id==='number'?id:plotIds.indexOf(id);}
function callAction(kind,id){if(kind==='issue')window.CM_APP?.showIssue?.(id);else if(kind==='resident')window.CM_APP?.showResident?.(id);else if(kind==='plot'){const key=plotIds[getPlotIndex(id)];if(!options.selected||options.validPlots.includes(key))window.CM_APP?.showPlot?.(key);}else window.DownstairsUI?.sceneBuilding?.();}

// Readable labels remain full-resolution DOM; only the physical world uses the
// low-poly/pixel-inspired art direction.
function registerDomLabel(anchor,value,{kind=null,id=null,background='#263347e8',color='#fff0d2',border='#e7be8699',size=12,offsetY=0,priority=0}={}){
  const node=document.createElement(kind==='issue'?'div':kind?'button':'span');
  const content=kind==='issue'?document.createElement('button'):node;
  node.className='scene-text-label'+(kind?' scene-clickable-label':'')+(kind==='issue'?' scene-issue-pin':'');
  if(kind){content.type='button';content.dataset.sceneKind=kind;content.dataset.sceneId=String(id);content.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();callAction(kind,id);});node.addEventListener('pointerdown',e=>e.stopPropagation());}
  Object.assign(node.style,{position:'absolute',display:'none',pointerEvents:kind?'auto':'none',cursor:kind?'pointer':'default',color,background,border:'1px solid '+border,borderRadius:kind==='issue'?'7px':'4px',padding:kind==='issue'?'0':kind?'5px 8px':'3px 7px',font:'600 '+size+'px/1.45 system-ui,"Microsoft YaHei","PingFang SC",sans-serif',letterSpacing:'.01em',whiteSpace:kind==='issue'?'normal':'nowrap',textAlign:'left',transform:'translate(-50%,-100%)',textShadow:'none',boxShadow:'0 3px 9px #19213745',imageRendering:'auto',WebkitFontSmoothing:'antialiased'});
  let dismiss=null;
  if(kind==='issue'){
    dismiss=document.createElement('button');dismiss.type='button';dismiss.className='scene-issue-dismiss';dismiss.textContent='×';
    dismiss.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.CM_APP?.dismissIssueMarker?.(id);});
    content.className='scene-issue-open';node.append(content,dismiss);
  }
  labelLayer.append(node);const label={anchor,node,content,dismiss,value,kind,id,offsetY,priority};domLabels.push(label);updateLabelText(label);return label;
}
function updateLabelText(label){const value=typeof label.value==='function'?label.value():t(label.value);if(label.content.textContent!==value)label.content.textContent=value;label.content.setAttribute('aria-label',value.replace(/\n/g,' '));if(label.dismiss){label.dismiss.setAttribute('aria-label',bilingual('收起这条新情况提示','Minimize this new issue notice'));label.dismiss.title=label.dismiss.getAttribute('aria-label');}}
function textSprite(value,x,y,z,parent=world,opts={}){const anchor=new THREE.Object3D();anchor.position.set(x,y,z);parent.add(anchor);registerDomLabel(anchor,value,opts);return anchor;}
function sign(value,w,h,x,y,z,parent=world,{background='#bc7558',color='#fff0cf',kind=null,id=null}={}){const board=box(w,h,.12,background,x,y,z,parent);registerDomLabel(board,value,{background:background+'ef',color,kind,id,size:12,offsetY:4});return board;}
function updateDomLabels(){
 if(!camera)return;
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const w=container.clientWidth,h=container.clientHeight,point=new THREE.Vector3();
 for(let i=domLabels.length-1;i>=0;i--){
  const label=domLabels[i];let parent=label.anchor,attached=false,visible=true;
  while(parent){if(!parent.visible)visible=false;if(parent===scene){attached=true;break;}parent=parent.parent;}
  if(!attached){label.node.remove();domLabels.splice(i,1);continue;}
  if(options.selected&&!label.candidate)visible=false;
  else if(label.kind==='plot'&&!label.candidate&&!options.showLand)visible=false;
  label.anchor.getWorldPosition(point);point.project(camera);
  if(!visible||point.z< -1||point.z>1||point.x< -1.1||point.x>1.1||point.y< -1.15||point.y>1.2){label.node.style.display='none';continue;}
  label.node.style.display='block';
  label.node.style.left=Math.round((point.x+1)*.5*w)+'px';
  label.node.style.top=Math.round((1-point.y)*.5*h+label.offsetY)+'px';
  label.node.style.zIndex=String(label.priority+Math.round(1000-point.z*100));
 }
}
function tree(x,z,parent=world,size=1){const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);cylinder(.17*size,2.5*size,C.wood,0,1.3*size,0,g);[[-.7,3.1,0,1.7],[.65,3.8,.3,1.8],[0,4.5,-.2,1.65],[1.1,3.1,-.5,1.4],[-.9,4,.6,1.4]].forEach(([a,b,c,d],i)=>{const leaf=box(d*size,1.2*size,d*.9*size,i%2?C.leaf:C.lightLeaf,a*size,b*size,c*size,g);leaf.rotation.y=i*.32;});return g;}
function planter(x,z,parent=world,size=.65){box(size,.5,size,C.coral,x,.4,z,parent);sphere(size*.63,C.leaf,x,.9,z,parent);sphere(size*.42,C.lightLeaf,x+.1,1.2,z,parent);}
function bench(x,z,parent=world,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);for(let k=0;k<3;k++)box(2.05,.1,.17,C.wood,0,.78,-.23+k*.2,g);box(2.05,.14,.13,C.wood,0,1.17,-.37,g);box(2.05,.14,.13,C.wood,0,.98,-.37,g);for(const a of [-.78,.78])box(.12,.75,.55,C.navy,a,.4,0,g);return g;}
function lamp(x,z,parent=world){cylinder(.07,3.4,C.dark,x,1.75,z,parent);box(.7,.12,.7,C.navy,x,3.53,z,parent);box(.4,.42,.4,C.amber,x,3.23,z,parent,{emissive:true});}

function addSideWindows(g,w,d,levels=1,startY=1.8,spacing=2.2){
 for(let f=0;f<levels;f++){const y=startY+f*spacing;for(const x of [-w*.3,0,w*.3]){box(Math.min(1.2,w/5),.9,.055,C.navy,x,y,-d/2-.04,g);box(Math.min(.98,w/6),.7,.035,C.amber,x,y,-d/2-.08,g,{emissive:true});}
 for(const side of [-1,1])for(const z of [-d*.25,d*.25]){box(.055,.9,Math.min(1.1,d/3),C.navy,side*(w/2+.04),y,z,g);box(.035,.7,Math.min(.9,d/3.4),C.amber,side*(w/2+.08),y,z,g,{emissive:true});}}
}
function resolvedPlacement(index,placement){
 const [x,z]=plotPositions[index],offset=placement||{},plot=plotDefinitions[index];
 const xLimit=plot?.placementBounds?.x??Infinity,zLimit=plot?.placementBounds?.z??Infinity;
 return{x:x+THREE.MathUtils.clamp(Number(offset.x)||0,-xLimit,xLimit),z:z+THREE.MathUtils.clamp(Number(offset.z)||0,-zLimit,zLimit),rotation:plot?.sceneRotation??(Number(offset.rotation)||0)};
}
function setGroupPlacement(g,index,placement){const p=resolvedPlacement(index,placement);g.position.set(p.x,0,p.z);g.rotation.y=p.rotation;return g;}

function makePerson({shirt=C.teal,skin=C.skin,scale=1,child=false,id=null,hair=null,elder=false,accessory=null}={}){
 const profiles={chen:{hair:0xb7b3b1,elder:true,accessory:'cane',skirt:true},rahman:{hair:0xaaa6a0,elder:true,accessory:'glasses'},lin:{hair:0x38313a,accessory:'bag',longHair:true},kumar:{hair:0x292b30,beard:true},students:{hair:0x272a35,accessory:'backpack'},huang:{hair:0xb0a59b,elder:true,apron:true,longHair:true},zhang:{hair:0xc3b9ad,elder:true,accessory:'clipboard',cap:true},ali:{hair:0x2b2934,longHair:true,accessory:'bag'}};
 const profile={hair:hair||0x3b333c,elder,accessory,...profiles[id]},g=new THREE.Group();g.scale.setScalar(scale);g.userData.personId=id;
 const torso=box(.52,.73,.35,shirt,0,1.12,0,g);if(profile.elder)torso.rotation.x=.08;
 box(.39,.43,.36,skin,0,1.72,0,g);box(.43,.18,.4,profile.hair,0,1.98,-.015,g);
 box(.43,.22,.13,profile.hair,0,1.79,-.18,g);
 if(profile.longHair){box(.18,.38,.18,profile.hair,.2,1.72,-.15,g);sphere(.14,profile.hair,0,1.91,-.25,g);}
 if(profile.cap){box(.48,.1,.43,C.teal,0,2.05,0,g);box(.44,.05,.19,C.teal,0,2.01,.23,g);}
 const eyes=[],brows=[];for(const x of [-.105,.105]){box(.11,.09,.025,0xfaf0dc,x,1.76,.187,g);eyes.push(box(.045,.055,.035,C.dark,x,1.76,.205,g));brows.push(box(.12,.025,.035,profile.hair,x,1.85,.21,g));}
 const mouth=box(.1,.028,.035,C.dark,0,1.61,.206,g),mouthCorners=[box(.035,.035,.035,C.dark,-.067,1.61,.206,g),box(.035,.035,.035,C.dark,.067,1.61,.206,g)];box(.06,.07,.06,skin,0,1.69,.21,g);
 if(profile.beard)box(.32,.085,.08,profile.hair,0,1.56,.17,g);
 if(profile.accessory==='glasses'||id==='chen'||id==='zhang')for(const x of [-.11,.11]){box(.16,.025,.04,C.dark,x,1.81,.23,g);box(.16,.025,.04,C.dark,x,1.69,.23,g);for(const d of [-.075,.075])box(.025,.14,.04,C.dark,x+d,1.75,.23,g);}
 if(profile.apron)box(.39,.58,.045,C.cream,0,1.08,.2,g);
 if(profile.skirt)box(.55,.4,.41,0x75667f,0,.76,0,g);
 const legs=[],arms=[];for(const x of [-.15,.15]){const pivot=new THREE.Group();pivot.position.set(x,.79,0);g.add(pivot);box(.18,.63,.2,C.navy,0,-.31,0,pivot);box(.23,.13,.38,C.dark,0,-.63,.07,pivot);legs.push(pivot);}
 for(const x of [-.35,.35]){const pivot=new THREE.Group();pivot.position.set(x,1.4,0);g.add(pivot);box(.17,.21,.2,shirt,0,-.09,0,pivot);box(.14,.43,.17,skin,0,-.38,0,pivot);arms.push(pivot);}
 if(profile.accessory==='cane'){box(.055,1.13,.055,C.wood,.43,.62,.16,g);box(.18,.07,.07,C.wood,.37,1.18,.16,g);}
 if(profile.accessory==='backpack'){box(.43,.52,.25,0x89765b,0,1.17,-.28,g);for(const x of [-.17,.17])box(.045,.58,.05,0x89765b,x,1.24,.2,g);}
 if(profile.accessory==='bag'){box(.24,.38,.2,C.wood,.35,.92,.05,g);box(.035,.55,.05,C.cream,.25,1.27,.19,g);}
 if(profile.accessory==='clipboard'){box(.3,.4,.055,C.cream,.43,1.03,.25,g);box(.16,.035,.065,C.teal,.43,1.15,.29,g);}
 g.userData.limbs={legs,arms};g.userData.face={eyes,brows,mouth,mouthCorners};g.userData.profile=profile;if(child)g.scale.multiplyScalar(.6);return g;
}

function routePoint(points,progress){const lengths=[],total=points.slice(1).reduce((sum,p,i)=>{const len=Math.hypot(p[0]-points[i][0],p[1]-points[i][1]);lengths.push(len);return sum+len;},0);let distance=((progress%1)+1)%1*total;for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const a=points[i],b=points[i+1],f=lengths[i]?distance/lengths[i]:0;return{x:a[0]+(b[0]-a[0])*f,z:a[1]+(b[1]-a[1])*f,angle:Math.atan2(b[0]-a[0],b[1]-a[1])};}distance-=lengths[i];}return{x:points[0][0],z:points[0][1],angle:0};}
function placeWalkingActor(actor,clock){
 let path=actor.path,speed=actor.speed||50;
 if(actor.id==='chen'){
  const coverIndex=state?.plots?.findIndex(p=>p?.cardId==='cover'&&p.status==='complete')??-1,covered=coverIndex>=0||!!state?.flags?.completed?.cover;
  const selected=coverIndex>=0?plotPositions[coverIndex]:[-16,3];
  path=covered?[[-27,1],[selected[0]-Math.min(6,plotSizes[Math.max(0,coverIndex)]?.[0]/2||6),selected[1]],[selected[0]+Math.min(6,plotSizes[Math.max(0,coverIndex)]?.[0]/2||6),selected[1]],[-11,2],[-5,7],[-11,2],[-27,1]]:actor.detourPath;speed=covered?65:84;
 }
 let phase=(clock+(actor.offset||0))/speed,walking=true;
 if(actor.id==='chen'&&!state?.flags?.completed?.cover){const cycle=((clock%84)+84)%84;if(cycle>16&&cycle<29){phase=16/84;walking=false;}}
 const p=routePoint(path,phase);actor.node.position.set(p.x,.2,p.z);actor.node.rotation.y=p.angle;
 const swing=walking?Math.sin(clock*5.2+(actor.offset||0))*.38:0;actor.node.userData.limbs?.legs.forEach((leg,i)=>leg.rotation.x=i?swing:-swing);actor.node.userData.limbs?.arms.forEach((arm,i)=>arm.rotation.x=i?-swing:swing);
 const group={chen:'elders',rahman:'owners',lin:'families',kumar:'care',students:'renters',huang:'elders',zhang:'elders',ali:'renters'}[actor.id];
 const concernKinds={chen:['route','noise'],rahman:['housing','waiting'],lin:['land','childcare'],kumar:['care','carealt'],students:['noise'],huang:['stall'],zhang:['petition','rumor'],ali:['noise']}[actor.id]||[];const concern=(state?.issues||options.issues||[]).some(i=>i.status!=='resolved'&&i.stage>0&&(concernKinds.includes(i.id)||i.anchor===actor.id));const value=state?.groups?.[group]??70;
 const mood=concern||value<40?'worried':value>=68?'content':'neutral';const face=actor.node.userData.face;
 if(face){face.mouth.scale.y=mood==='worried'?2.1:1;face.mouth.rotation.z=0;face.mouthCorners?.forEach(c=>c.position.y=mood==='content'?1.646:mood==='worried'?1.579:1.61);face.brows.forEach((b,i)=>b.rotation.z=mood==='worried'?(i?-.28:.28):0);}
 actor.node.userData.mood=mood;if(walking&&state?.flags?.neighbourHelp&&['students','chen','ali'].includes(actor.id)&&Math.sin(clock*.18)>.92){const arm=actor.node.userData.limbs?.arms[0];if(arm){arm.rotation.z=-1.1;arm.rotation.x=Math.sin(clock*4)*.22;}}else actor.node.userData.limbs?.arms.forEach(a=>a.rotation.z=0);
}

function balconyDetails(g,a,y,z,side,variant){
 const sill=y-.69;
 box(1.5,.14,.69,C.cream,a,sill,z+side*.25,g);
 if(variant===0){
  box(.57,.25,.35,C.coral,a-.36,sill+.19,z+side*.27,g);
  box(.48,.27,.32,C.lightLeaf,a-.36,sill+.44,z+side*.27,g);
  box(.38,.2,.33,C.wood,a+.3,sill+.18,z+side*.3,g);
  box(.32,.28,.28,C.leaf,a+.3,sill+.41,z+side*.3,g);
 }else if(variant===1){
  box(1.21,.048,.07,C.metal,a,y+.16,z+side*.54,g);
  for(let i=0;i<3;i++)box(.32,.48+i%2*.15,.05,[C.mint,C.pale,C.coral][i],a-.4+i*.4,y-.15,z+side*.56,g);
 }else if(variant===2){
  const flag=new THREE.Group();flag.position.set(a,y-.45,z+side*.4);flag.rotation.y=side===1?0:Math.PI;g.add(flag);
  box(.92,.3,.05,0xd84451,0,.14,0,flag);
  box(.92,.3,.05,0xf9eddc,0,-.16,0,flag);
  box(.14,.14,.05,0xf9eddc,-.27,.15,.027,flag);
  box(.11,.115,.05,0xd84451,-.235,.15,.053,flag);
  for(const [x,h] of [[-.1,.21],[-.015,.24],[.067,.195],[.035,.118],[-.061,.113]])box(.04,.04,.025,0xf9eddc,x,h,.044,flag);
 }else{
  const person=new THREE.Group();person.position.set(a+.14,y-.61,z+side*.21);person.rotation.y=side===1?0:Math.PI;g.add(person);
  box(.42,.46,.25,C.teal,0,.27,0,person);
  box(.28,.28,.27,C.skin,0,.65,0,person);
  box(.29,.1,.27,C.dark,0,.82,-.01,person);
  const arm=new THREE.Group();arm.position.set(.27,.43,0);person.add(arm);
  box(.13,.37,.15,C.skin,0,-.09,0,arm);
  box(.48,.07,.09,C.wood,-.15,.07,.2,person);
  balconyResidents.push({person,arm,phase:balconyResidents.length*.81});
 }
}

function hdbSlab(g,id,w,h,d,color,seed,detail=true){
 const floors=Math.max(3,Math.round((h-2.8)/2.35));
 target(box(w,h-2.8,d,color,0,(h+2.8)/2,0,g),'building',id);
 for(const zSide of [-d*.38,d*.38])for(let a=-w/2+.7;a<w/2;a+=3)box(.4,2.8,.45,C.cream,a,1.45,zSide,g);
 box(w+.35,.3,d+.35,C.cream,0,2.75,0,g);
 box(w+.55,.28,d+.55,C.cream,0,h+.12,0,g);
 for(let floor=0;floor<floors;floor++){
  const y=3.8+floor*2.3;
  for(const side of [-1,1]){
   box(w+.17,.18,.15,[C.coral,C.cream,C.teal][floor%3],0,y-.85,side*(d/2+.12),g);
   for(let i=0,a=-w/2+1.2;a<w/2-.5;a+=2.35,i++){
    const pane=(floor+i+seed)%3!==0,z=side*d/2;
    box(1.35,1.25,.07,C.dark,a,y,z+side*.04,g);
    box(1.06,1.04,.04,pane?C.amber:0x65747d,a,y,z+side*.09,g,{emissive:pane});
    box(.05,1.1,.06,C.cream,a,y,z+side*.14,g);
    box(1.25,.06,.06,C.cream,a,y,z+side*.14,g);
    const home=seed+floor*2+i*3+(side>0?4:0);
    if(detail&&home%7===0)balconyDetails(g,a,y,z,side,Math.floor(home/7)%4);
   }
  }
  for(const end of [-1,1])for(const a of [-d*.25,d*.25]){
   box(.07,1.15,1.1,C.dark,end*(w/2+.04),y,a,g);
   box(.04,.93,.9,0x8e9a98,end*(w/2+.09),y,a,g);
  }
 }
}

function oldHDB(id,x,z,w=18,h=15,d=5,rotation=0,color=C.wall){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;world.add(g);
 const seed=id.charCodeAt(0)-97;
 hdbSlab(g,id,w,h,d,color,seed);
 const wings={a:[-w/2+2.25,-d/2-3.5,7,11,4.4],f:[w/2-2.25,d/2+2.1,4.2,12,4.5]};
 if(wings[id]){
  const [x,z,length,height,depth]=wings[id],wing=new THREE.Group();
  wing.position.set(x,0,z);wing.rotation.y=Math.PI/2;g.add(wing);
  hdbSlab(wing,id,length,height,depth,color,seed+5,false);
 }else if(id==='c'||id==='g'){
  box(w*.53,2.35,d*.82,color,w*.14,h+1.2,0,g);
  box(w*.54,.23,d*.85,C.cream,w*.14,h+2.47,0,g);
  addSideWindows(g,w,d,1,h+1.18);
 }
 box(1.1,h+.5,d+.2,C.pale,-w/2+.65,(h+.5)/2,0,g);
 cylinder(.55,1.2,0x758a81,-w/2+3,h+.85,0,g);
 box(2,1.5,2.1,C.pale,w/2-2,h+.9,0,g);
 sign('旧组屋 '+id.toUpperCase(),2.1,.5,-w/2+.7,2.05,d/2+.35,g,{background:'#b57b65'});
 projectNodes.set('building:'+id,g);g.userData.windowFaces=4;return g;
}

function tower(id,x,z,height,color){
 const g=new THREE.Group();g.position.set(x,0,z);world.add(g);target(box(8,height,8,color,0,height/2+.2,0,g),'building',id);box(8.6,.35,8.6,C.cream,0,height+.35,0,g);
 for(let f=0;f<height/2.2;f++){box(8.1,.13,8.1,f%3?C.cream:C.teal,0,1.4+f*2.2,0,g);for(const a of [-2.65,-.9,.9,2.65])for(const side of [-1,1]){box(1.05,1.25,.06,(f+Math.round(a))%3?C.amber:0x61747b,a,1.9+f*2.2,side*4.04,g,{emissive:f%3!==0});box(.06,1.25,1.05,C.amber,side*4.04,1.9+f*2.2,a,g,{emissive:f%3!==0});}}
 box(2.4,height+1,2.8,C.pale,-2.7,(height+1)/2,-2.65,g);g.userData.windowFaces=4;return g;
}

function path(x1,z1,x2,z2,width=2.3,color=C.paving){const length=Math.hypot(x2-x1,z2-z1),piece=box(width,.1,length,color,(x1+x2)/2,.17,(z1+z2)/2);piece.rotation.y=Math.atan2(x2-x1,z2-z1);return piece;}
function createSky(){const cv=document.createElement('canvas');cv.width=8;cv.height=1024;const ctx=cv.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,1024);gradient.addColorStop(0,'#535871');gradient.addColorStop(.46,'#ad8a94');gradient.addColorStop(.75,'#e1a987');gradient.addColorStop(1,'#c9b39a');ctx.fillStyle=gradient;ctx.fillRect(0,0,8,1024);scene.background=new THREE.CanvasTexture(cv);scene.fog=new THREE.Fog(0xa29b91,120,235);for(let i=0;i<9;i++){const g=new THREE.Group();g.position.set(-100+i*25,35+(i%3)*4,-91-(i%2)*18);world.add(g);for(let k=0;k<4;k++){const cloud=box(8+k%2*3,1.6,4.8,0xd5c4bf,k*5,Math.sin(k*2)*.8,0,g,{transparent:true,opacity:.48});cloud.castShadow=false;}clouds.push({node:g,x:g.position.x,phase:i*17});}}
function createGround(){
 box(320,1,300,C.ground,0,-.65,-15);
 for(const z of [-55,17,46])box(180,.1,6,C.road,0,.06,z);
 for(const x of [-62,18,62])box(6,.1,107,C.road,x,.07,-4.5);
 // Markings stop before each junction. Footpaths run beside, never across it.
 for(const z of [-55,17,46])for(let x=-85;x<87;x+=5)if(![-62,18,62].some(j=>Math.abs(x-j)<5.4))box(2,.025,.13,C.cream,x,.14,z);
 for(const x of [-62,18,62])for(let z=-52;z<48;z+=5)if(![-55,17,46].some(j=>Math.abs(z-j)<5.4))box(.13,.025,2,C.cream,x,.15,z);
 for(const z of [12.5,21.5,41.8,50])for(const span of [[-58,12],[24,58]])path(span[0],z,span[1],z,2.2);
 for(const x of [13.5,22.5])for(const span of [[-50,10],[24,39],[53,59]])path(x,span[0],x,span[1],2.2);
 for(const [x,z]of [[-62,17],[62,17]]){
  for(let k=0;k<7;k++){box(.45,.03,5.2,C.cream,x-1.8+k*.6,.18,z-5.1);box(5.2,.03,.45,C.cream,x-5.1,.18,z-1.8+k*.6);}
  for(const side of [-1,1]){box(2.35,.03,.2,C.cream,x+side*1.5,.18,z+side*4.2);box(.2,.03,2.35,C.cream,x+side*4.2,.18,z-side*1.5);}
 }
 for(const z of [17,46]){
  for(let k=0;k<7;k++)box(2.4,.025,.32,C.cream,12.5,.14,z-2.55+k*.85);
  for(const end of [-1,1]){
   const curb=new THREE.Group();world.add(curb);
   if(end===-1)projectNodes.set('space:'+(z===17?'crossing':'crossing-b'),curb);
   box(2.7,.16,1.2,C.paving,12.5,.16,z+end*3.63,curb);
   box(2.4,.035,.38,C.amber,12.5,.26,z+end*3.4,curb);
  }
  path(13.5,z-9,12.5,z-7.9,2.2);
  path(12.5,z-7.9,12.5,z-3.85,2.6);
  path(12.5,z+3.8,13.5,z+7.3,2.2);
 }
 [[-48,-14,-17,-14],[-41,2,12,2],[-30,2,-30,12],[-12,-15,-12,2],[-10,2,-4,8],[-44,25,12,25],[-24,25,-24,42],[-8,25,-8,40],[25,-20,47,-20],[30,-20,30,12],[27,25,47,25],[36,25,36,42],[4,-36,4,-28]].forEach(p=>path(...p,2.3));
 for(const id of ['route','route-west','route-b']){
  const i=getPlotIndex(id);if(i<0)continue;
  const [x,z]=plotPositions[i],[width,depth]=plotSizes[i];
  path(x-width/2,z,x+width/2,z,depth,0xd7c3a4);
 }
 path(-12,9.5,-8.9,8,2.3);
 oldHDB('a',-29,-4,22,15,5);
 oldHDB('b',-9,-21,23,16,5);
 oldHDB('c',6.6,-28,10.8,17,5);
 oldHDB('d',-44,-24,19,14,5,Math.PI/2,C.pale);
 oldHDB('e',-32,28,21,14,5);
 oldHDB('f',-8,36,22,15,5);
 oldHDB('g',35,30,22,16,5);
 oldHDB('h',34,-10,23,17,5,Math.PI/2,C.pale);
 tower('new-1',-10,-43,30,0xc4b5a9);tower('new-2',8,-46,34,0xb9b5ac);
 textSprite('新组屋',0,32,-43,world,{background:'#4c5e6be8'});
 createHawker();createMarket();createTransit();createShoppingCentre();
 for(const def of plotDefinitions.filter(p=>p.kind==='room')){
  const [x,z]=def.scenePosition,room=new THREE.Group();room.position.set(x,0,z);world.add(room);
  box(5,2.7,4.2,C.pale,0,1.55,0,room);
  box(5.3,.23,4.5,C.cream,0,3.05,0,room);
  box(1.1,1.95,.09,C.teal,0,1.25,2.16,room);
  box(1.2,.8,.08,C.amber,-1.6,1.9,2.17,room,{emissive:true});
  addSideWindows(room,5,4.2,1,1.9);projectNodes.set('space:'+def.id,room);
 }
 const garden=new THREE.Group();world.add(garden);projectNodes.set('space:garden',garden);
 box(8.6,.12,8.6,0x829a6b,6,.19,27,garden);
 bench(4,29,garden);planter(8,24,garden);tree(9.8,30.2,garden,.7);garden.add(path(3,24,9,29,1.4));
 for(const id of ['hawker-annex','mall-forecourt','mrt-link']){
  const i=getPlotIndex(id);if(i<0)continue;
  const [x,z]=plotPositions[i],[w,d]=plotSizes[i];box(w,.12,d,0xbca98e,x,.15,z);
 }
 path(-2,-4,-2,2,2.7);path(45,9,53,9,2.5);path(40,-28,40,-19,3.4);
 path(13,-36,13,-24,2.1);
  box(18,.13,10,0x6f8d62,-46,.16,37);path(-51,35,-39,39,2.2);path(-47,33,-43,41,2.2);bench(-47,37);bench(-41,39,world,Math.PI);textSprite('邻里公园',-46,2,34,world,{background:'#4c6a55e8'});
  const trees=[[-53,-35],[-38,-37],[-27,-33],[-22,-29],[-49,-7],[-37,8],[-24,8],[-18,7],[-1,-29],[12,-37],[27,-34],[47,-30],[49,-14],[45,5],[50,13],[-52,32],[-49,43],[-48,51],[-40,52],[-34,50],[-29,47],[-29,36],[-54,53],[-22,47],[-15,46],[1,44],[9,41],[27,38],[44,38],[48,26],[52,32],[-58,-49],[35,-46],[52,-47]];trees.forEach(([x,z],i)=>{for(const roadZ of [-55,17,46])if(Math.abs(z-roadZ)<5)z=roadZ+(z>=roadZ?5:-5);for(const roadX of [-62,18,62])if(Math.abs(x-roadX)<5)x=roadX+(x>=roadX?5:-5);tree(x,z,world,.85+(i%4)*.18);});[[-34,10],[-19,10],[-2,11],[10,11],[26,11],[44,11],[-34,23],[-14,23],[6,23],[27,23],[46,23],[12,-20],[24,-15],[24,33]].forEach(([x,z])=>lamp(x,z));
  for(let i=0;i<28;i++){const x=-112+(i%14)*17,z=i<14?-88:83,height=10+(i*7%29);box(9+(i%3)*2,height,11,[0x727985,0x81808b,0x918591][i%3],x,height/2-.2,z);for(let k=0;k<3;k++)box(1,1.3,.08,C.amber,x-2.7+k*2.5,height*.7,z+5.57,world,{emissive:true});}for(let i=0;i<12;i++){const z=-70+i*14,x=i%2?-93:90,h=9+(i%4)*4;box(11,h,12,0x7e7f84,x,h/2-.1,z);}}
function createHawker(){const g=new THREE.Group();g.position.set(-1,0,7);world.add(g);box(17,.25,11,C.cream,0,.4,0,g);for(const x of [-7.7,0,7.7])for(const z of [-4.7,4.7])box(.25,4,.25,C.cream,x,2.3,z,g);box(18,.4,12,C.coral,0,4.48,0,g);box(18.2,.16,12.2,C.pale,0,4.78,0,g);for(let k=0;k<6;k++){box(2.4,1.4,.7,C.wood,-6.3+k*2.5,1.2,-3.8,g);box(2.5,.15,1,C.cream,-6.3+k*2.5,1.98,-3.6,g);box(2.1,.7,.08,k%2?C.amber:C.pale,-6.3+k*2.5,2.9,-4.25,g,{emissive:k%2===1});}for(const x of [-5.5,-1.7,2.2,5.7])for(const z of [-.5,2.6]){cylinder(.85,.13,C.cream,x,1.2,z,g);cylinder(.09,.9,C.metal,x,.7,z,g);for(const b of [-1.1,1.1])cylinder(.28,.6,C.coral,x,.52,z+b,g);}sign('食阁',4,.7,0,4.5,6.13,g,{background:'#bd7557'});textSprite('美兰的摊位',-3,2.65,3.4,world,{kind:'resident',id:'huang',background:'#87563fe8'});projectNodes.set('place:hawker',g);}
function createMarket(){const g=new THREE.Group();g.position.set(37,0,8);world.add(g);box(16,.28,11,C.cream,0,.35,0,g);box(16.8,.35,11.8,C.teal,0,4.4,0,g);for(const a of [-7,0,7])for(const b of [-4.7,4.7])box(.3,4,.3,C.cream,a,2.3,b,g);for(let k=0;k<5;k++){box(2.3,1.1,1.8,C.wood,-5.6+k*2.8,1.1,0,g);for(let m=0;m<5;m++)box(.32,.3,.38,[C.orange,C.leaf,C.amber][(m+k)%3],-6.3+k*2.8+m*.35,1.8,.2,g);}sign('菜市场与日常商店',8,.7,0,4.5,6,g,{background:'#4d7770'});projectNodes.set('place:market',g);}
function createShoppingCentre(){
 const g=new THREE.Group();g.position.set(53,0,-5);world.add(g);
 box(9.5,4.3,14.5,C.pale,0,2.35,0,g);
 box(9.75,.26,14.75,C.teal,0,4.6,0,g);
 box(8.6,2.8,11.4,0xad9b9d,-.2,5.7,-.4,g);
 box(8.8,.23,11.6,C.cream,-.2,7.21,-.4,g);
 for(const x of [-3.2,0,3.2]){
  box(2.65,2.5,.06,C.navy,x,1.65,7.28,g);
  box(2.35,2.1,.06,x?0x90a6a1:0x659693,x,1.64,7.32,g);
  box(2.67,.18,.85,x?C.coral:C.teal,x,3.22,7.38,g);
 }
 addSideWindows(g,9.5,14.5,1,2.8);
 sign(()=>bilingual('邻里商场','Neighbourhood shops'),4.9,.6,0,4.35,7.58,g,{background:'#4d7770'});
 projectNodes.set('place:mall',g);
}
function createTransit(){const g=new THREE.Group();g.position.set(39,0,-32);world.add(g);box(21,.35,11,C.cream,0,.4,0,g);box(20,4.5,8,0xc8b8a3,0,2.8,0,g);box(22,.4,12,C.teal,0,5.25,0,g);for(const x of [-8,-4,0,4,8])box(2.7,2.3,.06,0x739593,x,3,4.1,g);sign('金文泰站方向 · EW23',10,.8,0,5.4,6.1,g,{background:'#43776d'});path(24,-24,38,-24,3.5);addSideWindows(g,20,8,1,3);projectNodes.set('place:mrt',g);const hub=new THREE.Group();hub.position.set(43,0,56);world.add(hub);box(23,.22,12,0x9a9a87,0,.25,0,hub);for(const x of [-9,-3,3,9]){box(.25,3.7,.25,C.cream,x,2,0,hub);box(4.8,.25,8,C.teal,x,3.95,0,hub);bench(x,1,hub);}sign('巴士转换站方向',9,.7,0,4.15,4.3,hub,{background:'#476b69'});projectNodes.set('place:bus',hub);const clinic=new THREE.Group();clinic.position.set(39,0,-66);world.add(clinic);box(14,6,7,0xc6b8ab,0,3,0,clinic);box(14.7,.3,7.6,C.cream,0,6.3,0,clinic);sign('综合诊所方向',7,.7,0,6.4,3.85,clinic,{background:'#577b76'});addSideWindows(clinic,14,7,2,1.8);for(const x of [-4.5,0,4.5])box(2,1.2,.05,C.amber,x,3.2,3.55,clinic,{emissive:true});}
function createPeople(){const definitions=[
  {id:'chen',shirt:C.coral,path:[[-27,1],[-22,3],[-22,9],[-12,10],[-5,7],[-27,1]],directPath:[[-27,1],[-22,3],[-7,3],[-5,7],[-7,3],[-27,1]],detourPath:[[-27,1],[-22,3],[-22,9],[-12,10],[-5,7],[-12,10],[-27,1]],speed:84},
  {id:'rahman',shirt:0x6f8d95,path:[[-12,-15],[-10,-15],[-12,-15],[-12,-14],[-12,-15]],speed:110},
  {id:'lin',shirt:C.teal,path:[[9,-36],[13.4,-36],[13.4,-24],[9,-18],[9,-8],[9,-18],[13.4,-24],[13.4,-36],[9,-36]],speed:115,offset:20},
  {id:'kumar',shirt:C.orange,path:[[31,27],[28,24],[24,24],[24,12],[29,9],[31,27]],speed:130,offset:8},
  {id:'students',shirt:C.mint,path:[[-32,-18],[-42,-18],[-42,2],[-11,2],[-5,8],[-11,2],[-42,2],[-42,-18],[-32,-18]],speed:95,offset:27},
  {id:'huang',shirt:C.pale,path:[[-3,3.4],[-3,4.1],[-2,4.1],[-3,3.4]],speed:140},
  {id:'zhang',shirt:0x889ca4,path:[[-26,-1],[-26,2],[-16,2],[-16,-15],[-12,-15],[-16,-15],[-16,2],[-26,2],[-26,-1]],speed:105,offset:40},
  {id:'ali',shirt:0xc3919e,path:[[35,-19],[25,-19],[24,-26],[29,-26],[24,-26],[25,-19],[35,-19]],speed:125,offset:14}
];definitions.forEach(def=>{const node=makePerson({shirt:def.shirt,scale:1.1,id:def.id});world.add(node);target(node,'resident',def.id);const anchor=new THREE.Object3D();anchor.position.y=2.5;node.add(anchor);registerDomLabel(anchor,residentNames[def.id],{kind:'resident',id:def.id,background:'#303b50ec'});const actor={...def,node};actors.push(actor);placeWalkingActor(actor,0);});const child=makePerson({shirt:C.orange,scale:.9,child:true});world.add(child);actors.push({id:'lin-child',node:child,path:definitions[2].path,speed:115,offset:18.5});
  const paths=[[[ -40,2],[-12,2],[-5,7],[-12,2],[-40,2]],[[-31,24],[-8,24],[10,24],[-8,24],[-31,24]],[[25,-20],[26,8],[40,8],[26,8],[25,-20]],[[-42,39],[-33,43],[-40,48],[-48,43],[-42,39]],[[-11,10],[11,10],[12,17],[11,24],[-11,24],[-11,10]],[[27,25],[38,25],[43,40],[25,40],[27,25]],[[-24,-14],[-16,-14],[-16,2],[-24,2],[-24,-14]],[[24,-25],[39,-25],[43,-20],[24,-20],[24,-25]]];
  for(let i=0;i<24;i++){const node=makePerson({shirt:[C.teal,C.coral,C.cream,C.mint,0x9c8ca7,C.orange][i%6],scale:.76+(i%4)*.06,skin:[C.skin,0xc99570,0xaa7859,0xe3b68d][i%4],hair:[0x343239,0xa7a39b,0x574037][i%3],elder:i%6===0,accessory:i%4===0?'bag':null});world.add(node);const actor={node,path:paths[i%paths.length],speed:68+(i%7)*8,offset:i*11.7};walkers.push(actor);placeWalkingActor(actor,0);}}
function makeVehicle(bus=false,color=C.teal){const g=new THREE.Group(),w=bus?6.5:3.1,d=bus?2:1.6;box(w,bus?1.95:.8,d,color,0,bus?1.45:.8,0,g);box(w*.82,bus?.12:.7,d*.88,bus?C.amber:C.navy,0,bus?2.5:1.46,0,g);if(bus)for(let i=0;i<7;i++)for(const z of [-1.02,1.02])box(.6,.68,.04,C.amber,-2.6+i*.8,1.85,z,g,{emissive:true});for(const x of [-w*.33,w*.33])for(const z of [-d*.52,d*.52]){const wheel=cylinder(.36,.2,C.dark,x,.48,z,g);wheel.rotation.x=Math.PI/2;}return g;}
function roundedLoop(radius,reverse=false){
 const points=[];const corners=[[54,38,0,Math.PI/2],[-54,38,Math.PI/2,Math.PI],[-54,-47,Math.PI,Math.PI*1.5],[54,-47,Math.PI*1.5,Math.PI*2]];
 for(const [x,z,a,b]of corners)for(let k=0;k<=10;k++){const angle=a+(b-a)*k/10;points.push([x+Math.cos(angle)*radius,z+Math.sin(angle)*radius]);}
 if(reverse)points.reverse();points.push(points[0]);return points;
}
function createTraffic(){
 const loops=[roundedLoop(6.5),roundedLoop(9.5,true)];
 for(let i=0;i<8;i++){const bus=i<2,node=makeVehicle(bus,[C.teal,C.coral,C.cream,0x9dabb0,0xc8a975][i%5]);world.add(node);traffic.push({node,path:loops[i%2],speed:135,offset:Math.floor(i/2)*135/4+(i%2?9:0),bus,length:bus?6.5:3.1,width:bus?2:1.6,lane:i%2});}
 updateTraffic(0);
}
function vehicleCollision(a,b){
 const delta={x:b.node.position.x-a.node.position.x,z:b.node.position.z-a.node.position.z};
 const axes=[a.node.rotation.y,a.node.rotation.y+Math.PI/2,b.node.rotation.y,b.node.rotation.y+Math.PI/2];
 for(const angle of axes){const ax=Math.cos(angle),az=-Math.sin(angle),separation=Math.abs(delta.x*ax+delta.z*az);
  const project=v=>{const yaw=v.node.rotation.y,forward={x:Math.cos(yaw),z:-Math.sin(yaw)},side={x:Math.sin(yaw),z:Math.cos(yaw)};return Math.abs(forward.x*ax+forward.z*az)*v.length/2+Math.abs(side.x*ax+side.z*az)*v.width/2;};
  if(separation>project(a)+project(b)+.08)return false;
 }return true;
}
function updateTraffic(clock){
 // Equal speed and fixed headways prevent catch-up. Concentric rounded lanes
 // keep opposing vehicles separated through corners, including large time jumps.
 traffic.forEach(v=>{const p=routePoint(v.path,(clock+v.offset)/v.speed);v.node.position.set(p.x,.1,p.z);v.node.rotation.y=p.angle-Math.PI/2;});
 vehicleMinDistance=Infinity;vehicleOverlaps=0;
 for(let i=0;i<traffic.length;i++)for(let j=i+1;j<traffic.length;j++){const a=traffic[i],b=traffic[j];vehicleMinDistance=Math.min(vehicleMinDistance,a.node.position.distanceTo(b.node.position));if(vehicleCollision(a,b))vehicleOverlaps++;}
}

function buildCurbRamp(g){
 const shape=new THREE.Shape();shape.moveTo(-2.6,.09);shape.lineTo(2.25,.09);shape.lineTo(2.25,.47);shape.lineTo(-2.6,.16);shape.closePath();
 let wedge=geometryCache.get('curbRamp');
 if(!wedge){wedge=new THREE.ExtrudeGeometry(shape,{depth:2.28,bevelEnabled:false});wedge.translate(0,0,-1.14);geometryCache.set('curbRamp',wedge);}
 const ramp=new THREE.Mesh(wedge,mat(C.paving));ramp.castShadow=true;ramp.receiveShadow=true;g.add(ramp);
 box(.34,.04,2.2,C.amber,-2.37,.188,0,g);
 for(const z of [-1.23,1.23])box(4.66,.12,.15,C.cream,-.07,.31,z,g).rotation.z=.065;
}

function buildRetrofit(id,index,g){
 if(id==='hawker-expand'){
  box(9,.16,6.2,C.cream,0,.25,0,g);
  for(const x of [-4.2,0,4.2])for(const z of [-2.7,2.7])box(.14,3.1,.14,C.cream,x,1.82,z,g);
  box(9.5,.22,6.6,C.coral,0,3.4,0,g);box(9.55,.085,6.65,C.pale,0,3.53,0,g);
  for(const x of [-2.75,2.75])for(const z of [-1.48,1.48]){
   cylinder(.62,.12,C.cream,x,1.17,z,g);cylinder(.07,.84,C.metal,x,.69,z,g);
   for(const offset of [-.98,.98])cylinder(.26,.51,C.teal,x+offset,.52,z,g);
  }
 }else if(id==='mall-entry'){
  box(6.8,.14,5.25,C.cream,0,.25,0,g);
  for(const x of [-2.68,2.68]){
   for(const z of [-1.9,1.9])box(.13,2.8,.13,C.cream,x,1.72,z,g);
   box(2.55,.19,4.85,C.teal,x*.8,3.12,0,g);
   bench(x,1,g,Math.PI/2);planter(x,-1.2,g,.65);
  }
 }else if(id==='mrt-connection'){
  box(11.3,.11,3.6,C.cream,0,.23,0,g);
  for(const x of [-5,-1.7,1.7,5])for(const z of [-1.52,1.52])box(.12,3.3,.12,C.cream,x,1.9,z,g);
  box(11.55,.23,3.65,C.teal,0,3.66,0,g);
  box(10.8,.025,.28,C.amber,0,.302,-1.05,g);
  bench(-3.6,1.1,g);bench(3.6,1.1,g);
 }
 const title=()=>{const card=window.CM_DATA?.cards.find(c=>c.id===id);return card?bilingual(card.title,card.titleEn||card.title):id;};
 textSprite(title,0,3.8,2.3,g,{kind:'plot',id:index,background:'#4f786de8'});
}

function setFacility(id,index,placement=null,preview=false){const g=new THREE.Group();setGroupPlacement(g,index,placement);(preview?previewGroup:facilityGroup).add(g);if(id==='cover'){const length=plotSizes[index][0];g.scale.x=length/16;for(let a=-7.5;a<8;a+=3)for(const b of [-1,1])box(.13,2.8,.13,C.cream,a,1.6,b,g);box(16.2,.2,2.9,C.teal,0,3.1,0,g);box(16.3,.08,3,C.mint,0,3.25,0,g);sign('有盖走廊',3,.4,0,3.4,1.55,g,{background:'#477b74',kind:'plot',id:index});}
  else if(id==='corner'){bench(-2,0,g);bench(2,0,g,Math.PI);cylinder(.7,.13,C.cream,0,1.15,0,g);cylinder(.08,.9,C.metal,0,.65,0,g);planter(-3.5,0,g);sign('居民角',3,.45,0,2.4,1.8,g,{background:'#926b55',kind:'plot',id:index});}
  else if(id==='aac'){box(5.1,2.8,4.3,C.mint,0,1.6,0,g);box(5.4,.2,4.7,C.teal,0,3.1,0,g);box(1.1,2,.08,C.amber,-.8,1.4,2.2,g,{emissive:true});box(1.8,1,.08,C.amber,1.1,1.9,2.2,g,{emissive:true});sign('乐龄活动中心',5.2,.45,0,3.3,2.4,g,{background:'#477b74',kind:'plot',id:index});}
  else if(id==='cca'){box(7.5,.3,7.5,C.cream,0,.4,0,g);box(7,12,6.8,C.pale,0,6.5,0,g);for(let f=0;f<5;f++){box(7.2,.15,7,C.cream,0,2+f*2.2,0,g);for(const a of [-2.4,0,2.4])box(1.3,1.2,.08,C.amber,a,2.9+f*2.2,3.45,g,{emissive:true});}box(7.5,.3,7.5,C.teal,0,12.7,0,g);sign('社区关怀公寓',6,.5,0,2.05,3.95,g,{background:'#477b74',kind:'plot',id:index});}
  else if(id==='child'){box(7,3.2,6.2,C.pale,0,1.9,0,g);box(7.6,.3,6.8,C.orange,0,3.65,0,g);for(const a of [-2.2,0,2.2])box(1.5,1.4,.08,C.amber,a,2,3.15,g,{emissive:true});for(let a=0;a<4;a++)box(.5,.5,.5,[C.teal,C.coral,C.amber,C.mint][a],-2.3+a*1.4,.6,4,g);sign('托育与儿童空间',6,.45,0,3.9,3.6,g,{background:'#9b7651',kind:'plot',id:index});}
  else if(id==='ramp'){buildCurbRamp(g);textSprite('无障碍接驳',0,1.2,0,g,{kind:'plot',id:index,background:'#4f786de8'});}
  else if(['hawker-expand','mall-entry','mrt-connection'].includes(id))buildRetrofit(id,index,g);
  if(['aac','cca','child'].includes(id)){const dims=id==='aac'?[5.1,4.3,1,1.9]:id==='cca'?[7,6.8,5,2.9]:[7,6.2,1,2];addSideWindows(g,...dims);}
  if(!preview)target(g,'plot',index,facilityHits);else g.traverse(n=>{if(n.isMesh){n.material=n.material.clone();n.material.transparent=true;n.material.opacity=.3;n.material.depthWrite=false;n.castShadow=false;}});
  return g;
}
function construction(index,p){
 const [w,d]=p.cardId==='ramp'?[...plotSizes[index]].reverse():plotSizes[index],g=new THREE.Group();setGroupPlacement(g,index,p.placement);facilityGroup.add(g);box(w,.15,d,0xaf987b,0,.31,0,g);
 const height=p.cardId==='cca'?6:3.7;for(const a of [-w*.47,w*.47])for(const b of [-d*.45,d*.45])box(.1,height,.1,C.metal,a,height/2+.4,b,g);
 for(const y of [1,2.4,height])for(const b of [-d*.45,d*.45])box(w,.08,.08,C.metal,0,y,b,g);
 for(let a=0;a<Math.max(4,w/1.1);a++)box(.7,.75,.18,a%2?C.amber:C.navy,-w*.45+a*.9,.8,d*.48,g);
 box(.15,height+3,.15,C.orange,-w*.35,(height+3)/2,0,g);const crane=box(w+3,.15,.15,C.orange,0,height+3,0,g);
 for(let i=0;i<3;i++){const worker=makePerson({shirt:C.orange,scale:.85,skin:i===1?0xae7d5e:C.skin});worker.position.set((i-1)*Math.min(w*.24,2),.25,-d*.2);g.add(worker);box(.49,.12,.43,C.amber,0,2.05,0,worker);box(.5,.06,.5,C.amber,0,2,0,worker);box(.065,.65,.065,C.metal,.37,1.25,.17,worker);workerActors.push({node:worker,index,offset:i*1.7});}
 textSprite(()=>t('施工中')+' '+Math.round((p.progress||0)*100)+'%',0,height+1.5,d/2,g,{kind:'plot',id:index,background:'#6e5945ee'});
 const key=index+':'+p.cardId;if(!constructionStarted.has(key))constructionStarted.set(key,Number(state.simTime)||0);g.userData.born=constructionStarted.get(key);g.userData.crane=crane;constructionModels.push(g);target(g,'plot',index,facilityHits);return g;
}

function plotName(index){const def=plotDefinitions[index];return bilingual(plotNames[index],def?.nameEn||t(plotNames[index]));}

function createPlotAnchors(){plotIds.forEach((id,index)=>{
 const [x,z]=plotPositions[index],[w,d]=plotSizes[index],kind=plotDefinitions[index]?.kind;
 const anchor=new THREE.Object3D();anchor.position.set(x,kind==='void'?2.3:kind==='room'?3.4:1,z);
 world.add(anchor);
 const hit=box(w,.055,d,C.amber,x,.25,z,world,{transparent:true,opacity:0});target(hit,'plot',index);
 hit.castShadow=false;hit.receiveShadow=false;hit.material=new THREE.MeshBasicMaterial({visible:false});
 projectNodes.set('plot:'+index,anchor);projectNodes.set('plot:'+id,anchor);
 const selection=new THREE.Group();selection.position.set(x,.34,z);world.add(selection);
 const fill=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0xffc445,opacity:.31,transparent:true,depthWrite:false}));
 fill.rotation.x=-Math.PI/2;selection.add(fill);
 const border=new THREE.MeshBasicMaterial({color:0xffdf71});
 for(const side of [-1,1]){
  const horizontal=new THREE.Mesh(geo('box',[w,.11,.31]),border);
  const vertical=new THREE.Mesh(geo('box',[.31,.11,d]),border);
  horizontal.position.z=side*d/2;vertical.position.x=side*w/2;
  selection.add(horizontal,vertical);
 }
 selection.visible=false;selectionTiles.push({group:selection,border,fill});
 const label=registerDomLabel(anchor,()=>plotLocked(index)?bilingual('既有用途 · 不能建设','Existing use · no building'):plotName(index),{kind:'plot',id:index,background:plotLocked(index)?'#5a5c63e8':'#3c584fe8',offsetY:12,priority:180});
 plotLabels.push(label);
});}

function syncFacilities(){
 if(!state)return;for(const [index,id]of plotIds.entries()){const vacant=projectNodes.get('space:'+id);if(vacant)vacant.visible=!state.plots[index];}const next=JSON.stringify(state.plots.map(p=>p?{cardId:p.cardId,status:p.status,progress:Math.floor((p.progress||0)*10),placement:p.placement}:null));
 if(next!==signature){signature=next;facilityGroup.clear();facilityHits.length=0;workerActors.length=0;constructionModels.length=0;state.plots.forEach((p,index)=>{if(plotLocked(index)||!p)return;if(p.status==='building')construction(index,p);else setFacility(p.cardId,index,p.placement);});}
 selectionTiles.forEach(({group,border,fill},index)=>{
  const id=plotIds[index],selected=options.selectedPlot===id;
  group.visible=!!options.selected&&!state.plots[index]&&options.validPlots.includes(id);
  border.color.setHex(selected?0xfdf2a4:0xffdf71);fill.material.opacity=selected?.56:.31;
 });
 plotLabels.forEach((label,index)=>{
  const p=state.plots[index],id=plotIds[index],order=options.validPlots.indexOf(id),isCandidate=!!options.selected&&order>=0;
  const current=options.selectedPlot===id;
  label.anchor.visible=(!p||p.status==='building')&&(options.selected?isCandidate:options.showLand);
  label.candidate=isCandidate;
  label.node.classList.toggle('scene-candidate-pin',isCandidate);
  label.node.classList.toggle('is-selected',isCandidate&&current);
  if(isCandidate&&current)label.content.setAttribute('aria-current','true');else label.content.removeAttribute('aria-current');
  label.value=()=>isCandidate?(order+1)+' · '+plotName(index):plotLocked(index)?bilingual('既有用途 · 不能建设','Existing use · no building'):plotName(index);
  updateLabelText(label);
 });
}

function syncStory(){
 const done=state?.flags?.completed||{},help=state?.flags?.noiseResolved||state?.flags?.neighbourHelp,key=JSON.stringify([done.cover,done.corner,done.aac,done.cca,done.child,done.nrp,done.ease,done.visits,done.event,help]);
 if(key===storySignature)return;storySignature=key;storyGroup.clear();socialActors.length=0;
 if(help||done.event){for(let i=0;i<4;i++){const node=makePerson({id:['students','chen','ali','huang'][i],shirt:[C.mint,C.coral,C.teal,C.cream][i],scale:1});node.position.set(-7+(i%2)*2.2,.3,9+Math.floor(i/2)*2);node.rotation.y=i%2?-Math.PI/2:Math.PI/2;storyGroup.add(node);socialActors.push({node,kind:'gathering',offset:i*1.3,x:node.position.x,z:node.position.z});}textSprite('邻里互助',-5,3.1,10,storyGroup,{background:'#4f786de8'});}
 if(done.visits||done.aac){for(let i=0;i<2;i++){const node=makePerson({shirt:i?C.coral:C.mint,id:i?'chen':'zhang',scale:.95});node.position.set(-24+i*1.8,.25,2.4);storyGroup.add(node);socialActors.push({node,kind:'befriending',offset:i*1.5,x:node.position.x,z:node.position.z});}}
 if(done.nrp){[[-20,5],[-10,5],[3,3],[26,25]].forEach(([x,z])=>planter(x,z,storyGroup,.9));for(const [x,z]of [[-22,10],[26,25]]){bench(x,z,storyGroup);lamp(x+2,z,storyGroup);}for(const z of [12.5,21.5])storyGroup.add(path(-23,z,-9,z,2.6,0xdec6a4));}
 if(done.ease){textSprite('居家安全改善',-29,3.2,-1.3,storyGroup,{background:'#4f786de8'});for(const x of [-29.7,-28.5])box(.06,1.1,.06,C.teal,x,.9,-1.18,storyGroup);box(1.7,.06,.06,C.teal,-29.1,1.45,-1.18,storyGroup);}
 if(done.cover)textSprite('熟悉的路又通了',-17,3.8,3,storyGroup,{background:'#4f786de8'});
}

function anchorPosition(anchor,id){if(anchor&&typeof anchor==='object'&&Number.isFinite(anchor.x)&&Number.isFinite(anchor.z))return new THREE.Vector3(anchor.x,Number(anchor.y)||2,anchor.z);const key=typeof anchor==='string'?anchor:(issueAnchors[id]||'room'),index=plotIds.indexOf(key);if(index>=0)return new THREE.Vector3(plotPositions[index][0],plotLocked(index)?7:3.6,plotPositions[index][1]);const actor=actors.find(a=>a.id===key);if(actor){const p=actor.node.position.clone();p.y+=3;return p;}const node=projectNodes.get('place:'+key);if(node){const p=new THREE.Vector3();node.getWorldPosition(p);p.y+=4;return p;}return new THREE.Vector3(-11,4,-11);}
function syncIssues(){
 const issues=(options.issues||[]).filter(i=>(!i.status||i.status==='open')&&i.channel!=='mail');
 const wanted=new Set(issues.map(i=>String(i.id)));
 for(const [id,entry]of issueLabels)if(!wanted.has(id)){
  world.remove(entry.anchor);entry.label.node.remove();
  const index=domLabels.indexOf(entry.label);if(index>=0)domLabels.splice(index,1);
  issueLabels.delete(id);
 }
 for(const issue of issues){
  let entry=issueLabels.get(String(issue.id));
  if(!entry){
   const anchor=new THREE.Object3D();world.add(anchor);
   const label=registerDomLabel(anchor,issue.title,{kind:'issue',id:issue.id,border:'#ffd99b',size:13,offsetY:-8,priority:300});
   entry={anchor,label,issue};issueLabels.set(String(issue.id),entry);
  }
  entry.issue=issue;
  entry.label.priority=issue.isNew?360:300;
  entry.label.value=()=>issue.isNew?bilingual('社区里有新情况','New in the neighbourhood')+'\n'+t(issue.title):'◉ '+t(issue.title)+(issue.stage>0?' · '+t('需要关注'):'');
  entry.anchor.position.copy(anchorPosition(issue.anchor,issue.id));
  entry.label.node.classList.toggle('is-new',!!issue.isNew);
  entry.label.dismiss.hidden=!issue.isNew;
  entry.label.node.style.background=issue.stage>0?'#8c4738f5':'#263347f5';
  entry.label.node.style.outline=focusedIssue===issue.id?'2px solid #ffe2a1':'none';
  updateLabelText(entry.label);
 }
}

function createBurst(position,born,seed){
 const count=36,geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*3),colors=new Float32Array(count*3),velocities=[];
 for(let i=0;i<count;i++){
  const a=i*2.39996+seed,r=3.1+(i%7)*.48;
  velocities.push(new THREE.Vector3(Math.cos(a)*r,1.45+(i%11)*.5,Math.sin(a)*r));
  new THREE.Color([0xffd17b,0xf4a58d,0xa0dfc1,0xffefc6][(i+seed)%4]).toArray(colors,i*3);
 }
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
 const material=new THREE.PointsMaterial({size:4.2,sizeAttenuation:false,vertexColors:true,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 const points=new THREE.Points(geometry,material);points.position.copy(position);points.frustumCulled=false;points.renderOrder=20;points.visible=false;scene.add(points);
 return {points,velocities,born};
}

function celebrate(event){
 if(event?.type!=='complete'||event.id==null||celebratedEvents.has(event.id))return false;
 const index=getPlotIndex(event.plotId),plot=state?.plots?.[index];
 if(index<0||plot?.status!=='complete'||plot.cardId!==event.cardId)return false;
 celebratedEvents.add(event.id);
 const at=resolvedPlacement(index,plot.placement),height=event.cardId==='cca'?15:event.cardId==='ramp'?3:6;
 const position=new THREE.Vector3(at.x,height,at.z);
 const screen=position.clone().project(camera);
 if(Math.abs(screen.x)>.66||Math.abs(screen.y)>.58)focusPlot(event.plotId);
 const anchor=new THREE.Object3D();anchor.position.copy(position);world.add(anchor);
 const label=registerDomLabel(anchor,()=>bilingual('✦ 工程完工','✦ Project completed'),{background:'#254f41f7',border:'#ffe1a0',size:14,offsetY:8,priority:420});
 label.node.classList.add('scene-complete-pin');
 const born=performance.now()/1000+.18,bursts=[];
 if(!reducedMotion?.matches){
  for(let i=0;i<3;i++)bursts.push(createBurst(position.clone().add(new THREE.Vector3((i-1)*2.2,1+i%2*1.5,0)),born+i*.31,i));
 }
 fireworks.push({anchor,label,bursts,born});fireworksLaunched++;
 return true;
}

function disposeCelebration(effect){
 world.remove(effect.anchor);effect.label.node.remove();
 const index=domLabels.indexOf(effect.label);if(index>=0)domLabels.splice(index,1);
 for(const {points}of effect.bursts){scene.remove(points);points.geometry.dispose();points.material.dispose();}
}
function animateFireworks(clock){
 for(let i=fireworks.length-1;i>=0;i--){
  const effect=fireworks[i],age=clock-effect.born;
  if(age>3.1){disposeCelebration(effect);fireworks.splice(i,1);continue;}
  for(const burst of effect.bursts){
   const t=clock-burst.born;
   burst.points.visible=t>=0&&t<1.85;if(!burst.points.visible)continue;
   const attribute=burst.points.geometry.attributes.position;
   burst.velocities.forEach((v,j)=>attribute.setXYZ(j,v.x*t,v.y*t-t*t*2.2,v.z*t));
   attribute.needsUpdate=true;burst.points.material.opacity=Math.min(1,(1.85-t)/.75);
  }
 }
}

function clearPreview(){
 previewGroup.traverse(n=>{if(n.isMesh&&n.material?.userData?.placementPreview)n.material.dispose();});previewGroup.clear();previewSelection=null;
 for(let i=domLabels.length-1;i>=0;i--){const label=domLabels[i];if(label.preview){label.node.remove();domLabels.splice(i,1);}}
}
function previewPlacement(plotId,cardId,placement={}){
 clearPreview();const index=getPlotIndex(plotId);if(index<0||plotLocked(index))return false;
 const before=domLabels.length,g=setFacility(cardId,index,placement,true);g.traverse(n=>{if(n.isMesh){n.material.userData.placementPreview=true;}});
 for(let i=before;i<domLabels.length;i++){domLabels[i].preview=true;domLabels[i].node.style.visibility='hidden';}
 previewSelection={plotId:plotIds[index],cardId,placement:{...placement},node:g};return true;
}
function cue(event={}){
 const card=event.cardId||'',index=event.plotId?getPlotIndex(event.plotId):state?.plots?.findIndex(p=>p?.cardId===card)??-1;
 const position=index>=0?new THREE.Vector3(plotPositions[index][0],.35,plotPositions[index][1]):anchorPosition(issueAnchors[event.issueId],event.issueId);
 const g=new THREE.Group();g.position.copy(position);g.position.y=.4;world.add(g);const size=index>=0?Math.max(...plotSizes[index])*.6:3;
 for(const sign of [-1,1]){box(size*2,.08,.12,event.type==='worsen'?C.coral:C.amber,0,.02,sign*size,g,{transparent:true,opacity:.8});box(.12,.08,size*2,event.type==='worsen'?C.coral:C.amber,sign*size,.02,0,g,{transparent:true,opacity:.8});}
 if(event.type==='start'&&index>=0)constructionStarted.set(index+':'+card,Number(options.simTime)||0);
 const label=textSprite(()=>event.type==='worsen'?bilingual('居民正在担心','A concern is growing'):event.type==='complete'?bilingual('安排已完成','Action completed'):event.type==='decision'?bilingual('居民有了回应','A neighbour responds'):index>=0?bilingual('工程开始了','Work has begun'):bilingual('行动已安排','Action arranged'),0,4.5,0,g,{background:event.type==='worsen'?'#a75d48ed':'#6e5945ed'});
 cueEffects.push({node:g,born:performance.now()/1000,label,event,size});
 if((event.type==='decision'||event.type==='complete')&&index<0){
  const ids=event.issueId==='noise'||card.includes('mediate')?['students','chen','ali']:card==='event'?['huang','students','chen']:['zhang','rahman'];
  ids.forEach((id,i)=>{const n=makePerson({id,shirt:[C.teal,C.coral,C.cream][i%3],scale:1.15});n.position.set((i-1)*1.5,0,0);g.add(n);});
 }
 return true;
}
function animateConstruction(clock){
 constructionModels.forEach(g=>{const age=Math.max(0,clock-g.userData.born);g.scale.y=reducedMotion?.matches?1:Math.min(1,.16+age/1.2);if(g.userData.crane)g.userData.crane.rotation.y=Math.sin(clock*.3)*.055;});
 workerActors.forEach(worker=>{const phase=clock*3.4+worker.offset;worker.node.userData.limbs?.arms.forEach((arm,i)=>{arm.rotation.x=Math.sin(phase+i*.6)*.7-.4;});worker.node.rotation.y=Math.sin(clock*.4+worker.offset)*.3;});
 socialActors.forEach(actor=>{const phase=clock*2+actor.offset;actor.node.userData.limbs?.arms.forEach((arm,i)=>{arm.rotation.x=Math.sin(phase+i)*.22;arm.rotation.z=i===0?-.25:0;});if(actor.kind==='befriending'){actor.node.position.x=actor.x+Math.sin(clock*.15+actor.offset)*.7;actor.node.rotation.y=actor.offset?Math.PI/2:-Math.PI/2;}else actor.node.position.y=.3+Math.max(0,Math.sin(phase))*.04;});
}
function animateCues(wallTime){
 for(let i=cueEffects.length-1;i>=0;i--){const c=cueEffects[i],age=wallTime-c.born;if(age>5){world.remove(c.node);cueEffects.splice(i,1);continue;}const pulse=reducedMotion?.matches?1:1+Math.sin(age*4)*.025;c.node.scale.setScalar(pulse);c.node.traverse(n=>{if(n.userData?.limbs)n.userData.limbs.arms.forEach((arm,j)=>arm.rotation.x=Math.sin(age*3+j)*.3);});}
}

function cameraGoals(){
 const target=focusTarget||new THREE.Vector3(0,8,0);cameraTarget.copy(target).add(panOffset);
 const distance=options.view==='overview'?115:92;
 cameraPosition.set(cameraTarget.x+Math.sin(angle)*distance,cameraTarget.y+(focusedIssue?56:65),cameraTarget.z+Math.cos(angle)*distance);
 const aspect=(container.clientWidth||1200)/(container.clientHeight||800),h=(focusedIssue?20:options.view==='overview'?44:31)*(aspect<.8?1.22:1);
 camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;camera.zoom=zoomLevel;camera.updateProjectionMatrix();
}
function resize(){if(!renderer)return;const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h,false);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';cameraGoals();}
function focusIssue(id){
 const issue=(options.issues||[]).find(i=>i.id===id);if(!issue)return false;
 focusedIssue=id;focusTarget=anchorPosition(issue.anchor,id);panOffset.set(0,0,0);zoomLevel=1;cameraGoals();syncIssues();return true;
}
function focusPlot(id){
 const index=getPlotIndex(id);if(index<0||!plotPositions[index])return false;
 const [x,z]=plotPositions[index];focusTarget=new THREE.Vector3(x,4.3,z);
 focusedIssue=null;options.view='neighborhood';panOffset.set(0,0,0);zoomLevel=1.12;cameraGoals();return true;
}
function sync(s,opts={}){
 const now=performance.now(),oldLanguage=options.language;
 if(s&&s!==state){
  constructionStarted.clear();signature='';storySignature='';clearPreview();reset();
  for(const effect of cueEffects)world.remove(effect.node);
  cueEffects.length=0;
  for(const effect of fireworks)disposeCelebration(effect);
  fireworks.length=0;celebratedEvents.clear();fireworksLaunched=0;
 }
 state=s||state;if(!state)return;
 const nextTime=Number(opts.simTime??s?.simTime??options.simTime)||0;
 if(lastSync&&nextTime>previousSim)simRate=THREE.MathUtils.clamp((nextTime-previousSim)/Math.max(.05,(now-lastSync)/1000),.25,4);
 lastSync=now;previousSim=nextTime;animationClock=nextTime;
 options={...options,...opts,simTime:nextTime};syncFacilities();syncStory();syncIssues();
 if(opts.focusIssue&&opts.focusIssue!==focusedIssue)focusIssue(opts.focusIssue);
 if(oldLanguage!==options.language){
  domLabels.forEach(updateLabelText);
  renderer.domElement.setAttribute('aria-label',bilingual('金文泰互动地图','Interactive Clementi map'));
 }
}
function showOverview(){options.view='overview';focusTarget=null;focusedIssue=null;panOffset.set(0,0,0);zoomLevel=1;cameraGoals();}
function showNeighborhood(){options.view='neighborhood';focusTarget=null;focusedIssue=null;panOffset.set(0,0,0);zoomLevel=1;cameraGoals();}
function rotate(direction=1){angle+=Number(direction)*Math.PI/4;cameraGoals();}
function setZoom(value){zoomLevel=THREE.MathUtils.clamp(value,.55,2.7);cameraGoals();}
function zoom(delta){setZoom(zoomLevel+Number(delta));}
function pan(dx,dy){
 const scale=(camera.top-camera.bottom)/Math.max(1,container.clientHeight)/zoomLevel;
 panOffset.x=THREE.MathUtils.clamp(panOffset.x-scale*(dx*Math.cos(angle)+1.65*dy*Math.sin(angle)),-100,100);
 panOffset.z=THREE.MathUtils.clamp(panOffset.z-scale*(-dx*Math.sin(angle)+1.65*dy*Math.cos(angle)),-90,90);
 cameraGoals();
}
function reset(){angle=defaultAngle;showNeighborhood();}
function project(kind,id){let node=kind==='resident'?actors.find(a=>a.id===id)?.node:projectNodes.get(kind+':'+id);if(!node&&kind==='issue')node=issueLabels.get(String(id))?.anchor;if(!node||!renderer)return null;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const v=new THREE.Vector3();node.getWorldPosition(v);if(kind==='resident')v.y+=2.4;v.project(camera);const r=renderer.domElement.getBoundingClientRect();return{x:r.left+(v.x+1)*.5*r.width,y:r.top+(1-v.y)*.5*r.height,visible:v.z>=-1&&v.z<=1};}
function raycast(event){
 const r=renderer.domElement.getBoundingClientRect();
 pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
 const eligible=options.selected?staticHits.filter(o=>o.userData.kind==='plot'&&options.validPlots.includes(plotIds[o.userData.id])):[...facilityHits,...staticHits];
 return ray.intersectObjects(eligible,false).find(hit=>hit.object.visible&&hit.object.userData.kind)?.object||null;
}
function updateHover(object){if(hoverTarget===object)return;hoverTarget=object;container.style.cursor=object?'pointer':'grab';const hit=object?.userData,message=!hit?'':hit.kind==='resident'?t('认识')+' '+t(residentNames[hit.id]):hit.kind==='plot'?t(plotNames[hit.id]):t('点击认识这里的居民');window.DownstairsUI?.sceneHover?.(message);}
function activate(object){if(object)callAction(object.userData.kind,object.userData.id);}
function diagnostics(){return{ready,view:options.view,placed:true,plots:state?.plots?.filter(Boolean).length||0,plotIds:plotIds.slice(),residentHotspots:Object.keys(residentNames),oldHDBBlocks:8,newTowers:2,pedestrians:actors.length+walkers.length,vehicles:traffic.length,issues:issueLabels.size,paused:!!options.paused,simTime:animationClock,focusedIssue,width:renderer?.domElement.width,height:renderer?.domElement.height,domLabels:domLabels.length,fireworksActive:fireworks.length,fireworksLaunched,constructionWorkers:workerActors.length,socialParticipants:socialActors.length,vehicleMinDistance:Number.isFinite(vehicleMinDistance)?Math.round(vehicleMinDistance*100)/100:null,vehicleOverlaps,windowFaces:4,placementPreview:previewSelection?{plotId:previewSelection.plotId,cardId:previewSelection.cardId,placement:previewSelection.placement}:null,cueEffects:cueEffects.length};}

function animate(now){
 if(now-lastFrame<32)return;lastFrame=now;animationClock=Number(options.simTime)||0;if(!options.paused&&!reducedMotion?.matches)animationClock+=Math.min(1,(now-lastSync)/1000)*simRate;
 camera.position.lerp(cameraPosition,.1);const look=camera.userData.look||(camera.userData.look=new THREE.Vector3().copy(cameraTarget));look.lerp(cameraTarget,.1);camera.lookAt(look);
 actors.forEach(actor=>placeWalkingActor(actor,animationClock));walkers.forEach(actor=>placeWalkingActor(actor,animationClock));updateTraffic(animationClock);
 clouds.forEach(cloud=>cloud.node.position.x=cloud.x+Math.sin((animationClock+cloud.phase)*.007)*8);
 for(const entry of issueLabels.values())entry.anchor.position.copy(anchorPosition(entry.issue.anchor,entry.issue.id));
 for(const {person,arm,phase}of balconyResidents){
  person.rotation.z=Math.sin(animationClock*.72+phase)*.06;
  arm.rotation.z=Math.sin(animationClock*2.1+phase)*.48;
 }
 animateConstruction(animationClock);animateCues(now/1000);animateFireworks(now/1000);updateDomLabels();renderer.render(scene,camera);
}

function pointerCenter(){
 const [a,b]=pointers.values();
 return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};
}
function attachCameraInputs(canvas){
 canvas.tabIndex=0;
 canvas.addEventListener('pointerdown',event=>{
  if(event.button>2)return;
  canvas.focus({preventScroll:true});
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});canvas.setPointerCapture(event.pointerId);
  gesture=pointers.size>1?{mode:'pinch',...pointerCenter(),moved:true}:{mode:event.shiftKey||event.button!==0?'pan':'rotate',x:event.clientX,y:event.clientY,moved:false};
 });
 canvas.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId)){if(!gesture)updateHover(raycast(event));return;}
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(gesture.mode==='pinch'){
   const next=pointerCenter();
   pan(next.x-gesture.x,next.y-gesture.y);
   if(gesture.distance>10)setZoom(zoomLevel*next.distance/gesture.distance);
   Object.assign(gesture,next);return;
  }
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(!gesture.moved&&Math.hypot(dx,dy)<6)return;
  gesture.moved=true;gesture.x=event.clientX;gesture.y=event.clientY;
  if(gesture.mode==='pan'||event.shiftKey)pan(dx,dy);
  else{angle-=dx*.008;cameraGoals();}
  updateHover(null);container.style.cursor='grabbing';
 });
 const release=(event,cancelled)=>{
  if(!pointers.delete(event.pointerId))return;
  if(pointers.size>1){gesture={mode:'pinch',...pointerCenter(),moved:true};return;}
  if(pointers.size===1){gesture={mode:'rotate',...pointers.values().next().value,moved:true};return;}
  if(!cancelled&&event.button===0&&!gesture?.moved){
   const hit=raycast(event),now=performance.now();
   if(hit){activate(hit);lastMapTap=null;}
   else if(lastMapTap&&now-lastMapTap.time<360&&Math.hypot(event.clientX-lastMapTap.x,event.clientY-lastMapTap.y)<24){reset();lastMapTap=null;}
   else lastMapTap={time:now,x:event.clientX,y:event.clientY};
  }
  gesture=null;container.style.cursor='grab';
 };
 canvas.addEventListener('pointerup',event=>release(event,false));
 canvas.addEventListener('pointercancel',event=>release(event,true));
 canvas.addEventListener('lostpointercapture',event=>release(event,true));
 canvas.addEventListener('pointerleave',()=>{if(!gesture)updateHover(null);});
 canvas.addEventListener('contextmenu',event=>event.preventDefault());
 canvas.addEventListener('wheel',event=>{event.preventDefault();zoom(-event.deltaY*.0015);},{passive:false});
 canvas.addEventListener('keydown',event=>{
  switch(event.key){
   case 'Home':reset();break;
   case '+':case '=':zoom(.15);break;
   case '-':zoom(-.15);break;
   case 'ArrowLeft':event.shiftKey?pan(55,0):rotate(-1);break;
   case 'ArrowRight':event.shiftKey?pan(-55,0):rotate(1);break;
   case 'ArrowUp':pan(0,55);break;
   case 'ArrowDown':pan(0,-55);break;
   default:return;
  }
  event.preventDefault();
 });
}

function initialize(){container=document.getElementById('world-scene');if(!container)return;try{labelLayer=document.createElement('div');labelLayer.className='scene-label-layer';Object.assign(labelLayer.style,{position:'absolute',inset:'0',zIndex:'2',pointerEvents:'none',overflow:'hidden',imageRendering:'auto'});container.append(labelLayer);camera=new THREE.OrthographicCamera(-50,50,35,-35,.1,500);renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.id='hdb-world-canvas';renderer.domElement.setAttribute('aria-label',t('金文泰互动街区：拖动旋转，滚轮缩放，点击居民、地块或地图上的来信。'));renderer.domElement.style.touchAction='none';renderer.domElement.style.imageRendering='pixelated';container.prepend(renderer.domElement);scene.add(new THREE.HemisphereLight(0xd9bad3,0x3a4763,2.25));const sun=new THREE.DirectionalLight(0xffbd7d,3.2);sun.position.set(-35,100,65);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-85,right:85,top:85,bottom:-85,far:240});sun.shadow.normalBias=.08;scene.add(sun);createSky();createGround();createPlotAnchors();createPeople();createTraffic();resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();camera.position.copy(cameraPosition);camera.userData.look=new THREE.Vector3().copy(cameraTarget);camera.lookAt(cameraTarget);
  attachCameraInputs(renderer.domElement);
  ready=true;window.HDBScene={ready:true,sync,rotate,zoom,pan,reset,showOverview,showNeighborhood,project,diagnostics,focusIssue,focusPlot,cue,celebrate,previewPlacement,clearPreview,get view(){return options.view;}};
  renderer.setAnimationLoop(animate);window.DownstairsUI?.appSceneReady?.();
 }catch(error){console.error('Clementi scene could not initialize',error);let panel=document.getElementById('world-error');if(!panel){panel=document.createElement('div');panel.id='world-error';container.append(panel);}panel.textContent=t('浏览器未能打开3D场景。可刷新页面，或在支持WebGL的浏览器里继续。');panel.hidden=false;window.HDBScene={ready:false,diagnostics:()=>({ready:false,error:String(error.message||error)})};}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
