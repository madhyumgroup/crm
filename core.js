'use strict';
const API_URL='https://script.google.com/macros/s/AKfycbwd5x_8gPAzXMeP4TZPxLQQABisZ6Zn4lmGmzhfUsg83Z4xdnNY2dqb5KdZvRhGm4M/exec';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const cleanPhone=v=>String(v||'').replace(/\D/g,'').slice(-10);
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const WINGS=['Real Estate','Travel','Education & Admissions','Consultancy & Business Services','Events & Weddings','Membership','General / Other'];
const STATUSES=['NEW','CONTACTED','FOLLOW UP','IN PROGRESS','CONVERTED','NOT INTERESTED'];
const state={loginType:'agent',role:null,token:null,user:null,admin:{inquiries:[],agents:[],calling:[],commissions:[],distribution:[],trash:[]},agent:{leads:[],commissions:[],calling:[],shared:null},view:'home'};
let toastTimer=null;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
function busy(btn,on,text='Working...'){if(!btn)return;if(on){btn.dataset.old=btn.textContent;btn.disabled=true;btn.textContent=text}else{btn.disabled=false;btn.textContent=btn.dataset.old||btn.textContent}}
function statusBadge(s){const k=String(s||'NEW').toLowerCase().replace(/\s+/g,'-');return `<span class="status s-${['new','contacted','follow-up','in-progress','converted','not-interested'].includes(k)?k:'default'}">${esc(s||'NEW')}</span>`}
function followClass(d,status){if(!d||['CONVERTED','NOT INTERESTED'].includes(String(status||'').toUpperCase()))return'';const a=new Date(d+'T00:00:00'),b=new Date();b.setHours(0,0,0,0);return a<b?'overdue':a.getTime()===b.getTime()?'due':''}
function callActions(mobile){const m=cleanPhone(mobile);return m?`<a class="act-dark" href="tel:${m}">Call</a><a class="act-green" target="_blank" rel="noopener" href="https://wa.me/91${m}">WhatsApp</a>`:''}
function openModal(title,html,actions=''){ $('modalRoot').innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal-sheet"><div class="modal-grip"></div><div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" id="modalClose">×</button></div>${html}${actions}</div></div>`;$('modalClose').onclick=closeModal;$('modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')closeModal()}}
function closeModal(){$('modalRoot').innerHTML=''}
