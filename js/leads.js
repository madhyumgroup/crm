import {getLeads,addLead,updateLead} from './database.js';
export function allLeads(){return getLeads()}
export function createLead(data){return addLead(data)}
export function markConverted(id){updateLead(id,{status:'CONVERTED',followup:'Completed'})}
export function counts(){const l=getLeads();return {total:l.length,new:l.filter(x=>x.status==='NEW').length,hot:l.filter(x=>x.status==='HOT').length,converted:l.filter(x=>x.status==='CONVERTED').length,followups:l.filter(x=>x.followup?.startsWith('Today')).length}}
