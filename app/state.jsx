// Capa de persistencia para el prototipo Clienteling.
//
// Se carga DESPUÉS de app/data.jsx. Lee localStorage y, si existen datos guardados,
// reemplaza in-place los arrays globales (CLIENTS, PURCHASES, etc.) con la versión
// persistida. Si no hay nada guardado, conserva los defaults de data.jsx.
//
// Las pantallas que solo LEEN datos no necesitan cambios. Las que MUTAN deben usar
// LxState.<verb>(...) — cada mutación guarda + emite evento 'lx-state' para re-render.

const LX_NS = 'lx-clienteling:v1';
const LX_COLLECTIONS = [
  'CLIENTS', 'PRODUCTS', 'CONSENTS', 'INTERACTIONS', 'RECOMMENDATIONS',
  'SAMPLES', 'MESSAGES', 'TEMPLATES', 'APPOINTMENTS', 'TASKS',
  'DEVICES', 'TICKETS', 'INTEGRATIONS', 'PURCHASES', 'COMMUNICATIONS',
  'STORES', 'BAS', 'USERS',
];

function _key(name) { return `${LX_NS}:${name}`; }

function _load(name) {
  try {
    const raw = localStorage.getItem(_key(name));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _save(name, value) {
  try { localStorage.setItem(_key(name), JSON.stringify(value)); } catch {}
}

// Reemplaza el contenido de un array global in-place (preserva referencias).
function _replaceArray(target, next) {
  if (!Array.isArray(target)) return;
  target.length = 0;
  for (const item of next) target.push(item);
}

function _emit(collection) {
  window.dispatchEvent(new CustomEvent('lx-state', { detail: { collection } }));
}

// Persiste un array global y notifica.
function _commit(name) {
  const arr = window[name];
  if (Array.isArray(arr)) {
    _save(name, arr);
    _emit(name);
  }
}

// Inicialización: rehidrata cada colección desde localStorage si existe.
function _hydrate() {
  for (const name of LX_COLLECTIONS) {
    const stored = _load(name);
    if (stored && Array.isArray(stored) && Array.isArray(window[name])) {
      _replaceArray(window[name], stored);
    }
  }
}

// Reset total — devuelve la app a defaults de data.jsx (requiere recargar página).
function _resetAll() {
  for (const name of LX_COLLECTIONS) {
    try { localStorage.removeItem(_key(name)); } catch {}
  }
  try { localStorage.removeItem(`${LX_NS}:session`); } catch {}
  try { localStorage.removeItem(`${LX_NS}:lang`); } catch {}
  try { localStorage.removeItem(`${LX_NS}:lockout`); } catch {}
}

// Ejecuta la rehidratación inmediatamente al cargar este script.
_hydrate();

// ── API pública de mutación ────────────────────────────────────────────────

const LxState = {
  ns: LX_NS,
  collections: LX_COLLECTIONS,

  // Genera un ID único con prefijo (ej: 'cl', 'pu', 'rec').
  newId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  },

  // Suscripción a cambios. handler recibe { collection }.
  subscribe(handler) {
    const fn = (e) => handler(e.detail);
    window.addEventListener('lx-state', fn);
    return () => window.removeEventListener('lx-state', fn);
  },

  // Reset y reload — útil desde Admin o devtools.
  resetAll() { _resetAll(); location.reload(); },

  // ── CRUD genérico ─
  add(collectionName, record) {
    const arr = window[collectionName];
    if (!Array.isArray(arr)) return null;
    arr.push(record);
    _commit(collectionName);
    return record;
  },

  update(collectionName, id, patch) {
    const arr = window[collectionName];
    if (!Array.isArray(arr)) return null;
    const idx = arr.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    arr[idx] = { ...arr[idx], ...patch };
    _commit(collectionName);
    return arr[idx];
  },

  remove(collectionName, id) {
    const arr = window[collectionName];
    if (!Array.isArray(arr)) return false;
    const idx = arr.findIndex((r) => r.id === id);
    if (idx < 0) return false;
    arr.splice(idx, 1);
    _commit(collectionName);
    return true;
  },

  // ── Verbos específicos del dominio ─
  addClient(data) {
    const id = this.newId('cl');
    const client = {
      id,
      preferredLang: 'es',
      tier: 'Atelier',
      brands: [],
      allergies: [],
      affinities: [],
      since: String(new Date().getFullYear()),
      loyalty: { name: 'Luxe Circle', tier: 'Atelier', points: 0, toNext: 10000 },
      stats: { ltv: 0, visits: 0, avgTicket: 0, lastPurchase: null },
      skin: { type: '', concerns: [], tone: '' },
      ...data,
    };
    return this.add('CLIENTS', client);
  },

  updateClient(id, patch) { return this.update('CLIENTS', id, patch); },

  addPurchase(data) {
    const id = this.newId('pu');
    const purchase = {
      id,
      at: new Date().toISOString(),
      storeId: window.CURRENT_BA?.storeId,
      ...data,
    };
    return this.add('PURCHASES', purchase);
  },

  addRecommendation(data) {
    const id = this.newId('rec');
    const rec = {
      id,
      at: new Date().toISOString().slice(0, 10),
      status: 'pending',
      baId: window.CURRENT_BA?.id,
      ...data,
    };
    return this.add('RECOMMENDATIONS', rec);
  },

  addCommunication(data) {
    const id = this.newId('co');
    const comm = {
      id,
      at: new Date().toISOString(),
      direction: 'out',
      baId: window.CURRENT_BA?.id,
      ...data,
    };
    return this.add('COMMUNICATIONS', comm);
  },

  addAppointment(data) {
    const id = this.newId('ap');
    const appt = {
      id,
      status: 'confirmed',
      baId: window.CURRENT_BA?.id,
      ...data,
    };
    return this.add('APPOINTMENTS', appt);
  },

  addSample(data) {
    const id = this.newId('sm');
    const sample = {
      id,
      givenAt: new Date().toISOString().slice(0, 10),
      converted: false,
      baId: window.CURRENT_BA?.id,
      ...data,
    };
    return this.add('SAMPLES', sample);
  },

  addConsent(data) {
    const consent = {
      at: new Date().toISOString(),
      version: window.PRIVACY_NOTICE_VERSION || 'v2026.01',
      ...data,
    };
    window.CONSENTS.push(consent);
    _commit('CONSENTS');
    return consent;
  },

  // ── Aliases con persistencia para arrays globales sueltos ─
  // Algunas pantallas hacen window.CONSENTS.push(...) directamente. Para mantener
  // compat sin reescribir todo, exponemos saveAll() que persiste todo el estado.
  saveAll() {
    for (const name of LX_COLLECTIONS) _commit(name);
  },
};

// ── Hook React: re-render cuando una colección cambia ────────────────────

function useLxData(collectionName) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const off = LxState.subscribe((d) => {
      if (!collectionName || d.collection === collectionName) setTick((n) => n + 1);
    });
    return off;
  }, [collectionName]);
  return [window[collectionName], tick];
}

Object.assign(window, { LxState, useLxData, LX_NS });
