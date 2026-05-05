// ============================================================
//  DATA LAYER - localStorage + Firebase Realtime Sync
//  Works 100% offline; syncs in real-time when Firebase available.
// ============================================================

var DB = {
  get: function(key, def) {
    if (def === undefined) def = null;
    try {
      var v = localStorage.getItem('tg_' + key);
      return v ? JSON.parse(v) : def;
    } catch(e) { return def; }
  },
  set: function(key, val) {
    try {
      localStorage.setItem('tg_' + key, JSON.stringify(val));
    } catch(e) {}
  }
};

// ---- Init default data ----
function initData() {
  ensureAdmin();
  if (!DB.get('projects')) DB.set('projects', []);
  if (!DB.get('tasks'))    DB.set('tasks', []);
  if (!DB.get('notifications')) DB.set('notifications', []);
  if (!DB.get('pendingUsers'))  DB.set('pendingUsers', []);
  if (!DB.get('config'))   DB.set('config', { logo: '' });
}

function ensureAdmin() {
  var raw = localStorage.getItem('tg_users');
  var users = [];
  try { users = raw ? JSON.parse(raw) : []; } catch(e) { users = []; }
  var hasAdmin = users.some(function(u) { return u.username === 'admin' && u.approved; });
  if (!hasAdmin) {
    users.unshift({
      id: 'u1', username: 'admin', password: 'admin123',
      name: 'Admin Tikgenz', role: 'admin', avatar: '',
      approved: true, joinDate: '2024-01-01', bio: ''
    });
    localStorage.setItem('tg_users', JSON.stringify(users));
  }
}

// ============================================================
//  FIREBASE SYNC LAYER
// ============================================================

// Push a data key to Firebase (non-blocking)
function fbPush(key, data) {
  try {
    if (window._firebaseReady && window._db) {
      window._db.ref('workspace/' + key).set(data);
    }
  } catch(e) {}
}

var _fbSyncKeys = ['tasks', 'projects', 'users', 'groups', 'notifications', 'config'];
var _fbListenersSet = false;

// Called automatically when Firebase connects (from firebase-config.js)
window._onFirebaseReady = function() {
  if (_fbListenersSet) return;
  _fbListenersSet = true;

  _fbSyncKeys.forEach(function(key) {
    window._db.ref('workspace/' + key).on('value', function(snapshot) {
      var data = snapshot.val();
      if (data !== null && data !== undefined) {
        // Firebase data is authoritative — update local cache
        localStorage.setItem('tg_' + key, JSON.stringify(data));
        // Re-render current view if app is ready
        if (typeof tryRerender === 'function') tryRerender(key);
      } else {
        // Firebase empty for this key — push local data up
        var local = DB.get(key);
        if (local && (Array.isArray(local) ? local.length > 0 : Object.keys(local).length > 0)) {
          window._db.ref('workspace/' + key).set(local);
        }
      }
    }, function(err) {
      console.warn('[TG] Firebase listener error:', key, err);
    });
  });

  // Push admin user so others can login
  fbPush('users', getUsers());
  console.log('[TG] \u2705 Firebase sync active \u2014 c\u1ed9ng t\u00e1c th\u1eddi gian th\u1ef1c \u0111\u00e3 b\u1eadt!');
};

// ---- Data accessors ----
function getUsers()          { return DB.get('users', []); }
function saveUsers(u)        { DB.set('users', u); fbPush('users', u); }
function getProjects()       { return DB.get('projects', []); }
function saveProjects(p)     { DB.set('projects', p); fbPush('projects', p); }
function getTasks()          { return DB.get('tasks', []); }
function saveTasks(t)        { DB.set('tasks', t); fbPush('tasks', t); }
function getNotifications()  { return DB.get('notifications', []); }
function saveNotifications(n){ DB.set('notifications', n); fbPush('notifications', n); }
function getPending()        { return DB.get('pendingUsers', []); }
function savePending(p)      { DB.set('pendingUsers', p); }
function getLogo()           { var c = DB.get('config', {}); return c.logo || ''; }
function setLogo(l)          { var c = DB.get('config', {}); c.logo = l; DB.set('config', c); fbPush('config', c); }
function getGroups()         { return DB.get('groups', []); }
function saveGroups(g)       { DB.set('groups', g); fbPush('groups', g); }

// ---- Project CRUD ----
function addProject(p) {
  var ps = getProjects(); ps.push(p); saveProjects(ps);
}
function deleteProject(id) {
  saveProjects(getProjects().filter(function(p) { return p.id !== id; }));
  // Also remove tasks belonging to this project
  saveTasks(getTasks().filter(function(t) { return t.project !== id; }));
}
function updateProject(id, data) {
  var ps = getProjects();
  var idx = ps.findIndex(function(p) { return p.id === id; });
  if (idx >= 0) { ps[idx] = Object.assign({}, ps[idx], data); saveProjects(ps); }
}

// ---- User CRUD ----
function addUser(u) {
  var us = getUsers(); us.push(u); saveUsers(us);
}
function updateUser(id, data) {
  var us = getUsers();
  var idx = us.findIndex(function(u) { return u.id === id; });
  if (idx >= 0) { us[idx] = Object.assign({}, us[idx], data); saveUsers(us); }
}
function deleteUser(id) {
  saveUsers(getUsers().filter(function(u) { return u.id !== id; }));
}

function getCurrentUser() {
  try {
    var id = sessionStorage.getItem('tg_currentUser');
    if (!id) return null;
    return getUsers().find(function(u) { return u.id === id; }) || null;
  } catch(e) { return null; }
}
function setCurrentUser(id)  { try { sessionStorage.setItem('tg_currentUser', id); } catch(e) {} }
function clearCurrentUser()  { try { sessionStorage.removeItem('tg_currentUser'); } catch(e) {} }
function getUserById(id)     { return getUsers().find(function(u) { return u.id === id; }) || null; }

// ---- Task CRUD ----
function addTask(t) {
  var ts = getTasks(); ts.push(t); saveTasks(ts);
}
function updateTask(id, data) {
  var ts = getTasks();
  var idx = ts.findIndex(function(t) { return t.id === id; });
  if (idx >= 0) { ts[idx] = Object.assign({}, ts[idx], data); saveTasks(ts); }
}
function deleteTask(id) {
  saveTasks(getTasks().filter(function(t) { return t.id !== id; }));
}

// ---- Notifications ----
function addNotification(msg) {
  var ns = getNotifications();
  ns.unshift({ id: uid(), msg: msg, time: new Date().toISOString() });
  if (ns.length > 50) ns = ns.slice(0, 50);
  saveNotifications(ns);
}
function clearNotifications() { saveNotifications([]); }

// ---- Helpers ----
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(d) {
  if (!d) return '';
  try {
    var parts = String(d).split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return new Date(d).toLocaleDateString('vi-VN');
  } catch(e) { return String(d); }
}

function daysUntil(d) {
  if (!d) return null;
  try {
    var parts = String(d).split('-');
    var dl = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.ceil((dl - now) / 86400000);
  } catch(e) { return null; }
}

function taskDuration(t) {
  if (!t || !t.deadline || !t.createdAt) return null;
  try {
    var parts = String(t.deadline).split('-');
    var dl = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var cr = new Date(t.createdAt); cr.setHours(0, 0, 0, 0);
    return Math.ceil((dl - cr) / 86400000);
  } catch(e) { return null; }
}

function daysRemaining(d) { return daysUntil(d); }

function getDeadlineStatus(d) {
  var days = daysUntil(d);
  if (days === null) return '';
  if (days < 0) return 'overdue';
  if (days <= 3) return 'soon';
  return 'ok';
}

// ---- Role helpers ----
var ROLE_NAMES = { admin: 'Admin', manager: 'Qu\u1ea3n l\u00fd', leader: 'Tr\u01b0\u1edfng nh\u00f3m', staff: 'Nh\u00e2n vi\u00ean' };
var ROLE_CLASS  = { admin: 'role-admin', manager: 'role-manager', leader: 'role-leader', staff: 'role-staff' };

function canManageTasks(role)   { return role === 'admin' || role === 'manager' || role === 'leader'; }
function canManageMembers(role) { return role === 'admin' || role === 'manager'; }

function tryRerender(key) {
  try {
    var reRenderFor = { tasks: true, projects: true, users: true, notifications: true, pendingUsers: true, groups: true };
    if (!reRenderFor[key]) return;
    updateBadges();
    renderProjects();
    if (typeof renderNotifs === 'function') renderNotifs();
    var v = window._currentView;
    if      (v === 'dashboard') renderDashboard();
    else if (v === 'tasks')     renderAllTasks();
    else if (v === 'mytasks')   renderMyTasks();
    else if (v === 'done')      renderDone();
    else if (v === 'deadline')  renderDeadline();
    else if (v === 'members')   renderMembers();
    else if (v === 'pending')   renderPending();
    else if (v === 'groups')    renderGroups();
    else if (v === 'profile')   renderProfile();
    else if (v && v.startsWith('proj_')) renderProject(v.replace('proj_', ''));
  } catch(e) { console.warn('tryRerender error:', e); }
}
