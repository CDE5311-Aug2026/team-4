const {key,reason,deepseek,send}=require('./_deepseek');
let cache=null;
module.exports=async(req,res)=>{
  if(!key())return send(res,200,{configured:false,ok:false,error:reason({})});
  const force='force' in (req.query||{});
  if(!force&&cache&&Date.now()-cache.at<(cache.ok?600000:15000))return send(res,200,cache.result);
  const r=await deepseek({model:'deepseek-chat',messages:[{role:'user',content:'ping'}],max_tokens:1},15000);
  const ok=r.status===200,result={configured:true,ok,...(ok?{}:{error:reason(r)})};cache={at:Date.now(),ok,result};send(res,200,result);
};
