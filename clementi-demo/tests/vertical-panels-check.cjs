'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../dist/year-app.js'),'utf8');
const start=source.indexOf('  function fitDetail(){'),end=source.indexOf('  /* —— Policy:',start);
assert(start>=0&&end>start);
const detail={style:{}},context={root:{innerHeight:1080},doc:{querySelector(selector){if(selector==='.yr-need-detail')return detail;return this.rects[selector]?{getBoundingClientRect:()=>this.rects[selector]}:null;},rects:{}}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
let checked=0;
// Exercise the actual resize helper with desktop, IAB and small-device bounds.
// No parent/dock rectangle exists in this fixture: vertically scrolling the
// sidebar must not reduce the available detail panel to the old 150px sliver.
for(const frame of [
  {height:1080,header:82,action:904},
  {height:988,header:82,action:821},
  {height:764,header:116,action:614},
  {height:844,header:154,action:694}
]){
  context.root.innerHeight=frame.height;
  context.doc.rects={'.yr-bar':{bottom:frame.header},'.yr-action':{width:360,height:134,top:frame.action}};
  vm.runInContext('fitDetail()',context);
  const top=parseInt(detail.style.top,10),height=parseInt(detail.style.maxHeight,10);
  assert(top>=frame.header+12,'detail starts below the visible header');
  assert(height>300,'a side panel at the top must not collapse long detail content');
  assert(top+height<=frame.action-12,'detail leaves the footer reachable');
  checked++;
}
context.doc.rects['.yr-action']={width:0,height:0,top:0};
vm.runInContext('fitDetail()',context);
assert.equal(parseInt(detail.style.top,10)+parseInt(detail.style.maxHeight,10),context.root.innerHeight-16,'an invisible footer does not reserve a phantom space');
console.log('Vertical visit panels: '+checked+' viewport detail bounds, resize and hidden-footer checks passed.');
