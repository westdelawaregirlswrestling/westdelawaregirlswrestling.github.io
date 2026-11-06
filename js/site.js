/* West Delaware Girls Wrestling — shared site script.
   All live content comes from the team's Google Sheets (shared "anyone with the link can view").
   To change what the site shows, edit the sheets — not this file. */
const WD = {
  SHEETS: {
    schedule: '11gFLS-2TfPDow9LB5x8IEwcg7NqMT7hD-MCPHv-jeSg',      // tabs: Schedule, Practices, Photos
    roster: '1YU8ODCbLRa97z5nVQYobDwoPxc68M378kueaE_mq-4w',        // tabs: Roster, Coaches
    records: '1ZjVT56bGERcVvKPmyi_LuqBT0p_ICqDKz4bXALoukNc',       // tab: Record Board
    announcements: '1CijrRyTpfl2tcP0sbKcsh_QMGVSQKcBTV5O0eFaMt1I'  // tab: Announcements
  },
  CALENDAR_PDF: 'https://drive.google.com/file/d/1UUufBmUYPaOWwbnQqaVApBXJd8zSOE3-/view'
};

/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
// "Last, First & Last2, First2" -> "First Last & First2 Last2"
function fl(n){return String(n).split(' & ').map(x=>{x=x.trim();const m=x.match(/^([^,(]+),\s*([^(]+?)(\s*\(.*\))?$/);return m?m[2].trim()+' '+m[1].trim()+(m[3]||''):x}).join(' & ')}
const DN=['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const dkey=d=>d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
function todayCT(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());const g=t=>+p.find(x=>x.type===t).value;return new Date(g('year'),g('month')-1,g('day'))}
function isPhone(){return matchMedia('(max-width:700px)').matches}

/* ---------- Google Sheets loader (gviz) ---------- */
function wdLoad(id,sheet,range,raw){
  const q='https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?headers=0&sheet='+encodeURIComponent(sheet)+(range?'&range='+range:'')+'&t='+Date.now();
  const map=r=>(r.table&&r.table.rows||[]).map(x=>(x.c||[]).map(c=>c?(raw?c.v:(c.f!=null&&typeof c.v!=='string'?c.f:c.v)):''));
  const jsonp=()=>new Promise((res,rej)=>{const cb='wdcb'+Math.random().toString(36).slice(2);const s=document.createElement('script');
    const done=()=>{clearTimeout(to);try{delete window[cb]}catch(e){window[cb]=undefined}s.remove()};
    const to=setTimeout(()=>{done();rej('timeout')},15000);
    window[cb]=r=>{done();if(r&&r.status==='error')return rej(r.errors);res(map(r))};
    s.onerror=()=>{done();rej('load')};s.src=q+'&tqx=responseHandler:'+cb;document.head.appendChild(s)});
  const viaFetch=()=>fetch(q+'&tqx=out:json',{credentials:'omit',cache:'no-store'}).then(r=>{if(!r.ok)throw 'http';return r.text()}).then(t=>{const r=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));if(r.status==='error')throw r.errors;return map(r)});
  return jsonp().catch(()=>viaFetch());
}
function wdRetry(el,msg,fn){if(typeof el==='string')el=document.getElementById(el);if(!el)return;
  el.innerHTML='<div class="msg">'+esc(msg)+' <button type="button">Retry</button></div>';
  el.querySelector('button').onclick=()=>{el.innerHTML='<div class="msg">Loading…</div>';Promise.resolve(fn()).catch(()=>wdRetry(el,msg,fn))}}

/* ---------- schedule data (shared by Home + Schedule) ---------- */
const cleanT=s=>String(s||'').replace(/\s*est\. from \d\d-\d\d/g,' est.').replace(/\s*\((V|JV)\)/g,'').replace(/ CT/g,'').trim();
function parseDate(v){
  if(v instanceof Date)return v;if(v==null||v==='')return null;
  let m=String(v).match(/Date\((\d+),(\d+),(\d+)/);if(m)return new Date(+m[1],+m[2],+m[3]);
  m=String(v).match(/(\d{4})-(\d\d)-(\d\d)/);if(m)return new Date(+m[1],m[2]-1,+m[3]);
  m=String(v).match(/^(\d+)\/(\d+)\/(\d+)/);if(m)return new Date(+m[3]<100?2000+ +m[3]:+m[3],m[1]-1,+m[2]);
  return null}
let _sched=null;
function loadSchedule(){
  if(_sched)return _sched;
  const S=WD.SHEETS.schedule;
  _sched=Promise.all([wdLoad(S,'Schedule','A1:K200'),wdLoad(S,'Practices','A2:E400').catch(()=>[])]).then(([rows,pr])=>{
    const ym=String(rows[0]&&rows[0][0]||'').match(/(20\d\d)-(\d\d)/);
    const t=todayCT();const Y=ym?+ym[1]:(t.getMonth()>=6?t.getFullYear():t.getFullYear()-1);
    const meets=[];
    rows.forEach(r=>{const m=String(r[0]).match(/(\d{1,2})\/(\d{1,2})/);if(!m||!r[2]||/^date$/i.test(r[0]))return;
      const mo=+m[1];meets.push({d:new Date(mo>=7?Y:Y+1,mo-1,+m[2]),lv:String(r[1]||''),ev:String(r[2]),ty:String(r[3]||''),
        loc:String(r[4]||'').split(' — ')[0],full:String(r[4]||''),wi:cleanT(r[5]),st:cleanT(r[6])||'Time TBD',
        gb:String(r[7]||''),ad:String(r[8]||''),op:String(r[9]||''),of:String(r[10]||'')})});
    meets.sort((a,b)=>a.d-b.d);
    const practices=pr.filter(r=>r[0]!==''&&!/#/.test(String(r[0]))).map(r=>({d:parseDate(r[0]),t:String(r[1]||''),l:String(r[4]||r[2]||'').split(' — ').pop()})).filter(p=>p.d&&!isNaN(p.d));
    const byM={},byP={};
    meets.forEach(m=>(byM[dkey(m.d)]=byM[dkey(m.d)]||[]).push(m));
    practices.forEach(p=>(byP[dkey(p.d)]=byP[dkey(p.d)]||[]).push(p));
    return {season:ym?ym[0]:'',meets,practices,byM,byP};
  }).catch(e=>{_sched=null;throw e});
  return _sched;
}
const lvShort=lv=>lv=='Varsity'?'V':lv;
function meetLinks(m){let h='';
  if(m.gb)h+='<a href="'+esc(m.gb)+'" target="_blank" rel="noopener">GoBound</a>';
  if(m.ad)h+='<a href="https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(m.ad)+'" target="_blank" rel="noopener">Directions</a>';
  return h?'<div class="lk">'+h+'</div>':''}
/* a full meet card used in "Upcoming Meets" lists */
function meetCard(m){
  return '<div class="mc"><div class="dt"><span>'+DN[m.d.getDay()]+'</span><b>'+(m.d.getMonth()+1)+'/'+m.d.getDate()+'</b></div><div class="tx">'+
    '<h4>'+esc(m.ev)+'</h4>'+
    (m.op?'<div class="opp">'+esc(m.op)+(m.of?' <span>('+esc(m.of)+')</span>':'')+'</div>':'')+
    '<div><span class="tag">'+esc(m.lv)+'</span>'+esc(m.ty)+'</div>'+
    '<div class="where">'+esc(m.full)+'</div>'+
    '<div><b>Start:</b> '+esc(m.st)+(m.wi?' · <b>Weigh-ins:</b> '+esc(m.wi):'')+'</div>'+
    meetLinks(m)+'</div></div>'}

/* ---------- announcements ticker ---------- */
function initTicker(){
  const tk=document.getElementById('tk');if(!tk)return;
  const TAG={meet:'MEET',deadline:'DEADLINE',achievement:'ACHIEVEMENT',results:'RESULTS',general:'NEWS'};
  wdLoad(WD.SHEETS.announcements,'Announcements','A2:E200',true).then(rows=>{
    const today=todayCT();
    const items=rows.filter(r=>{if(!(r[0]===true||String(r[0]).toUpperCase()==='TRUE'))return false;if(!r[2])return false;
      const s=parseDate(r[3]),e=parseDate(r[4]);if(s&&today<s)return false;if(e&&today>e)return false;return true})
      .map(r=>'<span class="it"><span class="tg">'+(TAG[String(r[1]||'').toLowerCase()]||'NEWS')+'</span>'+esc(r[2])+'</span>');
    if(!items.length)return;
    tk.innerHTML='<div class="lbl">NEWS</div><div class="vp"><div class="track"></div></div>';
    const vp=tk.querySelector('.vp'),tr=tk.querySelector('.track');tk.classList.add('on');
    if(matchMedia('(max-width:640px)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches){
      vp.classList.add('fade');tr.innerHTML=items.join('');const els=tr.children;let i=0;els[0].classList.add('cur');
      // size the bar to the tallest message so nothing gets cut off
      let h=0;[...els].forEach(e=>{e.style.position='static';h=Math.max(h,e.offsetHeight);e.style.position=''});vp.style.minHeight=Math.max(52,h+12)+'px';
      if(els.length>1)setInterval(()=>{els[i].classList.remove('cur');i=(i+1)%els.length;els[i].classList.add('cur')},5000);
      return}
    let html=items.join('');tr.innerHTML=html;
    while(tr.scrollWidth<vp.clientWidth*1.2&&html.length<20000){html+=items.join('');tr.innerHTML=html}
    tr.innerHTML=html+html;tr.style.setProperty('--d',Math.max(12,tr.scrollWidth/2/70)+'s');
    vp.addEventListener('touchstart',()=>vp.classList.add('hold'),{passive:true});
    vp.addEventListener('touchend',()=>vp.classList.remove('hold'));
  }).catch(()=>{});
}

/* ---------- header / footer (same on every page) ---------- */
const PAGES=[['index.html','Home'],['schedule.html','Schedule'],['history.html','History'],['roster.html','Roster'],['parents.html','Parents & Athletes'],['youth.html','Youth Wrestling']];
function initChrome(){
  const here=(location.pathname.split('/').pop()||'index.html');
  const links=PAGES.map(([h,t])=>'<a href="'+h+'"'+(h===here?' aria-current="page"':'')+'>'+t+'</a>').join('');
  const top=document.getElementById('top');
  if(top)top.innerHTML='<div class="wrap"><a class="brand" href="index.html"><img src="img/logo-400.png" alt=""><span>West Delaware<b>Girls Wrestling</b></span></a>'+
    '<button class="menu" aria-label="Menu" aria-expanded="false"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>'+
    '<nav class="nav">'+links+'</nav></div>';
  const btn=top&&top.querySelector('.menu'),nav=top&&top.querySelector('.nav');
  if(btn)btn.onclick=()=>{const o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o)};
  const ft=document.getElementById('foot');
  if(ft)ft.innerHTML='<div class="wrap"><img src="img/logo-400.png" alt=""><div><b>West Delaware Girls Wrestling</b><br>Hawks · Manchester, Iowa</div><nav>'+PAGES.map(([h,t])=>'<a href="'+h+'">'+t+'</a>').join('')+'</nav></div>';
  initTicker();
}
document.addEventListener('DOMContentLoaded',initChrome);
