'use strict';
const API_URL='https://script.google.com/macros/s/AKfycbwd5x_8gPAzXMeP4TZPxLQQABisZ6Zn4lmGmzhfUsg83Z4xdnNY2dqb5KdZvRhGm4M/exec';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const cleanPhone=v=>String(v||'').replace(/\D/g,'').slice(-10);
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const WINGS=['Real Estate','Travel','Education & Admissions','Consultancy & Business Services','Events & Weddings','Membership','General / Other'];
const STATUSES=['NEW','CONTACTED','FOLLOW UP','IN PROGRESS','CONVERTED','NOT INTERESTED'];
const state={loginType:'agent',role:null,token:null,user:null,admin:{inquiries:[],agents:[],calling:[],commissions:[],distribution:[],trash:[]},agent:{leads:[],commissions:[],calling:[],shared:null},view:'home',wingFilter:'',notifications:[]};
let toastTimer=null;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
function busy(btn,on,text='Working...'){if(!btn)return;if(on){btn.dataset.old=btn.textContent;btn.disabled=true;btn.textContent=text}else{btn.disabled=false;btn.textContent=btn.dataset.old||btn.textContent}}
function statusBadge(s){const k=String(s||'NEW').toLowerCase().replace(/\s+/g,'-');return `<span class="status s-${['new','contacted','follow-up','in-progress','converted','not-interested'].includes(k)?k:'default'}">${esc(s||'NEW')}</span>`}
function followClass(d,status){if(!d||['CONVERTED','NOT INTERESTED'].includes(String(status||'').toUpperCase()))return'';const a=new Date(d+'T00:00:00'),b=new Date();b.setHours(0,0,0,0);return a<b?'overdue':a.getTime()===b.getTime()?'due':''}
function callActions(mobile){const m=cleanPhone(mobile);return m?`<a class="act-dark" href="tel:${m}">Call</a><a class="act-green" target="_blank" rel="noopener" href="https://wa.me/91${m}">WhatsApp</a>`:''}
function openModal(title,html,actions=''){ $('modalRoot').innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal-sheet"><div class="modal-grip"></div><div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" id="modalClose">×</button></div>${html}${actions}</div></div>`;$('modalClose').onclick=closeModal;$('modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()}}
function closeModal(){$('modalRoot').innerHTML=''}


const CORE_WINGS=[
  {label:'Real Estate',value:'Real Estate',icon:'⌂'},
  {label:'Travel',value:'Travel',icon:'✈'},
  {label:'Admission',value:'Education & Admissions',icon:'▤'},
  {label:'Consultancy & Business',value:'Consultancy & Business Services',icon:'◇'},
  {label:'Events & Weddings',value:'Events & Weddings',icon:'✦'}
];
function categoryButtons(){return `<section class="category-section"><div class="section-head"><h3>Main Categories</h3><span class="category-hint">Tap to view leads</span></div><div class="category-grid">${CORE_WINGS.map(w=>`<button class="category-btn" type="button" onclick="openWingLeads('${esc(w.value).replace(/&#039;/g,"\\'")}')"><span class="category-icon">${w.icon}</span><strong>${esc(w.label)}</strong></button>`).join('')}</div></section>`}
function openWingLeads(wing){state.wingFilter=wing;navigate('leads')}
function notificationStorageKey(suffix='items'){const id=state.user?.adminId||state.user?.agentId||'user';return `madhyumCRM:${state.role||'guest'}:${id}:${suffix}`}
function comparableLead(l){return {id:String(l.leadId||l.inquiryId||''),name:String(l.name||''),mobile:String(l.mobile||''),requirement:String(l.requirement||''),status:String(l.status||''),followUp:String(l.followUp||''),agentId:String(l.agentId||l.lgId||''),details:String(l.details||''),notes:String(l.notes||'')}}
function loadNotifications(){try{state.notifications=JSON.parse(localStorage.getItem(notificationStorageKey('notifications'))||'[]')||[]}catch(_){state.notifications=[]}renderNotificationBadge()}
function saveNotifications(){try{localStorage.setItem(notificationStorageKey('notifications'),JSON.stringify(state.notifications.slice(0,40)))}catch(_){}renderNotificationBadge()}
function renderNotificationBadge(){const b=$('notificationBadge');if(!b)return;const n=state.notifications.filter(x=>!x.read).length;b.textContent=n>99?'99+':String(n);b.classList.toggle('hidden',n===0)}
function detectLeadChanges(rows){
  if(!state.role||!state.user)return;
  const current=(Array.isArray(rows)?rows:[]).map(comparableLead).filter(x=>x.id);
  const key=notificationStorageKey('leadSnapshot');
  let previous=null;try{previous=JSON.parse(localStorage.getItem(key)||'null')}catch(_){previous=null}
  try{localStorage.setItem(key,JSON.stringify(current))}catch(_){}
  if(!Array.isArray(previous)){renderNotificationBadge();return}
  const oldMap=new Map(previous.map(x=>[x.id,x]));
  const found=[];
  for(const now of current){
    const old=oldMap.get(now.id);
    if(!old){found.push({title:'New lead received',message:`${now.name||now.id} • ${now.requirement||'General'}`,leadId:now.id});continue}
    const changed=[];
    if(old.status!==now.status)changed.push(`Status: ${old.status||'—'} → ${now.status||'—'}`);
    if(old.followUp!==now.followUp)changed.push(`Follow-up: ${now.followUp||'removed'}`);
    if(old.requirement!==now.requirement)changed.push(`Category: ${now.requirement||'updated'}`);
    if(old.agentId!==now.agentId)changed.push(`Assigned: ${now.agentId||'unassigned'}`);
    if(old.details!==now.details||old.notes!==now.notes)changed.push('Lead details / notes updated');
    if(changed.length)found.push({title:'Lead updated',message:`${now.name||now.id} • ${changed.join(' • ')}`,leadId:now.id});
  }
  if(found.length){
    const ts=Date.now();
    state.notifications=[...found.reverse().map((x,i)=>({...x,id:`${ts}-${i}`,time:new Date().toISOString(),read:false})),...state.notifications].slice(0,40);
    saveNotifications();
    toast(`${found.length} lead update${found.length>1?'s':''} received`);
  }else renderNotificationBadge();
}
function openNotifications(){
  const items=state.notifications;
  const html=`<div class="notification-list">${items.length?items.map(n=>`<article class="notification-item ${n.read?'':'unread'}"><div class="notification-dot"></div><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><small>${formatNotificationTime(n.time)}</small></div></article>`).join(''):'<div class="empty">No lead updates yet.</div>'}</div>`;
  const actions=items.length?`<div class="modal-actions"><button class="ghost-btn" id="clearNotifications">Clear all</button><button class="primary-btn" id="markNotificationsRead">Mark all read</button></div>`:'';
  openModal('Lead Notifications',html,actions);
  if($('markNotificationsRead'))$('markNotificationsRead').onclick=()=>{state.notifications=state.notifications.map(n=>({...n,read:true}));saveNotifications();closeModal()};
  if($('clearNotifications'))$('clearNotifications').onclick=()=>{state.notifications=[];saveNotifications();closeModal()};
}
function formatNotificationTime(v){try{const d=new Date(v);return d.toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch(_){return''}}
