// Shared helpers for the DeepSeek proxy. The key lives only in the Vercel environment
// variable DEEPSEEK_API_KEY and is never sent to the browser.
const key=()=>(process.env.DEEPSEEK_API_KEY||'').trim();
function reason(r){
  if(!key())return '服务器没有配置 DeepSeek Key（DEEPSEEK_API_KEY）';
  if(r.error)return r.error.name==='TimeoutError'||r.error.name==='AbortError'?'连接 DeepSeek 超时':'连不上 api.deepseek.com';
  const m=r.body?.error?.message||'';
  if(r.status===401)return 'Key 无效或已失效';
  if(r.status===402)return 'DeepSeek 账户余额不足';
  if(r.status===429)return 'DeepSeek 请求太频繁，请稍后再试';
  if(r.status>=500)return 'DeepSeek 服务暂时不可用';
  return 'DeepSeek 返回错误 '+r.status+(m?'：'+m:'');
}
async function deepseek(payload,timeoutMs){
  try{const res=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key()},body:JSON.stringify(payload),signal:AbortSignal.timeout(timeoutMs)});
    let body=null;try{body=await res.json();}catch{}return {status:res.status,body};}
  catch(error){return {status:0,error};}
}
// Only the game's own pages may call the proxy.
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host;}catch{return false;}}
function send(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
module.exports={key,reason,deepseek,sameOrigin,send};
