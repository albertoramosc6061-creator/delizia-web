/* ═══════════════════════════════════════════════════════
   firebase-db.js — Adaptador Firestore para Delizia
   Reemplaza localStorage con sincronización en la nube.
   • Lectura:  inmediata desde caché en memoria
   • Escritura: caché + localStorage + Firestore (async)
   • Al navegar: sincroniza la sección activa desde Firestore
═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const _CONFIG = {
    apiKey:            'AIzaSyDD18tdNw7OhCZ3GTjUvPy3Mz6QmKHO5Kg',
    authDomain:        'delizia-web.firebaseapp.com',
    projectId:         'delizia-web',
    storageBucket:     'delizia-web.firebasestorage.app',
    messagingSenderId: '122030358704',
    appId:             '1:122030358704:web:51d770b71e1e1f83e4bb75',
  };

  // Inicializar Firebase (evitar doble init)
  if (!firebase.apps.length) firebase.initializeApp(_CONFIG);
  const _fs  = firebase.firestore();
  const _COL = 'delizia'; // Colección Firestore raíz
  const _cache = {};
  const _KEYS  = ['users','empleados','clientes','proveedores',
                  'productos','categorias','pedidos','bitacora'];

  /* ── Guardar en Firestore ───────────────────────────── */
  function _push(k, v) {
    _fs.collection(_COL).doc(k)
      .set({ items: v, ts: Date.now() })
      .catch(e => console.warn('[Firebase] Error al guardar ' + k, e));
  }

  /* ── DB global (reemplaza a la versión localStorage) ── */
  window.DB = {
    get: k => {
      if (_cache[k] != null) return JSON.parse(JSON.stringify(_cache[k]));
      return JSON.parse(localStorage.getItem('dz_' + k) || '[]');
    },
    set: (k, v) => {
      _cache[k] = v;
      localStorage.setItem('dz_' + k, JSON.stringify(v));
      _push(k, v);
    },
    nextId: k => {
      const a = window.DB.get(k);
      return a.length ? Math.max(...a.map(i => i.id)) + 1 : 1;
    }
  };

  /* ── Cargar UNA clave desde Firestore → caché ────────── */
  window.dzSyncKey = function (k) {
    return _fs.collection(_COL).doc(k).get()
      .then(doc => {
        if (doc.exists) {
          const items = doc.data().items;
          if (Array.isArray(items)) {
            _cache[k] = items;
            localStorage.setItem('dz_' + k, JSON.stringify(items));
          }
        }
      })
      .catch(() => {}); // Si no hay internet, usa localStorage
  };

  /* ── Carga inicial: todas las colecciones ─────────────── */
  window.dzReady = Promise.all(
    _KEYS.map(k => window.dzSyncKey(k))
  ).then(() => console.log('[Delizia] Firebase sincronizado ✓'))
   .catch(() => console.warn('[Delizia] Sin conexión, usando datos locales'));

  console.log('[Delizia] Firebase inicializado');
})();
