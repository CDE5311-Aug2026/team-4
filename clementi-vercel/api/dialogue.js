const {key,reason,deepseek,sameOrigin,send}=require('./_deepseek');
module.exports=async(req,res)=>{
  if(!sameOrigin(req))return send(res,403,{error:'Origin rejected'});
  if(req.method!=='POST')return send(res,405,{error:'POST required'});
  if(!key())return send(res,401,{error:reason({})});
  let input=req.body;
  try{if(typeof input==='string')input=JSON.parse(input);}catch{return send(res,400,{error:'请求格式不正确'});}
  const messages=input?.messages;
  if(!Array.isArray(messages)||!messages.length||JSON.stringify(messages).length>60000)return send(res,400,{error:'请求格式不正确'});
  const r=await deepseek({model:'deepseek-chat',messages,response_format:{type:'json_object'},temperature:0.7,max_tokens:1000},40000);
  if(r.status===200){const choice=r.body?.choices?.[0];if(choice?.finish_reason==='length')return send(res,502,{error:'回复被截断，请重试。'});return send(res,200,{text:choice?.message?.content||''});}
  return send(res,r.status&&r.status>=400?r.status:502,{error:reason(r)});
};
