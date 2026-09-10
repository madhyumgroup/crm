import { backendMode,session,signIn,signOut,getProfile,getLeads,addLead,updateLead,addActivity,getActivities,setDemoRole,subscribeToChanges } from './database.js';
import { esc,toast,leadCard,fmtDate,dueLabel } from './ui.js';

const app=document.querySelector('#app'), modal=document.querySelector('#modal-root');
let page='home', leads=[], profile=null, mode='demo', query='', wing='All', busy=false, liveStop=null, loginRole='agent';
const wings=['Real Estate','Travel','Admission','Consultancy & Business Services','Events & Weddings'];

async function boot(){
  mode=await backendMode(); const s=await session();
  if(!s){renderLogin();return}
  try{profile=await getProfile();await refresh();startLiveSync()}catch(e){showError(e)}
}
function startLiveSync(){
  if(liveStop)return;
  subscribeToChanges(async()=>{try{leads=await getLeads();render()}catch(e){console.warn('Live refresh failed',e)}}).then(stop=>liveStop=stop).catch(console.warn);
}
async function refresh(){leads=await getLeads();render()}
function shell(body){return `<main class="app">${body}<nav class="nav"><button data-nav="home" class="${page==='home'?'active':''}"><span>⌂</span>Home</button><button data-nav="leads" class="${page==='leads'?'active':''}"><span>◎</span>Leads</button><button class="fab" data-add aria-label="Add inquiry">＋</button><button data-nav="followups" class="${page==='followups'?'active':''}"><span>✓</span>Follow-ups</button><button data-nav="more" class="${page==='more'?'active':''}"><span>☰</span>More</button></nav></main>`}
function stats(){const active=leads.filter(x=>x.status!=='CONVERTED'&&x.status!=='CLOSED').length, hot=leads.filter(x=>x.status==='HOT').length, converted=leads.filter(x=>x.status==='CONVERTED').length, due=leads.filter(x=>['TODAY','OVERDUE'].includes(dueLabel(x.followup_at))).length;return {active,hot,converted,due}}
function home(){const s=stats();const priority=leads.filter(x=>x.status==='HOT'||['TODAY','OVERDUE'].includes(dueLabel(x.followup_at))).slice(0,5);return shell(`<header class="hero"><div class="top"><div><div class="brand">MADHYUM GROUP</div><div class="crm-mark">CRM</div></div><div class="avatar">${esc((profile?.full_name||'M').slice(0,2).toUpperCase())}</div></div><p class="eyebrow">${mode==='online'?'LIVE • SHARED CRM':(profile?.role||'DEMO').toUpperCase()+' DASHBOARD • PREVIEW'}</p><h1>Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, ${esc((profile?.full_name||'Team').split(' ')[0])}.</h1><p>Everything that needs attention, in one place.</p></header><section class="content"><div class="stats"><button class="metric" data-nav="leads"><strong>${s.active}</strong><span>Active Leads</span></button><button class="metric" data-nav="followups"><strong>${s.due}</strong><span>Due Follow-ups</span></button><button class="metric"><strong>${s.hot}</strong><span>Hot Leads</span></button><button class="metric"><strong>${s.converted}</strong><span>Converted</span></button></div><button class="primary" data-add>＋ Add New Inquiry</button><div class="section-row"><div><h2>Priority</h2><p>Hot and due leads</p></div><button data-nav="leads">View all</button></div>${priority.map(leadCard).join('')||'<div class="empty">No priority leads right now.</div>'}</section>`)}
function leadsPage(){const list=leads.filter(x=>(wing==='All'||x.wing===wing)&&(`${x.name} ${x.mobile} ${x.city} ${x.requirement}`.toLowerCase().includes(query.toLowerCase())));return shell(`<section class="content page"><div class="page-title"><div><h1>Leads</h1><p>${list.length} result${list.length===1?'':'s'}</p></div><button class="small-primary" data-add>＋ Add</button></div><input id="search" class="search" value="${esc(query)}" placeholder="Search name, number, city, requirement"><div class="chips">${['All',...wings].map(w=>`<button data-wing="${esc(w)}" class="${wing===w?'active':''}">${esc(w)}</button>`).join('')}</div><div class="lead-list">${list.map(leadCard).join('')||'<div class="empty">No matching leads.</div>'}</div></section>`)}
function followups(){const list=leads.filter(x=>x.followup_at).sort((a,b)=>new Date(a.followup_at)-new Date(b.followup_at));return shell(`<section class="content page"><div class="page-title"><div><h1>Follow-ups</h1><p>Next actions in chronological order</p></div></div><div class="segmented"><button class="active">All scheduled</button></div>${list.map(leadCard).join('')||'<div class="empty">No follow-ups scheduled.</div>'}</section>`)}
function more(){return shell(`<section class="content page"><div class="page-title"><div><h1>More</h1><p>${esc(profile?.role||'user')} account • ${mode==='online'?'Online':'Demo'}</p></div></div><div class="menu-card"><button><span>♙</span><div><b>Members</b><small>Membership database</small></div><i>›</i></button><button><span>◇</span><div><b>Partners</b><small>Partner & provider network</small></div><i>›</i></button><button><span>▥</span><div><b>Reports</b><small>Conversion & performance</small></div><i>›</i></button><button data-signout><span>↪</span><div><b>Sign out</b><small>End this session</small></div><i>›</i></button></div>${mode==='demo'?'<div class="setup-note"><b>Online sync is not connected yet.</b><p>Add your Supabase URL and anon key in <code>js/config.js</code>, then run <code>supabase/schema.sql</code> once.</p></div>':''}</section>`)}
function render(){app.innerHTML=page==='home'?home():page==='leads'?leadsPage():page==='followups'?followups():more();bind()}
function renderLogin(){
  app.innerHTML=`<main class="login-wrap">
    <section class="login-card">
      <div class="login-brand-block">
        <div class="brand-logo-wrap">
          <img class="brand-logo-img" src="madhyum-brand.png" alt="MADHYUM GROUP" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
          <div class="login-monogram brand-fallback">M</div>
        </div>
        <div>
          <div class="login-company">MADHYUM GROUP</div>
          <div class="login-tagline">Ek Bharosemand Zariya</div>
          <div class="login-crm-title">CRM</div>
        </div>
      </div>
      <div class="role-tabs" role="tablist" aria-label="Select login type">
        <button type="button" data-role="admin" class="${loginRole==='admin'?'active':''}">Admin Login</button>
        <button type="button" data-role="agent" class="${loginRole==='agent'?'active':''}">Agent Login</button>
      </div>
      <h1>${loginRole==='admin'?'Admin':'Agent'} Login</h1>
      <p>Sign in to MADHYUM GROUP CRM.</p>
      <form id="login">
        <label>Login ID / Email<input name="identifier" type="text" autocomplete="username" placeholder="Enter Login ID or Email" required></label>
        <label>Password<div class="password-wrap"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter password" required><button type="button" class="show-password" id="show-password">Show</button></div></label>
        <button class="primary login-submit">Login</button>
      </form>
      <div class="login-footer">MADHYUM GROUP • ${loginRole==='admin'?'ADMIN':'AGENT'} ACCESS</div>
    </section>
  </main>`;
  app.querySelectorAll('[data-role]').forEach(btn=>btn.onclick=()=>{loginRole=btn.dataset.role;renderLogin()});
  const toggle=app.querySelector('#show-password'),pwd=app.querySelector('#password');
  toggle.onclick=()=>{const show=pwd.type==='password';pwd.type=show?'text':'password';toggle.textContent=show?'Hide':'Show'};
  app.querySelector('#login').onsubmit=async e=>{
    e.preventDefault();if(busy)return;busy=true;
    const btn=e.currentTarget.querySelector('.login-submit');btn.disabled=true;btn.textContent='Logging in…';
    try{
      const d=Object.fromEntries(new FormData(e.currentTarget));
      setDemoRole(loginRole);
      await signIn(d.identifier,d.password);
      profile=await getProfile();
      if(mode==='online' && profile?.role && profile.role!==loginRole){
        await signOut();
        throw new Error(`This account is registered as ${profile.role}. Please use ${profile.role==='admin'?'Admin':'Agent'} Login.`);
      }
      page='home';await refresh();startLiveSync();
    }catch(err){toast(err.message||'Login failed')}
    finally{busy=false;btn.disabled=false;btn.textContent='Login'}
  };
}
function addModal(){modal.innerHTML=`<div class="sheet"><form class="panel" id="lead-form"><div class="handle"></div><div class="modal-head"><div><h2>New Inquiry</h2><p>Only essentials. Add details later.</p></div><button type="button" class="close" data-close>×</button></div><label>Name<input name="name" required autocomplete="name" placeholder="Customer name"></label><div class="two"><label>Mobile<input name="mobile" required inputmode="tel" pattern="[0-9+ -]{8,15}" placeholder="10-digit number"></label><label>City<input name="city" placeholder="Bhopal"></label></div><label>Wing<select name="wing">${wings.map(w=>`<option>${esc(w)}</option>`).join('')}</select></label><label>Requirement<textarea name="requirement" required placeholder="What does the customer need?"></textarea></label><div class="two"><label>Status<select name="status"><option>NEW</option><option>CONTACTED</option><option>INTERESTED</option><option>HOT</option><option>CONVERTED</option><option>CLOSED</option></select></label><label>Follow-up<input name="followup_at" type="datetime-local"></label></div><button class="primary">Save Inquiry</button></form></div>`;bindSheet();modal.querySelector('#lead-form').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;try{const d=Object.fromEntries(new FormData(e.currentTarget));d.mobile=d.mobile.replace(/\D/g,'').slice(-10);d.followup_at=d.followup_at?new Date(d.followup_at).toISOString():null;await addLead(d);modal.innerHTML='';toast('Inquiry saved');await refresh()}catch(err){toast(err.message||'Could not save')}finally{busy=false}}}
async function openLead(id){const x=leads.find(v=>v.id===id);if(!x)return;let acts=[];try{acts=await getActivities(id)}catch{}modal.innerHTML=`<div class="sheet"><section class="panel"><div class="handle"></div><div class="modal-head"><div><h2>${esc(x.name)}</h2><p>${esc(x.wing)} • ${esc(x.status)}</p></div><button class="close" data-close>×</button></div><div class="profile-actions"><button data-call="${esc(x.mobile)}">☎ Call</button><button data-wa="${esc(x.mobile)}">WhatsApp</button></div><div class="detail-card"><span>Requirement</span><b>${esc(x.requirement)}</b></div><div class="detail-grid"><div><span>Mobile</span><b>${esc(x.mobile)}</b></div><div><span>City</span><b>${esc(x.city||'—')}</b></div><div><span>Follow-up</span><b>${esc(fmtDate(x.followup_at))}</b></div><div><span>Status</span><select id="status-select">${['NEW','CONTACTED','INTERESTED','HOT','CONVERTED','CLOSED'].map(s=>`<option ${x.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div><form id="note-form" class="note-form"><input name="note" required placeholder="Add call note or update..."><button>Add</button></form><div class="section-row"><div><h2>Activity</h2><p>Customer history</p></div></div><div class="timeline">${acts.map(a=>`<div><i></i><section><b>${esc(a.type||'update')}</b><p>${esc(a.note||'')}</p><small>${esc(fmtDate(a.created_at))}</small></section></div>`).join('')||'<p class="empty">No activity yet.</p>'}</div></section></div>`;bindSheet();bindQuick();modal.querySelector('#status-select').onchange=async e=>{try{await updateLead(id,{status:e.target.value});await addActivity(id,'status',`Status changed to ${e.target.value}`);toast('Status updated');await refresh()}catch(err){toast(err.message)}};modal.querySelector('#note-form').onsubmit=async e=>{e.preventDefault();const note=new FormData(e.currentTarget).get('note').trim();if(!note)return;try{await addActivity(id,'note',note);toast('Note added');await openLead(id)}catch(err){toast(err.message)}}}
function bindSheet(){modal.querySelector('[data-close]')?.addEventListener('click',()=>modal.innerHTML='');modal.querySelector('.sheet')?.addEventListener('click',e=>{if(e.target.classList.contains('sheet'))modal.innerHTML=''})}
function call(m){const n=(m||'').replace(/\D/g,'').slice(-10);if(n)location.href=`tel:+91${n}`}
function wa(m){const n=(m||'').replace(/\D/g,'').slice(-10);if(n)window.open(`https://wa.me/91${n}`,'_blank','noopener')}
function bindQuick(){document.querySelectorAll('[data-call]').forEach(b=>b.onclick=e=>{e.stopPropagation();call(b.dataset.call)});document.querySelectorAll('[data-wa]').forEach(b=>b.onclick=e=>{e.stopPropagation();wa(b.dataset.wa)})}
function bind(){app.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{page=b.dataset.nav;render();scrollTo(0,0)});app.querySelectorAll('[data-add]').forEach(b=>b.onclick=addModal);app.querySelectorAll('[data-open]').forEach(b=>b.onclick=e=>{e.stopPropagation();openLead(b.dataset.open)});app.querySelectorAll('[data-wing]').forEach(b=>b.onclick=()=>{wing=b.dataset.wing;render()});const s=app.querySelector('#search');if(s)s.oninput=e=>{query=e.target.value;render()};app.querySelector('[data-signout]')?.addEventListener('click',async()=>{if(liveStop){liveStop();liveStop=null}await signOut();profile=null;renderLogin()});bindQuick()}
function showError(e){console.error(e);app.innerHTML=`<div class="fatal"><h1>CRM could not load</h1><p>${esc(e?.message||'Unknown error')}</p><button onclick="location.reload()">Retry</button></div>`}
boot();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
