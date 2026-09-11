'use strict';
const READ_ACTIONS=new Set([
  'adminDashboard','agentDashboard','listAgents','adminTrash','adminCommissions',
  'adminDataDistribution','adminCallingData','adminVisitors','agentDataDistribution',
  'agentCallingData','adminMembers','adminMemberChangeRequests','agentMembers',
  'agentMemberChangeRequests','memberProfile'
]);
async function api(action,payload={}){
  const body={...payload,action};
  let r;
  try{
    if(READ_ACTIONS.has(action)){
      const u=new URL(API_URL);
      Object.entries(body).forEach(([k,v])=>{
        if(v!==undefined&&v!==null&&typeof v!=='object')u.searchParams.set(k,String(v));
      });
      u.searchParams.set('_',Date.now());
      r=await fetch(u.toString(),{method:'GET',cache:'no-store'});
    }else{
      r=await fetch(API_URL+'?action='+encodeURIComponent(action)+'&_='+Date.now(),{
        method:'POST',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)
      });
    }
  }catch(e){throw new Error('Network error. Check internet connection.');}
  let data;
  try{data=await r.json();}catch(e){throw new Error('Server returned an invalid response.');}
  if(!data.success&&/session/i.test(data.message||'')){logout(true);throw new Error('Session expired. Please login again.');}
  return data;
}
