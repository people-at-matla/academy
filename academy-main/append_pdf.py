
js = """
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

function _buildSvgBanner(){
  var d=new Date().toLocaleDateString('en-ZA',{year:'numeric',month:'long',day:'numeric'});
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160" viewBox="0 0 800 160">';
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
  svg+='<text x="40" y="110" font-family="Arial,sans-serif" font-size="13" fill="rgba(255,255,255,0.65)">Empowering the next generation of tech professionals</text>';
  svg+='<text x="40" y="135" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.4)">Exported: '+d+'</text>';
  svg+='</svg>';
  return svg;
}

function _pdfCss(size){
  return '@page{size:'+size+';margin:1.5cm}'
    +'*{box-sizing:border-box;margin:0;padding:0}'
    +'body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#1a1a2e;background:#fff}'
    +'.banner{width:100%;border-radius:8px;overflow:hidden;margin-bottom:1.5rem}'
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

function doExportPdf(){
  closePdfModal();
  var students=loadStudents();
  var grads=getGraduates();
  var size=_pdfSize||'A4';
  var type=_pdfType||'register';

  var bannerDataUrl='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(_buildSvgBanner())));
  var bodyContent='';
  var title='Matla Academy Report';

  if(type==='register'||type==='students'){
    title='Student Register';
    var rows=students.map(function(s,i){
      var prog=Math.round(courseProgress(s));
      var sc=statusFor(s)==='Active'?'#00b96b':statusFor(s)==='At Risk'?'#ff6b6b':'#888';
      return '<tr><td>'+(i+1)+'</td><td>'+fullName(s)+'</td><td>'+s.email+'</td>'
        +'<td><span class="badge" style="background:'+sc+'">'+statusFor(s)+'</span></td>'
        +'<td>'+(s.course||'&mdash;')+'</td>'
        +'<td><div class="prog-bar"><div class="prog-fill" style="width:'+prog+'%"></div></div> '+prog+'%</td>'
        +'<td>'+(s.xp||0)+'</td>'
        +'<td>'+(s.lastSeen?new Date(s.lastSeen).toLocaleDateString():'&mdash;')+'</td></tr>';
    }).join('');
    bodyContent='<table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Status</th><th>Course</th><th>Progress</th><th>XP</th><th>Last Seen</th></tr></thead><tbody>'+rows+'</tbody></table>';

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
    title='Student Profile \u2014 '+fullName(st);
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
    +'<div class="banner"><img src="'+bannerDataUrl+'" alt="Matla Academy Banner"></div>'
    +'<div class="doc-title">'+title+'</div>'
    +'<div class="doc-sub">Matla Academy &nbsp;|&nbsp; Generated: '+new Date().toLocaleString()+'</div>'
    +bodyContent
    +'<script>'+pscript+'<\\/script>'
    +'</body></html>';

  var blob=new Blob([fullHtml],{type:'text/html;charset=utf-8'});
  var blobUrl=URL.createObjectURL(blob);
  var win=window.open(blobUrl,'_blank');
  if(!win)toast('Please allow popups to export PDF');
  else{
    toast('PDF ready \u2014 print dialog will open');
    addNotif('PDF generated \u2014 '+title,'fa-file-pdf');
  }
  setTimeout(function(){URL.revokeObjectURL(blobUrl);},30000);
}
"""

with open(r'c:\\Users\\nkulu\\Downloads\\academy-main\\academy-main\\admin-script.js', 'a', encoding='utf-8') as f:
    f.write(js)
print('PDF functions appended OK')
