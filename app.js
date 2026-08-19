const STORAGE_KEY='summerSchoolData';
const TODAY=new Date();
const DEFAULT_DATA={employees:[{id:'james',name:'James Hall',schedules:{}},{id:'sarah',name:'Sarah Smith',schedules:{}},{id:'tom',name:'Tom Jones',schedules:{}},{id:'emma',name:'Emma Brown',schedules:{}}]};
function getData(){const r=localStorage.getItem(STORAGE_KEY);if(!r){saveData(DEFAULT_DATA);return structuredClone(DEFAULT_DATA)}try{return JSON.parse(r)}catch(e){saveData(DEFAULT_DATA);return structuredClone(DEFAULT_DATA)}}
function saveData(d){localStorage.setItem(STORAGE_KEY,JSON.stringify(d))}
function key(d){return d.toISOString().slice(0,10)}
function parseKey(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function formatDate(d){return d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
function minutes(t){const [h,m]=t.split(':').map(Number);return h*60+m}
function getSchedule(e,d){return [...((e.schedules&&e.schedules[key(d)])||[])].sort((a,b)=>minutes(a.start)-minutes(b.start))}
function getStatus(e,d){const list=getSchedule(e,d);const now=d.toDateString()===TODAY.toDateString()?TODAY.getHours()*60+TODAY.getMinutes():-1;const current=list.find(x=>now>=minutes(x.start)&&now<minutes(x.end));const next=list.find(x=>minutes(x.start)>now);return {working:!!(current||next),current:!!current,item:current||next||null}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
