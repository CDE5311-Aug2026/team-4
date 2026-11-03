const fs=require('fs'),path=require('path');
const dist=path.join(__dirname,'dist');
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,file)=>{
  let css=fs.readFileSync(path.join(dist,file),'utf8');
  css=css.replace(/url\(["']?(assets\/[^"')]+)["']?\)/g,(_,asset)=>'url("data:image/png;base64,'+fs.readFileSync(path.join(dist,asset)).toString('base64')+'")');
  return '<style'+(file==='flow.css'?' data-entry-style="true"':'')+'>'+css+'</style>';
});
html=html.replace(/\s*<script defer src="[^"]+"><\/script>/g,'');
const scripts=['data.js','engine.js','art.js','clementi-art.js','world.js','i18n.js','community.js','visuals.js','singapore-outline.js','flow.js','app.js','scene-adapter.js','scene.bundle.js'].map(file=>'<script>\n'+fs.readFileSync(path.join(dist,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>').join('\n');
html=html.replace('</body>',()=>scripts+'\n</body>');
const out=path.join(__dirname,'金文泰-可玩Demo.html');fs.writeFileSync(out,html);console.log(out);
