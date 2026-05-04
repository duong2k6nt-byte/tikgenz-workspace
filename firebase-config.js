// ============================================================
//  FIREBASE CONFIG - OPTIONAL CLOUD SYNC
//  App works 100% offline with localStorage.
//  Firebase is only used for cross-device sync if available.
// ============================================================

window._firebaseReady = false;
window._db = null;

(function() {
  try {
    var firebaseConfig = {
      apiKey: "AIzaSyA6ILwUycvPfj0uvjrS9Ol1BG3VJonjuDY",
      authDomain: "tikgenz-workspace-cf407.firebaseapp.com",
      databaseURL: "https://tikgenz-workspace-cf407-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "tikgenz-workspace-cf407",
      storageBucket: "tikgenz-workspace-cf407.firebasestorage.app",
      messagingSenderId: "803499955257",
      appId: "1:803499955257:web:d264d401707d3669f569e8"
    };

    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded - using localStorage only');
      return;
    }

    // Prevent duplicate app initialization
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }

    var database = firebase.database();
    window._db = database;

    // Test connection with timeout
    var connected = false;
    var timeout = setTimeout(function() {
      if (!connected) {
        console.warn('Firebase connection timeout - using localStorage only');
        window._firebaseReady = false;
      }
    }, 5000);

    database.ref('.info/connected').on('value', function(snapshot) {
      connected = true;
      clearTimeout(timeout);
      if (snapshot.val() === true) {
        console.log('✅ Firebase connected!');
        window._firebaseReady = true;
        window._db = database;
        if (window._onFirebaseReady) {
          try { window._onFirebaseReady(); } catch(e) {}
        }
      } else {
        console.log('Firebase offline - using localStorage');
        window._firebaseReady = false;
      }
    });

  } catch(e) {
    console.warn('Firebase init error (app still works):', e.message);
    window._firebaseReady = false;
    window._db = null;
  }
})();

// Safe reference to db - always use window._db
var db = {
  ref: function(path) {
    if (window._db) {
      try { return window._db.ref(path); } catch(e) {}
    }
    // Return no-op object if Firebase unavailable
    return {
      set: function() { return Promise.resolve(); },
      on: function() {},
      off: function() {},
      once: function() { return Promise.resolve({val: function(){ return null; }}); }
    };
  }
};
