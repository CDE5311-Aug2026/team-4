const {key,send}=require('./_deepseek');
module.exports=(req,res)=>send(res,200,{configured:!!key(),provider:'DeepSeek',model:'deepseek-chat'});
