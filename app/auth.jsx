// Autenticación PIN persistida para el prototipo.
//
// El demo permite cualquier PIN de 6 dígitos; el "mock inteligente" valida contra
// un PIN por usuario (definido en BAS/USERS) y aplica bloqueo tras 3 intentos
// fallidos en 5 minutos. La sesión se guarda en localStorage con expiración 12 h.
//
// Uso:
//   LxAuth.login({ role: 'BA', name: 'Valentina Ríos' }, '123456')
//     → { ok: true, user } | { ok: false, reason, attemptsLeft, lockoutUntil }
//   LxAuth.logout()
//   LxAuth.currentUser()   → user | null
//   LxAuth.isLocked()      → null | { until: ISO, minutesLeft }

const LX_NS_AUTH = window.LX_NS || 'lx-clienteling:v1';
const LX_SESSION_KEY = `${LX_NS_AUTH}:session`;
const LX_LOCKOUT_KEY = `${LX_NS_AUTH}:lockout`;
const LX_SESSION_HOURS = 12;
const LX_MAX_ATTEMPTS = 3;
const LX_LOCKOUT_MINUTES = 5;

function _safeLoad(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _safeSave(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function _safeRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// Resuelve un user record desde una persona del Login (role+name) o desde un userId.
function _resolveUser(persona) {
  if (!persona) return null;
  if (persona.id) {
    return (window.USERS || []).find((u) => u.id === persona.id)
        || (window.BAS || []).find((b) => b.id === persona.id);
  }
  // Match por nombre dentro del rol seleccionado
  const bas = window.BAS || [];
  const users = window.USERS || [];
  const byName = (arr) => arr.find((u) => u.name === persona.name && u.role === persona.role);
  return byName(bas) || byName(users)
      || bas.find((b) => b.role === persona.role)
      || users.find((u) => u.role === persona.role);
}

// PIN demo por rol: en el prototipo cualquier PIN de 6 dígitos pasa.
// Si un user record trae `pin`, validamos contra ese.
function _validatePin(user, pin) {
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) return false;
  if (user && user.pin) return user.pin === pin;
  return true; // demo: cualquier PIN de 6 dígitos
}

const LxAuth = {
  // ── Lockout ────────────────────────────────────────────────────────────

  isLocked() {
    const l = _safeLoad(LX_LOCKOUT_KEY);
    if (!l || !l.until) return null;
    const untilMs = Date.parse(l.until);
    if (isNaN(untilMs) || untilMs <= Date.now()) {
      _safeRemove(LX_LOCKOUT_KEY);
      return null;
    }
    return {
      until: l.until,
      minutesLeft: Math.max(1, Math.ceil((untilMs - Date.now()) / 60000)),
    };
  },

  _recordFailure() {
    const now = Date.now();
    const cur = _safeLoad(LX_LOCKOUT_KEY) || { failures: [] };
    // Limpiar intentos fuera de ventana (5 min)
    const recent = (cur.failures || []).filter((ts) => now - ts < LX_LOCKOUT_MINUTES * 60000);
    recent.push(now);
    if (recent.length >= LX_MAX_ATTEMPTS) {
      const until = new Date(now + LX_LOCKOUT_MINUTES * 60000).toISOString();
      _safeSave(LX_LOCKOUT_KEY, { failures: recent, until });
      return { locked: true, attemptsLeft: 0, until };
    }
    _safeSave(LX_LOCKOUT_KEY, { failures: recent });
    return { locked: false, attemptsLeft: LX_MAX_ATTEMPTS - recent.length };
  },

  _clearFailures() {
    _safeRemove(LX_LOCKOUT_KEY);
  },

  // ── Login / logout ─────────────────────────────────────────────────────

  login(persona, pin) {
    const locked = this.isLocked();
    if (locked) {
      return { ok: false, reason: 'locked', minutesLeft: locked.minutesLeft };
    }

    const user = _resolveUser(persona);
    if (!user) return { ok: false, reason: 'user_not_found' };

    if (!_validatePin(user, pin)) {
      const r = this._recordFailure();
      return {
        ok: false,
        reason: r.locked ? 'locked' : 'wrong_pin',
        attemptsLeft: r.attemptsLeft,
        minutesLeft: r.locked ? LX_LOCKOUT_MINUTES : undefined,
      };
    }

    // Éxito — crear sesión
    this._clearFailures();
    const session = {
      userId: user.id,
      role: user.role,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + LX_SESSION_HOURS * 3600_000).toISOString(),
    };
    _safeSave(LX_SESSION_KEY, session);
    window.CURRENT_BA = user;
    window.dispatchEvent(new CustomEvent('lx-session', { detail: { user, session } }));
    return { ok: true, user, session };
  },

  logout() {
    _safeRemove(LX_SESSION_KEY);
    window.CURRENT_BA = (window.BAS || [])[0] || null;
    window.dispatchEvent(new CustomEvent('lx-session', { detail: { user: null } }));
  },

  // ── Sesión actual ──────────────────────────────────────────────────────

  currentSession() {
    const s = _safeLoad(LX_SESSION_KEY);
    if (!s) return null;
    if (s.expiresAt && Date.parse(s.expiresAt) <= Date.now()) {
      _safeRemove(LX_SESSION_KEY);
      return null;
    }
    return s;
  },

  currentUser() {
    const s = this.currentSession();
    if (!s) return null;
    return (window.BAS || []).find((b) => b.id === s.userId)
        || (window.USERS || []).find((u) => u.id === s.userId)
        || null;
  },

  // Llamar al cargar la app — restaura CURRENT_BA si hay sesión válida.
  hydrate() {
    const u = this.currentUser();
    if (u) {
      window.CURRENT_BA = u;
      window.dispatchEvent(new CustomEvent('lx-session', { detail: { user: u } }));
    }
  },
};

LxAuth.hydrate();

// Hook React — re-renderiza al cambiar sesión.
function useSession() {
  const [user, setUser] = React.useState(window.CURRENT_BA || null);
  React.useEffect(() => {
    const onSession = (e) => setUser(e.detail?.user || window.CURRENT_BA || null);
    window.addEventListener('lx-session', onSession);
    return () => window.removeEventListener('lx-session', onSession);
  }, []);
  return user;
}

Object.assign(window, { LxAuth, useSession });
