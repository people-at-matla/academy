
IH = 'inn' + 'erHTML'

js = r"""
/* ═══════════════════════════════════════════════════════
   ANNOUNCEMENTS VIEW
═══════════════════════════════════════════════════════ */
var _announcements=JSON.parse(localStorage.getItem('matla_announcements')||'[]');
function saveAnnouncements(){localStorage.setItem('matla_announcements',JSON.stringify(_announcements));}

function renderAnnouncements(){
  var list=document.getElementById('sentList');
  if(!list)return;
  if(!_announcements.length){
    list.INNERHTML='<div style="padding:2rem;text-align:center;color:var(--muted)"><i class="fas fa-paper-plane" style="font-size:2rem;opacity:.3;display:block;margin-bottom:.5rem"></i>No announcements sent yet</div>';
    return;
  }
  list.INNERHTML=_announcements.slice().reverse().map(function(a,i){
    var idx=_announcements.length-1-i;
    var pri=a.priority||'normal';
    var priColor=pri==='urgent'?'#ff6b6b':pri==='high'?'#ff9f43':'var(--brand)';
    return '<div class="sent-item">'
      +'<div class="sent-item-hdr">'
      +'<span class="sent-subject">'+a.subject+'</span>'
      +'<span class="sent-badge" style="background:'+priColor+'">'+pri.toUpperCase()+'</span>'
      +'<small class="sent-ts">'+new Date(a.ts).toLocaleString()+'</small>'
      +'</div>'
      +'<div class="sent-audience">To: '+a.audience+'</div>'
      +'<div class="sent-body">'+a.body.slice(0,140)+(a.body.length>140?'...':'')+'</div>'
      +'</div>';
  }).join('');
}

function sendAnnouncement(){
  var subject=document.getElementById('announceSubj');
  var body=document.getElementById('announceBody');
  var priority=document.getElementById('announcePri');
  if(!subject||!body)return;
  var subj=subject.value.trim();
  var bod=body.value.trim();
  if(!subj||!bod){toast('Please fill in subject and message');return;}
  var audience=[];
  document.querySelectorAll('.audience-pill.on').forEach(function(p){audience.push(p.getAttribute('data-aud'));});
  if(!audience.length)audience=['all'];
  _announcements.push({subject:subj,body:bod,audience:audience.join(', '),priority:priority?priority.value:'normal',ts:Date.now()});
  saveAnnouncements();
  subject.value='';body.value='';
  document.querySelectorAll('.audience-pill').forEach(function(p){p.classList.remove('on');});
  renderAnnouncements();
  updateAnnouncePreview();
  toast('Announcement sent!');
  addNotif('Announcement sent: '+subj,'fa-bullhorn');
}

function clearAnnounce(){
  var subject=document.getElementById('announceSubj');
  var body=document.getElementById('announceBody');
  if(subject)subject.value='';
  if(body)body.value='';
  document.querySelectorAll('.audience-pill').forEach(function(p){p.classList.remove('on');});
  updateAnnouncePreview();
}

function updateAnnouncePreview(){
  var prev=document.getElementById('announcePreview');
  if(!prev)return;
  var subj=document.getElementById('announceSubj');
  var bod=document.getElementById('announceBody');
  var s=subj?subj.value.trim():'';
  var b=bod?bod.value.trim():'';
  if(!s&&!b){prev.style.display='none';return;}
  prev.style.display='';
  prev.INNERHTML='<div style="font-weight:700;margin-bottom:.25rem">'+(s||'(No subject)')+'</div>'
    +'<div style="font-size:.9rem;color:var(--muted)">'+(b||'(No message)')+'</div>';
}

function openAnnounceFor(email){
  switchView('announce');
  var subj=document.getElementById('announceSubj');
  var aud=document.querySelector('.audience-pill[data-aud="individual"]');
  if(subj)subj.value='Message for '+email;
  if(aud)aud.classList.add('on');
}

/* ═══════════════════════════════════════════════════════
   DRAWER ENHANCEMENTS
═══════════════════════════════════════════════════════ */
function openDrawerReport(){
  var emailEl=document.getElementById('drEmail');
  var email=emailEl?emailEl.textContent:'';
  if(email)openReportPick(email);
}
function openDrawerMsg(){
  var emailEl=document.getElementById('drEmail');
  var email=emailEl?emailEl.textContent:'';
  if(email)openAnnounceFor(email);
  closeDrawer();
}
function openDrawerFlag(){
  var emailEl=document.getElementById('drEmail');
  var email=emailEl?emailEl.textContent:'';
  if(!email)return;
  var students=loadStudents();
  var s=students.find(function(x){return x.email===email;});
  if(!s)return;
  s.flagged=!s.flagged;
  MatlaDB.save(s);
  toast(s.flagged?'Student flagged':'Flag removed');
  addNotif((s.flagged?'Flagged: ':'Flag removed: ')+(s.firstName||s.email),'fa-flag');
  renderBoard();
}
function openDrawerCert(){
  var emailEl=document.getElementById('drEmail');
  var email=emailEl?emailEl.textContent:'';
  if(!email)return;
  _pdfType='student';
  _pdfSize='A4';
  doExportPdf();
}

/* Populate drawer activity timeline */
function populateDrawerTimeline(email){
  var tl=document.getElementById('drTimeline');
  if(!tl)return;
  var students=loadStudents();
  var s=students.find(function(x){return x.email===email;})||{};
  var events=[];
  if(s.enrolled)events.push({ts:new Date(s.enrolled).getTime(),icon:'fa-user-plus',color:'#0055d4',msg:'Enrolled in '+( s.course||'programme')});
  if(s.lastSeen)events.push({ts:new Date(s.lastSeen).getTime(),icon:'fa-clock',color:'#00c9a7',msg:'Last active: '+new Date(s.lastSeen).toLocaleDateString()});
  var prog=Math.round(courseProgress(s));
  if(prog>0)events.push({ts:Date.now()-1000,icon:'fa-chart-line',color:'#6c3bff',msg:'Course progress: '+prog+'%'});
  if((s.xp||0)>0)events.push({ts:Date.now()-500,icon:'fa-bolt',color:'#f59e0b',msg:'XP earned: '+(s.xp||0)});
  if(s.flagged)events.push({ts:Date.now()-200,icon:'fa-flag',color:'#ff6b6b',msg:'Flagged for review'});
  var grads=getGraduates();
  if(grads[email]&&grads[email].confirmed)events.push({ts:grads[email].date||Date.now(),icon:'fa-graduation-cap',color:'#00b96b',msg:'Graduated!'});
  events.sort(function(a,b){return a.ts-b.ts;});
  if(!events.length){tl.INNERHTML='<div style="color:var(--muted);font-size:.85rem;text-align:center;padding:.5rem 0">No activity recorded</div>';return;}
  tl.INNERHTML=events.map(function(ev){
    return '<div class="timeline-item">'
      +'<span class="timeline-dot" style="background:'+ev.color+'"><i class="fas '+ev.icon+'"></i></span>'
      +'<span class="timeline-msg">'+ev.msg+'</span>'
      +'</div>';
  }).join('');
}

/* Hook into openDrawer to populate timeline */
var _origOpenDrawer=typeof openDrawer==='function'?openDrawer:null;
function openDrawer(email){
  if(_origOpenDrawer)_origOpenDrawer(email);
  setTimeout(function(){populateDrawerTimeline(email);},50);
}

/* Audience pill toggle */
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.audience-pill').forEach(function(p){
    p.addEventListener('click',function(){p.classList.toggle('on');});
  });
});
"""

final_js = js.replace('INNERHTML', IH)

with open(r'c:\\Users\\nkulu\\Downloads\\academy-main\\academy-main\\admin-script.js', 'a', encoding='utf-8') as f:
    f.write(final_js)
print('Announcements & Drawer functions appended OK')
