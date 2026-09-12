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
  const leads=state.agent.leads;
  const count=s=>leads.filter(x=>String(x.status||'').toUpperCase()===s).length;

  $('mainContent').innerHTML=`
    <section class="hero">
      <div class="eyebrow">Hi, ${esc(state.user?.name||'')}</div>
      <h3>Dashboard</h3>
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

function renderFollowups(){
  const today=new Date();
  today.setHours(0,0,0,0);

  const rows=state.agent.leads
    .filter(l=>l.followUp&&!['CONVERTED','NOT INTERESTED'].includes(String(l.status).toUpperCase()))
    .sort((a,b)=>String(a.followUp).localeCompare(String(b.followUp)));

  $('mainContent').innerHTML=`
    <section class="section-card">
      <div class="section-head">
        <h3>Due & Upcoming</h3>
        <span class="tiny muted">${rows.length} records</span>
      </div>

      <div class="list">
        ${rows.map(l=>leadCard(l)).join('')||'<div class="empty">No follow-ups scheduled.</div>'}
      </div>
    </section>
  `;

  bindLeadButtons(false)
}

function renderAddLead(){
  $('mainContent').innerHTML=`
    <section class="section-card">
      <div class="section-head">
        <h3>New Customer Lead</h3>
      </div>

      <form id="addLeadForm" class="form-grid">
        <div>
          <label class="field-label">Customer Name</label>
          <input class="input" id="alName" required>
        </div>

        <div>
          <label class="field-label">Mobile</label>
          <input class="input" id="alMobile" inputmode="numeric" maxlength="10" required>
        </div>

        <div>
          <label class="field-label">Email</label>
          <input class="input" id="alEmail" type="email">
        </div>

        <div>
          <label class="field-label">Wing / Requirement</label>
          <select class="select" id="alWing" required>
            <option value="">Select</option>
            ${WINGS.map(w=>`<option>${w}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="field-label">Category / Sub-category</label>
          <input class="input" id="alSub" placeholder="Plot, Hotel, MBBS, GST...">
        </div>

        <div>
          <label class="field-label">Budget / Range</label>
          <input class="input" id="alBudget">
        </div>

        <div class="field-full">
          <label class="field-label">Details</label>
          <textarea class="textarea" id="alDetails"></textarea>
        </div>

        <div class="field-full">
          <button class="primary-btn" id="addLeadBtn">Add Lead</button>
          <div id="addLeadMsg" class="form-message"></div>
        </div>
      </form>
    </section>
  `;

  $('alMobile').oninput=e=>e.target.value=cleanPhone(e.target.value);

  $('addLeadForm').onsubmit=async e=>{
    e.preventDefault();

    const btn=$('addLeadBtn');
    busy(btn,true,'Adding...');

    try{
      const details=[
        $('alSub').value.trim()?`Category / Sub-category: ${$('alSub').value.trim()}`:'',
        $('alBudget').value.trim()?`Budget / Range: ${$('alBudget').value.trim()}`:'',
        $('alDetails').value.trim()?`Details: ${$('alDetails').value.trim()}`:''
      ].filter(Boolean).join('\n');

      const r=await api('addAgentLead',{
        token:state.token,
        name:$('alName').value.trim(),
        mobile:cleanPhone($('alMobile').value),
        email:$('alEmail').value.trim(),
        requirement:$('alWing').value,
        details
      });

      if(!r.success)throw new Error(r.message||'Unable to add lead.');

      toast(`Lead ${r.leadId||''} added`);
      await loadAgentDashboard();
      navigate('leads')

    }catch(err){
      $('addLeadMsg').textContent=err.message
    }finally{
      busy(btn,false)
    }
  }
}

function bindLeadButtons(admin){
  document.querySelectorAll('.edit-lead').forEach(
    b=>b.onclick=()=>openLeadEditor(b.dataset.id,admin)
  );

  if(admin){
    document.querySelectorAll('.dispose-lead').forEach(
      b=>b.onclick=()=>disposeLead(b.dataset.type,b.dataset.id)
    )
  }
}

function parseDetails(text){
  const out={sub:'',budget:'',details:''};

  String(text||'').split(/\r?\n/).forEach(line=>{
    if(/^Category \/ Sub-category:/i.test(line))
      out.sub=line.replace(/^.*?:/,'').trim();

    else if(/^Budget \/ Range:/i.test(line))
      out.budget=line.replace(/^.*?:/,'').trim();

    else if(/^Details:/i.test(line))
      out.details+=(out.details?'\n':'')+line.replace(/^Details:/i,'').trim();

    else
      out.details+=(out.details?'\n':'')+line
  });

  return out
}

function openLeadEditor(id,admin){
  const l=(admin?state.admin.inquiries:state.agent.leads)
    .find(x=>(x.inquiryId||x.leadId)===id);

  if(!l)return;

  const p=parseDetails(l.details);
  const isAgentRecord=admin&&String(l.recordType||'').toUpperCase()==='AGENT';

  openModal(
    'Edit Lead',
    `<div class="form-grid">

      <div>
        <label class="field-label">Customer</label>
        <input class="input" id="edName" value="${esc(l.name||'')}" ${admin?'disabled':''}>
      </div>

      <div>
        <label class="field-label">Mobile</label>
        <input class="input" id="edMobile" value="${esc(l.mobile||'')}" ${admin?'disabled':''}>
      </div>

      <div>
        <label class="field-label">Requirement</label>
        <select class="select" id="edWing" ${admin?'disabled':''}>
          ${WINGS.map(w=>`<option ${w===l.requirement?'selected':''}>${w}</option>`).join('')}
        </select>
      </div>

      <div>
        <label class="field-label">Status</label>
        <select class="select" id="edStatus">
          ${STATUSES.map(s=>`
            <option
              ${s===String(l.status||'').toUpperCase()?'selected':''}
              ${!admin&&s==='CONVERTED'&&String(l.status).toUpperCase()!=='CONVERTED'?'disabled':''}>
              ${s}
            </option>
          `).join('')}
        </select>
      </div>

      <div>
        <label class="field-label">Follow-up Date</label>
        <input class="input" id="edFollow" type="date" value="${esc(l.followUp||'')}">
      </div>

      ${
        admin&&!isAgentRecord
        ? `<div>
            <label class="field-label">Assigned To</label>
            <input class="input" id="edAssigned" value="${esc(l.assignedTo||'')}">
          </div>`
        : ''
      }

      ${
        !admin
        ? `<div>
            <label class="field-label">Category</label>
            <input class="input" id="edSub" value="${esc(p.sub)}">
          </div>

          <div>
            <label class="field-label">Budget</label>
            <input class="input" id="edBudget" value="${esc(p.budget)}">
          </div>

          <div class="field-full">
            <label class="field-label">Details</label>
            <textarea class="textarea" id="edDetails">${esc(p.details)}</textarea>
          </div>`
        : ''
      }

      <div class="field-full">
        <label class="field-label">Notes</label>
        <textarea class="textarea" id="edNotes">${esc(l.notes||'')}</textarea>
      </div>

    </div>`,

    `<div class="modal-actions">
      <button class="ghost-btn" onclick="closeModal()">Cancel</button>
      <button class="primary-btn" id="saveLeadEdit">Save Update</button>
    </div>`
  );

  $('saveLeadEdit').onclick=async()=>{
    const btn=$('saveLeadEdit');
    busy(btn,true,'Saving...');

    try{
      let action,payload;

      if(admin){
        action=isAgentRecord?'updateAgentLead':'updateInquiry';

        payload={
          token:state.token,
          inquiryId:id,
          status:$('edStatus').value,
          assignedTo:isAgentRecord?'':($('edAssigned')?.value||'').trim(),
          followUp:$('edFollow').value,
          notes:$('edNotes').value.trim()
        };

      }else{
        const details=[
          $('edSub').value.trim()?`Category / Sub-category: ${$('edSub').value.trim()}`:'',
          $('edBudget').value.trim()?`Budget / Range: ${$('edBudget').value.trim()}`:'',
          $('edDetails').value.trim()?`Details: ${$('edDetails').value.trim()}`:''
        ].filter(Boolean).join('\n');

        action='agentUpdateLead';

        payload={
          token:state.token,
          leadId:id,
          name:$('edName').value.trim(),
          mobile:cleanPhone($('edMobile').value),
          requirement:$('edWing').value,
          details,
          status:$('edStatus').value,
          followUp:$('edFollow').value,
          notes:$('edNotes').value.trim()
        }
      }

      const r=await api(action,payload);

      if(!r.success)throw new Error(r.message||'Unable to update lead.');

      toast('Lead updated');
      closeModal();

      admin
        ? await loadAdminDashboard()
        : await loadAgentDashboard();

      navigate('leads')

    }catch(e){
      toast(e.message)

    }finally{
      busy(btn,false)
    }
  }
}

function renderAgentMore(){
  $('mainContent').innerHTML=`
    <section class="section-card">
      <div class="quick-grid">

        <button class="quick" onclick="navigate('commission')">
          <strong>₹ My Commission</strong>
          <small>Earnings & payout</small>
        </button>

        <button class="quick" onclick="navigate('calling')">
          <strong>☎ Calling Data</strong>
          <small>Assigned calling list</small>
        </button>

        <button class="quick" onclick="navigate('shared')">
          <strong>⇄ Shared Data</strong>
          <small>Director / BDM data</small>
        </button>

        <button class="quick" onclick="navigate('profile')">
          <strong>♙ Profile</strong>
          <small>ID & reporting</small>
        </button>

      </div>
    </section>

    <section class="section-card danger-zone">
      <div class="section-head">
        <h3>Account</h3>
      </div>

      <button class="danger-btn" style="width:100%" onclick="logout()">
        Logout
      </button>
    </section>
  `
}

function renderAgentCommission(){
  const rows=state.agent.commissions;

  $('mainContent').innerHTML=`
    <section class="hero">
      <div class="eyebrow">YOUR EARNINGS</div>
      <h3>${money(rows.reduce((a,c)=>a+Number(c.ownCommission||0),0))}</h3>
      <p>Combined earning shown by the existing MADHYUM commission records.</p>
    </section>

    <div class="list">
      ${
        rows.map(c=>`
          <article class="item-card">
            <div class="item-top">
              <div>
                <div class="item-title">${esc(c.customerName||'')}</div>
                <div class="item-id">${esc(c.leadId)}</div>
              </div>

              <span class="money">${money(c.ownCommission)}</span>
            </div>

            <div class="item-meta">
              <span>${esc(c.wing||'')}</span>
              <span>${esc(c.commissionStatus||'')}</span>
              <span>Payment: ${esc(c.paymentDate||'—')}</span>
            </div>
          </article>
        `).join('')
        ||
        '<div class="section-card"><div class="empty">No commission records.</div></div>'
      }
    </div>
  `
}

async function loadAgentCalling(){
  const r=await api('agentCallingData',{token:state.token});

  if(!r.success)
    throw new Error(r.message||'Unable to load calling data.');

  state.agent.calling=Array.isArray(r.items)?r.items:[];
  state.agent.callingMeta=r
}

function renderAgentCalling(){
  const rows=state.agent.calling,
  team=state.agent.callingMeta?.team||[],
  isBdm=!!state.agent.callingMeta?.isBdm;

  $('mainContent').innerHTML=`
    <div class="toolbar two">
      <input class="input" id="callSearch" placeholder="Search name, mobile, city">

      <select class="select" id="callStatusFilter">
        <option value="">All call status</option>
        <option>CONNECTED</option>
        <option>NOT CONNECTED</option>
      </select>
    </div>

    <div id="callList" class="list"></div>
  `;

  const run=()=>{
    const q=$('callSearch').value.toLowerCase(),
    s=$('callStatusFilter').value;

    const filtered=rows.filter(x=>
      (!q||[x.name,x.mobile,x.city,x.source].join(' ').toLowerCase().includes(q)) &&
      (!s||String(x.callStatus).toUpperCase()===s)
    );

    $('callList').innerHTML=
      filtered.map(x=>`
        <article class="item-card">
          <div class="item-top">
            <div>
              <div class="item-title">${esc(x.name||'')}</div>
              <div class="item-id">${esc(x.dataId||'')}</div>
            </div>

            ${statusBadge(x.leadStatus||'NEW')}
          </div>

          <div class="item-meta">
            <span>${esc(x.mobile||'—')}</span>
            <span>${esc(x.city||'—')}</span>
            <span>${esc(x.source||'—')}</span>
          </div>

          <div class="form-grid">

            <div>
              <label class="field-label">Call Status</label>

              <select class="select c-status" data-id="${esc(x.dataId)}">
                <option value="NOT CONNECTED" ${String(x.callStatus).toUpperCase()==='NOT CONNECTED'?'selected':''}>
                  Not Connected
                </option>

                <option value="CONNECTED" ${String(x.callStatus).toUpperCase()==='CONNECTED'?'selected':''}>
                  Connected
                </option>
              </select>
            </div>

            <div>
              <label class="field-label">Lead Status</label>

              <select class="select c-lead" data-id="${esc(x.dataId)}">
                ${STATUSES.map(s=>`
                  <option ${s===String(x.leadStatus||'NEW').toUpperCase()?'selected':''}>
                    ${s}
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="field-label">Follow Up</label>

              <input
                class="input c-follow"
                type="date"
                data-id="${esc(x.dataId)}"
                value="${esc(x.followUpDate||'')}">
            </div>

            ${
              isBdm
              ? `<div>
                  <label class="field-label">Assigned To</label>

                  <select class="select c-assignee" data-id="${esc(x.dataId)}">
                    <option value="${esc(state.agent.callingMeta.me)}">Self</option>

                    ${team.map(a=>`
                      <option
                        value="${esc(a.agentId)}"
                        ${a.agentId===x.assignedTo?'selected':''}>
                        ${esc(a.agentId+' — '+a.name)}
                      </option>
                    `).join('')}
                  </select>
                </div>`
              : ''
            }

            <div class="field-full">
              <label class="field-label">Remark</label>

              <input
                class="input c-remark"
                data-id="${esc(x.dataId)}"
                value="${esc(x.remark||'')}">
            </div>

          </div>

          <div class="item-actions">
            ${callActions(x.mobile)}
            <button class="act-gold save-call" data-id="${esc(x.dataId)}">Save</button>
          </div>
        </article>
      `).join('')
      ||
      '<div class="empty">No calling data.</div>';

    document.querySelectorAll('.save-call').forEach(
      b=>b.onclick=()=>saveAgentCalling(b.dataset.id,b)
    )
  };

  $('callSearch').oninput=run;
  $('callStatusFilter').onchange=run;

  run()
}

async function saveAgentCalling(id,btn){
  const root=btn.closest('.item-card');
  busy(btn,true,'Saving...');

  try{
    const r=await api('agentUpdateCallingData',{
      token:state.token,
      dataId:id,
      assignedTo:root.querySelector('.c-assignee')?.value||state.agent.callingMeta.me,
      callStatus:root.querySelector('.c-status').value,
      leadStatus:root.querySelector('.c-lead').value,
      followUpDate:root.querySelector('.c-follow').value,
      remark:root.querySelector('.c-remark').value.trim()
    });

    if(!r.success)
      throw new Error(r.message||'Unable to save.');

    toast('Calling data updated');

    await loadAgentCalling();
    renderAgentCalling()

  }catch(e){
    toast(e.message)

  }finally{
    busy(btn,false)
  }
}

async function loadAgentShared(){
  const r=await api('agentDataDistribution',{token:state.token});

  if(!r.success)
    throw new Error(r.message||'Unable to load shared data.');

  state.agent.shared=r
}

function renderAgentShared(){
  const r=state.agent.shared||{},
  received=r.received||[],
  sent=r.sent||[];

  $('mainContent').innerHTML=`
    ${
      r.isBdm
      ? `<section class="section-card">
          <div class="section-head">
            <h3>Send to Team Agent</h3>
          </div>

          <div class="form-grid">

            <div>
              <label class="field-label">Recipient</label>

              <select class="select" id="shareRecipient">
                <option value="">Select Agent</option>

                ${(r.team||[]).map(a=>`
                  <option value="${esc(a.agentId)}">
                    ${esc(a.agentId+' — '+a.name)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="field-label">Title</label>
              <input class="input" id="shareTitle">
            </div>

            <div class="field-full">
              <label class="field-label">Details</label>
              <textarea class="textarea" id="shareDetails"></textarea>
            </div>

            <div class="field-full">
              <label class="field-label">Attachment (max 3 MB)</label>
              <input class="input" type="file" id="shareFile">
            </div>

            <div class="field-full">
              <button class="primary-btn" id="shareSend">
                Send to Agent
              </button>
            </div>

          </div>
        </section>`
      : ''
    }

    <section class="section-card">
      <div class="section-head">
        <h3>Received Data</h3>
      </div>

      <div class="list">
        ${received.map(x=>sharedCard(x,'received')).join('')||'<div class="empty">No shared data received.</div>'}
      </div>
    </section>

    ${
      r.isBdm
      ? `<section class="section-card">
          <div class="section-head">
            <h3>Sent to Team</h3>
          </div>

          <div class="list">
            ${sent.map(x=>sharedCard(x,'sent')).join('')||'<div class="empty">No sent records.</div>'}
          </div>
        </section>`
      : ''
    }
  `;

  document.querySelectorAll('.open-shared').forEach(
    b=>b.onclick=()=>openSharedFile('agentGetSharedFile',b.dataset.id)
  );

  if($('shareSend'))
    $('shareSend').onclick=sendAgentShared
}

function sharedCard(x){
  return `<article class="item-card">

    <div class="item-top">
      <div>
        <div class="item-title">${esc(x.title||'Untitled')}</div>
        <div class="item-id">${esc(x.distributionId||'')} • ${esc(x.createdAt||'')}</div>
      </div>
    </div>

    <div class="item-meta">
      <span>From: ${esc(x.senderId||x.senderName||'—')}</span>
      <span>To: ${esc(x.recipientId||x.recipientName||'—')}</span>
    </div>

    ${x.details?`<div class="item-note">${esc(x.details)}</div>`:''}

    ${
      x.hasAttachment
      ? `<div class="item-actions">
          <button class="act-soft open-shared" data-id="${esc(x.distributionId)}">
            Open ${esc(x.attachmentFileName||'file')}
          </button>
        </div>`
      : ''
    }

  </article>`
}

async function filePayload(file,maxMb=3){
  if(!file)return null;

  if(file.size>maxMb*1024*1024)
    throw new Error(`File must be under ${maxMb} MB.`);

  const b64=await new Promise((res,rej)=>{
    const fr=new FileReader();

    fr.onload=()=>res(String(fr.result).split(',')[1]);
    fr.onerror=rej;

    fr.readAsDataURL(file)
  });

  return {
    base64:b64,
    fileName:file.name,
    mimeType:file.type||'application/octet-stream'
  }
}

async function sendAgentShared(){
  const btn=$('shareSend');
  busy(btn,true,'Sending...');

  try{
    const f=await filePayload($('shareFile').files[0],3);

    const r=await api('agentSendData',{
      token:state.token,
      recipientId:$('shareRecipient').value,
      title:$('shareTitle').value.trim(),
      details:$('shareDetails').value.trim(),
      file:f
    });

    if(!r.success)
      throw new Error(r.message||'Unable to send.');

    toast('Data sent');

    await loadAgentShared();
    renderAgentShared()

  }catch(e){
    toast(e.message)

  }finally{
    busy(btn,false)
  }
}

function renderProfile(){
  $('mainContent').innerHTML=`
    <section class="hero">
      <div class="eyebrow">PROFILE</div>
      <h3>${esc(state.user?.name||'')}</h3>
      <p>${esc(state.user?.agentId||state.user?.adminId||'')}</p>
    </section>

    <section class="section-card">
      <div class="stat-line">
        <span>Role</span>
        <strong>${esc(state.user?.role||state.role)}</strong>
      </div>

      ${
        state.user?.mobile
        ? `<div class="stat-line">
            <span>Mobile</span>
            <strong>${esc(state.user.mobile)}</strong>
          </div>`
        : ''
      }

      ${
        state.user?.reportingBdmId
        ? `<div class="stat-line">
            <span>Reporting BDM</span>
            <strong>${esc(state.user.reportingBdmId)}</strong>
          </div>`
        : ''
      }
    </section>
  `
}
