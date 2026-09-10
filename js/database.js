import { SUPABASE_URL, SUPABASE_ANON_KEY, DEMO_MODE, LOGIN_ID_DOMAIN } from './config.js';

const LOCAL_KEY='madhyum_crm_offline_v5';
const DEMO_AUTH_KEY='madhyum_crm_demo_session_v2';
const seed=[
 {id:'demo-1',name:'Aarav Sharma',mobile:'9876543210',city:'Bhopal',wing:'Travel',requirement:'Goa package • 4 adults • 4N/5D',status:'HOT',followup_at:new Date(Date.now()+3600000).toISOString(),assigned_to:null,notes:['Package options discussed','Final pricing to be shared'],created_at:new Date().toISOString()},
 {id:'demo-2',name:'Neha Verma',mobile:'9893012345',city:'Bhopal',wing:'Real Estate',requirement:'3 BHK near Hoshangabad Road',status:'NEW',followup_at:new Date(Date.now()+4*3600000).toISOString(),assigned_to:null,notes:['Budget confirmation pending'],created_at:new Date().toISOString()}
];
let client=null;

async function supabase(){
  if(DEMO_MODE) return null;
  if(client) return client;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
function localLeads(){
  const raw=localStorage.getItem(LOCAL_KEY);
  if(!raw){localStorage.setItem(LOCAL_KEY,JSON.stringify(seed));return structuredClone(seed)}
  try{return JSON.parse(raw)}catch{return structuredClone(seed)}
}
function saveLocal(list){localStorage.setItem(LOCAL_KEY,JSON.stringify(list))}
function demoSession(){try{return JSON.parse(localStorage.getItem(DEMO_AUTH_KEY)||'null')}catch{return null}}
function normalizeIdentifier(identifier){
  const value=String(identifier||'').trim();
  if(!value)return '';
  if(value.includes('@'))return value.toLowerCase();
  const domain=String(LOGIN_ID_DOMAIN||'').trim();
  if(!domain)throw new Error('Login ID support is not configured. Use your email or set LOGIN_ID_DOMAIN in js/config.js.');
  return `${value.toLowerCase()}@${domain}`;
}

export async function backendMode(){return DEMO_MODE?'demo':'online'}
export async function session(){
  const c=await supabase();
  if(!c)return demoSession();
  const {data,error}=await c.auth.getSession();
  if(error)throw error;
  return data.session;
}
export async function signIn(identifier,password){
  const cleanPassword=String(password||'');
  if(!String(identifier||'').trim()||!cleanPassword)throw new Error('Enter Login ID / Email and password.');
  const c=await supabase();
  if(!c){
    const demo={user:{id:'demo-user',email:String(identifier).trim()},demo:true};
    localStorage.setItem(DEMO_AUTH_KEY,JSON.stringify(demo));
    return demo;
  }
  const email=normalizeIdentifier(identifier);
  const {data,error}=await c.auth.signInWithPassword({email,password:cleanPassword});
  if(error)throw error;
  return data;
}
export async function signOut(){
  const c=await supabase();
  if(!c){localStorage.removeItem(DEMO_AUTH_KEY);return}
  const {error}=await c.auth.signOut();
  if(error)throw error;
}

export async function getProfile(){
  const c=await supabase();
  if(!c){
    const s=demoSession();
    if(!s?.user)return null;
    return {full_name:'Saif',role:localStorage.getItem('madhyum_demo_role')||'admin'};
  }
  const s=await session(); if(!s?.user)return null;
  const {data,error}=await c.from('profiles').select('id,full_name,role').eq('id',s.user.id).single();
  if(error)throw error; return data;
}
export function setDemoRole(role){if(DEMO_MODE)localStorage.setItem('madhyum_demo_role',role)}

export async function getLeads(){
  const c=await supabase(); if(!c)return localLeads();
  const {data,error}=await c.from('leads').select('*').order('created_at',{ascending:false});
  if(error)throw error; return data||[];
}
export async function addLead(lead){
  const c=await supabase();
  const payload={...lead,followup_at:lead.followup_at||null,status:lead.status||'NEW'};
  if(!c){
    if(!demoSession()?.user)throw new Error('Please sign in again.');
    const item={...payload,id:crypto.randomUUID(),created_at:new Date().toISOString(),notes:['Inquiry created']};
    const list=localLeads();list.unshift(item);saveLocal(list);return item;
  }
  const s=await session(); if(!s?.user)throw new Error('Please sign in again.');
  payload.created_by=s.user.id;
  const {data,error}=await c.from('leads').insert(payload).select().single(); if(error)throw error; return data;
}
export async function updateLead(id,patch){
  const c=await supabase();
  if(!c){const list=localLeads().map(x=>x.id===id?{...x,...patch}:x);saveLocal(list);window.dispatchEvent(new Event('madhyum-local-change'));return}
  const {error}=await c.from('leads').update(patch).eq('id',id); if(error)throw error;
}
export async function addActivity(leadId,type,note){
  const c=await supabase();
  if(!c){const list=localLeads();const i=list.findIndex(x=>x.id===leadId);if(i>=0){list[i].notes=[...(list[i].notes||[]),note];saveLocal(list);window.dispatchEvent(new Event('madhyum-local-change'))}return}
  const s=await session(); const {error}=await c.from('lead_activities').insert({lead_id:leadId,type,note,created_by:s?.user?.id}); if(error)throw error;
}
export async function getActivities(leadId){
  const c=await supabase();
  if(!c){const x=localLeads().find(v=>v.id===leadId);return (x?.notes||[]).map((note,i)=>({id:i,note,type:'note',created_at:x.created_at}))}
  const {data,error}=await c.from('lead_activities').select('*').eq('lead_id',leadId).order('created_at',{ascending:false}); if(error)throw error; return data||[];
}

// Keeps web and installed PWA views in sync when the shared Supabase backend changes.
export async function subscribeToChanges(onChange){
  const c=await supabase();
  if(!c){
    const handler=()=>onChange?.();
    window.addEventListener('storage',handler);
    window.addEventListener('madhyum-local-change',handler);
    return ()=>{window.removeEventListener('storage',handler);window.removeEventListener('madhyum-local-change',handler)};
  }
  const channel=c.channel('madhyum-crm-live')
    .on('postgres_changes',{event:'*',schema:'public',table:'leads'},()=>onChange?.())
    .on('postgres_changes',{event:'*',schema:'public',table:'lead_activities'},()=>onChange?.())
    .subscribe();
  return ()=>c.removeChannel(channel);
}
