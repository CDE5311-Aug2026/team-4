'use strict';

// A separate local review port prevents the original launcher from opening an
// older Downstairs process that may already be running on port 4201.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const crypto=require('node:crypto'),{spawn}=require('node:child_process');
const gameDir=path.resolve(__dirname,'..'),port=4311,url=`http://127.0.0.1:${port}/`;
const digest=text=>crypto.createHash('sha256').update(text).digest('hex');
const expected=['index.html','year-policy-content.js','year-app.js','community-intro.css'].map(file=>({file,hash:digest(fs.readFileSync(path.join(gameDir,'dist',file)))}));
async function probe(){const results=await Promise.all(expected.map(({file,hash})=>new Promise(resolve=>{
  const req=http.get(url+file,res=>{const chunks=[];res.on('data',part=>chunks.push(part));res.on('end',()=>resolve({busy:true,match:res.statusCode===200&&digest(Buffer.concat(chunks))===hash}));res.on('error',()=>resolve({busy:true,match:false}));});
  req.setTimeout(1200,()=>req.destroy());req.on('error',error=>resolve({busy:error.code!=='ECONNREFUSED',match:false}));
})));return {busy:results.some(result=>result.busy),match:results.every(result=>result.match)};}
async function main(){
  let status=await probe();
  if(status.busy&&!status.match)throw new Error('Port 4311 is used by another local preview. Close that preview and try again.');
  if(!status.busy){
    const child=spawn(process.execPath,[path.join(gameDir,'server.cjs')],{cwd:gameDir,env:{...process.env,PORT:String(port)},windowsHide:true,detached:true,stdio:'ignore'});child.unref();
    for(let n=0;n<40&&!status.match;n++){await new Promise(resolve=>setTimeout(resolve,150));status=await probe();}
    if(!status.match)throw new Error('The local preview could not start. Run clementi-demo/server.cjs to see the error.');
  }
  console.log('Downstairs local review: '+url);
  if(process.platform==='win32'&&!process.argv.includes('--check')){const browser=spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true,detached:true,stdio:'ignore'});browser.unref();}
  else console.log('Open the URL above in your browser.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
