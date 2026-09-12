'use strict';
// AGENT / BDM

async function loadAgentDashboard(){
  const r=await api('agentDashboard',{token:state.token});
  if(!r||r.success!==true)throw new Error((r&&r.message)||'Unable to load dashboard.');
  if(!r.agent||!Array.isArray(r.leads))throw new Error('Live Agent CRM feed is not available from the current backend.');
  state.user=r.agent||state.user;
  state.agent.leads=cleanRecords(r.leads);
  state.agent.commissions=Array.isArray(r.commissions)?r.commissions:[];
  detectLeadChanges(state.agent.leads);
  storeSession();
  return r
}

function leadCard(l,admin=false){
  const id=l.leadId||l.inquiryId||'',
  mobile=l.mobile||'',
  req=l.requirement||'General / Other',
  agent=l.agentId||l.lgId||'';

  return `<article class="item-card ${followClass(l.followUp,l.status)}">
    <div class="item-top">
      <div>
        <div class="item-title">${esc(l.name||'Unnamed')}</div>
        <div class="item-id">${esc(id)}</div>
      </div>
      ${statusBadge(l.status)}
    </div>
    <div class="item-meta">
      <span>📱 ${esc(mobile||'—')}</span>
      <span>◈ ${esc(req)}</span>
      ${agent?`<span>Agent: ${esc(agent)}</span>`:''}
      ${l.followUp?`<span>Follow-up: ${esc(portalDateText(l.followUp))}</span>`:''}
    </div>
    ${l.details?`<div class="item-note">${esc(l.details)}</div>`:''}
    <div class="item-actions">
      ${callActions(mobile)}
      <button class="act-gold edit-lead" data-id="${esc(id)}">Edit</button>
      ${admin?`<button class="act-red dispose-lead" data-id="${esc(id)}" data-type="${esc(l.recordType||'WEBSITE')}">Dispose</button>`:''}
    </div>
  </article>`
}

async function renderAgent(v){
  if(v==='home'){
    await loadAgentDashboard();
    renderAgentHome();
    return
  }
  if(v==='leads'){
    if(!state.agent.leads.length)await loadAgentDashboard();
    renderAgentLeads();
    return
  }
  if(v==='add'){
    renderAddLead();
    return
  }
  if(v==='followups'){
    if(!state.agent.leads.length)await loadAgentDashboard();
    renderFollowups();
    return
  }
  if(v==='more'){
    renderAgentMore();
    return
  }
  if(v==='commission'){
    if(!state.agent.commissions.length)await loadAgentDashboard();
    renderAgentCommission();
    return
  }
  if(v==='calling'){
    await loadAgentCalling();
    renderAgentCalling();
    return
  }
  if(v==='shared'){
    await loadAgentShared();
    renderAgentShared();
    return
  }
  if(v==='profile'){
    renderProfile();
    return
  }
}

function renderAgentHome(){
  const leads=state.agent.leads,
  count=s=>leads.filter(x=>String(x.status||'').toUpperCase()===s).length;

  $('mainContent').innerHTML=`
    <section class="hero">
      <div class="eyebrow">Hi, ${esc(state.user?.name || '')}</div>
      <p>Manage leads, follow-ups, calling data and earnings from one place.</p>
      <div class="hero-action">
        <button class="primary-btn" onclick="navigate('add')">+ Add Lead</button>
      </div>
    </section>

    <section class="metric-grid">
      <div class="metric full" onclick="navigate('leads')">
        <div>
          <div class="label">TOTAL LEADS</div>
          <div class="value">${leads.length}</div>
        </div>
        <span>→</span>
      </div>

      <div class="metric" onclick="filterAgentStatus('NEW')">
        <div class="label">NEW</div>
        <div class="value">${count('NEW')}</div>
      </div>

      <div class="metric" onclick="navigate('followups')">
        <div class="label">FOLLOW UP</div>
        <div class="value">${count('FOLLOW UP')}</div>
      </div>

      <div class="metric" onclick="filterAgentStatus('IN PROGRESS')">
        <div class="label">IN PROGRESS</div>
        <div class="value">${count('IN PROGRESS')}</div>
      </div>

      <div class="metric" onclick="filterAgentStatus('CONVERTED')">
        <div class="label">CONVERTED</div>
        <div class="value">${count('CONVERTED')}</div>
      </div>
    </section>

    ${categoryButtons()}

    <section class="section-card">
      <div class="section-head">
        <h3>Recent Leads</h3>
        <button class="link" onclick="navigate('leads')">View all</button>
      </div>
      <div class="list">
        ${leads.slice(0,4).map(l=>leadCard(l)).join('')||'<div class="empty">No leads yet.</div>'}
      </div>
    </section>
  `;

  bindLeadButtons(false)
}

window.filterAgentStatus=function(s){
  state.agentFilter=s;
  navigate('leads')
}

function renderAgentLeads(){
  const mc=$('mainContent');

  mc.innerHTML=`
    <div class="toolbar">
      <input class="input" id="agentSearch" placeholder="Search name, mobile or lead ID">

      <select class="select" id="agentWing">
        <option value="">All requirements</option>
        ${WINGS.map(w=>`<option>${w}</option>`).join('')}
      </select>

      <select class="select" id="agentStatus">
        <option value="">All statuses</option>
        ${STATUSES.map(s=>`<option>${s}</option>`).join('')}
      </select>
    </div>

    <div id="agentLeadList" class="list"></div>
  `;

  if(state.agentFilter){
    $('agentStatus').value=state.agentFilter;
    state.agentFilter=''
  }

  if(state.wingFilter){
    $('agentWing').value=state.wingFilter;
    state.wingFilter=''
  }

  const run=()=>{
    const q=$('agentSearch').value.toLowerCase(),
    w=$('agentWing').value,
    s=$('agentStatus').value;

    const rows=state.agent.leads.filter(l=>
      (!q||[l.leadId,l.name,l.mobile].join(' ').toLowerCase().includes(q)) &&
      (!w||l.requirement===w) &&
      (!s||String(l.status).toUpperCase()===s)
    );

    $('agentLeadList').innerHTML=
      rows.map(l=>leadCard(l)).join('')||
      '<div class="section-card"><div class="empty">No matching leads.</div></div>';

    bindLeadButtons(false)
  };

  ['agentSearch','agentWing','agentStatus'].forEach(id=>
    $(id).addEventListener(id==='agentSearch'?'input':'change',run)
  );

  run()
}
/* FIX: REQUIRED FOR EDIT / DISPOSE BUTTONS */
function bindLeadButtons(admin){
  document.querySelectorAll('.edit-lead').forEach(b=>{
    b.onclick=()=>openLeadEditor(b.dataset.id,admin);
  });

  if(admin){
    document.querySelectorAll('.dispose-lead').forEach(b=>{
      b.onclick=()=>disposeLead(b.dataset.type,b.dataset.id);
    });
  }
}
