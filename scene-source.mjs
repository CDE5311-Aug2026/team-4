import * as THREE from './vendor/three.module.js';

// The land, apartments and amenities are actual scene objects. Rules live in engine.js.
const C = {
  sky:0x32334f, ground:0x817b67, paving:0xceb398, road:0x555564,
  cream:0xe8d0ae, wall:0xa8a0ad, pale:0xd6b5a8, coral:0xc47568,
  teal:0x497f7b, mint:0x83a993, navy:0x303b57, dark:0x343548,
  amber:0xffc66d, orange:0xec9852, leaf:0x456c52, lightLeaf:0x779765,
  wood:0x805747, metal:0x6b7183, white:0xffe9c6, skin:0xd79e73,
};
const landSlots = [[-17,-17],[17,-17],[-17,17],[17,17]];
const plotPositions = [[-7,0],[-3,0],[1,0],[-7,4.4],[-3,4.4],[1,4.4],[-3,9]];
const residentPositions = {
  chen:[-6.95,8.13,-4.38], lin:[-2.45,12.43,-4.38],
  aisyah:[2.05,10.28,-4.38], mei:[-4.7,5.98,-4.38], kumar:[7.15,1.05,7.65],
};
const residentNames={chen:'Mdm Chen',lin:'The Lin Family',aisyah:'Aisyah’s Family',mei:'Mei’s Family',kumar:'Kumar & Friends'};
const geometryCache=new Map(),materialCache=new Map();
const staticHits=[],facilityHits=[],landHits=[];
const projectNodes=new Map();
const scene=new THREE.Scene();
scene.background=new THREE.Color(C.sky);
const world=new THREE.Group(), estate=new THREE.Group(), facilityGroup=new THREE.Group();
scene.add(world); world.add(estate); estate.add(facilityGroup);
estate.visible=false;
let renderer,camera,container,hoverSprite,hoverTarget=null,drag=null;
let state=null,options={placed:false,landIndex:0,view:'overview',selected:null,tab:'facility'};
let signature='',frameTime=0,angle=-Math.PI*.22,zoomLevel=1;
let cameraTarget=new THREE.Vector3(),cameraPosition=new THREE.Vector3();
let started=false,resizeObserver;
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
const activeFireworks=[];
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const fireworkPalette=[0xffd17b,0xf4a58d,0xa0dfc1,0xffefc6];
let fireworksLaunched=0,observedState=null,observedPlacement=false,observedPlots=[];

function disposeFirework(effect){
  scene.remove(effect.group);
  effect.group.traverse(o=>{if(o.isPoints){o.geometry.dispose();o.material.dispose();}});
}
function clearFireworks(){while(activeFireworks.length)disposeFirework(activeFireworks.pop());}
function fireworkPoints(count,size,colors){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));
  const rgb=new Float32Array(count*3);
  for(let i=0;i<count;i++)new THREE.Color(colors[i%colors.length]).toArray(rgb,i*3);
  geometry.setAttribute('color',new THREE.BufferAttribute(rgb,3));
  const material=new THREE.PointsMaterial({size,sizeAttenuation:false,vertexColors:true,
    transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
  const points=new THREE.Points(geometry,material);
  points.frustumCulled=false;
  return points;
}
function celebrateAt(origin,scale=1){
  if(reducedMotion?.matches)return;
  if(activeFireworks.length>=6)disposeFirework(activeFireworks.shift());
  const group=new THREE.Group();group.position.copy(origin);group.scale.setScalar(scale);scene.add(group);
  const rocket=fireworkPoints(8,3.1,[0xffe6a0,0xffd17b,0xec9852]);group.add(rocket);
  const bursts=[];
  for(let b=0;b<3;b++){
    const points=fireworkPoints(48,b===1?3.1:2.6,fireworkPalette);points.visible=false;group.add(points);
    const velocity=new Float32Array(48*3);
    for(let i=0;i<48;i++){
      const vertical=1-2*(i+.5)/48,radial=Math.sqrt(1-vertical*vertical),angle=i*2.3999632297+b;
      const speed=2.2+Math.random()*1.25;
      velocity[i*3]=Math.cos(angle)*radial*speed;
      velocity[i*3+1]=vertical*speed*.8+.5;
      velocity[i*3+2]=Math.sin(angle)*radial*speed;
    }
    bursts.push({points,velocity,delay:.42+b*.13,offset:new THREE.Vector3((b-1)*.65,2.5+b*.18,b===1?.28:-.15)});
  }
  activeFireworks.push({group,rocket,bursts,age:0,lastFrame:null,particleCount:152});
  fireworksLaunched++;
}
function animateFireworks(t){
  if(reducedMotion?.matches){clearFireworks();return;}
  for(let n=activeFireworks.length-1;n>=0;n--){
    const effect=activeFireworks[n];
    // Cold geometry/shader compilation must not consume an unseen celebration.
    const step=effect.lastFrame===null?0:Math.min(.05,Math.max(0,(t-effect.lastFrame)/1000));
    effect.lastFrame=t;effect.age+=step;const age=effect.age;
    if(age>=1.85){disposeFirework(effect);activeFireworks.splice(n,1);continue;}
    effect.rocket.visible=age<.43;
    if(effect.rocket.visible){
      const positions=effect.rocket.geometry.getAttribute('position');
      const progress=Math.min(1,age/.42);
      for(let i=0;i<8;i++)positions.setXYZ(i,Math.sin(age*15)*.035,Math.max(0,progress*2.5-i*.12),0);
      positions.needsUpdate=true;effect.rocket.material.opacity=Math.min(1,age*16);
    }
    for(const burst of effect.bursts){
      const life=age-burst.delay;burst.points.visible=life>=0&&life<1.1;if(!burst.points.visible)continue;
      const positions=burst.points.geometry.getAttribute('position');
      const spread=life*(1-.2*life);
      for(let i=0;i<48;i++)positions.setXYZ(i,
        burst.offset.x+burst.velocity[i*3]*spread,
        burst.offset.y+burst.velocity[i*3+1]*spread-2.2*life*life,
        burst.offset.z+burst.velocity[i*3+2]*spread);
      positions.needsUpdate=true;burst.points.material.opacity=Math.pow(1-life/1.1,1.5);
    }
  }
}
function syncConstructionCelebrations(){
  const plots=state.plots.map(p=>p?{cardId:p.cardId,builtRound:p.builtRound}:null);
  // A new state object is an initial load, restored save or restarted game.
  if(observedState!==state){
    clearFireworks();observedState=state;observedPlacement=!!options.placed;observedPlots=plots;return;
  }
  if(!options.placed)clearFireworks();
  else if(!observedPlacement){
    // Celebrate in front of the apartments, where the courtyard remains visible.
    celebrateAt(new THREE.Vector3(estate.position.x-1,1.8,estate.position.z+5.4),1.25);
  }else{
    scene.updateMatrixWorld(true);
    plots.forEach((p,i)=>{
      const previous=observedPlots[i];
      if(!p||(previous&&previous.cardId===p.cardId&&previous.builtRound===p.builtRound))return;
      const node=projectNodes.get(`plot:${i}`);if(!node)return;
      const bounds=new THREE.Box3().setFromObject(node),origin=new THREE.Vector3();node.getWorldPosition(origin);
      origin.y=Number.isFinite(bounds.max.y)?bounds.max.y+.15:origin.y+1.8;
      celebrateAt(origin);
    });
  }
  observedPlacement=!!options.placed;observedPlots=plots;
}

function mat(color,{emissive=false,transparent=false,opacity=1}={}){
  const key=`${color}|${emissive}|${transparent}|${opacity}`;
  if(!materialCache.has(key))materialCache.set(key,new THREE.MeshLambertMaterial({
    color,emissive:emissive?color:0,emissiveIntensity:emissive?.65:0,
    transparent,opacity,
  }));
  return materialCache.get(key);
}
function geo(type,args){const key=type+args.join(',');if(!geometryCache.has(key)){
  geometryCache.set(key,type==='box'?new THREE.BoxGeometry(...args):
    type==='cylinder'?new THREE.CylinderGeometry(...args):
      type==='sphere'?new THREE.SphereGeometry(...args):new THREE.TorusGeometry(...args));
}return geometryCache.get(key);}
function mesh(type,args,color,x,y,z,parent=estate,extra={}){
  const m=new THREE.Mesh(geo(type,args),mat(color,extra));
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function box(w,h,d,color,x,y,z,parent=estate,extra={}){return mesh('box',[w,h,d],color,x,y,z,parent,extra);}
function cylinder(r,h,color,x,y,z,parent=estate,segments=8){return mesh('cylinder',[r,r,h,segments],color,x,y,z,parent);}
function sphere(r,color,x,y,z,parent=estate){return mesh('sphere',[r,6,4],color,x,y,z,parent);}
function target(m,kind,id,hits=staticHits){m.userData={...m.userData,kind,id};hits.push(m);projectNodes.set(`${kind}:${id}`,m);return m;}
function groupTarget(g,kind,id,hits=facilityHits){g.traverse(o=>{if(o.isMesh){o.userData.kind=kind;o.userData.id=id;hits.push(o);}});}
function textSprite(value,x,y,z,parent=estate,{color='#fff0d2',background='#283347',scale=2.1,border='#e7be86'}={}){
  const cv=document.createElement('canvas');cv.width=512;cv.height=128;
  const ctx=cv.getContext('2d');ctx.fillStyle=background;ctx.fillRect(4,4,504,120);
  ctx.strokeStyle=border;ctx.lineWidth=6;ctx.strokeRect(7,7,498,114);
  ctx.fillStyle=color;ctx.font='bold 47px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,256,66,475);
  const texture=new THREE.CanvasTexture(cv);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearFilter;
  texture.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.SpriteMaterial({map:texture,depthTest:true,transparent:true});
  const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(scale,scale/4,1);s.userData.textureOwned=true;parent.add(s);return s;
}
function sign(value,w,h,x,y,z,parent=estate,{background='#d07b56',color='#fff0c9'}={}){
  const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d');
  ctx.fillStyle=background;ctx.fillRect(0,0,512,128);ctx.strokeStyle='#f5d0a0';ctx.lineWidth=9;ctx.strokeRect(7,7,498,114);
  ctx.font='bold 55px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,256,66,485);
  const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));m.position.set(x,y,z);m.userData.textureOwned=true;parent.add(m);return m;
}
function planter(x,y,z,parent=estate,size=.35){
  box(size,.32,size,C.coral,x,y+.16,z,parent);box(size+.05,.06,size+.05,0xd3936e,x,y+.34,z,parent);
  sphere(size*.53,C.leaf,x,y+.48,z,parent);sphere(size*.35,C.lightLeaf,x+.08,y+.65,z,parent);
}
function tree(x,z,parent=estate,size=1){
  const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
  cylinder(.15*size,2.15*size,C.wood,0,1.15*size,0,g);
  const branch=box(.12*size,1.2*size,.12*size,C.wood,.28*size,1.7*size,0,g);branch.rotation.z=-.45;
  const blocks=[[-.62,2.65,0,1.35], [.48,3.2,.2,1.55], [0,3.8,-.28,1.4], [.9,2.6,-.35,1.15], [-.7,3.3,.55,1.2]];
  blocks.forEach(([a,b,c,d],i)=>{const leaf=box(d*size,.95*size,d*.8*size,i%2?C.leaf:C.lightLeaf,a*size,b*size,c*size,g);leaf.rotation.y=i*.38;});
  for(let i=0;i<5;i++)box(.17*size,.17*size,.17*size,C.orange,Math.sin(i*4)*size,3*size+(i%3)*.4*size,Math.cos(i*4)*size,g);
  return g;
}
function bench(x,z,parent=estate,rotation=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);
  for(let i=0;i<3;i++)box(1.7,.08,.15,C.wood,0,.6,-.23+i*.18,g);
  box(1.7,.13,.12,C.wood,0,.98,-.32,g);box(1.7,.13,.12,C.wood,0,.8,-.32,g);
  for(const a of [-.62,.62]){box(.1,.54,.48,C.dark,a,.29,0,g);box(.1,.8,.09,C.dark,a,.67,-.32,g);}return g;
}
function person(x,z,parent=estate,{shirt=C.teal,scale=1,worker=false,y=0,rotation=0}={}){
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);g.rotation.y=rotation;parent.add(g);
  box(.34,.45,.22,shirt,0,.72,0,g);box(.27,.3,.25,C.skin,0,1.1,0,g);
  box(.29,.13,.27,worker?C.amber:0x302d35,0,1.28,0,g);
  for(const a of [-.11,.11]){box(.12,.4,.14,C.navy,a,.32,0,g);box(.16,.1,.27,C.dark,a,.06,.04,g);}
  for(const a of [-.24,.24])box(.12,.41,.12,C.skin,a,.73,0,g);
  box(.04,.04,.025,C.dark,-.07,1.13,.137,g);box(.04,.04,.025,C.dark,.07,1.13,.137,g);return g;
}
function lamp(x,z,parent=estate){
  cylinder(.06,2.45,C.dark,x,1.23,z,parent);box(.42,.1,.42,C.dark,x,2.53,z,parent);
  box(.27,.35,.27,C.amber,x,2.3,z,parent,{emissive:true});box(.34,.1,.34,C.dark,x,2.06,z,parent);
  const glow=new THREE.PointLight(C.amber,.9,5,2);glow.position.set(x,2.2,z);parent.add(glow);
}
function bicycle(x,z,parent=estate,rotation=0){
  const g=new THREE.Group();g.position.set(x,.42,z);g.rotation.y=rotation;parent.add(g);
  for(const a of [-.42,.42]){const ring=mesh('torus',[.32,.045,4,12],C.dark,a,0,0,g);ring.rotation.y=0;}
  const rod=box(.8,.05,.05,C.teal,0,.17,0,g);rod.rotation.z=.35;
  box(.08,.45,.08,C.teal,-.06,.23,0,g);box(.22,.05,.15,C.dark,-.06,.5,0,g);
  const fork=box(.05,.6,.05,C.metal,.37,.24,0,g);fork.rotation.z=.2;box(.26,.05,.08,C.dark,.29,.56,0,g);
}
function parasol(x,z,parent=estate,color=C.coral){
  cylinder(.045,1.8,C.cream,x,.92,z,parent);const top=mesh('cylinder',[.9,1.25,.26,6],color,x,1.82,z,parent);top.rotation.y=Math.PI/6;
  cylinder(.53,.08,C.wood,x,.72,z,parent);for(let i=0;i<4;i++){const a=i*Math.PI/2;box(.3,.4,.3,C.coral,x+Math.cos(a)*.8,.22,z+Math.sin(a)*.8,parent);}
}

function createLand(){
  box(76,.7,76,0x4f5963,0,-.83,0,world);
  // A quiet canal and street frame the playable terrain; no photographic backdrop.
  box(76,.055,5,0x324f66,0,-.4,-37.4,world);
  box(76,.04,3.3,C.road,0,-.39,0,world);box(3.3,.04,76,C.road,0,-.38,0,world);
  for(let a=-34;a<=34;a+=3){box(1.2,.04,.12,C.cream,a,-.35,0,world);box(.12,.04,1.2,C.cream,0,-.34,a,world);}
  landSlots.forEach(([x,z],i)=>{
    const tile=target(box(28,.54,28,C.ground,x,-.3,z,world),'land',i,landHits);
    tile.material=mat(i%2?0x8a8770:0x7d826c);
    box(27.5,.035,27.5,0x858975,x,.01,z,world);
    // Four corner stakes, hedges and lines make each vacant plot spatially legible.
    for(const a of [-13.6,13.6])for(const b of [-13.6,13.6]){box(.13,.7,.13,C.cream,x+a,.36,z+b,world);box(.38,.09,.38,C.amber,x+a,.71,z+b,world);}
    for(const a of [-13.45,13.45]){box(26.8,.065,.13,C.cream,x,.06,z+a,world);box(.13,.065,26.8,C.cream,x+a,.06,z,world);}
    const label=textSprite(`LOT ${String.fromCharCode(65+i)}`,x,.4,z+11.8,world,{scale:5.7});projectNodes.set(`land:${i}`,tile);
    label.userData.landLabel=i;
    for(let k=0;k<4;k++)tree(x-11.6+k*7.6,z-12.3,world,.65);
  });
  for(let i=0;i<6;i++){
    const x=-35+i*14;box(3.3,4+i%3,3.8,[0x656778,0x776772,0x5a6c76][i%3],x,1.5,-34.4,world);
    for(let j=0;j<3;j++)box(.23,.4,.04,C.amber,x-1+j,2+(i%3),-32.48,world,{emissive:true});
  }
}

function corridorDetail(x,y,z,index,side=false){
  const g=new THREE.Group();g.position.set(x,y,z);if(side)g.rotation.y=Math.PI/2;estate.add(g);
  box(1.98,.11,.78,C.paving,0,-.5,.21,g);
  box(2.02,.12,.12,C.navy,0,.3,.57,g);
  for(let j=0;j<8;j++)box(.035,.65,.035,C.navy,-.84+j*.24,-.03,.57,g);
  box(.08,1.9,.1,C.cream,-1.05,.48,.48,g);
  if(index%3===0)planter(.71,-.37,.49,g,.27);
  if(index%7===0){box(.61,.31,.38,0xc9c0ad,-.72,.64,.35,g);box(.49,.05,.045,C.metal,-.72,.65,.56,g);}
  if(index%5===0){box(.035,.035,.65,C.dark,.43,.62,.66,g);for(let k=0;k<3;k++){const cloth=box(.22,.44,.025,[C.teal,C.coral,C.cream][k],.12+k*.23,.41,.91,g);cloth.rotation.z=(k-1)*.08;}}
}

function createApartmentBuilding(){
  const front=-4.65,base=2.8,floorH=2.15,floors=7;
  // Raised residential wings meet in an L; the ground floor remains an open void deck.
  const mainHull=target(box(14.65,15.05,3.1,C.wall,-2,10.25,-6.47),'building','hdb');
  target(box(3.1,15.05,11.8,0xb8a5ab,6.65,10.25,-2.3),'building','hdb');
  projectNodes.set('building:hdb',mainHull);
  box(15.05,.36,3.65,C.cream,-2,2.6,-6.4);box(3.65,.36,12.35,C.cream,6.65,2.6,-2.3);
  for(const x of [-8.9,-6.1,-3.3,-.5,2.3,4.4])box(.36,2.42,.4,C.cream,x,1.28,-4.9);
  for(const z of [-6.6,-3.8,-1,1.8,3.2])box(.42,2.42,.36,C.cream,7.92,1.28,z);
  box(1.12,18.8,3.28,C.pale,-8.68,9.45,-6.48);
  box(1.15,18.8,3.4,C.cream,4.76,9.45,-6.48);
  // Stair tower, roof tanks and utility risers break up the silhouette.
  box(2.25,19.1,2.8,C.pale,5.85,9.65,-8.65);
  for(let f=0;f<8;f++){box(1.12,.84,.035,C.navy,5.85,1.6+f*2.12,-7.22);box(.07,.84,.07,C.cream,5.85,1.6+f*2.12,-7.16);}
  for(let f=0;f<floors;f++){
    const y=base+f*floorH;
    box(14.9,.16,4.08,C.cream,-2,y-0.02,-6.15);
    box(3.7,.16,12.6,C.cream,6.68,y-.02,-2.15);
    box(14.82,.21,.15,[C.coral,C.cream,C.teal][f%3],-2,y+.22,-4.17);
    for(let c=0;c<6;c++){
      const x=-6.95+c*2.25,windowY=y+1.03,index=f*6+c;
      const warm=(f+c)%3!==0;
      box(1.65,1.35,.06,C.dark,x,windowY,front);
      const pane=box(1.38,1.13,.025,warm?C.amber:0x536273,x,windowY,front+.042,estate,{emissive:warm});
      box(.055,1.25,.05,C.cream,x,windowY,front+.075);box(1.51,.065,.05,C.cream,x,windowY,front+.076);
      box(.2,1.15,.1,(index%3===0)?C.coral:0xb79d82,x-.56,windowY,front+.11);
      box(.2,1.15,.1,(index%3===0)?C.coral:0xb79d82,x+.56,windowY,front+.11);
      box(.38,1.55,.07,C.pale,x+.86,y+.87,front+.015);
      box(.05,.05,.075,C.amber,x+.89,y+.88,front+.095);
      corridorDetail(x,y+.8,front+.18,index);
      const assigned=Object.entries(residentPositions).find(([id,p])=>id!=='kumar'&&Math.abs(p[0]-x)<.05&&Math.abs(p[1]-windowY)<.45);
      if(assigned){
        const [id]=assigned;target(pane,'resident',id);
        person(x-.22,front+.28,estate,{y:y+.23,shirt:id==='chen'?C.coral:id==='lin'?C.teal:id==='aisyah'?0x9772a1:C.cream,scale:.61});
        textSprite(id==='chen'?'03-12':id==='lin'?'05-18':id==='aisyah'?'04-16':'02-14',x,y+1.85,front+.36,estate,{scale:1.0,background:'#514352',border:'#ba947e'});
      }
    }
    for(let c=0;c<5;c++){
      const z=-5.95+c*2.25,x=8.25,yw=y+1.04;
      box(.07,1.38,1.55,C.dark,x,yw,z);box(.03,1.14,1.31,(f+c)%2?C.amber:0x586979,x+.053,yw,z,estate,{emissive:(f+c)%2===1});
      box(.07,1.28,.06,C.cream,x+.075,yw,z);box(.07,.065,1.43,C.cream,x+.075,yw,z);
      corridorDetail(x+.08,y+.8,z,f*5+c,true);
    }
  }
  // Roof edges, water storage and a greenhouse accent.
  box(15.2,.25,4.2,C.cream,-2,18.1,-6.12);box(4.1,.25,12.65,C.cream,6.72,18.1,-2.1);
  for(const z of [-8.05,-4.13])box(15.05,.48,.12,C.pale,-2,18.36,z);
  for(const x of [-9.4,5.5])box(.12,.48,4.01,C.pale,x,18.36,-6.11);
  box(2.3,1.4,2.35,C.cream,-4.5,18.9,-6.45);box(2.47,.12,2.5,C.pale,-4.5,19.65,-6.45);
  for(const x of [-7.2,-6.05]){cylinder(.47,1.18,0x72817e,x,18.8,-6.6);cylinder(.52,.09,C.metal,x,19.4,-6.6);}
  for(const x of [-9.25,4.6])cylinder(.07,17.9,C.metal,x,9,-4.28);
  const number=sign('317A',2.45,.94,-8.78,12.35,-4.7,estate,{background:'#bd9c92',color:'#254d79'});
  number.rotation.y=0;
  sign('BLK 317A',2.5,.56,4.77,1.76,-4.7,estate,{background:'#e4c2a4',color:'#2f5064'});
  // Singapore flag hangs from a genuine railing, with canvas-generated crescent and stars.
  const cv=document.createElement('canvas');cv.width=128;cv.height=80;const ctx=cv.getContext('2d');ctx.fillStyle='#dc4546';ctx.fillRect(0,0,128,40);ctx.fillStyle='#fff3e0';ctx.fillRect(0,40,128,40);
  ctx.beginPath();ctx.arc(26,21,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dc4546';ctx.beginPath();ctx.arc(32,18,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff3e0';ctx.font='15px sans-serif';ctx.fillText('✦',48,19);ctx.fillText('✦',64,23);ctx.fillText('✦',55,36);
  const flagTex=new THREE.CanvasTexture(cv);flagTex.magFilter=THREE.NearestFilter;const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.7),new THREE.MeshLambertMaterial({map:flagTex,side:THREE.DoubleSide}));flag.position.set(.3,9.4,-3.67);flag.rotation.z=-.05;estate.add(flag);
  // Resident door for Mei and chessboard below the apartments make the void deck readable.
  box(1.4,.8,.7,C.wood,-7.8,.45,-5.2);box(1.35,.08,.68,C.cream,-7.8,.89,-5.2);
  for(let a=0;a<5;a++)for(let b=0;b<5;b++)box(.11,.018,.11,(a+b)%2?C.dark:C.cream,-8.02+a*.11,.945,-5.4+b*.11);
  bench(-5.4,-4.85);sign('SUNSET NEIGHBOURHOOD',5.8,.6,-2.2,2.05,-4.13,estate,{background:'#bc7558'});
}

function createGround(){
  box(26,.2,26,C.paving,0,.04,0);
  // Soft masonry grid and a peripheral street define this finite community parcel.
  for(let x=-12;x<12;x+=1.35)box(.025,.01,23,0xb69683,x,.148,-.5);
  for(let z=-12;z<12;z+=1.35)box(23,.01,.025,0xb69683,0,.149,z);
  box(28,.11,3.4,C.road,0,.18,14.2);box(2.85,.09,27.4,C.road,-14.2,.17,-.3);
  for(let x=-11;x<=11;x+=2.4)box(1.05,.01,.12,C.cream,x,.242,14.15);
  for(let x=6;x<10;x+=.58)box(.28,.015,2.6,C.cream,x,.25,14.2);
  box(28,.14,.65,C.cream,0,.2,12.4);box(.65,.14,27,C.cream,-12.7,.2,-.4);
  const hedges=[[-11.7,2],[-11.7,6],[-11.7,10],[10.4,6],[10.4,10],[3.5,11.2]];
  hedges.forEach(([x,z])=>{box(1.15,.23,2.0,C.wood,x,.29,z);box(1.1,.6,1.95,C.leaf,x,.69,z);for(let j=0;j<4;j++)box(.15,.17,.15,C.orange,x-.35+(j%2)*.65,1.08,z-.5+Math.floor(j/2),estate);});
  tree(-10.8,5.4,estate,1.5);tree(7.8,8.35,estate,1.65);tree(-10.4,-9.4,estate,1.1);tree(10.3,-9.4,estate,1.2);
  bench(5.8,9.6,estate,Math.PI);bench(-9.1,8.6,estate,Math.PI/2);bench(4.2,-.55,estate,-Math.PI/2);
  [[-11.8,-2.7],[-9.2,11.4],[6.2,11.2],[9.8,1.4]].forEach(([x,z])=>lamp(x,z));
  for(let i=0;i<5;i++)bicycle(5.6+i*.47,-3.5,estate,Math.PI/2);
  for(let i=0;i<4;i++)planter(-9.5+i*.7,-.01,-4.25,estate,.48);
  // Bus and a roofed walkway are existing daily scenery; a purchased stop adds service.
  const bus=new THREE.Group();bus.position.set(-6.7,.37,14.25);estate.add(bus);
  box(4.7,1.55,1.63,C.teal,0,1.15,0,bus);box(4.55,.47,1.67,0x31575e,0,1.03,0,bus);box(4.75,.18,1.76,C.amber,0,1.94,0,bus);
  for(let k=0;k<6;k++)box(.49,.51,.025,C.amber,-1.71+k*.58,1.53,.839,bus,{emissive:true});
  for(const x of [-1.57,1.57])for(const z of [-.85,.85]){const wheel=cylinder(.31,.14,C.dark,x,.34,z,bus);wheel.rotation.x=Math.PI/2;}
  sign('165 · SUNSET',2.3,.3,.1,1.53,.875,bus,{background:'#2f464e',color:'#ffd26f'});
  box(6.45,.18,1.2,C.metal,6.3,2.42,5.35);for(const x of [3.45,5.4,7.4,9.4])box(.12,2.32,.12,C.navy,x,1.18,5.35);
  person(-.2,8.7,estate,{shirt:C.coral});person(4.55,4.1,estate,{shirt:C.teal});person(-9.4,-2.5,estate,{shirt:C.cream,scale:.86});
  const worker=person(7.15,7.65,estate,{shirt:C.orange,worker:true});
  worker.traverse(o=>{if(o.isMesh){o.userData.kind='resident';o.userData.id='kumar';staticHits.push(o);}});
  projectNodes.set('resident:kumar',worker);
  person(8.18,7.5,estate,{shirt:C.teal,worker:true,rotation:.5});
  box(.7,.15,.62,C.cream,7.5,.2,7.05);box(.24,.14,.22,C.orange,7.4,.35,7.05);box(.24,.14,.22,C.cream,7.7,.35,7.05);
  // Mailboxes, shared notice board, refuse bin and playground traces.
  box(1.35,1.24,.32,C.teal,2.8,.75,-4.5);for(let i=0;i<3;i++)for(let j=0;j<4;j++)box(.24,.18,.04,C.cream,2.36+j*.29,.42+i*.31,-4.32);
  box(1.3,1.2,.18,C.wood,-9.15,.89,-1.65);for(let i=0;i<4;i++)box(.45,.38,.02,[C.cream,C.pale,C.amber,C.white][i],-9.42+(i%2)*.52,.62+Math.floor(i/2)*.45,-1.54);
  box(.58,.94,.58,C.teal,9.6,.64,11.5);box(.66,.08,.66,C.navy,9.6,1.15,11.5);
}

function frameFacility(g,color=C.coral,{w=2.9,d=2.45,h=1.95}={}){
  box(w,.17,d,C.cream,0,.2,0,g);
  for(const x of [-w*.41,w*.41])for(const z of [-d*.37,d*.37])box(.13,h,.13,C.cream,x,h*.5+.3,z,g);
  box(w+.25,.23,d+.23,color,0,h+.37,0,g);box(w+.28,.09,.48,C.amber,0,h+.18,d*.5+.15,g);
}
function solar(g,y=0){for(let r=0;r<2;r++)for(let c=0;c<3;c++){
  const panel=box(.67,.06,.87,0x345973,-.76+c*.77,y+.48,-.5+r*1.05,g);panel.rotation.x=-.15;
  for(let k=0;k<3;k++)box(.016,.02,.8,0x85a8b6,-1.01+c*.77+k*.24,y+.52,-.5+r*1.05,g);
  box(.09,.4,.09,C.metal,-.76+c*.77,y+.24,-.5+r*1.05,g);
}}
function facility(id,index){
  const g=new THREE.Group(),[x,z]=plotPositions[index];g.position.set(x,0,z);facilityGroup.add(g);
  if(id==='roof'||id==='solar'){
    const roofg=new THREE.Group();roofg.position.set(id==='roof'?-.8:2.0,18.32,id==='roof'?-6.1:-6.15);facilityGroup.add(roofg);
    if(id==='roof'){
      for(let a=0;a<3;a++)for(let b=0;b<2;b++){box(.77,.18,.72,C.wood,-1+a*.91,.15,-.45+b*.9,roofg);planter(-1+a*.91,.24,-.45+b*.9,roofg,.48);}
      box(3.45,.03,2.2,C.lightLeaf,0,.035,0,roofg);
    }else solar(roofg);
    groupTarget(roofg,'plot',index);projectNodes.set(`plot:${index}`,roofg);
    box(2.8,.08,2.4,C.teal,0,.22,0,g);textSprite(id==='roof'?'↑ ROOFTOP GARDEN':'↑ SOLAR PANELS',0,.56,0,g,{scale:2.5});
  }else if(['club','smart','childcare','daycare'].includes(id)){
    frameFacility(g,id==='smart'?C.teal:id==='childcare'?C.orange:C.coral,{h:1.8});
    box(2.6,1.5,.12,C.pale,0,1.15,-.99,g);
    for(const a of [-.87,0,.87]){box(.62,.85,.04,C.amber,a,1.08,-.91,g,{emissive:true});box(.045,.86,.065,C.cream,a,1.08,-.86,g);}
    const label=id==='club'?'COMMUNITY CLUB':id==='smart'?'SMART HUB':id==='childcare'?'CHILDCARE CENTRE':'DAY CENTRE';
    sign(label,2.6,.4,0,1.77,1.3,g,{background:id==='childcare'?'#b78552':'#596b76'});
    box(1.46,.08,.59,C.wood,0,.7,.04,g);for(const a of [-.86,.86])box(.42,.46,.4,C.teal,a,.47,.23,g);
    if(id==='smart'){box(.47,.8,.27,C.navy,.9,.71,.66,g);box(.33,.33,.03,0x98c6cd,.9,.89,.82,g,{emissive:true});}
    if(id==='childcare'){for(let i=0;i<4;i++)box(.28,.25,.3,[C.coral,C.teal,C.amber,C.mint][i],-.7+i*.4,.33,.8,g);person(-.8,.7,g,{scale:.45,shirt:C.orange});}
    if(id==='daycare')planter(1.35,.12,1.09,g,.32);
  }else if(id==='hawker'||id==='canteen'){
    frameFacility(g,id==='canteen'?C.teal:C.coral,{h:1.78});
    box(2.6,1.27,.19,C.wood,0,.98,-.93,g);box(2.68,.13,.54,C.cream,0,.94,-.59,g);
    for(const a of [-.86,0,.86]){box(.65,.08,.5,C.metal,a,1.02,-.56,g);cylinder(.17,.22,C.dark,a,1.18,-.57,g);box(.72,.6,.06,C.amber,a,1.54,-.77,g,{emissive:true});}
    sign(id==='hawker'?'88 HAWKER CENTRE':'AFFORDABLE CANTEEN',2.73,.41,0,1.79,1.35,g,{background:id==='hawker'?'#cf704c':'#477b74'});
    for(const a of [-.78,.8]){cylinder(.43,.08,C.cream,a,.69,.55,g);cylinder(.05,.58,C.metal,a,.36,.55,g);for(const b of [-.47,.47])cylinder(.14,.37,C.coral,a,.32,.55+b,g);}
    person(1.05,-.52,g,{shirt:C.cream,scale:.67});
  }else if(id==='bus'){
    box(3.2,.19,1.6,C.metal,0,2.15,0,g);for(const a of [-1.35,1.35])box(.13,2,.13,C.navy,a,1.11,-.4,g);
    box(2.64,1.48,.08,C.teal,0,1.12,-.54,g);box(2.52,.35,.04,C.amber,0,1.58,-.48,g,{emissive:true});
    box(2.3,.12,.49,C.wood,0,.62,-.08,g);for(const a of [-.9,.9])box(.09,.55,.32,C.navy,a,.32,-.1,g);
    sign('BUS · 165',2.46,.43,0,2.15,.84,g,{background:'#416965'});box(.22,2.4,.19,C.navy,-1.55,1.3,.7,g);box(.6,.61,.09,C.amber,-1.55,2.3,.7,g);
  }else if(id==='walkway'){
    for(const a of [-1.35,0,1.35])for(const b of [-.88,.88])box(.12,1.86,.12,C.cream,a,1.1,b,g);
    box(3.1,.18,2.1,C.teal,0,2.11,0,g);for(let a=-1.2;a<=1.2;a+=.4)box(.05,.07,2.2,C.metal,a,2.24,0,g);
    box(3,.02,1.6,C.white,0,.21,0,g);person(.15,.38,g,{scale:.6,shirt:C.coral});
  }else if(id==='rest'){
    frameFacility(g,C.teal,{h:1.65});bench(0,.3,g);tree(-1.38,-.57,g,.53);person(.83,.31,g,{shirt:C.orange,worker:true,scale:.58});
    sign('TAKE A SEAT',2,.36,0,1.72,1.34,g,{background:'#557566'});
  }else if(id==='rain'){
    box(2.8,.12,2.3,C.mint,0,.21,0,g);box(1.4,.055,1.48,0x628e99,0,.32,0,g);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;planter(Math.cos(a)*1.06,.23,Math.sin(a)*.82,g,.26);}
    box(.3,.58,.3,C.teal,-1.23,.5,-.9,g);box(2.5,.13,.25,C.wood,0,.27,1.05,g);
  }else if(id==='feedback'){
    box(1.12,1.8,.72,C.teal,0,1.12,0,g);box(.72,.81,.045,C.navy,0,1.37,.4,g);box(.59,.57,.035,0x94c0c5,0,1.42,.433,g,{emissive:true});
    box(.67,.065,.16,C.amber,0,.65,.47,g);box(1.55,.16,1.15,C.cream,0,2.12,0,g);sign('FEEDBACK',1.28,.39,0,2.01,.67,g,{background:'#3a6669'});
  }else if(id==='blank'){
    box(2.8,.06,2.45,0xb0a68d,0,.21,0,g);for(const a of [-.8,.8])bench(a,0,g,Math.PI/2);
    box(1.14,.08,.66,C.wood,0,.67,0,g);for(let i=0;i<3;i++)box(.17,.02,.17,C.cream,-.3+i*.3,.72,0,g);
    textSprite('SPACE FOR EVERYDAY LIFE',0,1.2,-.25,g,{scale:2.3});
  }else if(id==='retrofit'){
    solar(g);box(2.8,.1,2.3,C.mint,0,.17,0,g);box(.53,1.25,.53,C.teal,1,.8,.8,g);sign('ENERGY UPGRADE',2.4,.42,0,1.34,1.13,g,{background:'#547d6c'});
  }else if(id==='soundproof'){
    for(let i=0;i<7;i++){box(.38,1.8,.19,i%2?C.teal:C.mint,-1.29+i*.43,1.1,-.5,g);box(.06,2,.14,C.metal,-1.5+i*.43,1.2,-.5,g);}planter(1.2,.2,.8,g,.44);
  }else{frameFacility(g,C.teal);}
  groupTarget(g,'plot',index);if(!['roof','solar'].includes(id))projectNodes.set(`plot:${index}`,g);
  return g;
}

function clearFacilities(){
  facilityHits.length=0;
  facilityGroup.traverse(o=>{if(o.userData.textureOwned){o.material?.map?.dispose();o.material?.dispose();o.geometry?.dispose();}});
  facilityGroup.clear();for(let i=0;i<7;i++)projectNodes.delete(`plot:${i}`);
}
function syncFacilities(){
  if(!state)return;
  const next=JSON.stringify([state.plots,state.unlocked]);
  if(next!==signature){
    signature=next;clearFacilities();
    state.plots.forEach((p,i)=>{
      const [x,z]=plotPositions[i],locked=i>=state.unlocked;
      const pad=box(3.28,.12,3.35,locked?0x918888:0xcabca4,x,.18,z,facilityGroup);
      target(pad,'plot',i,facilityHits);
      for(const a of [-1.59,1.59])box(3.2,.03,.07,locked?C.metal:C.cream,x,.26,z+a,facilityGroup);
      for(const a of [-1.59,1.59])box(.07,.03,3.2,locked?C.metal:C.cream,x+a,.26,z,facilityGroup);
      textSprite(p?'':locked?`LOCKED ${i+1}`:`PLOT ${i+1}`,x,.43,z+1.4,facilityGroup,{scale:1.6,background:locked?'#605964':'#635d59',border:'#b8a28a'}).visible=!p;
      if(p)facility(p.cardId,i);
    });
  }
  selectionTiles.forEach((m,i)=>{m.visible=options.view==='neighborhood'&&!state.plots[i]&&i<state.unlocked&&!!options.selected;});
}
const selectionTiles=[];
function createSelection(){plotPositions.forEach(([x,z])=>{const s=box(3.31,.025,3.38,C.amber,x,.28,z,estate,{transparent:true,opacity:.23});s.visible=false;selectionTiles.push(s);});}
function hoverName(hit){
  if(hit.kind==='land')return options.placed?(Number(hit.id)===options.landIndex?'Enter this HDB neighbourhood':'Lot '+String.fromCharCode(65+Number(hit.id))):'Place the HDB neighbourhood on Lot '+String.fromCharCode(65+Number(hit.id));
  if(hit.kind==='resident')return `Visit ${residentNames[hit.id]}`;
  if(hit.kind==='building')return options.view==='overview'?'Enter BLK 317A':'BLK 317A · Click a resident’s window to visit';
  const p=state?.plots[Number(hit.id)],locked=Number(hit.id)>=(state?.unlocked??4);
  if(locked)return 'This plot is awaiting approval';
  if(p)return (window.Downstairs?.cards.find(c=>c.id===p.cardId)?.name||'Community facility')+' · View';
  return options.selected?'Build '+(window.Downstairs?.cards.find(c=>c.id===options.selected)?.name||'a facility')+' here':'Plot '+(Number(hit.id)+1)+' · Select a facility to build';
}
function raycast(event){
  if(!renderer)return null;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);
  const list=options.view==='overview'?options.placed?[...landHits,...staticHits]:landHits:[...staticHits,...facilityHits];
  return ray.intersectObjects(list,false).find(h=>h.object.visible&&h.object.userData.kind)?.object||null;
}
function updateHover(object){
  if(hoverTarget===object)return;hoverTarget=object;
  container.style.cursor=object?'pointer':'grab';hoverSprite.visible=!!object;
  if(object){
    const msg=hoverName(object.userData);window.DownstairsUI?.sceneHover?.(msg);
    hoverSprite.material.map?.dispose();const cv=document.createElement('canvas');cv.width=768;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle='#26324a';ctx.fillRect(4,4,760,120);ctx.strokeStyle='#f4d69b';ctx.lineWidth=5;ctx.strokeRect(6,6,756,116);ctx.fillStyle='#fff1d5';ctx.font='bold 35px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(msg,384,65,730);const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;hoverSprite.material.map=t;hoverSprite.material.needsUpdate=true;
    const position=new THREE.Vector3();object.getWorldPosition(position);if(object.userData.kind==='land'){position.y=1.5;position.z+=3;}else position.y+=1.3;hoverSprite.position.copy(position);hoverSprite.scale.set(options.view==='overview'?15:6.8,options.view==='overview'?2.5:1.13,1);
  }else window.DownstairsUI?.sceneHover?.('');
}
function activate(object){
  if(!object)return;const {kind,id}=object.userData;
  if(kind==='land'){
    if(!options.placed)window.DownstairsUI?.sceneLand?.(Number(id));
    else if(Number(id)===options.landIndex)window.DownstairsUI?.sceneBuilding?.();
  }else if(options.view==='overview')window.DownstairsUI?.sceneBuilding?.();
  else if(kind==='resident')window.DownstairsUI?.sceneResident?.(id);
  else if(kind==='plot')window.DownstairsUI?.scenePlot?.(Number(id));
  else window.DownstairsUI?.sceneBuilding?.();
}
function cameraGoals(){
  const neighborhood=options.placed&&options.view==='neighborhood';const [x,z]=landSlots[options.landIndex]||landSlots[0];
  cameraTarget.set(neighborhood?x:0,neighborhood?6.9:0,neighborhood?z:0);
  const distance=neighborhood?34:72;
  cameraPosition.set(cameraTarget.x+Math.sin(angle)*distance,cameraTarget.y+(neighborhood?23:57),cameraTarget.z+Math.cos(angle)*distance);
  const h=neighborhood?15:42;
  const aspect=(container.clientWidth||900)/(container.clientHeight||600);
  camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;camera.zoom=zoomLevel;camera.updateProjectionMatrix();
}
function resize(){if(!renderer)return;const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(Math.round(w/1.6),Math.round(h/1.6),false);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';cameraGoals();}
function sync(s,opts={}){
  state=s||state;const previousView=options.view;const previousLand=options.landIndex;
  options={...options,...opts};options.landIndex=Math.max(0,Math.min(3,Number(options.landIndex)||0));
  estate.visible=!!options.placed;const [x,z]=landSlots[options.landIndex];estate.position.set(x,0,z);
  world.children.forEach(o=>{if(o.userData.landLabel!==undefined)o.visible=!options.placed||o.userData.landLabel!==options.landIndex;});
  if(previousView!==options.view||previousLand!==options.landIndex){zoomLevel=1;updateHover(null);cameraGoals();}
  syncFacilities();
  syncConstructionCelebrations();
}
function showOverview(){sync(state,{view:'overview'});}
function showNeighborhood(){if(options.placed)sync(state,{view:'neighborhood'});}
function rotate(direction=1){angle+=Number(direction)*Math.PI/4;cameraGoals();}
function zoom(delta){zoomLevel=THREE.MathUtils.clamp(zoomLevel+Number(delta),.65,2.1);cameraGoals();}
function reset(){angle=-Math.PI*.22;zoomLevel=1;cameraGoals();}
function project(kind,id){
  const node=projectNodes.get(`${kind}:${id}`)||(kind==='building'?projectNodes.get('building:hdb'):null);if(!node||!camera||!renderer)return null;
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const v=new THREE.Vector3();node.getWorldPosition(v);
  if(kind==='land')v.y=.12;if(kind==='resident'&&id==='kumar')v.y+=.8;
  if(kind==='building')v.y+=1;
  v.project(camera);const r=renderer.domElement.getBoundingClientRect();
  return {x:r.left+(v.x+1)*.5*r.width,y:r.top+(1-v.y)*.5*r.height,visible:v.z>=-1&&v.z<=1};
}
function diagnostics(){return {ready:started,view:options.view,placed:options.placed,landIndex:options.landIndex,plots:state?.plots?.filter(Boolean).length||0,objects:renderer?.info.render.calls||0,residentHotspots:Object.keys(residentNames).filter(id=>projectNodes.has(`resident:${id}`)),width:renderer?.domElement.width,height:renderer?.domElement.height,fireworksActive:activeFireworks.length,fireworksLaunched,fireworksParticles:activeFireworks.reduce((count,effect)=>count+effect.particleCount,0)};}
function animate(t){
  if(t-frameTime<33)return;frameTime=t;
  camera.position.lerp(cameraPosition,.13);const look=camera.userData.look||(camera.userData.look=new THREE.Vector3().copy(cameraTarget));look.lerp(cameraTarget,.13);camera.lookAt(look);
  selectionTiles.forEach(m=>{if(m.visible)m.scale.setScalar(1+Math.sin(t*.004)*.015);});
  animateFireworks(t);
  renderer.render(scene,camera);
}
function initialize(){
  container=document.getElementById('world-scene');if(!container)return;
  try{
    camera=new THREE.OrthographicCamera(-40,40,40,-40,.1,280);
    renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.domElement.id='hdb-world-canvas';renderer.domElement.setAttribute('aria-label','Interactive HDB neighbourhood: drag to rotate, scroll to zoom, and click lots, residents or facilities');renderer.domElement.style.imageRendering='pixelated';renderer.domElement.style.touchAction='none';container.append(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xd9bad3,0x3a4763,2.25));
    const sun=new THREE.DirectionalLight(0xffbd7d,3.2);sun.position.set(-35,70,45);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;sun.shadow.camera.far=180;sun.shadow.normalBias=.06;scene.add(sun);
    createLand();createGround();createApartmentBuilding();createSelection();
    hoverSprite=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false}));hoverSprite.renderOrder=100;hoverSprite.visible=false;scene.add(hoverSprite);
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);resize();camera.position.copy(cameraPosition);camera.userData.look=new THREE.Vector3().copy(cameraTarget);camera.lookAt(cameraTarget);
    renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,angle,moved:false,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);});
    renderer.domElement.addEventListener('pointermove',e=>{
      if(drag){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;if(drag.moved){angle=drag.angle-(e.clientX-drag.x)*.007;cameraGoals();updateHover(null);container.style.cursor='grabbing';}}
      else updateHover(raycast(e));
    });
    renderer.domElement.addEventListener('pointerup',e=>{if(drag&&!drag.moved)activate(raycast(e));drag=null;container.style.cursor='grab';});
    renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});renderer.domElement.addEventListener('pointerleave',()=>{if(!drag)updateHover(null);});
    renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom(-e.deltaY*.001);},{passive:false});
    started=true;
    window.HDBScene={ready:true,sync,rotate,zoom,reset,showOverview,showNeighborhood,project,diagnostics,get view(){return options.view;}};
    renderer.setAnimationLoop(animate);window.DownstairsUI?.appSceneReady?.();
  }catch(error){
    console.error('HDB scene could not initialize',error);let panel=document.getElementById('world-error');if(!panel){panel=document.createElement('div');panel.id='world-error';container.append(panel);}panel.textContent='This browser could not open the 3D scene. Please refresh or try a browser that supports WebGL.';panel.hidden=false;
    window.HDBScene={ready:false,diagnostics:()=>({ready:false,error:String(error.message||error)})};
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
