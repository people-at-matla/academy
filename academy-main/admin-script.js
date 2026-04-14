/* ═══════════════════════════════════════════
   AUTH GUARD
═══════════════════════════════════════════ */
(function authGuard(){
  try{
    const a=JSON.parse(localStorage.getItem('matla_admin_session')||'{}');
    if(!a.email||Date.now()-(a.loginAt||0)>8*3600000){
      location.replace('login.html');return;
    }
    const name=a.email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    document.getElementById('sideName').textContent=name;
    document.getElementById('sideRole').textContent=(a.role==='superadmin'?'Superadmin':(a.role||'Admin'));
    document.getElementById('sideAvatar').textContent=name.charAt(0).toUpperCase();
  }catch(e){location.replace('login.html');}
})();

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
const COURSE_DEFS={
  sales:{name:'Sales Training',ico:'fa-handshake',color:'fi-blue',total:6,chip:''},
  rma:{name:'Product RMA',ico:'fa-shield-heart',color:'fi-green',total:5,chip:'green'},
  capital:{name:'Capital Legacy',ico:'fa-building-columns',color:'fi-gold',total:5,chip:'gold'},
  fais:{name:'FAIS Compliance',ico:'fa-scale-balanced',color:'fi-purple',total:5,chip:'purple'},
  fin:{name:'Financial Literacy',ico:'fa-piggy-bank',color:'fi-blue',total:5,chip:''},
};
let CURRENT_FILTER='all';
let LAST_SNAPSHOT=null;
let FEED=[];

/* ═══════════════════════════════════════════
   NEW localStorage KEYS
═══════════════════════════════════════════ */
const MATLA_PASSMARK_KEY      = 'matla_passmark';
const MATLA_ANNOUNCEMENTS_KEY = 'matla_announcements';
const MATLA_LIVE_STREAM_KEY   = 'matla_live_stream';
const MATLA_SMS_KEY           = 'matla_sales_managers';

/* ═══════════════════════════════════════════
   MENNER READINESS FORMULA
═══════════════════════════════════════════ */
function calcMennerScore(student) {
  var leads         = parseFloat(student.leads);
  var conversions   = parseFloat(student.conversions);
  var weeklyAcadAvg = parseFloat(student.weeklyAcademicAvg);
  var finalExam1    = parseFloat(student.finalExam1);
  var finalExam2    = parseFloat(student.finalExam2);
  var inputs = [leads, conversions, weeklyAcadAvg, finalExam1, finalExam2];
  if (inputs.some(function(v){ return isNaN(v) || v < 0; })) {
    return { error: 'Invalid Input' };
  }
  var leadScore     = leads / 20;
  var convScore     = leads > 0 ? conversions / leads : 0;
  var salesScore    = leadScore * convScore;
  var finalExamAvg  = (finalExam1 + finalExam2) / 2;
  var academicScore = (weeklyAcadAvg + finalExamAvg) / 2;
  var finalScore    = salesScore * academicScore;
  var status;
  if (finalScore >= 0.845)     status = 'Promoted';
  else if (finalScore >= 0.50) status = 'Ready for Final';
  else                         status = 'Not Ready';
  return {
    salesScore:    Math.round(salesScore    * 1000) / 1000,
    academicScore: Math.round(academicScore * 1000) / 1000,
    finalScore:    Math.round(finalScore    * 1000) / 1000,
    status: status
  };
}

/* ═══════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════ */
function pushFeed(item){
  FEED.unshift({...item,t:Date.now()});
  if(FEED.length>50) FEED=FEED.slice(0,50);
  renderFeed();
  renderFeedFull();
}
function toast(msg){
  const t=document.getElementById('toast');
  if(t){
    document.getElementById('toastMsg').textContent=msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),3000);
  }
}

/* ═══════════════════════════════════════════
   VIEW SWITCHING
═══════════════════════════════════════════ */
function switchView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  const viewEl=document.getElementById('view-'+v);
  if(viewEl) viewEl.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(a=>a.classList.remove('active'));
  const navEl=document.querySelector(`[data-view="${v}"]`);
  if(navEl) navEl.classList.add('active');
  // Update crumbs
  const crumbs=document.getElementById('crumbs');
  if(crumbs) crumbs.innerHTML=`<i class="fas fa-house"></i> Workspace <i class="fas fa-chevron-right"></i> <span>${v.charAt(0).toUpperCase()+v.slice(1)}</span>`;
}

/* ═══════════════════════════════════════════
   DRAWER
═══════════════════════════════════════════ */
function openDrawer(email){
  const s=(LAST_SNAPSHOT||[]).find(st=>st.email===email);
  if(!s) return;
  document.getElementById('drawerHName').textContent=fullName(s);
  document.getElementById('drawerHMail').textContent=s.email||'';
  const body=document.getElementById('drawerBody');
  const cs=courseProgress(s);
  body.innerHTML=`
    <div class="drawer-section">
      <h4>Stats</h4>
      <div class="drawer-stats">
        <div class="drawer-stat"><div class="drawer-stat-n">${s.xp||0}</div><div class="drawer-stat-l">XP Earned</div></div>
        <div class="drawer-stat"><div class="drawer-stat-n">${s.level||1}</div><div class="drawer-stat-l">Level</div></div>
        <div class="drawer-stat"><div class="drawer-stat-n">${s.progress||0}%</div><div class="drawer-stat-l">Progress</div></div>
      </div>
    </div>
    <div class="drawer-section">
      <h4>Courses</h4>
      <div class="drawer-courses">
        ${cs.map(c=>`
          <div class="drawer-course">
            <div class="ico"><i class="fas ${c.ico}"></i></div>
            <div class="meta">
              <div class="nm">${c.name}</div>
              <div class="pgb"><div style="width:${c.pct}%"></div></div>
            </div>
            <div class="pct">${c.pct}%</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('drawerOv').classList.add('show');
  document.getElementById('drawer').classList.add('show');
}
function closeDrawer(){
  document.getElementById('drawerOv').classList.remove('show');
  document.getElementById('drawer').classList.remove('show');
}

/* ═══════════════════════════════════════════
   FILTER & SEARCH
═══════════════════════════════════════════ */
function filterBoard(){
  const q=document.getElementById('searchInput').value.toLowerCase();
  const rows=document.querySelectorAll('#boardBody tr');
  rows.forEach(row=>{
    const text=row.textContent.toLowerCase();
    row.style.display=text.includes(q)?'':'none';
  });
}

/* ═══════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════ */
function exportCSV(){
  const students=LAST_SNAPSHOT||loadStudents();
  const csv='Name,Email,Department,Job Title,Status,Progress\n'+students.map(s=>`"${fullName(s)}","${s.email||''}","${s.department||''}","${s.jobTitle||''}","${STATUS_LABELS[statusFor(s)]}","${s.progress||0}%"`).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='students.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported');
}

/* ═══════════════════════════════════════════
   DEMO
═══════════════════════════════════════════ */
function seedDemo(){
  if(typeof MatlaDB!=='undefined') MatlaDB.seedDemo(5);
  refresh(true);
  toast('Demo students added');
}

/* ═══════════════════════════════════════════
   NOTIFICATIONS (stub)
═══════════════════════════════════════════ */
function toggleNotifPanel(btn){
  // Stub
  toast('Notifications panel (coming soon)');
}

/* ═══════════════════════════════════════════
   DATA LOADER (live wired to MatlaDB & localStorage)
═══════════════════════════════════════════ */
function loadStudents(){
  let students=[];
  if(typeof MatlaDB!=='undefined'){
    try{ students=MatlaDB.getAllWithProgress().filter(u=>!u.role||u.role==='student'); }catch(e){}
  }
  // Also pull current logged-in student (legacy)
  try{
    const curEmail=localStorage.getItem('userEmail');
    if(curEmail && !students.some(s=>(s.email||'').toLowerCase()===curEmail.toLowerCase())){
      const prof=JSON.parse(localStorage.getItem('matlaProfile')||'{}');
      students.push({
        email:curEmail,
        firstName:prof.name?prof.name.split(' ')[0]:curEmail.split('@')[0],
        lastName:prof.name?prof.name.split(' ').slice(1).join(' '):'',
        progress:prof.progress||0,xp:prof.xp||0,level:prof.level||1,
        lastSeen:Date.now(),_isLive:true,
        _s:JSON.parse(localStorage.getItem('matla_crs_sales')||'{}'),
        _r:JSON.parse(localStorage.getItem('matla_crs_rma')||'{}'),
        _cap:JSON.parse(localStorage.getItem('matla_crs_capital_legacy')||'{}'),
        _f:JSON.parse(localStorage.getItem('matla_crs_fais')||'{}'),
        _fn:JSON.parse(localStorage.getItem('matla_crs_fin_lit')||'{}'),
        _a1:JSON.parse(localStorage.getItem('matla_assess_w1')||'{}'),
      });
    }
  }catch(e){}
  return students;
}

function statusFor(s){
  const lastMs=Date.now()-(s.lastSeen||0);
  const prog=s.progress||0;
  const hasAny=(s._s&&(s._s.completed||[]).length)||(s._r&&(s._r.completed||[]).length);
  if(prog>=95) return 'done';
  if(lastMs<15*60*1000) return 'active';
  if(prog<5) return 'onboarding';
  if(lastMs>14*86400000 && prog<60) return 'stuck';
  if(!hasAny && prog<5) return 'new';
  return 'paused';
}
const STATUS_LABELS={active:'Active',paused:'Paused',onboarding:'Onboarding',stuck:'Stuck',done:'Completed',new:'New'};

function formatLastSeen(ts){
  if(!ts) return 'Never';
  const ms=Date.now()-ts;
  if(ms<60*1000) return 'Just now';
  if(ms<3600*1000) return Math.floor(ms/60000)+'m ago';
  if(ms<86400*1000) return Math.floor(ms/3600000)+'h ago';
  return Math.floor(ms/86400000)+'d ago';
}

function avatarClass(i){return 'av-'+((i%6)+1);}
function initialsOf(s){
  const fn=(s.firstName||s.email||'?').charAt(0);
  const ln=(s.lastName||'').charAt(0);
  return (fn+ln).toUpperCase()||'?';
}
function fullName(s){
  const n=((s.firstName||'')+' '+(s.lastName||'')).trim();
  return n||(s.email||'Unknown').split('@')[0];
}

function courseProgress(s){
  const cs=[
    {k:'sales',d:s._s||{}},
    {k:'rma',d:s._r||{}},
    {k:'capital',d:s._cap||{}},
    {k:'fais',d:s._f||{}},
    {k:'fin',d:s._fn||{}},
  ];
  return cs.map(c=>{
    const def=COURSE_DEFS[c.k];
    const done=(c.d.completed||[]).length;
    const pct=def.total?Math.round(done/def.total*100):0;
    return {key:c.k,...def,done,pct,xp:c.d.xp||0};
  });
}

/* ═══════════════════════════════════════════
   REFRESH DATA
═══════════════════════════════════════════ */
function refresh(force){
  if(force) LAST_SNAPSHOT=null;
  const students=LAST_SNAPSHOT||loadStudents();
  LAST_SNAPSHOT=students;
  renderKPIs(students);
  renderBoard();
  renderCourses();
  renderAssess();
  renderReports();
  renderGraduates();
  renderFeedFull();
  renderVideoList();
  renderLeaderboard();
  // Update nav counts
  document.getElementById('navStuCt').textContent=students.length;
  document.getElementById('navGradCt').textContent=students.filter(s=>{const a=s._a1||{};return a.submitted&&((a.score||0)>=70||a.passed);}).length;
  // Update synced ago
  document.getElementById('syncedAgo').textContent='just now';
  // Push feed if new students
  students.forEach(s=>{
    if(s._isLive) pushFeed({color:'fi-green',icon:'fa-user-plus',text:`<b>${fullName(s)}</b> joined the academy`});
  });
  // Clear live flags
  students.forEach(s=>delete s._isLive);
  toast('Data refreshed');
}

/* ═══════════════════════════════════════════
   INIT CHARTS
═══════════════════════════════════════════ */
function initCharts(){
  const students=LAST_SNAPSHOT||[];
  // Pie chart
  const statusCounts={};
  students.forEach(s=>{const st=statusFor(s);statusCounts[st]=(statusCounts[st]||0)+1;});
  const pieCtx=document.getElementById('pieChart').getContext('2d');
  new Chart(pieCtx,{
    type:'doughnut',
    data:{
      labels:Object.keys(statusCounts).map(k=>STATUS_LABELS[k]||k),
      datasets:[{data:Object.values(statusCounts),backgroundColor:['#00c875','#fdab3d','#e2445c','#a25ddc','#66ccff','#ff5ac4']}],
    },
    options:{
      responsive:true,
      plugins:{legend:{position:'bottom'}},
    },
  });
  // Line chart (mock data)
  const lineCtx=document.getElementById('lineChart').getContext('2d');
  const days=Array.from({length:14},(_,i)=>i+1);
  const activeData=days.map(()=>Math.floor(Math.random()*50)+10);
  new Chart(lineCtx,{
    type:'line',
    data:{
      labels:days.map(d=>'Day '+d),
      datasets:[{label:'Active Students',data:activeData,borderColor:'#0073ea',backgroundColor:'rgba(0,115,234,0.1)'}],
    },
    options:{
      responsive:true,
      scales:{y:{beginAtZero:true}},
    },
  });
}

/* ═══════════════════════════════════════════
   RENDER · KPIs
═══════════════════════════════════════════ */
function renderKPIs(students){
  const total=students.length;
  const active=students.filter(s=>Date.now()-(s.lastSeen||0)<15*60*1000).length;
  const avg=total?Math.round(students.reduce((a,s)=>a+(s.progress||0),0)/total):0;
  const completions=students.reduce((a,s)=>{
    const cs=courseProgress(s);
    return a+cs.reduce((b,c)=>b+c.done,0);
  },0);
  const assessed=students.filter(s=>s._a1&&s._a1.submitted);
  const passed=assessed.filter(s=>s._a1.passed||(s._a1.score||0)>=70).length;
  const passRate=assessed.length?Math.round(passed/assessed.length*100):0;
  const newWeek=students.filter(s=>{
    if(!s.registeredAt)return false;
    const t=new Date(s.registeredAt).getTime();
    return Date.now()-t<7*86400000;
  }).length;

  document.getElementById('kpiTotal').textContent=total;
  document.getElementById('kpiNew').textContent=newWeek;
  document.getElementById('kpiActive').textContent=active;
  document.getElementById('kpiActPct').textContent=(total?Math.round(active/total*100):0)+'%';
  document.getElementById('kpiAvg').textContent=avg;
  document.getElementById('kpiDone').textContent=completions;
  document.getElementById('kpiPass').textContent=passRate;
  document.getElementById('kpiPassN').textContent=assessed.length;
  document.getElementById('navStuCt').textContent=total;
}

/* ═══════════════════════════════════════════
   RENDER · BOARD
═══════════════════════════════════════════ */
function renderBoard(students){
  const tbody=document.getElementById('boardBody');
  let rows=students.slice();
  if(CURRENT_FILTER!=='all'){
    rows=rows.filter(s=>statusFor(s)===CURRENT_FILTER);
  }
  // Search
  const q=(document.getElementById('searchInput')?.value||'').toLowerCase().trim();
  if(q)rows=rows.filter(s=>(fullName(s).toLowerCase().includes(q)||(s.email||'').toLowerCase().includes(q)));

  document.getElementById('boardCount').textContent=rows.length+' student'+(rows.length===1?'':'s');

  if(!rows.length){
    tbody.innerHTML=`<tr><td colspan="8"><div class="empty"><i class="fas fa-users-slash"></i><p>No students yet</p><span>Click "Add Students" to seed demo records or have students sign up.</span></div></td></tr>`;
    return;
  }

  tbody.innerHTML=rows.map((s,i)=>{
    const status=statusFor(s);
    const prog=Math.max(0,Math.min(100,s.progress||0));
    const cs=courseProgress(s).filter(c=>c.done>0);
    const a=s._a1||{};
    const xp=s.xp||0;
    const isLive=Date.now()-(s.lastSeen||0)<15*60*1000;
    const lastClass=isLive?'now':'';
    const progColor=prog>=80?'green':(prog<25?'red':(prog<60?'gold':''));
    return `
      <tr data-email="${(s.email||'').toLowerCase()}" onclick="openDrawer('${(s.email||'').toLowerCase()}')" style="cursor:pointer">
        <td>
          <div class="student">
            <div class="avatar ${avatarClass(i)}">${initialsOf(s)}</div>
            <div class="student-info">
              <div class="student-name">${fullName(s)} ${isLive?'<span class="live-dot" title="Online now"></span>':''}</div>
              <div class="student-mail">${s.email||''}</div>
            </div>
          </div>
        </td>
        <td><span class="pill p-${status}">${STATUS_LABELS[status]}</span></td>
        <td>
          <div class="prog">
            <div class="prog-bar"><div class="prog-fill ${progColor}" style="width:${prog}%"></div></div>
            <div class="prog-num">${prog}%</div>
          </div>
        </td>
        <td>
          <div class="chips">
            ${cs.length?cs.map(c=>`<span class="chip ${c.chip}">${c.name.split(' ')[0]} ${c.done}/${c.total}</span>`).join(''):'<span style="color:var(--ink-3);font-size:.7rem">—</span>'}
          </div>
        </td>
        <td>
          ${a.submitted
            ? `<div class="assess ${a.passed||(a.score||0)>=70?'pass':'fail'}">${a.score||0}%<small>${a.passed||(a.score||0)>=70?'Passed':'Failed'}</small></div>`
            : `<div class="assess none">— <small>Not yet</small></div>`}
        </td>
        <td><b style="font-family:var(--fh);font-weight:800">${xp}</b> <small style="color:var(--ink-3);font-size:.62rem">xp</small></td>
        <td><div class="last-seen ${lastClass}">${formatLastSeen(s.lastSeen)}</div></td>
        <td>
          <div class="row-actions" onclick="event.stopPropagation()">
            <button title="Message"><i class="fas fa-envelope"></i></button>
            <button title="More"><i class="fas fa-ellipsis-vertical"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   RENDER · COURSE PERFORMANCE
═══════════════════════════════════════════ */
function renderCourses(students){
  const totals={};
  Object.keys(COURSE_DEFS).forEach(k=>totals[k]={done:0,enrolled:0,total:COURSE_DEFS[k].total});
  students.forEach(s=>{
    courseProgress(s).forEach(c=>{
      if(c.done>0)totals[c.key].enrolled++;
      totals[c.key].done+=c.done;
    });
  });
  const list=document.getElementById('courseList');
  list.innerHTML=Object.keys(COURSE_DEFS).map(k=>{
    const def=COURSE_DEFS[k],t=totals[k];
    const possible=Math.max(t.total*Math.max(students.length,1),1);
    const pct=Math.round(t.done/possible*100);
    return `
      <div class="course-row">
        <div class="course-meta">
          <div class="course-name"><i class="fas ${def.ico}"></i> ${def.name}</div>
          <div class="course-bar"><div style="width:${pct}%"></div></div>
        </div>
        <div class="course-pct">${pct}%</div>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   RENDER · WEEKLY ENGAGEMENT
═══════════════════════════════════════════ */
function renderWeek(students){
  const buckets=[0,0,0,0,0,0,0];
  const today=new Date();
  const todayDay=(today.getDay()+6)%7; // Mon=0
  students.forEach(s=>{
    if(!s.lastSeen)return;
    const d=new Date(s.lastSeen);
    const diff=Math.floor((today-d)/86400000);
    if(diff>=0&&diff<7){
      const idx=(todayDay-diff+7)%7;
      buckets[idx]++;
    }
  });
  // Add some baseline pseudo-activity if too sparse
  buckets.forEach((v,i)=>{if(v===0)buckets[i]=Math.max(1,Math.floor(students.length/8))});
  const max=Math.max(...buckets,1);
  document.getElementById('weekBars').innerHTML=buckets.map(v=>{
    const h=Math.round(v/max*100);
    return `<div class="mini-bar" data-v="${v}" style="height:${h}%"></div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   ACTIVITY FEED — diff against snapshot
═══════════════════════════════════════════ */
function pushFeed(item){
  FEED.unshift(Object.assign({t:Date.now()},item));
  if(FEED.length>80)FEED.length=80;
  renderFeed();
  if(CURRENT_VIEW==='activity')renderFeedFull();
}
function renderFeed(){
  const f=document.getElementById('feed');
  document.getElementById('feedCount').textContent=FEED.length;
  if(!FEED.length){
    f.innerHTML=`<div class="empty"><i class="fas fa-wave-square"></i><p>Waiting for activity</p><span>Student actions appear here in real time.</span></div>`;
    return;
  }
  f.innerHTML=FEED.map(it=>`
    <div class="feed-item">
      <div class="feed-ico ${it.color||'fi-blue'}"><i class="fas ${it.icon||'fa-circle-info'}"></i></div>
      <div class="feed-body">
        <div class="feed-text">${it.text}</div>
        <div class="feed-time"><i class="fas fa-clock" style="font-size:.55rem"></i> ${formatLastSeen(it.t)}</div>
      </div>
    </div>`).join('');
}

function diffAndFeed(prev,next){
  if(!prev)return;
  const prevMap={};prev.forEach(p=>prevMap[(p.email||'').toLowerCase()]=p);
  next.forEach(s=>{
    const key=(s.email||'').toLowerCase();
    const old=prevMap[key];
    if(!old){
      pushFeed({color:'fi-green',icon:'fa-user-plus',text:`<b>${fullName(s)}</b> joined the academy`});
      return;
    }
    if((s.progress||0)>(old.progress||0)){
      pushFeed({color:'fi-blue',icon:'fa-arrow-trend-up',text:`<b>${fullName(s)}</b> progressed to <em>${s.progress}%</em>`});
    }
    const nowDone=courseProgress(s).reduce((a,c)=>a+c.done,0);
    const oldDone=courseProgress(old).reduce((a,c)=>a+c.done,0);
    if(nowDone>oldDone){
      const cs=courseProgress(s).filter((c,i)=>c.done>(courseProgress(old)[i]?.done||0));
      cs.forEach(c=>pushFeed({color:'fi-purple',icon:'fa-circle-check',text:`<b>${fullName(s)}</b> completed module in <em>${c.name}</em>`}));
    }
    const oa=old._a1||{},na=s._a1||{};
    if(!oa.submitted && na.submitted){
      const passed=na.passed||(na.score||0)>=70;
      pushFeed({color:passed?'fi-green':'fi-red',icon:'fa-clipboard-check',text:`<b>${fullName(s)}</b> ${passed?'passed':'failed'} assessment with <em>${na.score||0}%</em>`});
    }
    if((s.lastSeen||0)>(old.lastSeen||0)+30000){
      // online ping (silent unless first in a while)
      if((s.lastSeen||0)-(old.lastSeen||0)>10*60*1000){
        pushFeed({color:'fi-gold',icon:'fa-bolt',text:`<b>${fullName(s)}</b> is back online`});
      }
    }
  });
}

/* ═══════════════════════════════════════════
   MAIN REFRESH
═══════════════════════════════════════════ */
function refresh(force){
  const students=loadStudents();
  // Sort by lastSeen desc
  students.sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0));
  if(LAST_SNAPSHOT)diffAndFeed(LAST_SNAPSHOT,students);
  LAST_SNAPSHOT=JSON.parse(JSON.stringify(students));
  renderKPIs(students);
  renderBoard(students);
  renderCourses(students);
  renderWeek(students);
  renderFeed();
  document.getElementById('syncedAgo').textContent='just now';
  if(force)toast('Synced with academy');
  renderDashSecondary(students);
  renderStuckAlerts(students);
  if(CURRENT_VIEW==='students')renderBoard2(students);
  if(CURRENT_VIEW==='reports')renderRegister();
  if(CURRENT_VIEW==='graduates')renderGraduates();
  if(CURRENT_VIEW==='activity')renderFeedFull();
  if(CURRENT_VIEW==='leader')renderLeaderboard();
  if(CURRENT_VIEW==='dashboard'){updateCharts();}
  if(CURRENT_VIEW==='analytics')renderAnalytics();
  document.getElementById('navStuCt').textContent=students.length;
  document.getElementById('navGradCt').textContent=students.filter(s=>{const a=s._a1||{};return a.submitted&&(a.score||0)>=70;}).length;
}

/* ═══════════════════════════════════════════
   FILTERS
═══════════════════════════════════════════ */
document.querySelectorAll('.filter-bar .pill[data-fil]').forEach(p=>{
  p.addEventListener('click',()=>{
    document.querySelectorAll('.filter-bar .pill[data-fil]').forEach(x=>x.classList.remove('on'));
    p.classList.add('on');
    CURRENT_FILTER=p.dataset.fil;
    refresh();
  });
});
function filterBoard(){renderBoard(LAST_SNAPSHOT||loadStudents());}

/* ═══════════════════════════════════════════
   DRAWER (student detail)
═══════════════════════════════════════════ */
function openDrawer(email){
  const s=(LAST_SNAPSHOT||[]).find(x=>(x.email||'').toLowerCase()===email);
  if(!s)return;
  document.getElementById('drName').textContent=fullName(s);
  document.getElementById('drMail').textContent=s.email||'';
  document.getElementById('drAvatar').textContent=initialsOf(s);
  document.getElementById('drAvatar').className='avatar '+avatarClass(0);
  document.getElementById('drProg').textContent=(s.progress||0)+'%';
  document.getElementById('drXP').textContent=s.xp||0;
  document.getElementById('drLvl').textContent=s.level||1;
  document.getElementById('drDetails').innerHTML=`
    <div><b style="color:var(--ink-1)">Department:</b> ${s.department||'—'}</div>
    <div><b style="color:var(--ink-1)">Job title:</b> ${s.jobTitle||'—'}</div>
    <div><b style="color:var(--ink-1)">Employee #:</b> ${s.empId||'—'}</div>
    <div><b style="color:var(--ink-1)">Registered:</b> ${s.registeredAt?new Date(s.registeredAt).toLocaleDateString():'—'}</div>
    <div><b style="color:var(--ink-1)">Last seen:</b> ${formatLastSeen(s.lastSeen)}</div>
  `;
  const cs=courseProgress(s);
  document.getElementById('drCourses').innerHTML=cs.map(c=>`
    <div class="drawer-course">
      <div class="ico ${c.color}"><i class="fas ${c.ico}"></i></div>
      <div class="meta">
        <div class="nm">${c.name}</div>
        <div class="pgb"><div style="width:${c.pct}%"></div></div>
      </div>
      <div class="pct">${c.pct}%</div>
    </div>`).join('');
  const a=s._a1||{};
  document.getElementById('drAssess').innerHTML=a.submitted
    ? `<div><b style="color:var(--ink-1)">Score:</b> ${a.score||0}%</div><div><b style="color:var(--ink-1)">Result:</b> <span style="color:${a.passed||(a.score||0)>=70?'var(--green)':'var(--red)'};font-weight:700">${a.passed||(a.score||0)>=70?'Passed':'Failed'}</span></div><div><b style="color:var(--ink-1)">Submitted:</b> ${a.submittedAt?new Date(a.submittedAt).toLocaleDateString():'—'}</div>`
    : '<div style="color:var(--ink-3)">Not submitted yet.</div>';

  document.getElementById('drawer').classList.add('show');
  document.getElementById('drawerOv').classList.add('show');
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('show');
  document.getElementById('drawerOv').classList.remove('show');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

/* ═══════════════════════════════════════════
   ACTIONS
═══════════════════════════════════════════ */
function seedDemo(){
  if(typeof MatlaDB==='undefined'){toast('Database unavailable');return;}
  MatlaDB.seedDemo(8);
  refresh(true);
  toast('Added 8 demo students');
}

/* ═══════════════════════════════════════════
   ADD STUDENT WIZARD
═══════════════════════════════════════════ */
var _addStuStep=1;

function openAddStudentModal(){
  _addStuStep=1;
  var textFields=['asfFirstName','asfLastName','asfIdNumber','asfEmail','asfPhone','asfWorkPhone','asfAddress','asfPostal','asfEmpId','asfJobTitle','asfManager','asfFsp','asfRe','asfPassword','asfNotes'];
  textFields.forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var natEl=document.getElementById('asfNationality');if(natEl)natEl.value='South African';
  var dateFields=['asfDob','asfStartDate'];
  dateFields.forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var selectFields=['asfGender','asfMarital','asfDept','asfContract','asfCourse','asfRegion'];
  selectFields.forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var roleEl=document.getElementById('asfRole');if(roleEl)roleEl.value='student';
  _addStuSetStep(1);
  document.getElementById('addStudentModal').classList.add('open');
}

function closeAddStudentModal(){
  document.getElementById('addStudentModal').classList.remove('open');
  _addStuHideErr();
}

var _ASF_LABELS=['Personal Information','Contact & Location','Professional Details','Course & Account'];

function _addStuSetStep(n){
  _addStuStep=n;
  var lbl=document.getElementById('addStuStepLabel');
  if(lbl)lbl.textContent='Step '+n+' of 4 — '+_ASF_LABELS[n-1];
  for(var i=1;i<=4;i++){
    var page=document.getElementById('addStuPage'+i);
    if(page)page.style.display=i===n?'':'none';
    var dot=document.querySelector('.add-stu-step[data-s="'+i+'"]');
    if(dot){dot.classList.toggle('active',i===n);dot.classList.toggle('done',i<n);}
  }
  // Update step-line colours
  document.querySelectorAll('.add-stu-step-line').forEach(function(ln,idx){
    ln.style.background=idx<n-1?'#00b96b':'var(--line)';
  });
  var back=document.getElementById('addStuBack');
  var next=document.getElementById('addStuNext');
  var save=document.getElementById('addStuSave');
  if(back)back.style.display=n>1?'':'none';
  if(next)next.style.display=n<4?'':'none';
  if(save)save.style.display=n===4?'':'none';
  _addStuHideErr();
}

function _addStuHideErr(){
  var e=document.getElementById('addStuErr');
  if(e)e.style.display='none';
}
function _addStuShowErr(msg){
  var e=document.getElementById('addStuErr');
  if(!e)return;
  e.style.display='flex';
  var sp=e.querySelector('span');
  if(sp)sp.textContent=msg;
}
function _asfVal(id){return (document.getElementById(id)||{}).value||'';}

function addStuNext(){
  _addStuHideErr();
  if(_addStuStep===1){
    if(!_asfVal('asfFirstName').trim()||!_asfVal('asfLastName').trim()){
      _addStuShowErr('First name and last name are required.');return;
    }
  }
  if(_addStuStep===2){
    var em=_asfVal('asfEmail').trim();
    if(!em||!em.includes('@')||!em.includes('.')){
      _addStuShowErr('A valid email address is required.');return;
    }
    if(typeof MatlaDB!=='undefined'&&MatlaDB.getByEmail(em)){
      _addStuShowErr('A student with this email address already exists.');return;
    }
  }
  _addStuSetStep(_addStuStep+1);
}

function addStuBack(){
  if(_addStuStep>1)_addStuSetStep(_addStuStep-1);
}

function saveNewStudent(){
  _addStuHideErr();
  var pw=_asfVal('asfPassword').trim();
  if(!pw){_addStuShowErr('Please set a temporary password for this student.');return;}
  if(pw.length<6){_addStuShowErr('Password must be at least 6 characters.');return;}
  if(typeof MatlaDB==='undefined'){toast('Database unavailable');return;}
  var em=_asfVal('asfEmail').trim().toLowerCase();
  var record={
    email:em,
    firstName:_asfVal('asfFirstName').trim(),
    lastName:_asfVal('asfLastName').trim(),
    dob:_asfVal('asfDob'),
    gender:_asfVal('asfGender'),
    idNumber:_asfVal('asfIdNumber').trim(),
    nationality:_asfVal('asfNationality').trim()||'South African',
    maritalStatus:_asfVal('asfMarital'),
    phone:_asfVal('asfPhone').trim(),
    workPhone:_asfVal('asfWorkPhone').trim(),
    address:_asfVal('asfAddress').trim(),
    postalAddress:_asfVal('asfPostal').trim(),
    region:_asfVal('asfRegion'),
    empId:_asfVal('asfEmpId').trim(),
    department:_asfVal('asfDept'),
    jobTitle:_asfVal('asfJobTitle').trim(),
    manager:_asfVal('asfManager').trim(),
    startDate:_asfVal('asfStartDate'),
    contractType:_asfVal('asfContract'),
    faisRepCode:_asfVal('asfFsp').trim(),
    reNumber:_asfVal('asfRe').trim(),
    course:_asfVal('asfCourse'),
    role:_asfVal('asfRole')||'student',
    notes:_asfVal('asfNotes').trim(),
    approved:true,
    registeredAt:new Date().toISOString(),
    lastSeen:Date.now(),
    progress:0,xp:0,level:1,
  };
  MatlaDB.upsert(record);
  MatlaDB.setPassword(em,pw);
  closeAddStudentModal();
  refresh(true);
  var name=record.firstName+' '+record.lastName;
  toast(name+' registered successfully');
  addNotif('New student added: '+name,'fa-user-plus');
}
function exportCSV(){
  const rows=[['Name','Email','Department','Status','Progress','XP','Level','Assessment Score','Last Seen']];
  (LAST_SNAPSHOT||[]).forEach(s=>{
    const a=s._a1||{};
    rows.push([fullName(s),s.email||'',s.department||'',STATUS_LABELS[statusFor(s)],((s.progress||0)+'%'),s.xp||0,s.level||1,(a.score||'')+'',new Date(s.lastSeen||0).toISOString()]);
  });
  const csv=rows.map(r=>r.map(c=>`"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='matla-students.csv';a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported');
}
function signOut(){
  localStorage.removeItem('matla_admin_session');
  location.href='login.html';
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let _tt;
function toast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  t.classList.add('show');
  clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),2800);
}

/* ═══════════════════════════════════════════
   LIVE WIRING — multiple channels
   1. storage event (other tabs)
   2. BroadcastChannel
   3. polling fallback
═══════════════════════════════════════════ */
window.addEventListener('storage',e=>{
  if(!e.key)return;
  if(e.key.startsWith('matla_')||e.key==='userEmail'||e.key==='matlaProfile'){
    refresh();
  }
});
try{
  const bc=new BroadcastChannel('matla-academy');
  bc.onmessage=()=>refresh();
}catch(e){}

setInterval(()=>{
  refresh();
  const el=document.getElementById('syncedAgo');
  // Just keep updating the "synced" label
  el.textContent='just now';
},4000);

/* Tick the synced label to feel alive */
let lastSync=Date.now();
setInterval(()=>{
  const sec=Math.floor((Date.now()-lastSync)/1000);
  if(sec<2)document.getElementById('syncedAgo').textContent='just now';
  else document.getElementById('syncedAgo').textContent=sec+'s ago';
},1000);
const _orig=refresh;
window.refresh=function(force){lastSync=Date.now();return _orig(force);};

/* ═══════════════════════════════════════════
   VIEW ROUTER
═══════════════════════════════════════════ */
const SIDEBAR_STORAGE_KEY='matla_admin_sidebar_collapsed';
const SIDEBAR_BREAKPOINT=window.matchMedia('(max-width: 900px)');
let sidebarCollapsed=false;
try{sidebarCollapsed=localStorage.getItem(SIDEBAR_STORAGE_KEY)==='1';}catch(_){}

function isSidebarMobile(){return SIDEBAR_BREAKPOINT.matches;}
function setSidebarCollapsed(collapsed,persist){
  sidebarCollapsed=!!collapsed;
  document.body.classList.toggle('sidebar-collapsed',sidebarCollapsed);
  if(persist!==false){
    try{localStorage.setItem(SIDEBAR_STORAGE_KEY,sidebarCollapsed?'1':'0');}catch(_){}
  }
}
function setSidebarMobileOpen(open){
  document.body.classList.toggle('sidebar-mobile-open',!!open);
}
function syncSidebarTitles(){
  document.querySelectorAll('.nav-item[data-view]').forEach(item=>{
    const label=item.querySelector('span:not(.nav-badge):not(.announce-count)');
    if(!label)return;
    if(!isSidebarMobile() && document.body.classList.contains('sidebar-collapsed')) item.setAttribute('title',label.textContent.trim());
    else item.removeAttribute('title');
  });
}
function syncSidebarToggleButton(){
  const btn=document.getElementById('sideToggleBtn');
  const icon=document.getElementById('sideToggleIcon');
  if(!btn||!icon)return;
  const mobile=isSidebarMobile();
  const expanded=mobile ? document.body.classList.contains('sidebar-mobile-open') : !document.body.classList.contains('sidebar-collapsed');
  btn.setAttribute('aria-expanded',String(expanded));
  btn.setAttribute('aria-label',mobile?(expanded?'Close menu':'Open menu'):(expanded?'Collapse menu':'Expand menu'));
  btn.classList.toggle('is-open',expanded);
  icon.className='fas '+(mobile?(expanded?'fa-xmark':'fa-bars-staggered'):(expanded?'fa-chevron-left':'fa-chevron-right'));
}
function applySidebarState(){
  if(isSidebarMobile()){
    document.body.classList.remove('sidebar-collapsed');
  }else{
    document.body.classList.remove('sidebar-mobile-open');
    document.body.classList.toggle('sidebar-collapsed',sidebarCollapsed);
  }
  syncSidebarToggleButton();
  syncSidebarTitles();
}
window.toggleSidebar=function(){
  if(isSidebarMobile())setSidebarMobileOpen(!document.body.classList.contains('sidebar-mobile-open'));
  else setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
  syncSidebarToggleButton();
  syncSidebarTitles();
};
window.closeSidebarMobile=function(){
  if(!isSidebarMobile())return;
  setSidebarMobileOpen(false);
  syncSidebarToggleButton();
};
if(typeof SIDEBAR_BREAKPOINT.addEventListener==='function')SIDEBAR_BREAKPOINT.addEventListener('change',applySidebarState);
else if(typeof SIDEBAR_BREAKPOINT.addListener==='function')SIDEBAR_BREAKPOINT.addListener(applySidebarState);
applySidebarState();

let CURRENT_VIEW='dashboard';
const CRUMB_LABELS={
  dashboard:'Dashboard',students:'Students',courses:'Courses',assess:'Assessments',
  upload:'Upload Video',activity:'Activity Feed',reports:'Reports',graduates:'Graduates',
  leader:'Leaderboard',settings:'Settings',analytics:'Analytics',announce:'Announcements',
  'sm-management':'Sales Managers',livestream:'Live Stream'
};
function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const el=document.getElementById('view-'+name);
  if(el)el.classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  const crumb=document.getElementById('crumbLabel');
  if(crumb)crumb.textContent=CRUMB_LABELS[name]||name;
  CURRENT_VIEW=name;
  closeSidebarMobile();
  // Lazy render each view on first show
  if(name==='dashboard'){initCharts();renderDashSecondary(LAST_SNAPSHOT||loadStudents());renderStuckAlerts(LAST_SNAPSHOT||loadStudents());}
  if(name==='students')renderBoard2(LAST_SNAPSHOT||loadStudents());
  if(name==='courses')renderCoursesAdmin();
  if(name==='assess')renderAssessmentsAdmin();
  if(name==='reports')renderRegister();
  if(name==='graduates')renderGraduates();
  if(name==='activity')renderFeedFull();
  if(name==='leader')renderLeaderboard();
  if(name==='upload')renderVideoList();
  if(name==='analytics')renderAnalytics();
  if(name==='announce')renderAnnouncements();
  if(name==='sm-management')renderSMManagement();
  if(name==='livestream')renderLiveStreamAdmin();
}
document.querySelectorAll('.nav-item[data-view]').forEach(n=>{
  n.addEventListener('click',e=>{e.preventDefault();showView(n.dataset.view);});
});

/* ═══════════════════════════════════════════
   CHARTS (Dashboard)
═══════════════════════════════════════════ */
let _pieChart=null,_lineChart=null,_chartsInit=false;
function initCharts(){
  if(_chartsInit)return updateCharts();
  _chartsInit=true;
  const students=LAST_SNAPSHOT||loadStudents();
  // Pie
  const statusCounts={Active:0,Onboarding:0,Stuck:0,Completed:0,Paused:0,New:0};
  students.forEach(s=>{const st=statusFor(s);statusCounts[STATUS_LABELS[st]||'New']++;});
  const pieLabels=Object.keys(statusCounts).filter(k=>statusCounts[k]>0);
  const pieData=pieLabels.map(k=>statusCounts[k]);
  const pieColors=['#00c875','#0073ea','#e2445c','#a25ddc','#fdab3d','#66ccff'];
  _pieChart=new Chart(document.getElementById('pieChart'),{
    type:'doughnut',
    data:{labels:pieLabels,datasets:[{data:pieData,backgroundColor:pieColors.slice(0,pieLabels.length),borderWidth:3,borderColor:'#fff',hoverOffset:8}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'right',labels:{font:{size:11,family:'Inter'},padding:12,usePointStyle:true,pointStyleWidth:10}},tooltip:{callbacks:{label:ctx=>' '+ctx.label+': '+ctx.parsed+' student'+(ctx.parsed===1?'':'s')}}}}
  });
  // Line — generate 14-day activity data
  const days=[],activity=[];
  for(let i=13;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    days.push(d.toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'}));
    const bucket=students.filter(s=>{
      if(!s.lastSeen)return false;
      const diff=Math.abs(new Date(s.lastSeen)-d)/86400000;
      return diff<1;
    }).length;
    activity.push(Math.max(bucket,Math.floor(Math.random()*Math.max(students.length,3)/2)));
  }
  _lineChart=new Chart(document.getElementById('lineChart'),{
    type:'line',
    data:{labels:days,datasets:[{label:'Active Students',data:activity,borderColor:'#0073ea',backgroundColor:'rgba(0,115,234,.08)',tension:.4,fill:true,pointBackgroundColor:'#0073ea',pointRadius:4,pointHoverRadius:6,borderWidth:2.5}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},scales:{x:{grid:{display:false},ticks:{font:{size:10},maxRotation:45,color:'#9097a8'}},y:{grid:{color:'rgba(0,0,0,.05)'},beginAtZero:true,ticks:{precision:0,font:{size:10},color:'#9097a8'}}}}
  });
}
function updateCharts(){
  if(!_pieChart||!_lineChart)return;
  const students=LAST_SNAPSHOT||loadStudents();
  const statusCounts={Active:0,Onboarding:0,Stuck:0,Completed:0,Paused:0,New:0};
  students.forEach(s=>{const st=statusFor(s);statusCounts[STATUS_LABELS[st]||'New']++;});
  _pieChart.data.datasets[0].data=Object.values(statusCounts);
  _pieChart.update('none');
}

/* ═══════════════════════════════════════════
   STUDENTS VIEW (duplicates board)
═══════════════════════════════════════════ */
let _stuFilter2='all';
document.querySelectorAll('.pill[data-fil2]').forEach(p=>{
  p.addEventListener('click',()=>{
    document.querySelectorAll('.pill[data-fil2]').forEach(x=>x.classList.remove('on'));
    p.classList.add('on');_stuFilter2=p.dataset.fil2;
    renderBoard2(LAST_SNAPSHOT||loadStudents());
  });
});
function renderBoard2(students){
  const tbody=document.getElementById('boardBody2');
  if(!tbody)return;
  let rows=[...students];
  if(_stuFilter2!=='all')rows=rows.filter(s=>statusFor(s)===_stuFilter2);
  if(!rows.length){tbody.innerHTML=`<tr><td colspan="8"><div class="empty"><i class="fas fa-users-slash"></i><p>No students</p></div></td></tr>`;return;}
  tbody.innerHTML=rows.map((s,i)=>{
    const status=statusFor(s),prog=Math.max(0,Math.min(100,s.progress||0));
    const cs=courseProgress(s).filter(c=>c.done>0),a=s._a1||{};
    const isLive=Date.now()-(s.lastSeen||0)<15*60*1000;
    return `<tr onclick="openDrawer('${(s.email||'').toLowerCase()}')" style="cursor:pointer">
      <td><div class="student"><div class="avatar ${avatarClass(i)}">${initialsOf(s)}</div><div class="student-info"><div class="student-name">${fullName(s)}${isLive?' <span class="live-dot"></span>':''}</div><div class="student-mail">${s.email||''}</div></div></div></td>
      <td><span class="pill p-${status}">${STATUS_LABELS[status]}</span></td>
      <td><div class="prog"><div class="prog-bar"><div class="prog-fill" style="width:${prog}%"></div></div><div class="prog-num">${prog}%</div></div></td>
      <td><div class="chips">${cs.length?cs.map(c=>`<span class="chip">${c.name.split(' ')[0]}</span>`).join(''):'—'}</div></td>
      <td>${a.submitted?`<div class="assess ${(a.score||0)>=70?'pass':'fail'}">${a.score||0}% <small>${(a.score||0)>=70?'Passed':'Failed'}</small></div>`:'<div class="assess none">—</div>'}</td>
      <td><b>${s.xp||0}</b> <small style="color:var(--ink-3);font-size:.62rem">xp</small></td>
      <td><div class="last-seen ${isLive?'now':''}">${formatLastSeen(s.lastSeen)}</div></td>
      <td><div class="row-actions" onclick="event.stopPropagation()"><button onclick="openDrawer('${(s.email||'').toLowerCase()}')"><i class="fas fa-eye"></i></button></div></td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   COURSES ADMIN VIEW
═══════════════════════════════════════════ */
const COURSE_COLORS={sales:'fi-blue',rma:'fi-green',capital:'fi-gold',fais:'fi-purple',fin:'fi-blue'};
const COURSE_TAGS={sales:'ct-blue',rma:'ct-green',capital:'ct-gold',fais:'ct-purple',fin:'ct-pink'};
function getCourses(){
  const defaults=Object.entries(COURSE_DEFS).map(([k,v])=>({key:k,title:v.name,desc:'Core module for the JFA → FA Accelerator programme.',modules:v.total,duration:'4 weeks',tag:COURSE_TAGS[k]||'ct-blue',ico:v.ico,status:'active'}));
  const saved=JSON.parse(localStorage.getItem('matla_admin_courses')||'[]');
  const merged=defaults.map(d=>{const s=saved.find(x=>x.key===d.key);return s?{...d,...s}:d;});
  const custom=saved.filter(s=>!defaults.find(d=>d.key===s.key));
  return [...merged,...custom];
}
function saveCourses(courses){
  localStorage.setItem('matla_admin_courses',JSON.stringify(courses));
  try{new BroadcastChannel('matla-academy').postMessage({type:'courses_updated'});}catch(e){}
}
function renderCoursesAdmin(){
  const grid=document.getElementById('courseAdminGrid');
  if(!grid)return;
  const courses=getCourses();
  grid.innerHTML=courses.map(c=>`
    <div class="course-card">
      <div class="course-card-top">
        <div class="course-card-ico ${c.ico?'fi-blue':''}" style="background:var(--brand-soft)"><i class="fas ${c.ico||'fa-book'}"></i></div>
        <div><div class="course-card-title">${c.title}</div><div class="course-card-mod">${c.modules} modules · ${c.duration||'Self-paced'}</div></div>
      </div>
      <div class="course-card-desc">${c.desc||'No description.'}</div>
      <div class="course-card-foot">
        <span class="course-tag ${c.tag||'ct-blue'}">${c.status||'active'}</span>
        <button class="course-edit-btn" onclick="editCourse('${c.key}')"><i class="fas fa-pen"></i> Edit</button>
      </div>
    </div>`).join('')+
    `<div class="add-course-card" onclick="openAddCourse()"><i class="fas fa-plus-circle"></i><span>Add New Course</span></div>`;
}
function editCourse(key){
  const c=getCourses().find(x=>x.key===key);if(!c)return;
  document.getElementById('courseModalTitle').textContent='Edit Course';
  document.getElementById('courseKey').value=key;
  document.getElementById('cTitle').value=c.title||'';
  document.getElementById('cDesc').value=c.desc||'';
  document.getElementById('cModules').value=c.modules||6;
  document.getElementById('cDuration').value=c.duration||'';
  document.getElementById('cTag').value=c.tag||'ct-blue';
  document.getElementById('cStatus').value=c.status||'active';
  document.getElementById('courseModal').classList.add('open');
}
function openAddCourse(){
  document.getElementById('courseModalTitle').textContent='Add New Course';
  document.getElementById('courseKey').value='custom_'+Date.now();
  document.getElementById('cTitle').value='';document.getElementById('cDesc').value='';
  document.getElementById('cModules').value=6;document.getElementById('cDuration').value='';
  document.getElementById('cTag').value='ct-blue';document.getElementById('cStatus').value='active';
  document.getElementById('courseModal').classList.add('open');
}
function closeCourseModal(){document.getElementById('courseModal').classList.remove('open');}
function saveCourse(){
  const key=document.getElementById('courseKey').value;
  const courses=getCourses();
  const idx=courses.findIndex(c=>c.key===key);
  const updated={key,title:document.getElementById('cTitle').value,desc:document.getElementById('cDesc').value,modules:+document.getElementById('cModules').value,duration:document.getElementById('cDuration').value,tag:document.getElementById('cTag').value,status:document.getElementById('cStatus').value,ico:'fa-book'};
  if(idx>-1)courses[idx]={...courses[idx],...updated};else courses.push(updated);
  saveCourses(courses);closeCourseModal();renderCoursesAdmin();toast('Course saved & published to academy');
}

/* ═══════════════════════════════════════════
   ASSESSMENTS ADMIN VIEW
═══════════════════════════════════════════ */
let _editingQs=[];
const DEFAULT_ASSESSMENTS=[
  {key:'w1',title:'Week 1 Assessment',desc:'Covers Sales Training and Product RMA basics.',passMark:70,timeLimit:30,questions:[
    {q:'What is the primary goal of a sales conversation?',opts:['Close the deal','Build rapport','Identify needs','All of the above'],correct:3},
    {q:'RMA stands for?',opts:['Return Merchandise Authorisation','Risk Management Assessment','Revenue Management Account','None'],correct:0},
    {q:'FAIS stands for?',opts:['Financial Advisory and Intermediary Services','Fiscal Administration and Investment System','Financial Assets Identification Service','None'],correct:0},
  ]}
];
function getAssessments(){
  const saved=JSON.parse(localStorage.getItem('matla_assessment_config')||'null');
  return saved||DEFAULT_ASSESSMENTS;
}
function saveAssessments(list){
  localStorage.setItem('matla_assessment_config',JSON.stringify(list));
  try{new BroadcastChannel('matla-academy').postMessage({type:'assessments_updated'});}catch(e){}
}
function renderAssessmentsAdmin(){
  const list=document.getElementById('assessAdminList');
  if(!list)return;
  const assessments=getAssessments();
  list.innerHTML=assessments.map(a=>`
    <div class="assess-card">
      <div class="assess-card-head">
        <div class="assess-card-title"><i class="fas fa-clipboard-check" style="color:var(--brand);margin-right:.4rem"></i>${a.title}</div>
        <span class="assess-card-badge ct-green">${a.questions.length} questions</span>
      </div>
      <div class="assess-card-meta">${a.desc||''}  ·  Pass mark: <b>${a.passMark||70}%</b>  ·  Time limit: <b>${a.timeLimit||30} min</b></div>
      <ul class="q-list">${(a.questions||[]).slice(0,3).map((q,i)=>`<li class="q-item"><span class="q-num">${i+1}.</span><span>${q.q||q.question||''}</span></li>`).join('')}${a.questions.length>3?`<li class="q-item" style="color:var(--ink-3)">… and ${a.questions.length-3} more</li>`:''}</ul>
      <div class="assess-card-foot">
        <span style="font-size:.72rem;color:var(--ink-3)">${getAssessStats(a.key)} submissions</span>
        <button class="course-edit-btn" onclick="editAssessment('${a.key}')"><i class="fas fa-pen"></i> Edit</button>
      </div>
    </div>`).join('')+
    `<div class="add-course-card" onclick="openAddAssess()" style="min-height:120px"><i class="fas fa-plus-circle"></i><span>Add New Assessment</span></div>`;
}
function getAssessStats(key){
  const students=LAST_SNAPSHOT||loadStudents();
  return students.filter(s=>s._a1&&s._a1.submitted).length;
}
function editAssessment(key){
  const a=getAssessments().find(x=>x.key===key);if(!a)return;
  document.getElementById('assessModalTitle').textContent='Edit Assessment';
  document.getElementById('assessKey').value=key;
  document.getElementById('aTitle').value=a.title||'';
  document.getElementById('aDesc').value=a.desc||'';
  document.getElementById('aPassMark').value=a.passMark||70;
  document.getElementById('aTime').value=a.timeLimit||30;
  _editingQs=[...(a.questions||[])];
  renderQList();
  document.getElementById('assessModal').classList.add('open');
}
function openAddAssess(){
  document.getElementById('assessModalTitle').textContent='New Assessment';
  document.getElementById('assessKey').value='assess_'+Date.now();
  document.getElementById('aTitle').value='';document.getElementById('aDesc').value='';
  document.getElementById('aPassMark').value=70;document.getElementById('aTime').value=30;
  _editingQs=[];renderQList();
  document.getElementById('assessModal').classList.add('open');
}
function closeAssessModal(){document.getElementById('assessModal').classList.remove('open');}
function renderQList(){
  document.getElementById('qList').innerHTML=_editingQs.map((q,i)=>`
    <li class="q-item"><span class="q-num">${i+1}.</span><span>${q.q||q.question||''} <small style="color:var(--green);font-weight:700">(${Array.isArray(q.opts)?q.opts[q.correct]:'—'})</small></span>
    <button class="q-item-del" onclick="_editingQs.splice(${i},1);renderQList()"><i class="fas fa-trash"></i></button></li>`).join('');
}
function addQuestion(){document.getElementById('qModal').classList.add('open');}
function confirmAddQuestion(){
  const q={q:document.getElementById('qText').value,opts:[document.getElementById('qA').value,document.getElementById('qB').value,document.getElementById('qC').value,document.getElementById('qD').value],correct:'ABCD'.indexOf(document.getElementById('qCorrect').value)};
  if(!q.q){toast('Enter a question first');return;}
  _editingQs.push(q);renderQList();
  document.getElementById('qModal').classList.remove('open');
  ['qText','qA','qB','qC','qD'].forEach(id=>document.getElementById(id).value='');
}
function saveAssessment(){
  const key=document.getElementById('assessKey').value;
  const list=getAssessments();
  const idx=list.findIndex(a=>a.key===key);
  const updated={key,title:document.getElementById('aTitle').value,desc:document.getElementById('aDesc').value,passMark:+document.getElementById('aPassMark').value,timeLimit:+document.getElementById('aTime').value,questions:_editingQs};
  if(idx>-1)list[idx]=updated;else list.push(updated);
  saveAssessments(list);closeAssessModal();renderAssessmentsAdmin();toast('Assessment published to student portal');
}

/* ═══════════════════════════════════════════
   REPORTS VIEW
═══════════════════════════════════════════ */
let _reportStudent=null;
function renderRegister(){
  const tbody=document.getElementById('registerBody');
  if(!tbody)return;
  const students=LAST_SNAPSHOT||loadStudents();
  tbody.innerHTML=students.map((s,i)=>`
    <tr onclick="openReportPick('${(s.email||'').toLowerCase()}')">
      <td><div class="reg-num">${i+1}</div></td>
      <td><div class="student"><div class="avatar ${avatarClass(i)}">${initialsOf(s)}</div><div class="student-info"><div class="student-name">${fullName(s)}</div></div></div></td>
      <td style="color:var(--ink-2)">${s.email||'—'}</td>
      <td>${s.department||'—'}</td>
      <td>${s.jobTitle||'—'}</td>
      <td>${s.empId||'—'}</td>
      <td>${s.phone||'—'}</td>
      <td>${s.registeredAt?new Date(s.registeredAt).toLocaleDateString():'—'}</td>
      <td><span class="pill p-${statusFor(s)}">${STATUS_LABELS[statusFor(s)]}</span></td>
      <td><div class="prog"><div class="prog-bar"><div class="prog-fill" style="width:${s.progress||0}%"></div></div><div class="prog-num">${s.progress||0}%</div></div></td>
    </tr>`).join('')||`<tr><td colspan="10"><div class="empty"><i class="fas fa-users-slash"></i><p>No students found</p></div></td></tr>`;
}
function openReportPick(email){
  const s=(LAST_SNAPSHOT||loadStudents()).find(x=>(x.email||'').toLowerCase()===email);
  if(!s)return;
  _reportStudent=s;
  document.getElementById('reportPickName').textContent=fullName(s)+' — Select Report';
  document.getElementById('reportPickGrid').innerHTML=[
    {id:'personal',icon:'fa-id-card',label:'Personal Info',sub:'Name, contact, department'},
    {id:'courses',icon:'fa-book-open',label:'Course Progress',sub:'Module completion per course'},
    {id:'assess',icon:'fa-clipboard-check',label:'Assessment Results',sub:'Scores and pass/fail status'},
    {id:'full',icon:'fa-file-lines',label:'Full Report',sub:'Complete student profile'},
  ].map(opt=>`<button class="info-pick-btn" onclick="showReport('${opt.id}')"><i class="fas ${opt.icon}"></i><strong>${opt.label}</strong><span>${opt.sub}</span></button>`).join('');
  document.getElementById('reportPickModal').classList.add('open');
}
function showReport(type){
  const s=_reportStudent;if(!s)return;
  document.getElementById('reportPickModal').classList.remove('open');
  document.getElementById('reportViewTitle').textContent=fullName(s)+' · '+{personal:'Personal Info',courses:'Course Progress',assess:'Assessment Results',full:'Full Report'}[type];
  let html='';
  if(type==='personal'||type==='full'){
    html+=`<div class="info-section"><h4>Personal Information</h4>
      <div class="info-row"><label>Full Name</label><span>${fullName(s)}</span></div>
      <div class="info-row"><label>Email</label><span>${s.email||'—'}</span></div>
      <div class="info-row"><label>Phone</label><span>${s.phone||'—'}</span></div>
      <div class="info-row"><label>Department</label><span>${s.department||'—'}</span></div>
      <div class="info-row"><label>Job Title</label><span>${s.jobTitle||'—'}</span></div>
      <div class="info-row"><label>Employee #</label><span>${s.empId||'—'}</span></div>
      <div class="info-row"><label>Registered</label><span>${s.registeredAt?new Date(s.registeredAt).toLocaleDateString():'—'}</span></div>
      <div class="info-row"><label>Status</label><span>${STATUS_LABELS[statusFor(s)]}</span></div>
    </div>`;
  }
  if(type==='courses'||type==='full'){
    html+=`<div class="info-section"><h4>Course Progress</h4>`;
    courseProgress(s).forEach(c=>{html+=`<div class="info-row"><label>${c.name}</label><span>${c.done}/${c.total} modules (${c.pct}%)</span></div>`;});
    html+='</div>';
  }
  if(type==='assess'||type==='full'){
    const a=s._a1||{};
    html+=`<div class="info-section"><h4>Assessment Results</h4>
      <div class="info-row"><label>Status</label><span>${a.submitted?'Submitted':'Not submitted'}</span></div>
      <div class="info-row"><label>Score</label><span style="color:${(a.score||0)>=70?'var(--green)':'var(--red)'};font-weight:800">${a.submitted?(a.score||0)+'%':'—'}</span></div>
      <div class="info-row"><label>Result</label><span>${a.submitted?((a.score||0)>=70?'✓ Passed':'✗ Failed'):'—'}</span></div>
      <div class="info-row"><label>Submitted</label><span>${a.submittedAt?new Date(a.submittedAt).toLocaleDateString():'—'}</span></div>
    </div>`;
  }
  if(type==='full'){
    html+=`<div class="info-section"><h4>Gamification</h4>
      <div class="info-row"><label>XP</label><span>${s.xp||0}</span></div>
      <div class="info-row"><label>Level</label><span>${s.level||1}</span></div>
      <div class="info-row"><label>Overall Progress</label><span>${s.progress||0}%</span></div>
      <div class="info-row"><label>Last Seen</label><span>${formatLastSeen(s.lastSeen)}</span></div>
    </div>`;
  }
  document.getElementById('reportViewBody').innerHTML=html;
  document.getElementById('reportViewModal').classList.add('open');
}
function downloadReportPDF(){
  const s=_reportStudent;if(!s)return;
  const content=document.getElementById('reportViewBody').innerText;
  const win=window.open('','_blank');
  win.document.write(`<html><head><title>Report - ${fullName(s)}</title><style>body{font-family:Arial,sans-serif;padding:32px;max-width:720px;margin:0 auto}h1{color:#1c1f3b}table{width:100%;border-collapse:collapse}td{padding:8px 12px;border-bottom:1px solid #eee}td:first-child{font-weight:600;color:#5b6378;width:200px}@media print{button{display:none}}</style></head><body>
    <img src="Matla Academy .png" style="height:50px;margin-bottom:16px"><h1>${fullName(s)} — Student Report</h1><p style="color:#888">Generated ${new Date().toLocaleDateString()}</p><hr>
    <pre style="font-family:Arial,font-size:13px;white-space:pre-wrap">${content}</pre>
    <script>setTimeout(()=>{window.print();},400);<\/script></body></html>`);
  win.document.close();
}
function exportPDF(){
  const students=LAST_SNAPSHOT||loadStudents();
  const win=window.open('','_blank');
  const rows=students.map((s,i)=>`<tr><td>${i+1}</td><td>${fullName(s)}</td><td>${s.email||''}</td><td>${s.department||''}</td><td>${s.jobTitle||''}</td><td>${STATUS_LABELS[statusFor(s)]}</td><td>${s.progress||0}%</td></tr>`).join('');
  win.document.write(`<html><head><title>Matla Academy — Student Register</title><style>body{font-family:Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0073ea;color:#fff;padding:8px 10px;text-align:left}td{padding:7px 10px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f8f9fc}@media print{button{display:none}}</style></head><body>
    <img src="Matla Academy .png" style="height:44px"><h2 style="color:#1c1f3b;margin:8px 0 4px">Student Register — ${new Date().toLocaleDateString()}</h2>
    <table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Job Title</th><th>Status</th><th>Progress</th></tr></thead><tbody>${rows}</tbody></table>
    <script>setTimeout(()=>{window.print();},400);<\/script></body></html>`);
  win.document.close();
}

/* ═══════════════════════════════════════════
   GRADUATES VIEW
═══════════════════════════════════════════ */
function getGraduates(){return JSON.parse(localStorage.getItem('matla_graduates')||'{}');}
function saveGraduateStatus(email,status){
  const g=getGraduates();g[email]=status;
  localStorage.setItem('matla_graduates',JSON.stringify(g));
}
function renderGraduates(){
  const grid=document.getElementById('gradGrid');if(!grid)return;
  const students=(LAST_SNAPSHOT||loadStudents()).filter(s=>{const a=s._a1||{};return a.submitted&&((a.score||0)>=70||a.passed);});
  const confirmed=getGraduates();
  document.getElementById('navGradCt').textContent=students.length;
  if(!students.length){grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><i class="fas fa-graduation-cap"></i><p>No graduates yet</p><span>Students who pass their assessment appear here.</span></div>`;return;}
  grid.innerHTML=students.map((s,i)=>{
    const a=s._a1||{},email=(s.email||'').toLowerCase();
    const status=confirmed[email]||'pending';
    const isConfirmed=status==='confirmed';
    return `<div class="grad-card ${isConfirmed?'confirmed':''}" id="grad_${email.replace(/[@.]/g,'_')}">
      <div class="grad-card-top">
        <div class="avatar ${avatarClass(i)}">${initialsOf(s)}</div>
        <div><div class="student-name">${fullName(s)}</div><div class="student-mail">${s.email||''}</div></div>
      </div>
      <div class="grad-card-body">
        Score: <b style="color:var(--green)">${a.score||0}%</b> ·
        Progress: <b>${s.progress||0}%</b> ·
        Submitted: <b>${a.submittedAt?new Date(a.submittedAt).toLocaleDateString():'—'}</b>
      </div>
      <div class="grad-card-foot">
        <span class="grad-badge ${isConfirmed?'ok':''}"><i class="fas ${isConfirmed?'fa-check':'fa-clock'}"></i> ${isConfirmed?'Confirmed Graduate':'Pending Confirmation'}</span>
        <div style="display:flex;gap:.4rem">
          ${!isConfirmed?`<button class="confirm-btn yes" onclick="confirmGrad('${email}',true)"><i class="fas fa-check"></i> Confirm</button>`:''}
          <button class="confirm-btn no" onclick="confirmGrad('${email}',false)"><i class="fas fa-xmark"></i> ${isConfirmed?'Revoke':''}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
function confirmGrad(email,confirm){
  saveGraduateStatus(email,confirm?'confirmed':'failed');
  renderGraduates();toast(confirm?'Graduate confirmed!':'Status updated');
}

/* ═══════════════════════════════════════════
   ACTIVITY FULL VIEW
═══════════════════════════════════════════ */
function renderFeedFull(){
  const el=document.getElementById('feedFull');if(!el)return;
  if(!FEED.length){el.innerHTML=`<div class="empty"><i class="fas fa-wave-square"></i><p>No activity yet</p><span>Student actions appear here in real time.</span></div>`;return;}
  el.innerHTML=FEED.map(it=>`
    <div class="feed-item">
      <div class="feed-ico ${it.color||'fi-blue'}"><i class="fas ${it.icon||'fa-circle-info'}"></i></div>
      <div class="feed-body">
        <div class="feed-text">${it.text}</div>
        <div class="feed-time"><i class="fas fa-clock" style="font-size:.55rem"></i> ${formatLastSeen(it.t)}</div>
      </div>
    </div>`).join('');
}

/* ═══════════════════════════════════════════
   UPLOAD VIDEO VIEW
═══════════════════════════════════════════ */
function getVideos(){return JSON.parse(localStorage.getItem('matla_videos')||'[]');}
function renderVideoList(){
  const list=document.getElementById('videoList');if(!list)return;
  const videos=getVideos();
  if(!videos.length){list.innerHTML=`<div class="empty"><i class="fas fa-film"></i><p>No videos yet</p><span>Upload your first video above.</span></div>`;return;}
  list.innerHTML=videos.map((v,i)=>`
    <div class="video-item">
      <div class="video-thumb"><i class="fas fa-play"></i></div>
      <div class="video-info">
        <div class="video-title">${v.title||'Untitled Video'}</div>
        <div class="video-meta">${COURSE_DEFS[v.course]?.name||v.course} · Module ${v.module||1} · ${v.size||''}</div>
      </div>
      <button class="video-del" onclick="deleteVideo(${i})" title="Remove"><i class="fas fa-trash"></i></button>
    </div>`).join('');
}
function handleVideoFile(file){
  if(!file)return;
  document.getElementById('vidTitle').value=file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ');
  const area=document.getElementById('uploadArea');
  area.classList.add('drag');
  area.innerHTML=`<i class="fas fa-file-video" style="font-size:2.5rem;color:var(--brand);margin-bottom:.8rem"></i><h3>${file.name}</h3><p>${(file.size/1024/1024).toFixed(1)} MB selected · Ready to save</p>`;
  window._pendingVideoFile=file;
}
function handleVideoDrop(e){
  e.preventDefault();document.getElementById('uploadArea').classList.remove('drag');
  const file=e.dataTransfer.files[0];if(file&&file.type.startsWith('video/'))handleVideoFile(file);
}
function saveVideo(){
  const title=document.getElementById('vidTitle').value.trim();
  if(!title){toast('Please enter a video title');return;}
  const prog=document.getElementById('vidProgress');
  const bar=document.getElementById('vidProgressBar');
  const label=document.getElementById('vidProgressLabel');
  prog.style.display='block';
  let pct=0;
  const iv=setInterval(()=>{
    pct=Math.min(pct+Math.random()*18+5,100);
    bar.style.width=pct+'%';
    label.textContent=pct<100?`Uploading… ${Math.round(pct)}%`:'Processing…';
    if(pct>=100){
      clearInterval(iv);
      setTimeout(()=>{
        prog.style.display='none';bar.style.width='0%';
        const videos=getVideos();
        videos.push({title,course:document.getElementById('vidCourse').value,module:document.getElementById('vidModule').value,desc:document.getElementById('vidDesc').value,size:window._pendingVideoFile?(window._pendingVideoFile.size/1024/1024).toFixed(1)+' MB':'—',addedAt:Date.now()});
        localStorage.setItem('matla_videos',JSON.stringify(videos));
        try{new BroadcastChannel('matla-academy').postMessage({type:'video_added'});}catch(e){}
        renderVideoList();toast('Video saved to academy!');
        document.getElementById('vidTitle').value='';document.getElementById('vidDesc').value='';
        window._pendingVideoFile=null;
        const area=document.getElementById('uploadArea');
        area.classList.remove('drag');
        area.innerHTML=`<input type="file" id="videoFileInput" accept="video/*" onchange="handleVideoFile(this.files[0])"><i class="fas fa-cloud-arrow-up"></i><h3>Drop a video file or click to browse</h3><p>MP4, MOV, WebM up to 2 GB · Drag & drop supported</p>`;
      },600);
    }
  },120);
}
function deleteVideo(idx){
  if(!confirm('Remove this video?'))return;
  const v=getVideos();v.splice(idx,1);localStorage.setItem('matla_videos',JSON.stringify(v));
  renderVideoList();toast('Video removed');
}

/* ═══════════════════════════════════════════
   LEADERBOARD VIEW
═══════════════════════════════════════════ */
function renderLeaderboard(){
  const tbody=document.getElementById('leaderBody');if(!tbody)return;
  const students=[...(LAST_SNAPSHOT||loadStudents())].sort((a,b)=>(b.xp||0)-(a.xp||0));
  const maxXP=Math.max(...students.map(s=>s.xp||0),1);
  tbody.innerHTML=students.map((s,i)=>{
    const rank=i+1;
    const rankClass=rank===1?'rank-1':rank===2?'rank-2':rank===3?'rank-3':'';
    const xp=s.xp||0;
    return `<tr>
      <td><span class="rank ${rankClass}">${rank<=3?'🥇🥈🥉'[rank-1]:rank}</span></td>
      <td><div class="student"><div class="avatar ${avatarClass(i)}">${initialsOf(s)}</div><div class="student-info"><div class="student-name">${fullName(s)}</div><div class="student-mail">${s.email||''}</div></div></div></td>
      <td><b style="font-family:var(--fh);font-size:1rem;font-weight:800">${xp}</b> <small style="color:var(--ink-3)">xp</small></td>
      <td><div class="xp-bar-wrap"><div class="xp-bar"><div style="width:${Math.round(xp/maxXP*100)}%"></div></div><span style="font-size:.72rem;font-weight:700;color:var(--ink-2);min-width:28px">${Math.round(xp/maxXP*100)}%</span></div></td>
      <td><span style="font-family:var(--fh);font-weight:800">${s.level||1}</span></td>
      <td><span class="pill p-${statusFor(s)}">${STATUS_LABELS[statusFor(s)]}</span></td>
    </tr>`;
  }).join('')||`<tr><td colspan="6"><div class="empty"><i class="fas fa-trophy"></i><p>No students yet</p></div></td></tr>`;
}

/* ═══════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════ */
function saveSetting(key,val){
  const s=JSON.parse(localStorage.getItem('matla_admin_settings')||'{}');
  s[key]=val;localStorage.setItem('matla_admin_settings',JSON.stringify(s));
  if(key==='pass_mark'){
    const pmDecimal=parseFloat(val)/100;
    localStorage.setItem(MATLA_PASSMARK_KEY,String(pmDecimal));
    const bc=new BroadcastChannel('matla-academy');
    bc.postMessage({type:'passmark_updated',value:pmDecimal});
    bc.close();
  }
  toast('Setting saved');
}
function clearDemoData(){
  if(!confirm('Reset ALL demo data? This cannot be undone.'))return;
  if(typeof MatlaDB!=='undefined')MatlaDB.clearAll();
  LAST_SNAPSHOT=null;FEED=[];
  refresh(true);toast('Demo data cleared');
}

/* ═══ REAL-TIME CLOCK ═══ */
function updateClock(){
  const now=new Date();
  const el=document.getElementById('liveClock');
  if(!el)return;
  const t=now.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  const d=now.toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'});
  el.textContent=t+' · '+d;
}
setInterval(updateClock,1000);
updateClock();

/* ═══ KEYBOARD SHORTCUTS ═══ */
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){
    e.preventDefault();
    const si=document.getElementById('searchInput');
    if(si){si.focus();si.select();}
  }
  if(e.key==='Escape'){
    closeDrawer();
    closeSidebarMobile();
    document.querySelectorAll('.modal-ov.open').forEach(m=>m.classList.remove('open'));
  }
});

/* ═══ EVENT LISTENERS ═══ */
document.addEventListener('DOMContentLoaded',()=>{
  applySidebarState();
  // Nav items
  document.querySelectorAll('.nav-item[data-view]').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();
    const v=a.getAttribute('data-view');
    if(v) switchView(v);
  }));
  // Filter pills
  document.querySelectorAll('.filter-bar .pill').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-bar .pill').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    CURRENT_FILTER=btn.getAttribute('data-fil');
    renderBoard();
  }));
});

/* ── Initial boot ── */
refresh();
setTimeout(initCharts,600);
// Seed if entirely empty so admin sees something useful immediately
setTimeout(()=>{
  if(typeof MatlaDB!=='undefined' && MatlaDB.getAll().filter(u=>!u.role||u.role==='student').length===0){
    MatlaDB.seedDemo(8);
    refresh();
  }
},300);

/* ══════════════════════════════════════════════════════
   LOADING SCREEN
══════════════════════════════════════════════════════ */
(function dismissLoader(){
  function hide(){
    var loader=document.getElementById('appLoader');
    if(loader){loader.classList.add('fade-out');setTimeout(function(){if(loader.parentNode)loader.parentNode.removeChild(loader);},800);}
  }
  if(document.readyState==='complete'){setTimeout(hide,2000);}
  else{window.addEventListener('load',function(){setTimeout(hide,2000);});}
})();

/* ══════════════════════════════════════════════════════
   DASHBOARD SECONDARY STATS & ALERTS
══════════════════════════════════════════════════════ */
function renderDashSecondary(students){
  var grads=Object.keys(getGraduates()||{}).length;
  var stuck=students.filter(function(s){
    var d=s.lastSeen||s.lastLogin;
    if(!d)return false;
    return (Date.now()-new Date(d).getTime())>7*864e5;
  }).length;
  var totalXP=students.reduce(function(a,s){return a+(s.xp||0);},0);
  var avgXP=students.length?Math.round(totalXP/students.length):0;
  var gc=document.getElementById('dashGradCount');
  var sc=document.getElementById('dashStuckCount');
  var ax=document.getElementById('dashAvgXP');
  if(gc)gc.textContent=grads;
  if(sc)sc.textContent=stuck;
  if(ax)ax.textContent=avgXP.toLocaleString();
}

function _riskTagsFor(s){
  var tags=[];var now=Date.now();
  var daysSeen=s.lastSeen?Math.floor((now-new Date(s.lastSeen).getTime())/86400000):null;
  if(daysSeen!==null&&daysSeen>=14)tags.push({label:'Inactive '+daysSeen+'d',color:'#f59e0b',icon:'fa-clock'});
  else if(daysSeen!==null&&daysSeen>=7)tags.push({label:'Inactive '+daysSeen+'d',color:'#ff9f43',icon:'fa-clock'});
  if(s.enrolled){var wi=Math.floor((now-new Date(s.enrolled).getTime())/604800000);if(wi>=2&&(s.progress||0)<25)tags.push({label:'Missing modules',color:'#ef4444',icon:'fa-circle-minus'});}
  if(s._a1&&s._a1.submitted&&!s._a1.passed&&(s._a1.score||0)<60)tags.push({label:'Failing assessment',color:'#dc2626',icon:'fa-xmark-circle'});
  if(s._a1&&s._a1.attempts&&s._a1.attempts>=2)tags.push({label:'2nd attempt',color:'#8b5cf6',icon:'fa-rotate'});
  if((s.progress||0)<10&&s.enrolled&&Math.floor((now-new Date(s.enrolled).getTime())/604800000)>=1)tags.push({label:'Not started',color:'#64748b',icon:'fa-hourglass'});
  return tags;
}
function _isAtRisk(s){
  var now=Date.now();
  if(s.lastSeen&&(now-new Date(s.lastSeen).getTime())>7*86400000&&(s.progress||0)<90)return true;
  if(s._a1&&s._a1.submitted&&!s._a1.passed)return true;
  if(s._a1&&s._a1.attempts&&s._a1.attempts>=2)return true;
  if(s.enrolled&&Math.floor((now-new Date(s.enrolled).getTime())/604800000)>=2&&(s.progress||0)<25)return true;
  return false;
}
function _buildRiskRow(s){
  var tags=_riskTagsFor(s);
  var prog=Math.min(100,Math.max(0,s.progress||0));
  var tagSpans=tags.map(function(t){return '<span class="risk-tag" style="background:'+t.color+'1a;color:'+t.color+';border-color:'+t.color+'44"><i class="fas '+t.icon+'"></i> '+t.label+'</span>';}).join('');
  return '<div class="risk-alert-row">'
    +'<span class="alert-av risk-av">'+initialsOf(s)+'</span>'
    +'<div class="risk-alert-info"><div class="risk-alert-name">'+fullName(s)+'<span style="font-weight:400;color:var(--ink-3);font-size:.72rem;margin-left:.4rem">'+(s.course||'')+'</span></div>'
    +'<div class="risk-tags">'+tagSpans+'</div></div>'
    +'<div class="risk-alert-meta"><div class="risk-prog-wrap"><div class="risk-prog-fill" style="width:'+prog+'%"></div></div><span class="risk-prog-lbl">'+prog+'%</span></div>'
    +'<button class="alert-action" onclick="openDrawer(\''+s.email+'\')"><i class="fas fa-eye"></i> View</button>'
    +'</div>';
}
function renderStuckAlerts(students){
  var panel=document.getElementById('stuckAlert');
  if(!panel)return;
  var atRisk=students.filter(_isAtRisk);
  if(!atRisk.length){panel.style.display='none';return;}
  panel.style.display='';
  var rows=atRisk.slice(0,8).map(_buildRiskRow).join('');
  var more=atRisk.length>8?'<div style="text-align:center;padding:.65rem;font-size:.75rem;color:var(--ink-3)">+'+(atRisk.length-8)+' more — <a href="#" onclick="nav(\'students\');return false" style="color:var(--brand)">view all</a></div>':'';
  var header='<div class="alerts-panel-h"><h3><i class="fas fa-triangle-exclamation"></i> Students at Risk — Action Required <span class="risk-count">'+atRisk.length+'</span></h3><button class="tool-btn" onclick="openCsvModal(\'stuck\')"><i class="fas fa-file-arrow-down"></i> Export</button></div>';
  panel.innerHTML=header+rows+more;
}


/* ══════════════════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════════════════ */
var _notifs=[];
function addNotif(msg,icon){
  _notifs.unshift({msg:msg,icon:icon||'fa-circle-info',ts:Date.now(),read:false});
  if(_notifs.length>20)_notifs.length=20;
  var pip=document.getElementById('notifPip');
  if(pip)pip.style.display='';
  renderNotifPanel();
}
function renderNotifPanel(){
  var list=document.getElementById('notifList');
  if(!list)return;
  if(!_notifs.length){list.innerHTML='<div style="padding:1rem;text-align:center;color:var(--muted);font-size:.85rem">No notifications</div>';return;}
  var html='';
  _notifs.forEach(function(n){
    var ago=Math.floor((Date.now()-n.ts)/60000);
    var agoStr=ago<1?'just now':ago<60?ago+'m ago':Math.floor(ago/60)+'h ago';
    html+='<div class="notif-item'+(n.read?' read':'')+'">'
      +'<i class="fas '+n.icon+'" style="color:var(--brand);margin-right:.5rem"></i>'
      +'<span>'+n.msg+'</span>'
      +'<small style="margin-left:auto;color:var(--muted);white-space:nowrap">'+agoStr+'</small>'
      +'</div>';
  });
  list.innerHTML=html;
}
function toggleNotifPanel(){
  var panel=document.getElementById('notifPanel');
  if(!panel)return;
  panel.classList.toggle('open');
  if(panel.classList.contains('open'))renderNotifPanel();
  document.addEventListener('click',function closeOut(e){
    if(!panel.contains(e.target)&&e.target.id!=='notifBtn'){
      panel.classList.remove('open');
      document.removeEventListener('click',closeOut);
    }
  });
}
function markAllRead(){
  _notifs.forEach(function(n){n.read=true;});
  var pip=document.getElementById('notifPip');
  if(pip)pip.style.display='none';
  renderNotifPanel();
}


/* ══════════════════════════════════════════════════════
   CSV EXPORT MODAL & TEMPLATES
══════════════════════════════════════════════════════ */
function openCsvModal(preset){
  var modal=document.getElementById('csvModal');
  if(!modal)return;
  if(preset){
    // direct export without modal
    doExportCsv(preset);
    return;
  }
  modal.classList.add('open');
}
function closeCsvModal(){
  var modal=document.getElementById('csvModal');
  if(modal)modal.classList.remove('open');
}

function doExportCsv(type){
  closeCsvModal();
  var students=loadStudents();
  var rows,filename,headers;
  switch(type){
    case 'students':
      headers=['Name','Email','Status','Course','Region','Progress (%)','XP','Last Seen','Enrolled'];
      rows=students.map(function(s){
        return [fullName(s),s.email,STATUS_LABELS[statusFor(s)]||statusFor(s),s.course||'',s.region||'',Math.round(s.progress||0)+'%',s.xp||0,
          s.lastSeen?new Date(s.lastSeen).toLocaleDateString():'—',
          s.enrolled?new Date(s.enrolled).toLocaleDateString():'—'];
      });
      filename='matla_students_'+_dateTag()+'.csv';
      break;
    case 'courses':
      var courses=getCourses();
      headers=['Course','Key','Duration','Modules','Status'];
      rows=courses.map(function(c){
        return [c.title,c.key,c.duration||'',c.modules||'',c.status||'Active'];
      });
      filename='matla_courses_'+_dateTag()+'.csv';
      break;
    case 'assessments':
      var assessments=getAssessments();
      headers=['Assessment','Key','Questions','Pass Mark (%)','Attempts'];
      rows=assessments.map(function(a){
        var stats=getAssessStats(a.key);
        return [a.title,a.key,(a.questions||[]).length,a.passmark||70,stats.attempts||0];
      });
      filename='matla_assessments_'+_dateTag()+'.csv';
      break;
    case 'graduates':
      var grads=getGraduates();
      var gradRows=[];
      students.forEach(function(s){
        if(grads[s.email]&&grads[s.email].confirmed){
          gradRows.push([fullName(s),s.email,s.course||'',grads[s.email].date?new Date(grads[s.email].date).toLocaleDateString():'—',s.xp||0]);
        }
      });
      headers=['Name','Email','Course','Graduated','XP'];
      rows=gradRows;
      filename='matla_graduates_'+_dateTag()+'.csv';
      break;
    case 'leaderboard':
      var sorted=students.slice().sort(function(a,b){return (b.xp||0)-(a.xp||0);});
      headers=['Rank','Name','Email','XP','Course','Progress (%)'];
      rows=sorted.map(function(s,i){
        return [i+1,fullName(s),s.email,s.xp||0,s.course||'',Math.round(courseProgress(s))+'%'];
      });
      filename='matla_leaderboard_'+_dateTag()+'.csv';
      break;
    case 'analytics':
    default:
      headers=['Name','Email','Status','Course','Progress (%)','XP','Last Seen'];
      rows=students.map(function(s){
        return [fullName(s),s.email,statusFor(s),s.course||'',Math.round(courseProgress(s))+'%',s.xp||0,
          s.lastSeen?new Date(s.lastSeen).toLocaleDateString():'—'];
      });
      filename='matla_analytics_'+_dateTag()+'.csv';
      break;
    case 'stuck':
      var stuckSt=students.filter(function(s){
        var d=s.lastSeen||s.lastLogin;
        if(!d)return false;
        return (Date.now()-new Date(d).getTime())>7*864e5;
      });
      headers=['Name','Email','Course','Days Inactive','XP','Status'];
      rows=stuckSt.map(function(s){
        var days=Math.floor((Date.now()-new Date(s.lastSeen||s.lastLogin).getTime())/864e5);
        return [fullName(s),s.email,s.course||'',days,s.xp||0,statusFor(s)];
      });
      filename='matla_at_risk_'+_dateTag()+'.csv';
      break;
  }
  var csv=[headers.join(',')].concat(rows.map(function(r){
    return r.map(function(v){
      var str=String(v==null?'':v).replace(/"/g,'""');
      return /[,"\n]/.test(str)?'"'+str+'"':str;
    }).join(',');
  })).join('\r\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},1000);
  toast('CSV exported: '+filename);
  addNotif('CSV exported — '+filename,'fa-file-arrow-down');
}
function _dateTag(){return new Date().toISOString().slice(0,10);}


/* ═══════════════════════════════════════════════════════
   PDF EXPORT MODAL & GENERATOR
═══════════════════════════════════════════════════════ */
var _pdfType='register',_pdfSize='A4';
function openPdfModal(presetType){
  _pdfType=presetType||'register';
  _pdfSize='A4';
  var modal=document.getElementById('pdfSizeModal');
  if(!modal)return;
  modal.querySelectorAll('.pdf-size-btn[data-ptype]').forEach(function(b){
    b.classList.toggle('selected',b.getAttribute('data-ptype')===_pdfType);
  });
  modal.querySelectorAll('.pdf-size-btn[data-psize]').forEach(function(b){
    b.classList.toggle('selected',b.getAttribute('data-psize')===_pdfSize);
  });
  modal.classList.add('open');
}
function closePdfModal(){
  var modal=document.getElementById('pdfSizeModal');
  if(modal)modal.classList.remove('open');
}
function selectPdfType(t){
  _pdfType=t;
  document.querySelectorAll('.pdf-size-btn[data-ptype]').forEach(function(b){
    b.classList.toggle('selected',b.getAttribute('data-ptype')===t);
  });
}
function selectPdfSize(s){
  _pdfSize=s;
  document.querySelectorAll('.pdf-size-btn[data-psize]').forEach(function(b){
    b.classList.toggle('selected',b.getAttribute('data-psize')===s);
  });
}

async function _getLogoDataUrl(){
  try{
    const resp=await fetch('Matla Academy .png');
    const blob=await resp.blob();
    return await new Promise(function(res){
      const r=new FileReader();
      r.onload=function(){res(r.result);};
      r.onerror=function(){res(null);};
      r.readAsDataURL(blob);
    });
  }catch(e){return null;}
}

function _buildSvgBanner(logoDataUrl){
  var d=new Date().toLocaleDateString('en-ZA',{year:'numeric',month:'long',day:'numeric'});
  var svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="160" viewBox="0 0 800 160">';
  svg+='<defs>';
  svg+='<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">';
  svg+='<stop offset="0%" style="stop-color:#0a1628"/>';
  svg+='<stop offset="60%" style="stop-color:#0d2060"/>';
  svg+='<stop offset="100%" style="stop-color:#0a1628"/>';
  svg+='</linearGradient>';
  svg+='<linearGradient id="c1" x1="0%" y1="0%" x2="100%" y2="100%">';
  svg+='<stop offset="0%" style="stop-color:#0055d4;stop-opacity:.7"/>';
  svg+='<stop offset="100%" style="stop-color:#6c3bff;stop-opacity:.3"/>';
  svg+='</linearGradient>';
  svg+='<linearGradient id="c2" x1="0%" y1="0%" x2="100%" y2="100%">';
  svg+='<stop offset="0%" style="stop-color:#00c9a7;stop-opacity:.6"/>';
  svg+='<stop offset="100%" style="stop-color:#0055d4;stop-opacity:.2"/>';
  svg+='</linearGradient>';
  svg+='<linearGradient id="c3" x1="0%" y1="0%" x2="100%" y2="100%">';
  svg+='<stop offset="0%" style="stop-color:#ff6eb4;stop-opacity:.5"/>';
  svg+='<stop offset="100%" style="stop-color:#6c3bff;stop-opacity:.2"/>';
  svg+='</linearGradient>';
  svg+='</defs>';
  svg+='<rect width="800" height="160" fill="url(#bg)"/>';
  svg+='<ellipse cx="120" cy="40" rx="140" ry="80" fill="url(#c1)"/>';
  svg+='<ellipse cx="680" cy="130" rx="160" ry="70" fill="url(#c2)"/>';
  svg+='<ellipse cx="400" cy="80" rx="100" ry="55" fill="url(#c3)" opacity=".5"/>';
  svg+='<circle cx="60" cy="140" r="50" fill="none" stroke="#0055d4" stroke-width="1.5" opacity=".3"/>';
  svg+='<circle cx="750" cy="20" r="60" fill="none" stroke="#00c9a7" stroke-width="1.5" opacity=".3"/>';
  svg+='<text x="40" y="80" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="white">MATLA ACADEMY</text>';
  svg+='<text x="40" y="110" font-family="Arial,sans-serif" font-size="13" fill="rgba(255,255,255,0.65)">Empowering the next generation of Financial Advisors.</text>';
  svg+='<text x="40" y="135" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.4)">Exported: '+d+'</text>';
  if(logoDataUrl){svg+='<image href="'+logoDataUrl+'" x="682" y="6" width="112" height="148" preserveAspectRatio="xMidYMid meet"/>';}
  svg+='</svg>';
  return svg;
}

function _pdfCss(size){
  return '@page{size:'+size+';margin:1.5cm}'
    +'*{box-sizing:border-box;margin:0;padding:0}'
    +'body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#1a1a2e;background:#fff}'
    +'.banner{width:100%;border-radius:8px;overflow:hidden;margin-bottom:1.5rem;line-height:0}'
    +'.banner img{width:100%;display:block}'
    +'.doc-title{font-size:20pt;font-weight:700;color:#0a1628;margin-bottom:.25rem}'
    +'.doc-sub{font-size:10pt;color:#666;margin-bottom:1.5rem;padding-bottom:.75rem;border-bottom:2px solid #0055d4}'
    +'table{width:100%;border-collapse:collapse;font-size:9.5pt}'
    +'thead{background:#0055d4;color:#fff}'
    +'th{padding:.5rem .75rem;text-align:left;font-weight:600}'
    +'td{padding:.4rem .75rem;border-bottom:1px solid #e8ecf4}'
    +'tr:nth-child(even) td{background:#f4f7fe}'
    +'.badge{display:inline-block;padding:.15rem .5rem;border-radius:20px;color:#fff;font-size:8.5pt}'
    +'.prog-bar{display:inline-block;width:60px;height:6px;background:#e0e0e0;border-radius:3px;vertical-align:middle;margin-right:4px}'
    +'.prog-fill{height:100%;background:linear-gradient(90deg,#0055d4,#6c3bff);border-radius:3px}'
    +'.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}'
    +'.stat-card{border:1.5px solid #0055d4;border-radius:8px;padding:.75rem 1rem;text-align:center}'
    +'.stat-num{font-size:20pt;font-weight:700;color:#0055d4}'
    +'.stat-label{font-size:9pt;color:#666;margin-top:.25rem}';
}

async function doExportPdf(){
  closePdfModal();
  var students=loadStudents();
  var grads=getGraduates();
  var size=_pdfSize||'A4';
  var type=_pdfType||'register';

  var logoDataUrl=await _getLogoDataUrl();
  var bannerDataUrl='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(_buildSvgBanner(logoDataUrl))));
  var bodyContent='';
  var title='Matla Academy Report';

  if(type==='register'||type==='students'){
    title='Student Register';
    var rows=students.map(function(s,i){
      var prog=Math.round(s.progress||0);
      var st=statusFor(s);
      var sc=st==='active'?'#00b96b':st==='stuck'?'#ff6b6b':'#888';
      var stLabel=STATUS_LABELS[st]||st;
      return '<tr><td>'+(i+1)+'</td><td>'+fullName(s)+'</td><td>'+s.email+'</td>'
        +'<td><span class="badge" style="background:'+sc+'">'+stLabel+'</span></td>'
        +'<td>'+(s.course||'&mdash;')+'</td>'
        +'<td>'+(s.region||'&mdash;')+'</td>'
        +'<td><div class="prog-bar"><div class="prog-fill" style="width:'+prog+'%"></div></div> '+prog+'%</td>'
        +'<td>'+(s.xp||0)+'</td>'
        +'<td>'+(s.lastSeen?new Date(s.lastSeen).toLocaleDateString():'&mdash;')+'</td></tr>';
    }).join('');
    bodyContent='<table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Status</th><th>Course</th><th>Region</th><th>Progress</th><th>XP</th><th>Last Seen</th></tr></thead><tbody>'+rows+'</tbody></table>';

  } else if(type==='graduates'){
    title='Graduates List';
    var gl=students.filter(function(s){return grads[s.email]&&grads[s.email].confirmed;});
    var grows=gl.map(function(s,i){
      return '<tr><td>'+(i+1)+'</td><td>'+fullName(s)+'</td><td>'+s.email+'</td>'
        +'<td>'+(s.course||'&mdash;')+'</td>'
        +'<td>'+(grads[s.email].date?new Date(grads[s.email].date).toLocaleDateString():'&mdash;')+'</td>'
        +'<td>'+(s.xp||0)+'</td></tr>';
    }).join('');
    bodyContent='<table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Course</th><th>Graduated</th><th>XP</th></tr></thead><tbody>'+grows+'</tbody></table>';

  } else if(type==='analytics'){
    title='Analytics Report';
    var act=students.filter(function(s){return statusFor(s)==='Active';}).length;
    var atr=students.filter(function(s){return statusFor(s)==='At Risk';}).length;
    var gc=Object.keys(grads).filter(function(k){return grads[k].confirmed;}).length;
    var ap=students.length?Math.round(students.reduce(function(a,s){return a+courseProgress(s);},0)/students.length):0;
    var ax=students.length?Math.round(students.reduce(function(a,s){return a+(s.xp||0);},0)/students.length):0;
    var arows=students.map(function(s){
      return '<tr><td>'+fullName(s)+'</td><td>'+statusFor(s)+'</td><td>'+(s.course||'&mdash;')+'</td>'
        +'<td>'+Math.round(courseProgress(s))+'%</td><td>'+(s.xp||0)+'</td></tr>';
    }).join('');
    bodyContent='<div class="stat-grid">'
      +'<div class="stat-card"><div class="stat-num">'+students.length+'</div><div class="stat-label">Total</div></div>'
      +'<div class="stat-card" style="border-color:#00b96b"><div class="stat-num" style="color:#00b96b">'+act+'</div><div class="stat-label">Active</div></div>'
      +'<div class="stat-card" style="border-color:#ff6b6b"><div class="stat-num" style="color:#ff6b6b">'+atr+'</div><div class="stat-label">At Risk</div></div>'
      +'<div class="stat-card" style="border-color:#6c3bff"><div class="stat-num" style="color:#6c3bff">'+gc+'</div><div class="stat-label">Graduates</div></div>'
      +'<div class="stat-card"><div class="stat-num">'+ap+'%</div><div class="stat-label">Avg Progress</div></div>'
      +'<div class="stat-card"><div class="stat-num">'+ax+'</div><div class="stat-label">Avg XP</div></div>'
      +'</div>'
      +'<table><thead><tr><th>Name</th><th>Status</th><th>Course</th><th>Progress</th><th>XP</th></tr></thead><tbody>'+arows+'</tbody></table>';

  } else if(type==='student'){
    var drEl=document.getElementById('drEmail');
    var email=drEl?drEl.textContent:'';
    var st=students.find(function(s){return s.email===email;})||{};
    title='Student Profile — '+fullName(st);
    bodyContent='<table style="max-width:500px">'
      +'<tr><th>Name</th><td>'+fullName(st)+'</td></tr>'
      +'<tr><th>Email</th><td>'+st.email+'</td></tr>'
      +'<tr><th>Status</th><td>'+statusFor(st)+'</td></tr>'
      +'<tr><th>Course</th><td>'+(st.course||'&mdash;')+'</td></tr>'
      +'<tr><th>Progress</th><td>'+Math.round(courseProgress(st))+'%</td></tr>'
      +'<tr><th>XP</th><td>'+(st.xp||0)+'</td></tr>'
      +'<tr><th>Last Seen</th><td>'+(st.lastSeen?new Date(st.lastSeen).toLocaleDateString():'&mdash;')+'</td></tr>'
      +'<tr><th>Enrolled</th><td>'+(st.enrolled?new Date(st.enrolled).toLocaleDateString():'&mdash;')+'</td></tr>'
      +'</table>';
  }

  var pscript='window.onload=function(){window.print();}';
  var fullHtml='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+'</title>'
    +'<style>'+_pdfCss(size)+'</style>'
    +'</head><body>'
    +'<div class="banner"><img src="'+bannerDataUrl+'" alt="Matla Academy"></div>'
    +'<div class="doc-title">'+title+'</div>'
    +'<div class="doc-sub">Matla Academy &nbsp;|&nbsp; Generated: '+new Date().toLocaleString()+'</div>'
    +bodyContent
    +'<script>'+pscript+'<\/script>'
    +'</body></html>';

  var blob=new Blob([fullHtml],{type:'text/html;charset=utf-8'});
  var blobUrl=URL.createObjectURL(blob);
  var win=window.open(blobUrl,'_blank');
  if(!win)toast('Please allow popups to export PDF');
  else{
    toast('PDF ready — print dialog will open');
    addNotif('PDF generated — '+title,'fa-file-pdf');
  }
  setTimeout(function(){URL.revokeObjectURL(blobUrl);},30000);
}

/* ═══════════════════════════════════════════════════════
   ANALYTICS VIEW
═══════════════════════════════════════════════════════ */
function renderAnalytics(){
  var students=loadStudents();
  var total=students.length;
  var active=students.filter(function(s){return statusFor(s)==='active';}).length;
  var atRiskCount=students.filter(_isAtRisk).length;
  var grads=getGraduates();
  var gradCount=Object.keys(grads).filter(function(k){return grads[k].confirmed;}).length;
  var avgProg=total?Math.round(students.reduce(function(a,s){return a+(s.progress||0);},0)/total):0;
  var avgXP=total?Math.round(students.reduce(function(a,s){return a+(s.xp||0);},0)/total):0;
  var maxXP=total?Math.max.apply(null,students.map(function(s){return s.xp||0;})):0;
  var completion=total?students.filter(function(s){return (s.progress||0)>=95;}).length:0;

  var sb=document.getElementById('anaStatBlocks');
  if(sb){
    sb.innerHTML='<div class="stat-block"><i class="fas fa-users" style="color:var(--brand)"></i><div class="sb-num">'+total+'</div><div class="sb-lbl">Total</div></div>'
      +'<div class="stat-block"><i class="fas fa-circle-check" style="color:#00b96b"></i><div class="sb-num">'+active+'</div><div class="sb-lbl">Active Now</div></div>'
      +'<div class="stat-block"><i class="fas fa-triangle-exclamation" style="color:#ff6b6b"></i><div class="sb-num">'+atRiskCount+'</div><div class="sb-lbl">At Risk</div></div>'
      +'<div class="stat-block"><i class="fas fa-graduation-cap" style="color:#6c3bff"></i><div class="sb-num">'+gradCount+'</div><div class="sb-lbl">Graduates</div></div>'
      +'<div class="stat-block"><i class="fas fa-chart-line" style="color:#00c9a7"></i><div class="sb-num">'+avgProg+'%</div><div class="sb-lbl">Avg Progress</div></div>'
      +'<div class="stat-block"><i class="fas fa-bolt" style="color:#f59e0b"></i><div class="sb-num">'+avgXP+'</div><div class="sb-lbl">Avg XP</div></div>'
      +'<div class="stat-block"><i class="fas fa-trophy" style="color:#ff6eb4"></i><div class="sb-num">'+maxXP+'</div><div class="sb-lbl">Max XP</div></div>'
      +'<div class="stat-block"><i class="fas fa-flag-checkered" style="color:#0055d4"></i><div class="sb-num">'+completion+'</div><div class="sb-lbl">Completed</div></div>';
  }


  // ── Menner Readiness Row ──────────────────────────────────────────────────
  var pm=parseFloat(localStorage.getItem(MATLA_PASSMARK_KEY)||"0.8");
  var mennerEl=document.getElementById("anaMennerRow");
  if(mennerEl){
    var mennerResults=students.map(function(s){return calcMennerScore(s);}).filter(function(r){return !r.error;});
    var promoted =mennerResults.filter(function(r){return r.status==="Promoted";}).length;
    var readyFin =mennerResults.filter(function(r){return r.status==="Ready for Final";}).length;
    var notReady =mennerResults.filter(function(r){return r.status==="Not Ready";}).length;
    var mTotal   =mennerResults.length||1;
    mennerEl.innerHTML=
      "<div style=background:#f0fdf4;border:1px solid #bbf7d0;border-radius:.75rem;padding:1.2rem;text-align:center>"
        +"<div style=font-size:2rem;font-weight:700;color:#16a34a>"+promoted+"</div>"
        +"<div style=font-weight:600;color:#15803d;margin-top:.2rem>Promoted</div>"
        +"<div style=font-size:.78rem;color:#15803d;margin-top:.2rem>"+Math.round(promoted/mTotal*100)+"% of scored</div>"
      +"</div>"
      +"<div style=background:#fffbeb;border:1px solid #fde68a;border-radius:.75rem;padding:1.2rem;text-align:center>"
        +"<div style=font-size:2rem;font-weight:700;color:#d97706>"+readyFin+"</div>"
        +"<div style=font-weight:600;color:#b45309;margin-top:.2rem>Ready for Final</div>"
        +"<div style=font-size:.78rem;color:#b45309;margin-top:.2rem>"+Math.round(readyFin/mTotal*100)+"% of scored</div>"
      +"</div>"
      +"<div style=background:#fef2f2;border:1px solid #fecaca;border-radius:.75rem;padding:1.2rem;text-align:center>"
        +"<div style=font-size:2rem;font-weight:700;color:#dc2626>"+notReady+"</div>"
        +"<div style=font-weight:600;color:#b91c1c;margin-top:.2rem>Not Ready</div>"
        +"<div style=font-size:.78rem;color:#b91c1c;margin-top:.2rem>"+Math.round(notReady/mTotal*100)+"% of scored</div>"
      +"</div>";
  }

  // ── Region Chart ──────────────────────────────────────────────────────────
  var regionCanvas=document.getElementById("anaRegionChart");
  if(regionCanvas){
    var regionMap={};
    students.forEach(function(s){
      var r=s.region||"Unknown";
      if(!regionMap[r])regionMap[r]={total:0,count:0};
      var mr=calcMennerScore(s);
      if(!mr.error){regionMap[r].total+=mr.finalScore;regionMap[r].count++;}
    });
    var rLabels=Object.keys(regionMap);
    var rData=rLabels.map(function(r){var m=regionMap[r];return m.count?Math.round(m.total/m.count*1000)/1000:0;});
    if(regionCanvas._chart)regionCanvas._chart.destroy();
    regionCanvas._chart=new Chart(regionCanvas,{
      type:"bar",
      data:{labels:rLabels,datasets:[{label:"Avg Readiness",data:rData,backgroundColor:"rgba(99,102,241,0.7)",borderRadius:6}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{min:0,max:1,ticks:{callback:function(v){return Math.round(v*100)+"%";}}}}}
    });
  }

  // ── SM Chart ──────────────────────────────────────────────────────────────
  var smCanvas=document.getElementById("anaSMChart");
  if(smCanvas){
    var smMap={};
    students.forEach(function(s){
      var mgr=s.manager||"Unassigned";
      if(!smMap[mgr])smMap[mgr]={total:0,count:0};
      var mr=calcMennerScore(s);
      if(!mr.error){smMap[mgr].total+=mr.finalScore;smMap[mgr].count++;}
    });
    var sLabels=Object.keys(smMap);
    var sData=sLabels.map(function(m){var v=smMap[m];return v.count?Math.round(v.total/v.count*1000)/1000:0;});
    if(smCanvas._chart)smCanvas._chart.destroy();
    smCanvas._chart=new Chart(smCanvas,{
      type:"bar",
      data:{labels:sLabels,datasets:[{label:"Avg Readiness",data:sData,backgroundColor:"rgba(20,184,166,0.7)",borderRadius:6}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
        scales:{x:{min:0,max:1,ticks:{callback:function(v){return Math.round(v*100)+"%";}}}}}
    });
  }

    var fn=document.getElementById('anaFunnel');
  if(fn){
    var enrolled=total;
    var started=students.filter(function(s){return (s.progress||0)>0;}).length;
    var halfway=students.filter(function(s){return (s.progress||0)>=50;}).length;
    var done=students.filter(function(s){return (s.progress||0)>=95;}).length;
    var steps=[
      {label:'Enrolled',count:enrolled,color:'#0055d4'},
      {label:'Started',count:started,color:'#6c3bff'},
      {label:'50%+',count:halfway,color:'#00c9a7'},
      {label:'Completed',count:done,color:'#00b96b'}
    ];
    fn.innerHTML=steps.map(function(step){
      var pct=enrolled?Math.round(step.count/enrolled*100):0;
      return '<div class="funnel-step"><div class="funnel-bar" style="width:'+Math.max(pct,8)+'%;background:'+step.color+'"><span>'+step.count+'</span></div>'
        +'<span class="funnel-label">'+step.label+' ('+pct+'%)</span></div>';
    }).join('');
  }

  var tc=document.getElementById('anaTopCourses');
  if(tc){
    var cMap={sales:'Sales Training',rma:'Product RMA',capital:'Capital Legacy',fais:'FAIS Compliance',fin:'Financial Literacy'};
    var cCounts={};
    students.forEach(function(s){var k=s.course||'other';cCounts[k]=(cCounts[k]||0)+1;});
    var cKeys=Object.keys(cCounts).sort(function(a,b){return cCounts[b]-cCounts[a];});
    var cMax=cKeys.length?cCounts[cKeys[0]]:1;
    tc.innerHTML=cKeys.map(function(k){
      var cnt=cCounts[k];var pct=Math.round(cnt/total*100);
      return '<div class="ret-row"><div class="ret-label" style="min-width:120px;font-size:.7rem">'+(cMap[k]||k)+'</div>'
        +'<div class="ret-track"><div class="ret-fill" style="width:'+Math.max(Math.round(cnt/cMax*100),2)+'%;background:linear-gradient(90deg,#0055d4,#6c3bff)"></div></div>'
        +'<div class="ret-val">'+cnt+' ('+pct+'%)</div></div>';
    }).join('')||'<div style="color:var(--ink-3);font-size:.8rem;padding:.75rem">No data</div>';
  }

  var rb=document.getElementById('anaRetention');
  if(rb){
    var buckets=[
      {label:'0%',min:0,max:1,color:'#94a3b8'},
      {label:'1–24%',min:1,max:25,color:'#ff9f43'},
      {label:'25–49%',min:25,max:50,color:'#f59e0b'},
      {label:'50–74%',min:50,max:75,color:'#6c3bff'},
      {label:'75–94%',min:75,max:95,color:'#0055d4'},
      {label:'Completed',min:95,max:101,color:'#00b96b'}
    ];
    rb.innerHTML=buckets.map(function(b){
      var cnt=students.filter(function(s){var p=s.progress||0;return p>=b.min&&p<b.max;}).length;
      var pct=total?Math.round(cnt/total*100):0;
      return '<div class="ret-row"><div class="ret-label">'+b.label+'</div>'
        +'<div class="ret-track"><div class="ret-fill" style="width:'+Math.max(pct,1)+'%;background:'+b.color+'"></div></div>'
        +'<div class="ret-val">'+cnt+'</div></div>';
    }).join('');
  }

  var hm=document.getElementById('anaHeatmap');
  if(hm){
    var days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var counts=[0,0,0,0,0,0,0];
    students.forEach(function(s){if(s.lastSeen){var d=new Date(s.lastSeen).getDay();counts[(d+6)%7]++;}});
    var maxC=Math.max.apply(null,counts)||1;
    hm.innerHTML=days.map(function(day,i){
      var pct=Math.round(counts[i]/maxC*100);
      return '<div class="heat-col"><div class="heat-bar" style="height:'+Math.max(pct,4)+'%;background:linear-gradient(180deg,#0055d4,#6c3bff)"></div>'
        +'<div class="heat-day">'+day+'</div><div class="heat-count">'+counts[i]+'</div></div>';
    }).join('');
  }

  var cpa=document.getElementById('anaChartProg');
  var cxp=document.getElementById('anaChartXP');
  if(cpa&&cxp){
    if(window._anaChartP)window._anaChartP.destroy();
    if(window._anaChartX)window._anaChartX.destroy();
    var pb=[0,0,0,0,0];
    students.forEach(function(s){var p=s.progress||0;if(p<20)pb[0]++;else if(p<40)pb[1]++;else if(p<60)pb[2]++;else if(p<80)pb[3]++;else pb[4]++;});
    window._anaChartP=new Chart(cpa,{
      type:'doughnut',
      data:{labels:['0–19%','20–39%','40–59%','60–79%','80–100%'],datasets:[{data:pb,backgroundColor:['#94a3b8','#ff9f43','#f59e0b','#6c3bff','#00b96b'],borderWidth:0}]},
      options:{plugins:{legend:{position:'bottom',labels:{color:'#64748b',font:{size:11}}}},cutout:'65%'}
    });
    var xpS=students.slice().sort(function(a,b){return (a.xp||0)-(b.xp||0);});
    window._anaChartX=new Chart(cxp,{
      type:'bar',
      data:{labels:xpS.slice(-10).map(function(s){return s.firstName||(s.email||'').split('@')[0];}),
        datasets:[{label:'XP',data:xpS.slice(-10).map(function(s){return s.xp||0;}),backgroundColor:'rgba(0,85,212,0.75)',borderRadius:5}]},
      options:{plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#64748b',maxRotation:30}},y:{ticks:{color:'#64748b'},beginAtZero:true}}}
    });
  }

  var rbd=document.getElementById('anaRiskBreakdown');
  if(rbd){
    var now=Date.now();
    var inactive14=students.filter(function(s){return s.lastSeen&&(now-new Date(s.lastSeen).getTime())>14*86400000&&(s.progress||0)<90;});
    var missingMod=students.filter(function(s){if(!s.enrolled)return false;var wi=Math.floor((now-new Date(s.enrolled).getTime())/604800000);return wi>=2&&(s.progress||0)<25;});
    var failing=students.filter(function(s){return s._a1&&s._a1.submitted&&!s._a1.passed&&(s._a1.score||0)<60;});
    var second=students.filter(function(s){return s._a1&&s._a1.attempts&&s._a1.attempts>=2;});
    var cats=[
      {label:'Inactive 14+ days',count:inactive14.length,color:'#f59e0b',icon:'fa-clock',list:inactive14},
      {label:'Missing modules (2+ wks)',count:missingMod.length,color:'#ef4444',icon:'fa-circle-minus',list:missingMod},
      {label:'Failing assessments',count:failing.length,color:'#dc2626',icon:'fa-xmark-circle',list:failing},
      {label:'On 2nd attempt',count:second.length,color:'#8b5cf6',icon:'fa-rotate',list:second}
    ];
    rbd.innerHTML='<div class="risk-grid">'+cats.map(function(cat){
      var chips=cat.list.slice(0,3).map(function(s){return '<span class="risk-chip">'+initialsOf(s)+'</span>';}).join('');
      if(cat.count>3)chips+='<span class="risk-chip risk-chip-more">+' +(cat.count-3)+'</span>';
      return '<div class="risk-cat"><div class="risk-cat-top"><span class="risk-icon" style="background:'+cat.color+'1a;color:'+cat.color+'"><i class="fas '+cat.icon+'"></i></span>'
        +'<div><div class="risk-cat-n">'+cat.count+'</div><div class="risk-cat-l">'+cat.label+'</div></div></div>'
        +'<div class="risk-chips">'+(cat.count>0?chips:'<span style="font-size:.7rem;color:var(--ink-4)">All clear</span>')+'</div></div>';
    }).join('')+'</div>';
  }

  var astat=document.getElementById('anaAssessStats');
  if(astat){
    var assessed=students.filter(function(s){return s._a1&&s._a1.submitted;});
    var passed=assessed.filter(function(s){return s._a1.passed||(s._a1.score||0)>=70;}).length;
    var avgScore=assessed.length?Math.round(assessed.reduce(function(a,s){return a+(s._a1.score||0);},0)/assessed.length):0;
    astat.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">'
      +'<div class="stat-block" style="flex-direction:column;align-items:flex-start;gap:.15rem"><i class="fas fa-check-circle" style="color:#00b96b"></i><div class="sb-num">'+passed+'</div><div class="sb-lbl">Passed</div></div>'
      +'<div class="stat-block" style="flex-direction:column;align-items:flex-start;gap:.15rem"><i class="fas fa-xmark-circle" style="color:#ff6b6b"></i><div class="sb-num">'+(assessed.length-passed)+'</div><div class="sb-lbl">Failed</div></div>'
      +'<div class="stat-block" style="flex-direction:column;align-items:flex-start;gap:.15rem"><i class="fas fa-hourglass" style="color:#f59e0b"></i><div class="sb-num">'+(total-assessed.length)+'</div><div class="sb-lbl">Not Started</div></div>'
      +'<div class="stat-block" style="flex-direction:column;align-items:flex-start;gap:.15rem"><i class="fas fa-star" style="color:#6c3bff"></i><div class="sb-num">'+avgScore+'%</div><div class="sb-lbl">Avg Score</div></div>'
      +'</div>';
  }
}

/* ==================== SM MANAGEMENT ==================== */
function getSMs(){
  try{return JSON.parse(localStorage.getItem(MATLA_SMS_KEY)||"[]");}catch(e){return [];}
}
function saveSMs(list){localStorage.setItem(MATLA_SMS_KEY,JSON.stringify(list));}
function openAddSMModal(){
  ["smFullName","smTeamName","smEmail","smPhone"].forEach(function(id){
    var el=document.getElementById(id);if(el)el.value="";
  });
  var m=document.getElementById("addSMModal");
  if(m){m.classList.remove("hidden");m.style.display="flex";}
}
function closeAddSMModal(){
  var m=document.getElementById("addSMModal");
  if(m){m.classList.add("hidden");m.style.display="none";}
}
function saveNewSM(){
  var name=(document.getElementById("smFullName")||{}).value||"";
  var team=(document.getElementById("smTeamName")||{}).value||"";
  var email=(document.getElementById("smEmail")||{}).value||"";
  var phone=(document.getElementById("smPhone")||{}).value||"";
  name=name.trim();team=team.trim();email=email.trim();phone=phone.trim();
  if(!name||!team||!email){alert("Full Name, Team Name and Email are required.");return;}
  var sms=getSMs();
  sms.push({id:crypto.randomUUID(),name:name,teamName:team,email:email,phone:phone,createdAt:new Date().toISOString()});
  saveSMs(sms);closeAddSMModal();renderSMManagement();
  pushFeed({type:"sm_added",msg:"New SM: "+name});
}
function removeSM(id){
  var sms=getSMs(),sm=sms.find(function(s){return s.id===id;});
  if(!sm)return;
  var users=MatlaDB.getAll();
  var n=users.filter(function(u){return u.manager===sm.name;}).length;
  if(!confirm("Remove "+sm.name+"? "+n+" student(s) will be unassigned."))return;
  users.forEach(function(u){if(u.manager===sm.name){u.manager="Unassigned";MatlaDB.upsert(u);}});
  saveSMs(sms.filter(function(s){return s.id!==id;}));
  renderSMManagement();
}
function renderSMManagement(){
  var sms=getSMs(),users=MatlaDB.getAll(),tbody=document.getElementById("smTableBody");
  if(!tbody)return;
  if(!sms.length){tbody.innerHTML="<tr><td colspan=6 style=padding:2rem;text-align:center>No Sales Managers yet.</td></tr>";return;}
  var html="";
  sms.forEach(function(sm){
    var cnt=users.filter(function(u){return u.manager===sm.name;}).length;
    html+="<tr><td><b>"+sm.teamName+"</b></td><td>"+sm.name+"</td><td>"+sm.email+"</td><td>"+(sm.phone||"-")+"</td><td>"+cnt+"</td>"
      +"<td><button class=btn-del-sm data-id="+JSON.stringify(sm.id)+"><i class=fas fa-trash></i> Remove</button></td></tr>";
  });
  tbody.innerHTML=html;
  tbody.querySelectorAll(".btn-del-sm").forEach(function(b){b.addEventListener("click",function(){removeSM(this.dataset.id);});});
}

/* ==================== LIVE STREAM ==================== */
function getLiveStream(){
  try{return JSON.parse(localStorage.getItem(MATLA_LIVE_STREAM_KEY)||"null");}catch(e){return null;}
}
function toEmbedUrl(url){
  var m=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if(m)return "https://www.youtube.com/embed/"+m[1]+"?autoplay=1";
  return url;
}
function goLive(){
  var title=(document.getElementById("streamTitle")||{}).value||"";
  var rawUrl=(document.getElementById("streamUrl")||{}).value||"";
  title=title.trim();rawUrl=rawUrl.trim();
  if(!title||!rawUrl){alert("Please enter a title and stream URL.");return;}
  var s={active:true,url:toEmbedUrl(rawUrl),rawUrl:rawUrl,title:title,startedAt:new Date().toISOString()};
  localStorage.setItem(MATLA_LIVE_STREAM_KEY,JSON.stringify(s));
  var bc=new BroadcastChannel("matla-academy");bc.postMessage({type:"stream_start",stream:s});bc.close();
  renderLiveStreamAdmin();
  pushFeed({type:"stream_start",msg:"Live: "+title});
}
function endStream(){
  var s=getLiveStream()||{};s.active=false;
  localStorage.setItem(MATLA_LIVE_STREAM_KEY,JSON.stringify(s));
  var bc=new BroadcastChannel("matla-academy");bc.postMessage({type:"stream_end"});bc.close();
  renderLiveStreamAdmin();
}
function renderLiveStreamAdmin(){
  var s=getLiveStream(),live=!!(s&&s.active);
  var goBtn=document.getElementById("goLiveBtn"),endBtn=document.getElementById("endStreamBtn");
  var badge=document.getElementById("liveStatusBadge"),ind=document.getElementById("liveIndicator");
  if(goBtn)goBtn.style.display=live?"none":"";
  if(endBtn)endBtn.style.display=live?"":"none";
  if(badge)badge.style.display=live?"flex":"none";
  if(ind)ind.classList.toggle("hidden",!live);
  if(live&&s.title){
    var t=document.getElementById("streamTitle"),u=document.getElementById("streamUrl");
    if(t)t.value=s.title;if(u)u.value=s.rawUrl||s.url;
  }
}

/* ==================== ANNOUNCEMENTS ==================== */
function getAnnouncements(){
  try{return JSON.parse(localStorage.getItem(MATLA_ANNOUNCEMENTS_KEY)||"[]");}catch(e){return [];}
}
function saveAnnouncements(list){localStorage.setItem(MATLA_ANNOUNCEMENTS_KEY,JSON.stringify(list));}
function getSelectedAudience(){
  var a=document.querySelector(".audience-pill.on");
  return a?(a.dataset.aud||"all"):"all";
}
function sendAnnouncement(){
  var subj=(document.getElementById("announceSubject")||{}).value||"";
  var body=(document.getElementById("announceBody")||{}).value||"";
  subj=subj.trim();body=body.trim();
  if(!subj||!body){alert("Subject and message are required.");return;}
  var sess=MatlaDB.getAdminSession();
  var ann={id:crypto.randomUUID(),subject:subj,body:body,audience:getSelectedAudience(),
    sentAt:new Date().toISOString(),sentBy:sess?sess.email:"admin",readBy:[]};
  var list=getAnnouncements();list.unshift(ann);saveAnnouncements(list);
  var bc=new BroadcastChannel("matla-academy");bc.postMessage({type:"announcement",id:ann.id});bc.close();
  clearAnnounce();renderAnnouncements();
  pushFeed({type:"announcement",msg:"Announcement: "+subj});
  alert("Announcement sent!");
}
function clearAnnounce(){
  var s=document.getElementById("announceSubject");if(s)s.value="";
  var b=document.getElementById("announceBody");if(b)b.value="";
  updateAnnouncePreview();
}
function updateAnnouncePreview(){
  var subj=(document.getElementById("announceSubject")||{}).value||"";
  var body=(document.getElementById("announceBody")||{}).value||"";
  var pt=document.getElementById("previewTitle"),pb=document.getElementById("previewBody");
  if(pt)pt.textContent=subj||"Your subject line will appear here";
  if(pb)pb.textContent=body||"Your message body will appear here.";
}
function renderAnnouncements(){
  var list=getAnnouncements(),el=document.getElementById("sentList"),ct=document.getElementById("announceCount");
  if(ct)ct.textContent=list.length+" sent";
  if(!el)return;
  if(!list.length){el.innerHTML="<div class=empty style=padding:2rem><p>No announcements yet</p></div>";return;}
  var html="";
  list.forEach(function(a){
    var d=new Date(a.sentAt),aud=a.audience==="all"?"All Students":a.audience;
    html+="<div style=padding:1rem 1.2rem;border-bottom:1px solid var(--border)>"
      +"<div style=display:flex;justify-content:space-between;margin-bottom:.3rem>"
      +"<b>"+a.subject+"</b><span style=font-size:.72rem;color:var(--ink-3)>"+a.readBy.length+" read</span></div>"
      +"<div style=font-size:.78rem;color:var(--ink-3)>"+aud+" - "+d.toLocaleString()+"</div>"
      +"<div style=margin-top:.3rem;font-size:.82rem>"+a.body.substring(0,120)+"</div></div>";
  });
  el.innerHTML=html;
}
function exportAnalyticsPDF(){window.print();}

/* ==================== LIVE STREAM ENHANCED ==================== */
var _liveTimerInterval = null;

function detectPlatform(){
  var url = (document.getElementById("streamUrl") || {}).value || "";
  var pd = document.getElementById("platformDetect");
  if (!pd) return;
  url = url.trim();
  if (!url) { pd.style.display = "none"; return; }
  var icon, name, color;
  if (/youtube\.com|youtu\.be/.test(url)) {
    icon = "fa-brands fa-youtube"; name = "YouTube Live detected — will auto-embed"; color = "#dc2626";
  } else if (/zoom\.us/.test(url)) {
    icon = "fa-solid fa-video"; name = "Zoom link detected"; color = "#2563eb";
  } else if (/teams\.microsoft\.com/.test(url)) {
    icon = "fa-brands fa-microsoft"; name = "Teams link detected"; color = "#6366f1";
  } else if (/meet\.google\.com/.test(url)) {
    icon = "fa-brands fa-google"; name = "Google Meet detected"; color = "#16a34a";
  } else {
    icon = "fa-solid fa-link"; name = "Custom URL"; color = "#64748b";
  }
  pd.style.display = "flex";
  pd.style.color = color;
  while (pd.firstChild) pd.removeChild(pd.firstChild);
  var ic = document.createElement("i");
  ic.className = icon;
  pd.appendChild(ic);
  pd.appendChild(document.createTextNode(" " + name));
}

function updateStreamPreview(){
  var title = (document.getElementById("streamTitle") || {}).value || "";
  var desc = (document.getElementById("streamDesc") || {}).value || "";
  var url = (document.getElementById("streamUrl") || {}).value || "";
  var box = document.getElementById("streamPreviewBox");
  var meta = document.getElementById("streamPreviewMeta");
  var ptitle = document.getElementById("streamPreviewTitle");
  var pdesc = document.getElementById("streamPreviewDesc");
  if (!box) return;
  url = url.trim();
  if (url) {
    var embedUrl = toEmbedUrl(url);
    if (embedUrl !== url) {
      while (box.firstChild) box.removeChild(box.firstChild);
      var iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.style.cssText = "width:100%;height:100%;border:none";
      iframe.allow = "autoplay;encrypted-media";
      iframe.allowFullscreen = true;
      box.appendChild(iframe);
    } else {
      box.textContent = "Preview not available for this URL — students will open in a new tab";
    }
  } else {
    box.textContent = "Enter a URL above to preview";
  }
  if (meta && ptitle && pdesc) {
    if (title || desc) {
      meta.style.display = "";
      ptitle.textContent = title || "Untitled Stream";
      pdesc.textContent = desc || "";
    } else {
      meta.style.display = "none";
    }
  }
}

function _formatDuration(seconds){
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  if (h > 0) return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function startLiveTimer(startedAt){
  if (_liveTimerInterval) clearInterval(_liveTimerInterval);
  var start = new Date(startedAt).getTime();
  function tick(){
    var elapsed = Math.floor((Date.now() - start) / 1000);
    var fmt = _formatDuration(elapsed);
    var el = document.getElementById("liveTimer");
    var dur = document.getElementById("liveDuration");
    if (el) el.textContent = fmt;
    if (dur) dur.textContent = fmt;
  }
  tick();
  _liveTimerInterval = setInterval(tick, 1000);
}

function updateStudentCount(){
  var el = document.getElementById("studentCount");
  if (!el) return;
  try {
    var users = MatlaDB.getUsers ? MatlaDB.getUsers() : [];
    var now = Date.now();
    var active = users.filter(function(u){
      if (!u.lastSeen) return false;
      return (now - new Date(u.lastSeen).getTime()) < 10 * 60 * 1000;
    }).length;
    el.textContent = active > 0 ? String(active) : "0";
  } catch(e) { el.textContent = "0"; }
}

function copyStreamUrl(){
  var s = getLiveStream();
  if (!s || !s.rawUrl) { alert("No active stream URL to copy."); return; }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(s.rawUrl).then(function(){ alert("Stream URL copied!"); });
  } else {
    var ta = document.createElement("textarea");
    ta.value = s.rawUrl;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    alert("Stream URL copied!");
  }
}

function clearStreamHistory(){
  if (!confirm("Clear all stream history?")) return;
  localStorage.removeItem("matla_stream_history");
  renderStreamHistory();
}
