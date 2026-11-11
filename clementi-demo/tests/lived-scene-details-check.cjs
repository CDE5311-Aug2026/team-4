'use strict';
// Execute the static geometry builders using the actual bundled Three.js.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'scene-source.mjs'),'utf8');
function between(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b);}
(async()=>{
 const THREE=await import(require('node:url').pathToFileURL(path.join(root,'vendor/three.module.js')).href);
 const context={THREE,world:new THREE.Group(),geometryCache:new Map(),materialCache:new Map()};vm.createContext(context);
 vm.runInContext(source.match(/^const C=.+/m)[0],context);
 vm.runInContext(between('function geo(','function target('),context);
 vm.runInContext(between('function planter(','function bench('),context);
 vm.runInContext(between('function detailGeometry(','function oldHDB('),context);
 const flag=vm.runInContext('facadeFlag(world,0,4,2,1)',context);
 const cloth=flag.children.slice(0,2);assert.equal(cloth[0].material.color.getHex(),0xdf453f);assert.equal(cloth[1].material.color.getHex(),0xfff3df);assert(cloth[0].position.y>cloth[1].position.y);
 assert(Math.abs(cloth[0].geometry.parameters.width/(cloth[0].geometry.parameters.height*2)-1.5)<.001,'3:2 flag cloth');
 assert.equal(flag.children.filter(n=>n.geometry.type==='ShapeGeometry').length,5,'five separate stars');
 const moon=flag.children[3],cut=flag.children[4];assert.equal(moon.material.color.getHex(),0xfff3df);assert.equal(cut.material.color.getHex(),0xdf453f);assert(cut.position.x>moon.position.x,'crescent opens towards stars');
 context.host=new THREE.Group();context.host.position.set(-10,0,20);context.world.add(context.host);
 const facade=vm.runInContext("livedFacade(host,'a',22,5,6)",context);assert(facade.userData.facadeDetails);assert.equal(facade.userData.counts.flags,1);assert.equal(facade.userData.counts.laundry,2);assert.equal(facade.userData.counts.condensers,6);
 assert(facade.children.every(n=>n.isInstancedMesh),'static details remain instanced');
 const instanceCount=facade.children.reduce((sum,n)=>sum+n.count,0);assert(facade.children.length<instanceCount/2,'batching reduces static detail draw calls');
 for(const child of facade.children){assert(child.boundingSphere&&Number.isFinite(child.boundingSphere.radius));const matrix=new THREE.Matrix4();for(let i=0;i<child.count;i++){child.getMatrixAt(i,matrix);assert(matrix.elements.every(Number.isFinite),'finite instance transforms');}}
 vm.runInContext('streetDetails()',context);const street=context.world.children.find(n=>n.userData.streetDetails);assert(street&&street.children.length);
 assert(street.children.every(n=>n.isInstancedMesh),'street furniture is batched');
 console.log('Lived scene details passed: red/white 3:2 flag with crescent and five stars; deterministic facade content; finite, instanced facade and street geometry. Facade '+instanceCount+' pieces in '+facade.children.length+' batches.');
})().catch(error=>{console.error(error);process.exitCode=1;});
