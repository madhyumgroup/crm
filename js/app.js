'use strict';
if('serviceWorker' in navigator)window.addEventListener('load',async()=>{try{const r=await navigator.serviceWorker.register('./sw.js?v=20260912.1');await r.update()}catch(_){}});
window.navigate=navigate;window.closeModal=closeModal;window.logout=logout;window.openWingLeads=openWingLeads;

let leadPollBusy=false;
async function checkForLeadUpdates(){
  if(leadPollBusy||!state.token||!state.role||document.hidden||$('loginView')?.classList.contains('hidden')===false)return;
  if($('modalRoot')?.children.length)return;
  leadPollBusy=true;
  try{
    if(state.role==='admin'){
      const r=await api('adminDashboard',{token:state.token});
      if(r.success){state.admin.inquiries=Array.isArray(r.inquiries)?r.inquiries:[];state.admin.stats=r.stats||state.admin.stats||{};detectLeadChanges(state.admin.inquiries)}
    }else{
      const r=await api('agentDashboard',{token:state.token});
      if(r.success){state.user=r.agent||state.user;state.agent.leads=Array.isArray(r.leads)?r.leads:[];state.agent.commissions=Array.isArray(r.commissions)?r.commissions:state.agent.commissions;detectLeadChanges(state.agent.leads);storeSession()}
    }
  }catch(_){/* background check stays silent */}
  finally{leadPollBusy=false}
}

setInterval(checkForLeadUpdates,15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(checkForLeadUpdates,800)});
window.addEventListener('focus',()=>setTimeout(checkForLeadUpdates,800));

if(restoreSession())startApp().catch(()=>logout(true));
