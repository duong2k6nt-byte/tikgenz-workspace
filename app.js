// TikgenzApp v2.2 - TrustedTypes Fix

// Fix TrustedTypes CSP (GitHub Pages / Chrome security)
if (typeof trustedTypes !== 'undefined' && trustedTypes.createPolicy) {
  try {
    trustedTypes.createPolicy('default', {
      createHTML: function(s) { return s; },
      createScript: function(s) { return s; },
      createScriptURL: function(s) { return s; }
    });
  } catch(e) { /* policy may already exist */ }
}

// ============================
// APP INITIALIZATION (DOMContentLoaded)
// ============================
document.addEventListener('DOMContentLoaded', function() {
  try {
    initData();
  } catch(e) { console.error('[TG] initData failed:', e); }

  try {
    var cu = getCurrentUser();

    if(cu){
      var loginPage = document.getElementById('loginPage');
      var appPage = document.getElementById('appPage');
      if(loginPage) loginPage.classList.add('hidden');
      if(appPage) appPage.classList.remove('hidden');
      updateTopbar();
      updateBadges();
      updateLogo();
      renderProjects();
      navigate('dashboard');
    } else {
      var loginPage2 = document.getElementById('loginPage');
      var appPage2 = document.getElementById('appPage');
      if(loginPage2) loginPage2.classList.remove('hidden');
      if(appPage2) appPage2.classList.add('hidden');

      try{
        var rem = JSON.parse(localStorage.getItem('tg_remember') || 'null');
        if(rem){
          setTimeout(function(){
            var uEl = document.getElementById('loginUsername');
            var pEl = document.getElementById('loginPassword');
            var cbEl = document.getElementById('rememberMe');
            if(uEl) uEl.value = rem.u;
            if(pEl) pEl.value = rem.p;
            if(cbEl) cbEl.checked = true;
          }, 100);
        }
      } catch(e2){}
    }
  } catch(e) { console.error('[TG] initApp failed:', e); }
});

var editId = null, taskImages = [];

function canManageProjects(role){return role==='admin'||role==='manager';}
function handleSearch(q){
  q=(q||'').trim().toLowerCase();
  if(!q){navigate(window._currentView||'dashboard');return;}
  var el=document.getElementById('view-tasks');
  var tasks=getTasks().filter(function(t){return t.title.toLowerCase().indexOf(q)>=0||(t.desc&&t.desc.toLowerCase().indexOf(q)>=0);});
  document.querySelectorAll('.view').forEach(function(x){x.classList.add('hidden');});
  if(el)el.classList.remove('hidden');
  document.getElementById('pageTitle').textContent='Tìm: '+q+' ('+tasks.length+')';
  var cu=getCurrentUser();
  el.innerHTML='<div class="table-header"><h2>Kết quả tìm kiếm: "'+q+'" ('+tasks.length+')</h2></div>'
    +'<table class="task-table"><thead><tr><th>Tiêu đề</th><th>Dự án</th><th>Trạng thái</th><th>Ưu tiên</th><th>Deadline</th><th>Giao cho</th></tr></thead><tbody>'
    +tasks.map(function(t){
      var p=getProjects().find(function(x){return x.id===t.project;});
      var u=t.assignees?t.assignees.map(function(aid){var x=getUserById(aid);return x?x.name:''}).filter(Boolean).join(', '):''
      return'<tr><td data-tid="'+t.id+'" onclick="openDetail(this.dataset.tid)" style="cursor:pointer">'+(t.done?'<s>':'')+t.title+(t.done?'</s>':'')+'</td>'
        +'<td>'+(p?'<span class="task-tag" style="background:'+p.color+'">'+p.name+'</span>':'')+'</td>'
        +'<td>'+(t.status==='todo'?'Cần làm':t.status==='doing'?'Đang làm':t.status==='review'?'Chờ duyệt':'Hoàn thành')+'</td>'
        +'<td><span class="priority-badge '+t.priority+'">'+(t.priority==='high'?'🔴 Khẩn':t.priority==='medium'?'🟡 TB':'🟢 Thấp')+'</span></td>'
        +'<td>'+(t.deadline?formatDate(t.deadline):'')+'</td>'
        +'<td>'+u+'</td>'
        +'</tr>';
    }).join('')+'</tbody></table>';
}
function _gp(el){navigate('proj_'+el.dataset.pid);}
function _at(el){openAddTask(el.dataset.status||'todo',el.dataset.proj||null);}
function _td(el){event.stopPropagation();toggleDone(el.dataset.tid);}
function _dt(el){event.stopPropagation();delTask(el.dataset.tid);}
function _od(el){openDetail(el.dataset.tid);}
function _om(el){openMember(el.dataset.uid);}
function _cr(el){changeRole(el.dataset.uid,el.dataset.role);}
function _rm(el){removeMember(el.dataset.uid);}
function _am(el){approveMember(el.dataset.uid);}
function _xm(el){rejectMember(el.dataset.uid);}

function gid(i){return document.getElementById(i)}
function showToast(msg,typ){var t=gid('toast');t.textContent=msg;t.className='toast '+(typ||'');t.classList.remove('hidden');setTimeout(function(){t.classList.add('hidden')},3000);}
function showLogin(){gid('registerForm').classList.add('hidden');gid('loginForm').classList.remove('hidden');}
function showRegister(){gid('loginForm').classList.add('hidden');gid('registerForm').classList.remove('hidden');}

function togglePassword(inputId, btnId){
  var inp=document.getElementById(inputId);
  var btn=document.getElementById(btnId);
  if(inp.type==='password'){
    inp.type='text';
    if(btn)btn.textContent='🙈';
  } else {
    inp.type='password';
    if(btn)btn.textContent='👁️';
  }
}
function handleLogin(){
  try {
  var u=gid('loginUsername').value.trim(),p=gid('loginPassword').value;
  var users=getUsers();
  var f=users.find(function(x){return x.username===u&&x.password===p&&x.approved;});
  if(!f){
    var errEl=gid('loginError');
    if(errEl){errEl.textContent='Sai tai khoan hoac mat khau ('+users.length+' users)';errEl.classList.remove('hidden');}
    return;
  }
  gid('loginError').classList.add('hidden');
  // Remember me
  var rem=gid('rememberMe');
  if(rem&&rem.checked){
    localStorage.setItem('tg_remember',JSON.stringify({u:u,p:p}));
  } else {
    localStorage.removeItem('tg_remember');
  }
  setCurrentUser(f.id);
  // Show dashboard directly without reload (avoid sessionStorage issues)
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('appPage').classList.remove('hidden');
  updateTopbar();
  updateBadges();
  updateLogo();
  renderProjects();
  navigate('dashboard');
  } catch(e){ console.error('[TG] Login error:',e); var errEl=gid('loginError'); if(errEl){errEl.textContent='Loi: '+e.message;errEl.classList.remove('hidden');} }
}
function handleRegister(){var n=gid('regName').value.trim(),u=gid('regUsername').value.trim(),p=gid('regPassword').value;if(!n||!u||!p){gid('regError').textContent='Dien day du thong tin';gid('regError').classList.remove('hidden');return;}if(getUsers().find(function(x){return x.username===u})){gid('regError').textContent='Username da ton tai';gid('regError').classList.remove('hidden');return;}var pending=getPending();pending.push({id:uid(),username:u,password:p,name:n,role:'staff',avatar:'',approved:false,joinDate:new Date().toISOString().slice(0,10)});savePending(pending);gid('regPending').classList.remove('hidden');gid('regError').classList.add('hidden');}
function handleLogout(){
  clearCurrentUser();
  document.getElementById('appPage').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('loginUsername').value='';
  document.getElementById('loginPassword').value='';
}
function toggleUserMenu(){gid('userDropdown').classList.toggle('hidden');}
function toggleNotifPanel(){gid('notifPanel').classList.toggle('hidden');renderNotifs();}
function clearNotifs(){clearNotifications();renderNotifs();}
function renderNotifs(){var n=getNotifications();gid('notifList').innerHTML=n.length?n.map(function(x){return'<div class=notif-item><div>'+x.msg+'</div><div class=notif-time>'+new Date(x.time).toLocaleString('vi-VN')+'</div></div>'}).join(''):'<div class=notif-empty>Khong co thong bao</div>';gid('notifCount').textContent=n.length;gid('notifCount').style.display=n.length?'flex':'none';}
function closeModalOnOverlay(e){if(e.target.id==='modalOverlay'){gid('modalOverlay').classList.add('hidden');document.querySelectorAll('.modal').forEach(function(m){m.classList.add('hidden')});}}
function closeModal(id){gid(id).classList.add('hidden');var any=Array.from(document.querySelectorAll('.modal')).some(function(m){return!m.classList.contains('hidden')});if(!any)gid('modalOverlay').classList.add('hidden');}
function triggerLogoUpload(){var cu=getCurrentUser();if(cu&&cu.role==='admin')gid('logoUploadInput').click();}
function handleLogoUpload(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){setLogo(ev.target.result);updateLogo();showToast('Cap nhat logo!','success');};r.readAsDataURL(f);}
function updateLogo(){var logo=getLogo();['loginLogo','sidebarLogo','topbarLogo'].forEach(function(id){var el=gid(id);if(!el)return;el.innerHTML=logo?'<img src="'+logo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">':'TG';});}
function updateTopbar(){var cu=getCurrentUser();if(!cu)return;gid('topbarName').textContent=cu.name;gid('topbarRole').textContent=ROLE_NAMES[cu.role]||cu.role;var av=gid('topbarAvatar');av.innerHTML=cu.avatar?'<img src="'+cu.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">':cu.name[0].toUpperCase();}
function updateBadges(){var tasks=getTasks(),pending=getPending(),cu=getCurrentUser();var b=gid('badge-tasks');if(b)b.textContent=tasks.filter(function(t){return!t.done}).length||'';var bm=gid('badge-mytasks');if(bm)bm.textContent=tasks.filter(function(t){return t.assignees&&t.assignees.includes(cu.id)&&!t.done}).length||'';var bd=gid('badge-deadline');if(bd){var cnt=tasks.filter(function(t){return t.deadline&&daysUntil(t.deadline)<=3&&!t.done}).length;bd.textContent=cnt||'';bd.style.display=cnt?'inline-flex':'none';}var bp=gid('badge-pending');if(bp){bp.textContent=pending.length||'';bp.style.display=pending.length?'inline-flex':'none';}}

function navigate(v){
  document.querySelectorAll('.view').forEach(function(x){x.classList.add('hidden')});
  document.querySelectorAll('.nav-item,.project-nav-item').forEach(function(x){x.classList.remove('active')});
  var el=document.getElementById('view-'+v);if(el)el.classList.remove('hidden');
  var nav=document.getElementById('nav-'+v);if(nav)nav.classList.add('active');
  var titles={dashboard:'Tổng quan',tasks:'Tất cả Task',mytasks:'Nhiệm vụ của tôi',done:'Hoàn thành',deadline:'Deadline',calendar:'Lịch & Thông báo',members:'Nhân sự',pending:'Chờ duyệt',profile:'Hồ sơ',groups:'Nhóm làm việc'};
  document.getElementById('pageTitle').textContent=titles[v]||'Dự án';
  window._currentView=v;
  if(v==='dashboard')renderDashboard();
  else if(v==='tasks')renderAllTasks();
  else if(v==='mytasks')renderMyTasks();
  else if(v==='done')renderDone();
  else if(v==='deadline')renderDeadline();
  else if(v==='members')renderMembers();
  else if(v==='pending')renderPending();
  else if(v==='profile')renderProfile();
  else if(v==='groups')renderGroups();
  else if(v==='calendar')renderCalendar();
  else if(v.startsWith('proj_'))renderProject(v.replace('proj_',''));
}
function renderProjects(){
  var cu=getCurrentUser(),el=document.getElementById('projectsList');
  var allTasks=getTasks();
  var html='';
  getProjects().forEach(function(p){
    var myProjTasks=allTasks.filter(function(t){return t.project===p.id&&t.assignees&&t.assignees.includes(cu.id)&&!t.done});
    var hasMine=myProjTasks.length>0;
    html+='<div class="project-nav-item" id="nav-proj_'+p.id+'" data-pid="'+p.id+'" onclick="_gp(this)">'
      +'<span class="project-dot" style="background:'+p.color+'"></span>'
      +p.name
      +(hasMine?'<span class="red-dot" title="'+myProjTasks.length+' nhiem vu cua ban"></span>':'')
      +(canManageProjects(cu.role)?'<span class="project-del" data-pid="'+p.id+'" onclick="event.stopPropagation();deleteProj(this.dataset.pid)">x</span>':'')
      +'</div>';
  });
  el.innerHTML=html;
  document.getElementById('btnAddProject').style.display=canManageProjects(cu.role)?'block':'none';
}
function deleteProj(id){deleteProject(id);renderProjects();showToast('Đã xóa dự án','success');}
function showAddProject(){
  document.getElementById('projectModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('projectColorPicker').innerHTML=['#7c3aed','#ef4444','#06b6d4','#f59e0b','#22c55e','#ec4899','#8b5cf6','#14b8a6'].map(function(c){
    return '<div class="color-dot-pick" style="background:'+c+'" data-color="'+c+'" onclick="selColor(this.dataset.color)"></div>';
  }).join('');
  window._col='#7c3aed';
}
function selColor(c){window._col=c;document.querySelectorAll('.color-dot-pick').forEach(function(d){d.classList.toggle('selected',d.style.background===c||d.style.backgroundColor===c);});}
function saveProject(){
  var name=document.getElementById('projectName').value.trim();
  if(!name)return;
  addProject({id:uid(),name:name,color:window._col||'#7c3aed',desc:document.getElementById('projectDesc').value});
  closeModal('projectModal');renderProjects();showToast('Đã thêm dự án: '+name,'success');
}
function buildCard(t){
  var proj=getProjects().find(function(p){return p.id===t.project});
  var rem=daysRemaining(t.deadline);
  var dlc=rem===null?'':rem<0?'overdue':rem<=3?'soon':'ok';
  var dlTxt=rem===null?'':(rem<0?'Quá hạn '+(Math.abs(rem))+'N':rem===0?'Hôm nay!':'Còn '+rem+'N');
  var users=getUsers();
  var cu=getCurrentUser();
  var isAssignee=t.assignees&&t.assignees.includes(cu.id);
  var assignHtml=t.assignees?t.assignees.map(function(aid){
    var u=users.find(function(x){return x.id===aid});
    return u?'<div class="mini-avatar" title="'+u.name+'">'+(u.avatar?'<img src="'+u.avatar+'">':u.name[0].toUpperCase())+'</div>':'';
  }).join(''):'';
  var imgHtml=t.images&&t.images[0]?'<img src="'+t.images[0]+'" class="task-card-img" alt="">':'';
  var pl=t.priority==='high'?'🔴 Khẩn cấp':t.priority==='medium'?'🟡 Trung bình':'🟢 Thấp';
  var canDel=canManageTasks(cu.role);
  // Checkbox/action button based on status and role
  var actionBtn='';
  if(t.done){
    actionBtn='<div class="task-checkbox checked" data-tid="'+t.id+'" onclick="event.stopPropagation();unDoneTask(this.dataset.tid)" title="Hủy hoàn thành"></div>';
  } else if(t.status==='doing'&&isAssignee){
    actionBtn='<div class="task-checkbox doing-check" data-tid="'+t.id+'" onclick="event.stopPropagation();openSubmitModal(this.dataset.tid)" title="Nộp kết quả để hoàn thành"></div>';
  } else if(t.status==='todo'&&isAssignee){
    actionBtn='<div class="task-checkbox" data-tid="'+t.id+'" onclick="event.stopPropagation();startTask(this.dataset.tid)" title="Bắt đầu làm việc này"></div>';
  } else {
    actionBtn='<div class="task-checkbox'+(t.done?' checked':'')+'" style="opacity:.4"></div>';
  }
  // Start button for todo tasks
  var startBtn='';
  if(t.status==='todo'&&isAssignee&&!t.done){
    startBtn='<button class="btn-start-task" data-tid="'+t.id+'" onclick="event.stopPropagation();startTask(this.dataset.tid)">▶ Bắt đầu</button>';
  } else if(t.status==='doing'&&isAssignee&&!t.done){
    startBtn='<button class="btn-submit-task" data-tid="'+t.id+'" onclick="event.stopPropagation();openSubmitModal(this.dataset.tid)">📤 Nộp kết quả</button>';
  }
  // Proof link if done
  var proofHtml='';
  if(t.done&&t.proofUrl){
    proofHtml='<div class="proof-link"><a href="'+t.proofUrl+'" target="_blank">🔗 Xem kết quả</a></div>';
  } else if(t.done&&t.proofImg){
    proofHtml='<div class="proof-link">📷 Có ảnh kết quả</div>';
  }
  return '<div class="task-card priority-'+t.priority+(t.done?' done-card':'')+'" data-tid="'+t.id+'" onclick="openDetail(this.dataset.tid)">'
    +'<div class="task-card-top">'
    +actionBtn
    +'<div class="task-card-title">'+t.title+'</div>'
    +(canDel?'<span class="task-card-del" data-tid="'+t.id+'" onclick="event.stopPropagation();delTask(this.dataset.tid)">✕</span>':'')
    +'</div>'
    +imgHtml
    +(proj?'<div class="task-tags"><span class="task-tag" style="background:'+proj.color+'">'+proj.name+'</span>'
    +'<span class="priority-badge '+t.priority+'">'+pl+'</span></div>':'')
    +startBtn
    +proofHtml
    +'<div class="task-card-meta">'
    +(t.deadline?'<span class="deadline-badge '+dlc+'">'+dlTxt+'</span>':'')
    +'<div class="task-assignees">'+assignHtml+'</div>'
    +'</div></div>';
}

function startTask(id){
  updateTask(id,{status:'doing'});
  addNotification('Đã bắt đầu task: '+getTasks().find(function(t){return t.id===id}).title);
  showToast('Đã chuyển sang Đang làm!','success');
  updateBadges();navigate('dashboard');
}
function unDoneTask(id){
  updateTask(id,{done:false,status:'doing',proofUrl:'',proofImg:''});
  showToast('Đã hủy hoàn thành','success');
  updateBadges();navigate('dashboard');
}
function openSubmitModal(id){
  var t=getTasks().find(function(x){return x.id===id});
  if(!t)return;
  document.getElementById('submitTaskId').value=id;
  document.getElementById('submitTaskName').textContent=t.title;
  document.getElementById('submitUrl').value=t.proofUrl||'';
  document.getElementById('submitImgPreview').innerHTML=t.proofImg?'<img src="'+t.proofImg+'" style="max-width:100%;max-height:200px;border-radius:8px">':'';
  window._submitImg=t.proofImg||'';
  document.getElementById('submitModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function handleSubmitImg(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    window._submitImg=ev.target.result;
    document.getElementById('submitImgPreview').innerHTML='<img src="'+ev.target.result+'" style="max-width:100%;border-radius:8px;margin-top:8px">';
  };
  r.readAsDataURL(f);
}
function saveSubmit(){
  var id=document.getElementById('submitTaskId').value;
  var url=document.getElementById('submitUrl').value.trim();
  var img=window._submitImg||'';
  if(!url&&!img){showToast('Cần nhập link hoặc upload ảnh kết quả!','error');return;}
  var t=getTasks().find(function(x){return x.id===id});
  updateTask(id,{status:'review',proofUrl:url,proofImg:img,submittedAt:new Date().toISOString()});
  addNotification('Có nhiệm vụ chờ nghiệm thu: '+(t?t.title:''));
  closeModal('submitModal');
  showToast('Đã nộp kết quả! Chờ admin nghiệm thu.','success');
  updateBadges();navigate('dashboard');
}

function switchKanbanTab(btn,pid){
  document.querySelectorAll('.kanban-tab').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  var tasks=getTasks();
  var filtered=pid==='all'?tasks.filter(function(t){return t.project!=='shared'}):tasks.filter(function(t){return t.project===pid});
  document.getElementById('kanbanBoard').innerHTML=buildKanban(filtered,pid==='all'?null:pid);
}

function renderSharedTasks(){
  var el=document.getElementById('sharedTasksSection');
  if(!el)return;
  var cu=getCurrentUser();
  var sharedTasks=getTasks().filter(function(t){return t.project==='shared'});
  var canEdit=canManageTasks(cu.role);
  var todo=sharedTasks.filter(function(t){return!t.done});
  var done=sharedTasks.filter(function(t){return t.done});
  var html='<div class="announce-card" style="border-color:var(--accent2)">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'
    +'<h3 style="color:var(--accent2);margin:0">📋 Nhiệm vụ chung</h3>'
    +(canEdit?'<button class="btn-primary sm" onclick="openAddSharedTask()">+ Thêm nhiệm vụ chung</button>':'')
    +'</div>'
    +(sharedTasks.length===0?'<p style="color:var(--text-muted);font-size:13px">Chưa có nhiệm vụ chung nào.</p>':'')
    +'<div style="display:grid;gap:8px">';
  todo.forEach(function(t){
    var assignees=t.assignees?t.assignees.map(function(aid){var u=getUserById(aid);return u?u.name:''}).filter(Boolean).join(', '):'Tất cả';
    var days=daysUntil(t.deadline);
    var dlc=days===null?'':days<0?'overdue':days<=3?'soon':'ok';
    html+='<div class="shared-task-item">'
      +'<div style="display:flex;align-items:center;gap:10px">'
      +(t.assignees&&t.assignees.includes(cu.id)?'<div class="task-checkbox" data-tid="'+t.id+'" onclick="startOrSubmitShared(this.dataset.tid)"></div>':'<div class="task-checkbox" style="opacity:.3"></div>')
      +'<span style="font-weight:600;flex:1">'+t.title+'</span>'
      +(t.deadline?'<span class="deadline-badge '+dlc+'">'+( days<0?'Qua han':days+'N')+'</span>':'')
      +'<span style="font-size:12px;color:var(--text-muted)">→ '+assignees+'</span>'
      +(canEdit?'<span data-tid="'+t.id+'" onclick="delTask(this.dataset.tid)" style="color:var(--danger);cursor:pointer;padding:2px 6px;font-size:14px" title="Xoa">✕</span>':'')
      +'</div>'
      +(t.desc?'<div style="font-size:12px;color:var(--text-muted);margin-left:32px">'+t.desc+'</div>':'')
      +'</div>';
  });
  if(done.length>0){
    html+='<div style="font-size:12px;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">Đã hoàn thành ('+done.length+'):</div>';
    done.forEach(function(t){
      html+='<div class="shared-task-item" style="opacity:.6"><div style="display:flex;align-items:center;gap:10px"><div class="task-checkbox checked"></div><s>'+t.title+'</s></div></div>';
    });
  }
  html+='</div></div>';
  el.innerHTML=html;
}

function openAddSharedTask(){
  taskImages=[];
  document.getElementById('taskImagesPreview').innerHTML='';
  document.getElementById('taskModalTitle').textContent='Thêm Nhiệm vụ chung';
  document.getElementById('taskModalError').classList.add('hidden');
  populateSelects();
  document.getElementById('taskProject').value='shared';
  document.getElementById('taskTitle').value='';
  document.getElementById('taskDesc').value='';
  document.getElementById('taskStatus').value='todo';
  document.getElementById('taskDeadline').value='';
  editId=null;
  document.getElementById('taskModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}



function previewSubmitImg(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    window._submitImg=ev.target.result;
    document.getElementById('submitImgPreview').innerHTML='<img src="'+ev.target.result+'" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid var(--border);margin-bottom:6px"><br><small style="color:var(--text-muted)">'+f.name+'</small>';
  };
  r.readAsDataURL(f);
}
function approveTask(id){
  var t=getTasks().find(function(x){return x.id===id});
  if(!t)return;
  updateTask(id,{done:true,status:'done',approvedAt:new Date().toISOString(),approvedBy:getCurrentUser().id});
  addNotification('Admin đã xác nhận hoàn thành: '+t.title);
  showToast('Đã xác nhận hoàn thành!','success');
  updateBadges();navigate('dashboard');
}
function rejectTask(id){
  var t=getTasks().find(function(x){return x.id===id});
  if(!t)return;
  updateTask(id,{status:'doing',proofUrl:'',proofImg:'',submittedAt:''});
  addNotification('Admin yêu cầu làm lại: '+t.title);
  showToast('Đã từ chối - yêu cầu làm lại','success');
  updateBadges();navigate('dashboard');
}

function startOrSubmitShared(id){
  var t=getTasks().find(function(x){return x.id===id});
  if(!t)return;
  if(t.status==='todo'){startTask(id);}
  else if(t.status==='doing'){openSubmitModal(id);}
}
function delTask(id){if(!canManageTasks(getCurrentUser().role)){showToast('Bạn không có quyền xóa task!','error');return;}
  deleteTask(id);
  showToast('Đã xóa task','success');
  updateBadges();
  navigate('dashboard');
}
function getAnnouncement(){return DB.get('announcement',{text:'',img:''});}
function saveAnnouncement(){
  var cu=getCurrentUser();
  if(!canManageTasks(cu.role)){showToast('Khong co quyen!','error');return;}
  var text=document.getElementById('announceTxt').value;
  var img=window._announceImg||getAnnouncement().img||'';
  DB.set('announcement',{text:text,img:img,by:cu.name,time:new Date().toISOString()});
  fbPush('announcement',{text:text,img:img,by:cu.name,time:new Date().toISOString()});
  showToast('Đã lưu thông báo!','success');
  renderAnnouncement();
}
function handleAnnounceImg(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    window._announceImg=ev.target.result;
    document.getElementById('announceImgPreview').innerHTML='<img src="'+ev.target.result+'" style="max-width:100%;border-radius:8px;margin-top:8px">';
  };
  r.readAsDataURL(f);
}
function renderAnnouncement(){
  var el=document.getElementById('announcementSection');
  if(!el)return;
  var cu=getCurrentUser();
  var ann=getAnnouncement();
  var canEdit=canManageTasks(cu.role);
  var html='<div class="announce-card">';
  if(canEdit){
    html+='<div class="announce-edit">'
      +'<textarea id="announceTxt" placeholder="Nhập thông báo, nội dung công việc chung..." rows="4" style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text);resize:vertical">'+( ann.text||'')+'</textarea>'
      +'<div style="display:flex;gap:10px;margin-top:8px;align-items:center">'
      +'<label class="btn-secondary" style="cursor:pointer;padding:8px 14px;font-size:13px">📷 Ảnh<input type="file" accept="image/*" class="hidden" onchange="handleAnnounceImg(event)"></label>'
      +'<button class="btn-primary" onclick="saveAnnouncement()">Lưu thông báo</button>'
      +(ann.by?'<span style="color:var(--text-muted);font-size:12px">Cập nhật bởi '+ann.by+'</span>':'')
      +'</div>'
      +'<div id="announceImgPreview">'+(ann.img?'<img src="'+ann.img+'" style="max-width:100%;border-radius:8px;margin-top:8px">':'')+'</div>'
      +'</div>';
  } else {
    if(ann.text||ann.img){
      html+='<div class="announce-view">';
      if(ann.text)html+='<p style="white-space:pre-wrap;font-size:15px">'+ann.text+'</p>';
      if(ann.img)html+='<img src="'+ann.img+'" style="max-width:100%;border-radius:8px;margin-top:12px">';
      if(ann.by)html+='<div style="color:var(--text-muted);font-size:12px;margin-top:8px">Cập nhật bởi: '+ann.by+'</div>';
      html+='</div>';
    } else {
      html+='<p style="color:var(--text-muted)">Chưa có thông báo nào.</p>';
    }
  }
  html+='</div>';
  el.innerHTML=html;
}

function renderDashboard(){
  var el=document.getElementById('view-dashboard'),cu=getCurrentUser();
  var tasks=getTasks();
  var doing=tasks.filter(function(t){return t.status==='doing'}).length;
  var done=tasks.filter(function(t){return t.done}).length;
  var urgent=tasks.filter(function(t){return t.deadline&&daysUntil(t.deadline)<=3&&!t.done}).length;
  var myTasks=tasks.filter(function(t){return t.assignees&&t.assignees.includes(cu.id)&&!t.done});
  var statHtml='<div class="stats-grid">'
    +'<div class="stat-card"><div class="stat-label">TỔNG TASK</div><div class="stat-val purple">'+tasks.length+'</div><div class="stat-sub">Tất cả dự án</div></div>'
    +'<div class="stat-card"><div class="stat-label">ĐANG LÀM</div><div class="stat-val cyan">'+doing+'</div><div class="stat-sub">Hôm nay</div></div>'
    +'<div class="stat-card"><div class="stat-label">HOÀN THÀNH</div><div class="stat-val green">'+done+'</div><div class="stat-sub">Tổng cộng</div></div>'
    +'<div class="stat-card"><div class="stat-label">SẮP DEADLINE</div><div class="stat-val red">'+urgent+'</div><div class="stat-sub">Cần xử lý gấp</div></div>'
    +'</div>';
  var myAlert=myTasks.length>0?'<div class="my-tasks-alert">📋 Bạn có <b>'+myTasks.length+' nhiệm vụ</b> chưa hoàn thành — <a data-view="mytasks" onclick="navigate(this.dataset.view)" style="color:var(--accent);cursor:pointer">Xem ngay</a></div>':'';
  var announceHtml='<div id="announcementSection" style="margin-bottom:20px"></div>';
  var sharedHtml='<div id="sharedTasksSection" style="margin-bottom:20px"></div>';
  // Role-based kanban
  var kanbanHtml='';
  if(cu.role==='admin'||cu.role==='manager'||cu.role==='leader'){
    // Full kanban with project tabs
    var projects=getProjects();
    var tabsHtml='<div class="kanban-header"><h2>Bảng Kanban</h2><div class="kanban-tabs">'
      +'<button class="kanban-tab active" id="ktab-all" data-pid="all" onclick="switchKanbanTab(this,this.dataset.pid)">Tất cả</button>'
      +projects.map(function(p){return'<button class="kanban-tab" id="ktab-'+p.id+'" data-pid="'+p.id+'" style="border-color:'+p.color+'" onclick="switchKanbanTab(this,this.dataset.pid)">'+p.name+'</button>'}).join('')
      +'</div></div>';
    kanbanHtml=tabsHtml+'<div id="kanbanBoard">'+buildKanban(tasks.filter(function(t){return t.project!=='shared'}))+'</div>';
  } else {
    // Staff: only see their project tasks (read-only kanban of their assigned tasks)
    kanbanHtml='<div class="section-title" style="font-size:16px">Nhiệm vụ được giao cho tôi</div>'+buildKanban(tasks.filter(function(t){return t.assignees&&t.assignees.includes(cu.id)}));
  }
  el.innerHTML=statHtml+myAlert+announceHtml+sharedHtml+kanbanHtml;
  renderAnnouncement();
  renderSharedTasks();
}
function renderProject(pid){
  var el=document.getElementById('view-project');
  document.querySelectorAll('.view').forEach(function(x){x.classList.add('hidden')});
  el.classList.remove('hidden');
  var proj=getProjects().find(function(p){return p.id===pid});
  document.getElementById('pageTitle').textContent=proj?proj.name:'Du an';
  var tasks=getTasks().filter(function(t){return t.project===pid});
  el.innerHTML='<div class="kanban-header"><h2>'+( proj?proj.name:'Du an')+'</h2><button class="btn-primary" data-proj="'+pid+'" data-status="todo" onclick="_at(this)">+ Them task</button></div>'+buildKanban(tasks);
}
function buildKanban(tasks,defaultProjId){
  var cu=getCurrentUser();
  var cols=[{k:'todo',l:'Cần làm',c:'#64748b'},{k:'doing',l:'Đang làm',c:'#f59e0b'},{k:'review',l:'Chờ nghiệm thu',c:'#a855f7'},{k:'done',l:'Hoàn thành',c:'#22c55e'}];
  var html='<div class="kanban-board">';
  cols.forEach(function(col){
    var ct=tasks.filter(function(t){return t.status===col.k});
    html+='<div class="kanban-col"><div class="col-header"><span class="col-dot" style="background:'+col.c+'"></span><span class="col-title">'+col.l+'</span><span class="col-count">'+ct.length+'</span></div>'
      +ct.map(function(t){
        var card=buildCard(t);
        if(col.k==='review'&&canManageTasks(cu.role)){
          card+='<div class="review-actions" data-tid="'+t.id+'">'
            +'<button class="btn-approve" data-tid="'+t.id+'" onclick="event.stopPropagation();approveTask(this.dataset.tid)">✅ Xác nhận</button>'
            +'<button class="btn-reject" data-tid="'+t.id+'" onclick="event.stopPropagation();rejectTask(this.dataset.tid)">&#x21a9; Làm lại</button>'
            +'</div>';
        }
        return card;
      }).join('');
    if(col.k==='todo'&&canManageTasks(cu.role)){
      var addData=defaultProjId?'data-proj="'+defaultProjId+'"':'';
      html+='<button class="col-add-btn" '+addData+' data-status="todo" onclick="_at(this)">+ Thêm task</button>';
    }
    html+='</div>';
  });
  return html+'</div>';
}

function toggleDone(id){var t=getTasks().find(function(x){return x.id===id});if(!t)return;if(!t.done&&t.status==='doing'){openSubmitModal(id);}else if(!t.done&&t.status==='todo'){startTask(id);}else{unDoneTask(id);}}
function openDetail(id){
  var t=getTasks().find(function(x){return x.id===id});if(!t)return;
  editId=id;
  var proj=getProjects().find(function(p){return p.id===t.project});
  var users=getUsers();
  var assignees=t.assignees?t.assignees.map(function(aid){var u=users.find(function(x){return x.id===aid});return u?u.name:''}).filter(Boolean).join(', '):'';
  var imgs=t.images&&t.images.length?t.images.map(function(src){return'<img src="'+src+'" style="width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">'}).join(' '):'';
  var priorityLabel=t.priority==='high'?'🔴 Khẩn cấp':t.priority==='medium'?'🟡 Trung bình':'🟢 Thấp';
  var dlStatus=getDeadlineStatus(t.deadline);
  var cu=getCurrentUser();
  var isAssignee=t.assignees&&t.assignees.includes(cu.id);
  var actionHtml='';
  if(t.status==='review'){
    // Waiting for admin approval - show submitted proof
    actionHtml='<div style="background:rgba(168,85,247,.1);border:2px solid #a855f7;border-radius:10px;padding:16px">'
      +'<div style="color:#a855f7;font-weight:700;font-size:15px;margin-bottom:12px">⏳ Đang chờ nghiệm thu</div>'
      +(t.proofUrl?'<div style="margin-bottom:10px"><b>🔗 Link kết quả:</b> <a href="'+t.proofUrl+'" target="_blank" style="color:var(--accent);word-break:break-all">'+t.proofUrl+'</a></div>':'')
      +(t.proofImg?'<div style="margin-bottom:12px"><b>🖼️ Ảnh kết quả:</b><br><img src="'+t.proofImg+'" style="max-width:100%;max-height:300px;border-radius:8px;margin-top:8px;border:1px solid var(--border)"></div>':'')
      +((!t.proofUrl&&!t.proofImg)?'<div style="color:var(--text-muted);font-size:13px">Chưa có bằng chứng nộp</div>':'')
      +(canManageTasks(cu.role)?'<div style="display:flex;gap:10px;margin-top:14px"><button class="btn-approve" data-tid="'+t.id+'" onclick="approveTask(this.dataset.tid);closeModal(\'taskDetailModal\')">✅ Xác nhận hoàn thành</button><button class="btn-reject" data-tid="'+t.id+'" onclick="rejectTask(this.dataset.tid);closeModal(\'taskDetailModal\')">↩ Yêu cầu làm lại</button></div>':'<div style="font-size:12px;color:var(--text-muted);margin-top:8px">Đang chờ Admin/Quản lý xác nhận...</div>')
      +'</div>';
  } else if(t.done){
    actionHtml='<div style="background:rgba(34,197,94,.1);border:1px solid var(--success);border-radius:8px;padding:14px">'
      +'<div style="color:var(--success);font-weight:700;font-size:15px;margin-bottom:8px">✅ Đã hoàn thành</div>'
      +(t.proofUrl?'<div style="margin-bottom:8px"><b>🔗 Link kết quả:</b> <a href="'+t.proofUrl+'" target="_blank" style="color:var(--accent);word-break:break-all">'+t.proofUrl+'</a></div>':'')
      +(t.proofImg?'<div style="margin-bottom:8px"><b>🖼️ Ảnh kết quả:</b><br><img src="'+t.proofImg+'" style="max-width:100%;max-height:300px;border-radius:8px;margin-top:8px;border:1px solid var(--border)"></div>':'')
      +(t.approvedBy?'<div style="font-size:12px;color:var(--text-muted)">✔ Được duyệt bởi: '+getUserById(t.approvedBy).name+'</div>':'')
      +(canManageTasks(cu.role)?'<button class="btn-secondary" style="margin-top:10px" data-tid="'+t.id+'" onclick="unDoneTask(this.dataset.tid);closeModal(\'taskDetailModal\')">↩ Hủy hoàn thành</button>':'')
      +'</div>';
  } else if(t.status==='doing'&&isAssignee){
    actionHtml='<div style="background:rgba(245,158,11,.12);border:2px solid var(--warning);border-radius:10px;padding:18px;text-align:center">'
      +'<div style="font-weight:700;font-size:15px;margin-bottom:6px;color:var(--warning)">📤 Bạn đang thực hiện nhiệm vụ này</div>'
      +'<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px">Khi hoàn thành công việc, hãy nộp kết quả để xác nhận.<br>Bạn cần cung cấp link hoặc ảnh chụp màn hình làm bằng chứng.</div>'
      +'<button class="btn-submit-task" style="width:auto;padding:12px 28px;font-size:15px;display:inline-flex" data-tid="'+t.id+'" onclick="closeModal(\'taskDetailModal\');openSubmitModal(this.dataset.tid)">📤 Nộp kết quả &amp; Báo cáo hoàn thành</button>'
      +'</div>';
  } else if(t.status==='todo'&&isAssignee){
    actionHtml='<div style="background:rgba(124,58,237,.1);border:1px solid var(--accent);border-radius:10px;padding:16px;text-align:center">'
      +'<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Nhấn nút bên dưới để nhận nhiệm vụ và bắt đầu làm việc.</div>'
      +'<button class="btn-start-task" style="width:auto;padding:10px 24px;font-size:14px;display:inline-flex" data-tid="'+t.id+'" onclick="closeModal(\'taskDetailModal\');startTask(this.dataset.tid)">▶ Nhận nhiệm vụ &amp; Bắt đầu</button>'
      +'</div>';
  }
  document.getElementById('detailTaskTitle').textContent=t.title;
  document.getElementById('taskDetailBody').innerHTML=
    '<div style="display:grid;gap:14px">'
    +'<div><b>Mô tả:</b> '+(t.desc||'Chưa có mô tả')+'</div>'
    +'<div style="display:flex;gap:12px;flex-wrap:wrap">'
    +(proj?'<span><b>Dự án:</b> <span class="task-tag" style="background:'+proj.color+'">'+proj.name+'</span></span>':'')
    +'<span><b>Ưu tiên:</b> '+priorityLabel+'</span>'
    +'<span><b>Trạng thái:</b> '+(t.status==='todo'?'⬜ Cần làm':t.status==='doing'?'🟡 Đang làm':t.status==='review'?'⏳ Chờ duyệt':'✅ Hoàn thành')+'</span>'
    +'</div>'
    +'<div><b>Deadline:</b> '+(t.deadline?'<span class="deadline-badge '+dlStatus+'">'+formatDate(t.deadline)+(t.deadlineTime?' lúc '+t.deadlineTime:'')+'</span>':'Chưa có')+'</div>'
    +'<div><b>Giao cho:</b> '+(assignees||'Chưa giao')+'</div>'
    +(imgs?'<div><b>Hình ảnh:</b><br><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+imgs+'</div></div>':'')
    +'<div><b>Ngày tạo:</b> '+formatDate(t.createdAt)+'</div>'
    +actionHtml
    +'</div>';
  document.getElementById('taskDetailModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function editCurrentTask(){if(editId)openAddTask(null,null,editId);}
function openAddTask(status,projId,taskId){
  taskImages=[];
  document.getElementById('taskImagesPreview').innerHTML='';
  document.getElementById('taskModalTitle').textContent=taskId?'Sửa Task':'Thêm Task mới';
  document.getElementById('taskModalError').classList.add('hidden');
  populateSelects();
  if(taskId){
    var t=getTasks().find(function(x){return x.id===taskId});
    if(t){
      document.getElementById('taskTitle').value=t.title;
      document.getElementById('taskDesc').value=t.desc||'';
      document.getElementById('taskProject').value=t.project||'';
      document.getElementById('taskStatus').value=t.status;
      document.getElementById('taskPriority').value=t.priority;
      document.getElementById('taskDeadline').value=t.deadline||'';
      var tlEl=document.getElementById('taskDeadlineTime');
      if(tlEl)tlEl.value=t.deadlineTime||'';
      taskImages=t.images?t.images.slice():[];
      renderImgPreview();
      editId=taskId;
    }
  } else {
    document.getElementById('taskTitle').value='';
    document.getElementById('taskDesc').value='';
    document.getElementById('taskStatus').value=status||'todo';
    if(projId)document.getElementById('taskProject').value=projId;
    document.getElementById('taskDeadline').value='';
    editId=null;
  }
  document.getElementById('taskModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function populateSelects(){
  var ps=document.getElementById('taskProject'),as=document.getElementById('taskAssignee');
  ps.innerHTML='<option value="shared">📋 Nhiệm vụ chung</option>'
    +getProjects().map(function(p){return'<option value="'+p.id+'">'+p.name+'</option>'}).join('');
  as.innerHTML=getUsers().filter(function(u){return u.approved}).map(function(u){return'<option value="'+u.id+'">'+u.name+' ('+ROLE_NAMES[u.role]+')</option>'}).join('');
}
function handleTaskImages(e){
  var files=Array.from(e.target.files);
  files.forEach(function(file){
    var r=new FileReader();
    r.onload=function(ev){taskImages.push(ev.target.result);renderImgPreview();};
    r.readAsDataURL(file);
  });
}
function renderImgPreview(){
  document.getElementById('taskImagesPreview').innerHTML=taskImages.map(function(src,i){
    return'<div class="img-preview-wrap"><img src="'+src+'"><span class="del-img" onclick="taskImages.splice('+i+',1);renderImgPreview()">x</span></div>';
  }).join('');
}
function saveTask(){
  var title=document.getElementById('taskTitle').value.trim();
  if(!title){document.getElementById('taskModalError').textContent='Nhập tiêu đề task';document.getElementById('taskModalError').classList.remove('hidden');return;}
  var assignees=Array.from(document.getElementById('taskAssignee').selectedOptions).map(function(o){return o.value});
  var cu=getCurrentUser();
  var data={title:title,desc:document.getElementById('taskDesc').value,project:document.getElementById('taskProject').value,status:editId?document.getElementById('taskStatus').value:'todo',priority:document.getElementById('taskPriority').value,deadline:document.getElementById('taskDeadline').value||null,deadlineTime:(document.getElementById('taskDeadlineTime')||{}).value||'',assignees:assignees.length?assignees:[cu.id],images:taskImages.slice()};
  if(editId){updateTask(editId,data);showToast('Đã cập nhật task!','success');}
  else{addTask(Object.assign({id:uid(),createdAt:new Date().toISOString().slice(0,10),done:false},data));addNotification('Task mới: '+title);showToast('Đã thêm task!','success');}
  closeModal('taskModal');closeModal('taskDetailModal');updateBadges();navigate('dashboard');
}

function renderAllTasks(){
  var el=document.getElementById('view-tasks'),tasks=getTasks().filter(function(t){return t.project!=='shared'}),cu=getCurrentUser();
  el.innerHTML='<div class="table-header"><h2>Tat ca Task</h2>'+(canManageTasks(cu.role)?'<button class="btn-primary" onclick="openAddTask()">+ Them Task</button>':'')+'</div>'
    +'<table class="task-table"><thead><tr><th>Tieu de</th><th>Du an</th><th>Trang thai</th><th>Uu tien</th><th>Deadline</th><th>Giao cho</th>'+(canManageTasks(cu.role)?'<th>Xoa</th>':'')+'</tr></thead><tbody>'
    +tasks.map(function(t){
      var p=getProjects().find(function(x){return x.id===t.project});
      var u=t.assignees?t.assignees.map(function(aid){var x=getUserById(aid);return x?x.name:''}).filter(Boolean).join(', '):'';
      return'<tr><td data-tid="'+t.id+'" onclick="openDetail(this.dataset.tid)" style="cursor:pointer">'+(t.done?'<s>':'')+t.title+(t.done?'</s>':'')+'</td>'
        +'<td>'+(p?'<span class="task-tag" style="background:'+p.color+'">'+p.name+'</span>':'')+'</td>'
        +'<td>'+(t.status==='todo'?'Can lam':t.status==='doing'?'Dang lam':'Hoan thanh')+'</td>'
        +'<td><span class="priority-badge '+t.priority+'">'+(t.priority==='high'?'🔴 Khan':t.priority==='medium'?'🟡 TB':'🟢 Thap')+'</span></td>'
        +'<td><span class="deadline-badge '+(getDeadlineStatus(t.deadline)||'')+'">'+(t.deadline?formatDate(t.deadline):'')+'</span></td>'
        +'<td>'+u+'</td>'
        +(canManageTasks(cu.role)?'<td><span class="task-card-del" data-tid="'+t.id+'" onclick="delTask(this.dataset.tid)">✕</span></td>':'')
        +'</tr>';
    }).join('')+'</tbody></table>';
}
function renderMyTasks(){
  var el=document.getElementById('view-mytasks'),cu=getCurrentUser();
  var allTasks=getTasks();
  var myTasks=allTasks.filter(function(t){return t.assignees&&t.assignees.includes(cu.id)});
  var todo=myTasks.filter(function(t){return t.status==='todo'&&!t.done});
  var doing=myTasks.filter(function(t){return t.status==='doing'&&!t.done});
  var done=myTasks.filter(function(t){return t.done});
  el.innerHTML='<div class="kanban-header"><h2>Nhiệm vụ của tôi ('+(myTasks.length)+')</h2></div>'
    +'<div class="stats-grid" style="margin-bottom:16px">'
    +'<div class="stat-card"><div class="stat-label">CẦN LÀM</div><div class="stat-val purple">'+todo.length+'</div></div>'
    +'<div class="stat-card"><div class="stat-label">ĐANG LÀM</div><div class="stat-val cyan">'+doing.length+'</div></div>'
    +'<div class="stat-card"><div class="stat-label">HOÀN THÀNH</div><div class="stat-val green">'+done.length+'</div></div>'
    +'</div>'
    +'<div class="kanban-board">'
    +'<div class="kanban-col"><div class="col-header"><span class="col-dot" style="background:#64748b"></span><span class="col-title">Cần làm</span><span class="col-count">'+todo.length+'</span></div>'+todo.map(function(t){return buildCard(t)}).join('')+'</div>'
    +'<div class="kanban-col"><div class="col-header"><span class="col-dot" style="background:#f59e0b"></span><span class="col-title">Đang làm</span><span class="col-count">'+doing.length+'</span></div>'+doing.map(function(t){return buildCard(t)}).join('')+'</div>'
    +'<div class="kanban-col"><div class="col-header"><span class="col-dot" style="background:#22c55e"></span><span class="col-title">Hoàn thành</span><span class="col-count">'+done.length+'</span></div>'+done.map(function(t){return buildCard(t)}).join('')+'</div>'
    +'</div>';
}
function renderDone(){
  var el=document.getElementById('view-done');
  var tasks=getTasks().filter(function(t){return t.done});
  el.innerHTML='<div class="section-title">Đã hoàn thành ('+tasks.length+')</div>'
    +'<table class="task-table"><thead><tr><th>Tiêu đề</th><th>Dự án</th><th>Deadline</th></tr></thead><tbody>'
    +tasks.map(function(t){var p=getProjects().find(function(x){return x.id===t.project});return'<tr><td><s>'+t.title+'</s></td><td>'+(p?p.name:'')+'</td><td>'+(t.deadline?formatDate(t.deadline):'')+'</td></tr>'}).join('')
    +'</tbody></table>';
}
function renderDeadline(){
  var el=document.getElementById('view-deadline');
  var tasks=getTasks().filter(function(t){return!t.done&&t.deadline}).sort(function(a,b){return new Date(a.deadline)-new Date(b.deadline)});
  el.innerHTML='<div class="section-title">Deadline sap den</div>'
    +'<table class="task-table"><thead><tr><th>Tieu de</th><th>Du an</th><th>Deadline</th><th>Con lai</th></tr></thead><tbody>'
    +tasks.map(function(t){
      var p=getProjects().find(function(x){return x.id===t.project});
      var days=daysRemaining(t.deadline)||daysUntil(t.deadline);
      var dur=taskDuration(t);
      var ds=getDeadlineStatus(t.deadline);
      return'<tr data-tid="'+t.id+'" onclick="openDetail(this.dataset.tid)" style="cursor:pointer"><td>'+t.title+'</td><td>'+(p?p.name:'')+'</td>'
        +'<td>'+formatDate(t.deadline)+'</td>'
        +'<td><span class="deadline-badge '+ds+'">'+( days<0?'Qua han '+Math.abs(days)+'N':days+'N')+'</span></td></tr>';
    }).join('')+'</tbody></table>';
}
function renderMembers(){
  var cu=getCurrentUser(),el=document.getElementById('view-members');
  var users=getUsers().filter(function(u){return u.approved});
  el.innerHTML='<div class="section-title">Thành viên ('+(users.length)+')</div><div class="members-grid">'
    +users.map(function(u){
      var taskCount=getTasks().filter(function(t){return t.assignees&&t.assignees.includes(u.id)&&!t.done}).length;
      return'<div class="member-card" data-uid="'+u.id+'" onclick="openMember(this.dataset.uid)">'
        +'<div class="member-avatar-lg">'+(u.avatar?'<img src="'+u.avatar+'" alt="">':u.name[0].toUpperCase())+'</div>'
        +'<div class="member-name">'+u.name+'</div>'
        +'<span class="role-badge '+ROLE_CLASS[u.role]+'">'+ROLE_NAMES[u.role]+'</span>'
        +'<div class="member-stats"><span>'+taskCount+' task đang làm</span></div>'
        +'</div>';
    }).join('')+'</div>';
}
function openMember(id){
  var cu=getCurrentUser(),u=getUserById(id);if(!u)return;
  var roles=['staff','leader','manager','admin'];
  var myIdx=roles.indexOf(cu.role),uIdx=roles.indexOf(u.role);
  var canManage=canManageMembers(cu.role)&&u.id!==cu.id&&myIdx>uIdx;
  var body='<div class="profile-avatar-wrap">'
    +'<div class="member-avatar-lg">'+(u.avatar?'<img src="'+u.avatar+'">':u.name[0])+'</div>'
    +'<div><div class="member-name">'+u.name+'</div><div class="user-role">@'+u.username+'</div>'
    +'<span class="role-badge '+ROLE_CLASS[u.role]+'">'+ROLE_NAMES[u.role]+'</span></div></div>';
  var footer='';
  if(canManage){
    if(uIdx<3)footer+='<button class="btn-primary" data-uid="'+u.id+'" data-role="'+roles[uIdx+1]+'" onclick="changeRole(this.dataset.uid,this.dataset.role)">&#x2B06; Thăng chức</button> ';
    if(uIdx>0)footer+='<button class="btn-secondary" data-uid="'+u.id+'" data-role="'+roles[uIdx-1]+'" onclick="changeRole(this.dataset.uid,this.dataset.role)">&#x2B07; Giảng chức</button> ';
    footer+='<button class="btn-danger" data-uid="'+u.id+'" onclick="removeMember(this.dataset.uid)">Xóa khỏi nhóm</button>';
  }
  document.getElementById('memberModalTitle').textContent=u.name;
  document.getElementById('memberModalBody').innerHTML=body;
  document.getElementById('memberModalFooter').innerHTML=footer;
  document.getElementById('memberModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function changeRole(id,role){var users=getUsers().map(function(u){return u.id===id?Object.assign({},u,{role:role}):u});saveUsers(users);closeModal('memberModal');showToast('Cap nhat chuc vu thanh cong!','success');renderMembers();}
function removeMember(id){saveUsers(getUsers().filter(function(u){return u.id!==id}));closeModal('memberModal');showToast('Da xoa thanh vien','success');renderMembers();}
function renderPending(){
  var cu=getCurrentUser(),el=document.getElementById('view-pending');
  var pending=getPending();
  el.innerHTML='<div class="section-title">Cho duyet ('+pending.length+')</div>'
    +(pending.length===0?'<div class="empty-state"><div class="icon">✅</div><p>Khong co yeu cau nao</p></div>'
    :'<table class="task-table"><thead><tr><th>Ho ten</th><th>Username</th><th>Ngay DK</th><th>Hanh dong</th></tr></thead><tbody>'
    +pending.map(function(u){
      return'<tr><td>'+u.name+'</td><td>'+u.username+'</td><td>'+(u.joinDate||'')+'</td>'
        +'<td><button class="btn-primary sm" data-uid="'+u.id+'" onclick="approveMember(this.dataset.uid)">Duyet</button> '
        +'<button class="btn-danger" data-uid="'+u.id+'" onclick="rejectMember(this.dataset.uid)">Tu choi</button></td></tr>';
    }).join('')+'</tbody></table>');
}
function approveMember(id){
  var pending=getPending();
  var u=pending.find(function(x){return x.id===id});
  if(!u)return;
  var users=getUsers();
  var today=new Date().toISOString().slice(0,10);
  users.push(Object.assign({},u,{approved:true,joinDate:today,id:u.id}));
  saveUsers(users);
  savePending(pending.filter(function(x){return x.id!==id}));
  addNotification('Da duyet thanh vien: '+u.name);
  showToast('Da duyet: '+u.name,'success');
  renderPending();
  renderMembers();
  updateBadges();
}
function rejectMember(id){savePending(getPending().filter(function(x){return x.id!==id}));showToast('Da tu choi','success');renderPending();updateBadges();}
function renderCalendar(){
  var el=document.getElementById('view-calendar');
  if(!el)return;
  if(!window._calYear){var now=new Date();window._calYear=now.getFullYear();window._calMonth=now.getMonth();}
  var y=window._calYear,m=window._calMonth;
  var tasks=getTasks().filter(function(t){return t.deadline;});
  var days=['CN','T2','T3','T4','T5','T6','T7'];
  var monthNames=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  var first=new Date(y,m,1),last=new Date(y,m+1,0);
  var startDay=first.getDay();
  var today=todayVN();
  // Build calendar HTML
  var html='<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">'
    +'<button class="btn-secondary" style="padding:6px 14px" onclick="prevMonth()">&#9664; Trước</button>'
    +'<h2 style="flex:1;text-align:center;margin:0">'+monthNames[m]+' '+y+'</h2>'
    +'<button class="btn-secondary" style="padding:6px 14px" onclick="nextMonth()">Sau &#9654;</button>'
    +'</div>'
    +'<div class="cal-grid">';
  // Day headers
  days.forEach(function(d){html+='<div class="cal-day-hdr">'+d+'</div>';});
  // Empty cells before first day
  for(var i=0;i<startDay;i++){html+='<div class="cal-cell"></div>';}
  // Day cells
  for(var d=1;d<=last.getDate();d++){
    var cellDate=new Date(y,m,d);cellDate.setHours(0,0,0,0);
    var isToday=cellDate.getTime()===today.getTime();
    var dayTasks=tasks.filter(function(t){
      if(!t.deadline) return false;
      // Parse date string directly to avoid timezone issues
      var parts=t.deadline.split('-');
      if(parts.length<3) return false;
      var dl=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
      return dl.getFullYear()===y&&dl.getMonth()===m&&dl.getDate()===d;
    });
    // Also show tasks assigned to current user that are due this day
    var cu2=getCurrentUser();
    var myDayTasks=dayTasks.filter(function(t){
      return !t.done && t.assignees && t.assignees.includes(cu2.id);
    });
    var otherTasks=dayTasks.filter(function(t){
      return !myDayTasks.includes(t);
    });
    // Show all tasks (mine first, then others, including done tasks)
    html+='<div class="cal-cell'+(isToday?' today':'')+'"><div class="cal-date">'+d+'</div>';
    dayTasks.forEach(function(t){
      var remDays=daysUntil(t.deadline);
      var timeStr=t.deadlineTime||'';
      var dotColor=t.done?'#6b7280':remDays<0?'#ef4444':remDays<=3?'#ef4444':remDays<=7?'#f59e0b':'#22c55e';
      var p=getProjects().find(function(x){return x.id===t.project;});
      var pColor=p?p.color:dotColor;
      var isMyTask=t.assignees&&t.assignees.includes(cu2?cu2.id:'');
      html+='<div class="cal-task-dot" style="background:'+dotColor+';border-left:3px solid '+(pColor||dotColor)+';'+(isMyTask?'font-weight:700;':'')+';cursor:pointer" title="'+t.title+(timeStr?' '+timeStr:'')+(t.assignees?' - Giao cho: '+t.assignees.map(function(aid){var u=getUsers().find(function(x){return x.id===aid});return u?u.name:''}).filter(Boolean).join(', '):'')+'" onclick="openDetail(\''+t.id+'\')">'+( timeStr?'<b>'+timeStr.trim()+'</b> ':'')+t.title.substring(0,16)+'</div>';
    });
    html+='</div>';
  }
  html+='</div>';
  el.innerHTML=html;
}
function prevMonth(){if(!window._calYear){var n=new Date();window._calYear=n.getFullYear();window._calMonth=n.getMonth();}window._calMonth--;if(window._calMonth<0){window._calMonth=11;window._calYear--;}renderCalendar();}
function nextMonth(){if(!window._calYear){var n=new Date();window._calYear=n.getFullYear();window._calMonth=n.getMonth();}window._calMonth++;if(window._calMonth>11){window._calMonth=0;window._calYear++;}renderCalendar();}
function renderProfile(userId){
  var el=document.getElementById('view-profile');
  if(!el)return;
  var cu=getCurrentUser();
  var targetId=userId||cu.id;
  var u=getUserById(targetId);
  if(!u){el.innerHTML='<p>Khong tim thay nguoi dung</p>';return;}
  var isOwnProfile=cu.id===targetId;
  var allTasks=getTasks();
  var myTasks=allTasks.filter(function(t){return t.assignees&&t.assignees.includes(targetId)});
  var doneTasks=myTasks.filter(function(t){return t.done});
  var pendingTasks=myTasks.filter(function(t){return!t.done});
  var assignedByMe=canManageTasks(cu.role)?allTasks.filter(function(t){return t.createdBy===targetId||t.assignees&&t.assignees.includes(targetId)}):[];
  var projs=getProjects();
  // Avatar
  var avatarHtml=u.avatar
    ?'<img src="'+u.avatar+'" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid var(--accent)">'
    :'<div style="width:96px;height:96px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#fff">'+u.name[0].toUpperCase()+'</div>';
  var html='<div style="max-width:700px;margin:0 auto">'
    // Header card
    +'<div class="announce-card" style="display:flex;gap:24px;align-items:flex-start;margin-bottom:20px">'
    +'<div style="position:relative;flex-shrink:0">'
    +avatarHtml
    +(isOwnProfile?'<label style="position:absolute;bottom:0;right:0;background:var(--accent);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px" title="Doi anh">📷<input type="file" accept="image/*" class="hidden" onchange="uploadAvatar(event)"></label>':'')
    +'</div>'
    +'<div style="flex:1">'
    +'<div style="font-size:22px;font-weight:800;margin-bottom:4px">'+u.name+'</div>'
    +'<div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">@'+u.username+' &nbsp;|&nbsp; <span class="role-badge '+ROLE_CLASS[u.role]+'">'+ROLE_NAMES[u.role]+'</span></div>'
    +'<div style="font-size:12px;color:var(--text-muted)">📅 Gia nhap: '+formatDate(u.joinDate)+'</div>'
    +(u.bio?'<div style="margin-top:10px;font-size:14px;color:var(--text);line-height:1.6;padding:10px;background:var(--bg3);border-radius:8px">'+u.bio+'</div>':'')
    +(isOwnProfile?'<button class="btn-secondary" style="margin-top:12px;font-size:12px" onclick="openEditProfile()">✏️ Chinh sua ho so</button><div id="profile-edit-inline" class="hidden" style="margin-top:16px;background:var(--bg3);border:1px solid var(--accent);border-radius:10px;padding:16px"><div style="display:grid;gap:12px"><div class="form-group"><label class="form-label">Ten hien thi</label><input type="text" id="editProfileName" class="form-input" placeholder="Ten cua ban"></div><div class="form-group"><label class="form-label">Tieu su (cong khai)</label><textarea id="editProfileBio" class="form-input" rows="3" placeholder="Gioi thieu ban than, vi tri, ky nang..."></textarea></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn-secondary" onclick="openEditProfile()">Huy</button><button class="btn-primary" onclick="saveProfile()">💾 Luu ho so</button></div></div></div>':'')
    +'</div>'
    +'</div>'
    // Stats
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">'
    +'<div class="stat-card"><div class="stat-label">HOAN THANH</div><div class="stat-val green">'+doneTasks.length+'</div><div class="stat-sub">Nhiem vu</div></div>'
    +'<div class="stat-card"><div class="stat-label">CHUA HOAN THANH</div><div class="stat-val red">'+pendingTasks.length+'</div><div class="stat-sub">Nhiem vu</div></div>'
    +'<div class="stat-card"><div class="stat-label">TONG NHIEM VU</div><div class="stat-val purple">'+myTasks.length+'</div><div class="stat-sub">Duoc giao</div></div>'
    +(canManageTasks(cu.role)?'<div class="stat-card"><div class="stat-label">DU AN</div><div class="stat-val cyan">'+projs.length+'</div><div class="stat-sub">Tham gia</div></div>':'')
    +'</div>';
  // Recent tasks
  if(myTasks.length>0){
    html+='<div class="announce-card"><h3 style="margin-bottom:12px">Nhiem vu gan day</h3>'
      +'<div style="display:grid;gap:6px">';
    myTasks.slice(-5).reverse().forEach(function(t){
      var p=projs.find(function(x){return x.id===t.project});
      html+='<div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg3);border-radius:6px">'
        +'<span style="width:8px;height:8px;border-radius:50%;background:'+(t.done?'#22c55e':t.status==='review'?'#a855f7':t.status==='doing'?'#f59e0b':'#64748b')+';flex-shrink:0"></span>'
        +'<span style="flex:1;font-size:13px">'+(t.done?'<s>':'')+t.title+(t.done?'</s>':'')+'</span>'
        +(p?'<span class="task-tag" style="background:'+p.color+';font-size:11px">'+p.name+'</span>':'')
        +'</div>';
    });
    html+='</div></div>';
  }
  html+='</div>';
  el.innerHTML=html;
}

function uploadAvatar(e){
  var f=e.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    var users=getUsers();
    var cu=getCurrentUser();
    var idx=users.findIndex(function(u){return u.id===cu.id});
    if(idx>=0){
      users[idx].avatar=ev.target.result;
      saveUsers(users);
      showToast('Da cap nhat anh dai dien!','success');
      renderProfile();
    }
  };
  r.readAsDataURL(f);
}

function openEditProfile(){
  var cu=getCurrentUser();
  var u=getUserById(cu.id);
  var el=document.getElementById('profile-edit-inline');
  if(el){
    el.classList.toggle('hidden');
    if(!el.classList.contains('hidden')){
      document.getElementById('editProfileName').value=u.name||'';
      document.getElementById('editProfileBio').value=u.bio||'';
    }
  }
}

function saveProfile(){
  var cu=getCurrentUser();
  var users=getUsers();
  var idx=users.findIndex(function(u){return u.id===cu.id});
  if(idx>=0){
    var newName=document.getElementById('editProfileName').value.trim();
    users[idx].name=newName||users[idx].name;
    users[idx].bio=document.getElementById('editProfileBio').value.trim();
    saveUsers(users);
    showToast('Da cap nhat ho so!','success');
    renderProfile();
    updateBadges();
  }
}

// ===== GROUPS =====
function getGroups(){return DB.get('groups',[]);}
function saveGroups(g){DB.set('groups',g);}

function renderGroups(){
  var el=document.getElementById('view-groups');
  if(!el)return;
  var cu=getCurrentUser();
  var canEdit=canManageMembers(cu.role);
  var groups=getGroups();
  var users=getUsers().filter(function(u){return u.approved});
  var html='<div class="kanban-header"><h2>Nhom lam viec</h2>'+(canEdit?'<button class="btn-primary" onclick="openAddGroup()">+ Tao nhom moi</button>':'')+'</div>';
  if(groups.length===0){
    html+='<div style="text-align:center;padding:60px;color:var(--text-muted)">Chua co nhom nao. '+(canEdit?'<a onclick="openAddGroup()" style="color:var(--accent);cursor:pointer">Tao nhom dau tien</a>':'')+'</div>';
  } else {
    html+='<div style="display:grid;gap:16px">';
    groups.forEach(function(g){
      var memberNames=g.members?g.members.map(function(mid){var u=users.find(function(x){return x.id===mid});return u?u.name:''}).filter(Boolean):[];
      html+='<div class="announce-card" style="border-left:4px solid '+(g.color||'var(--accent)')+'">'
        +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'
        +'<div style="display:flex;align-items:center;gap:10px">'
        +'<span style="font-size:20px">'+(g.icon||'👥')+'</span>'
        +'<div><div style="font-weight:700;font-size:16px">'+g.name+'</div>'
        +'<div style="font-size:12px;color:var(--text-muted)">'+memberNames.length+' thanh vien</div>'
        +'</div></div>'
        +(canEdit?'<div style="display:flex;gap:8px">'
          +'<button class="btn-secondary" style="padding:6px 12px;font-size:12px" data-gid="'+g.id+'" onclick="openAddSubgroup(this.dataset.gid)">+ Nhom con</button>'
          +'<button class="btn-secondary" style="padding:6px 12px;font-size:12px" data-gid="'+g.id+'" onclick="openEditGroup(this.dataset.gid)">✏️ Sua</button>'
          +'<button class="btn-secondary" style="padding:6px 12px;font-size:12px;color:var(--danger)" data-gid="'+g.id+'" onclick="deleteGroup(this.dataset.gid)">✕</button>'
          +'</div>':'')
        +'</div>'
        // Members
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
        +memberNames.map(function(n){return'<span style="background:var(--bg3);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:12px">'+n+'</span>';}).join('')
        +'</div>'
        // Subgroups
        +(g.subgroups&&g.subgroups.length?'<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)"><div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">Nhom con:</div><div style="display:grid;gap:6px">'
          +g.subgroups.map(function(sg){
            var sgNames=sg.members?sg.members.map(function(mid){var u=users.find(function(x){return x.id===mid});return u?u.name:''}).filter(Boolean):[];
            return'<div style="background:var(--bg3);border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:8px">'
              +'<span style="color:var(--text-muted)">↳</span>'
              +'<span style="font-weight:600;font-size:13px">'+sg.name+'</span>'
              +'<span style="font-size:12px;color:var(--text-muted)">('+sgNames.join(', ')+')</span>'
              +(canEdit?'<span data-gid="'+g.id+'" data-sgid="'+sg.id+'" onclick="deleteSubgroup(this.dataset.gid,this.dataset.sgid)" style="margin-left:auto;color:var(--danger);cursor:pointer;font-size:12px">✕</span>':'')
              +'</div>';
          }).join('')
          +'</div></div>':'')
        +'</div>';
    });
    html+='</div>';
  }
  el.innerHTML=html;
}

function openAddGroup(){
  var users=getUsers().filter(function(u){return u.approved});
  document.getElementById('groupModalTitle').textContent='Tao nhom moi';
  document.getElementById('groupName').value='';
  document.getElementById('groupIcon').value='👥';
  window._editGroupId=null;
  var mlist=document.getElementById('groupMemberList');
  mlist.innerHTML=users.map(function(u){
    return'<label style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;cursor:pointer"><input type="checkbox" value="'+u.id+'" class="group-member-cb"> <span>'+u.name+'</span> <span style="font-size:11px;color:var(--text-muted)">'+ROLE_NAMES[u.role]+'</span></label>';
  }).join('');
  document.getElementById('groupColors').innerHTML=['#7c3aed','#ef4444','#06b6d4','#f59e0b','#22c55e','#ec4899'].map(function(c){
    return'<div class="color-dot-pick" style="background:'+c+'" data-color="'+c+'" onclick="selGroupColor(this.dataset.color)"></div>';
  }).join('');
  window._groupColor='#7c3aed';
  document.getElementById('groupModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function selGroupColor(c){window._groupColor=c;document.querySelectorAll('#groupColors .color-dot-pick').forEach(function(d){d.classList.toggle('selected',d.dataset.color===c);});}

function openEditGroup(gid){
  var g=getGroups().find(function(x){return x.id===gid});if(!g)return;
  var users=getUsers().filter(function(u){return u.approved});
  document.getElementById('groupModalTitle').textContent='Chinh sua nhom';
  document.getElementById('groupName').value=g.name;
  document.getElementById('groupIcon').value=g.icon||'👥';
  window._editGroupId=gid;
  window._groupColor=g.color||'#7c3aed';
  var mlist=document.getElementById('groupMemberList');
  mlist.innerHTML=users.map(function(u){
    return'<label style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;cursor:pointer"><input type="checkbox" value="'+u.id+'" class="group-member-cb"'+(g.members&&g.members.includes(u.id)?' checked':'')+'> <span>'+u.name+'</span></label>';
  }).join('');
  document.getElementById('groupColors').innerHTML=['#7c3aed','#ef4444','#06b6d4','#f59e0b','#22c55e','#ec4899'].map(function(c){
    return'<div class="color-dot-pick'+(c===window._groupColor?' selected':'')+'" style="background:'+c+'" data-color="'+c+'" onclick="selGroupColor(this.dataset.color)"></div>';
  }).join('');
  document.getElementById('groupModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function saveGroup(){
  var name=document.getElementById('groupName').value.trim();
  if(!name){showToast('Nhap ten nhom!','error');return;}
  var members=Array.from(document.querySelectorAll('.group-member-cb:checked')).map(function(cb){return cb.value;});
  var icon=document.getElementById('groupIcon').value||'👥';
  var groups=getGroups();
  if(window._editGroupId){
    var idx=groups.findIndex(function(g){return g.id===window._editGroupId});
    if(idx>=0){groups[idx]={...groups[idx],name:name,members:members,color:window._groupColor,icon:icon};}
  } else {
    groups.push({id:uid(),name:name,members:members,color:window._groupColor,icon:icon,subgroups:[],createdAt:new Date().toISOString()});
  }
  saveGroups(groups);
  closeModal('groupModal');
  showToast((window._editGroupId?'Da cap nhat':'Da tao')+" nhom: "+name,'success');
  renderGroups();
}

function deleteGroup(gid){
  var groups=getGroups().filter(function(g){return g.id!==gid});
  saveGroups(groups);showToast('Da xoa nhom','success');renderGroups();
}

function openAddSubgroup(gid){
  var users=getUsers().filter(function(u){return u.approved});
  window._parentGroupId=gid;
  var g=getGroups().find(function(x){return x.id===gid});
  document.getElementById('subgroupParentName').textContent=g?g.name:'';
  document.getElementById('subgroupName').value='';
  var mlist=document.getElementById('subgroupMemberList');
  mlist.innerHTML=users.map(function(u){
    return'<label style="display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;cursor:pointer"><input type="checkbox" value="'+u.id+'" class="subgroup-member-cb"> <span>'+u.name+'</span></label>';
  }).join('');
  document.getElementById('subgroupModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function saveSubgroup(){
  var name=document.getElementById('subgroupName').value.trim();
  if(!name){showToast('Nhap ten nhom con!','error');return;}
  var members=Array.from(document.querySelectorAll('.subgroup-member-cb:checked')).map(function(cb){return cb.value;});
  var groups=getGroups();
  var idx=groups.findIndex(function(g){return g.id===window._parentGroupId});
  if(idx>=0){
    if(!groups[idx].subgroups)groups[idx].subgroups=[];
    groups[idx].subgroups.push({id:uid(),name:name,members:members});
  }
  saveGroups(groups);
  closeModal('subgroupModal');
  showToast('Da tao nhom con: '+name,'success');
  renderGroups();
}

function deleteSubgroup(gid,sgid){
  var groups=getGroups();
  var idx=groups.findIndex(function(g){return g.id===gid});
  if(idx>=0&&groups[idx].subgroups){
    groups[idx].subgroups=groups[idx].subgroups.filter(function(sg){return sg.id!==sgid});
  }
  saveGroups(groups);showToast('Da xoa nhom con','success');renderGroups();
}


// GLOBAL EXPORTS
(function(){
  var fns={
    handleLogin:handleLogin,handleRegister:handleRegister,handleLogout:handleLogout,
    showLogin:showLogin,showRegister:showRegister,togglePassword:togglePassword,
    toggleUserMenu:toggleUserMenu,toggleNotifPanel:toggleNotifPanel,clearNotifs:clearNotifs,
    navigate:navigate,handleSearch:handleSearch,
    openAddTask:openAddTask,saveTask:saveTask,openDetail:openDetail,
    closeModal:closeModal,closeModalOnOverlay:closeModalOnOverlay,
    openSubmitModal:openSubmitModal,saveSubmit:saveSubmit,
    approveTask:approveTask,rejectTask:rejectTask,
    toggleDone:toggleDone,delTask:delTask,openMember:openMember,
    changeRole:changeRole,removeMember:removeMember,
    approveMember:approveMember,rejectMember:rejectMember,
    saveProfile:saveProfile,uploadAvatar:uploadAvatar,
    openEditProfile:openEditProfile,
    openAddGroup:openAddGroup,saveGroup:saveGroup,deleteGroup:deleteGroup,
    openAddSubgroup:openAddSubgroup,saveSubgroup:saveSubgroup,deleteSubgroup:deleteSubgroup,
    triggerLogoUpload:triggerLogoUpload,handleLogoUpload:handleLogoUpload,
    renderImgPreview:renderImgPreview,handleTaskImages:handleTaskImages,
    handleSubmitImg:handleSubmitImg,handleAnnounceImg:handleAnnounceImg,
    saveAnnouncement:saveAnnouncement,startTask:startTask,unDoneTask:unDoneTask,
    startOrSubmitShared:startOrSubmitShared,openAddSharedTask:openAddSharedTask,
    showAddProject:showAddProject,saveProject:saveProject,selColor:selColor,deleteProj:deleteProj,
    switchKanbanTab:switchKanbanTab,prevMonth:prevMonth,nextMonth:nextMonth,
    editCurrentTask:editCurrentTask,
    _gp:_gp,_at:_at,_td:_td,_dt:_dt,_od:_od,
    _om:_om,_cr:_cr,_rm:_rm,_am:_am,_xm:_xm
  };
  for(var k in fns){try{window[k]=fns[k];}catch(e){}}
  console.log('[TG] Ready. handleLogin:',typeof window.handleLogin,'canManageProjects:',typeof window.canManageProjects);
})();
