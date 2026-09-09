const KEY='madhyum_crm_v2';
const seed=[
 {id:'L1001',name:'Aarav Sharma',mobile:'9876543210',city:'Bhopal',wing:'Travel',requirement:'Goa package • 4 adults • 4N/5D',status:'HOT',followup:'Today • 11:00 AM',notes:['Package options discussed','Final pricing to be shared']},
 {id:'L1002',name:'Neha Verma',mobile:'9893012345',city:'Bhopal',wing:'Real Estate',requirement:'3 BHK near Hoshangabad Road',status:'NEW',followup:'Today • 03:30 PM',notes:['Budget confirmation pending']},
 {id:'L1003',name:'Rahul Khan',mobile:'9826012345',city:'Indore',wing:'Admission',requirement:'MBA admission counselling',status:'CONVERTED',followup:'Completed',notes:['Admission converted']}
];
export function getLeads(){const raw=localStorage.getItem(KEY);if(!raw){localStorage.setItem(KEY,JSON.stringify(seed));return seed}return JSON.parse(raw)}
export function saveLeads(leads){localStorage.setItem(KEY,JSON.stringify(leads))}
export function addLead(lead){const leads=getLeads();leads.unshift({...lead,id:'L'+Date.now(),notes:['Inquiry created']});saveLeads(leads);return lead}
export function updateLead(id,patch){const leads=getLeads().map(x=>x.id===id?{...x,...patch}:x);saveLeads(leads)}
export function resetDemo(){localStorage.setItem(KEY,JSON.stringify(seed))}
