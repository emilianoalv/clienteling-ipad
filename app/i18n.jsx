// Sistema i18n mínimo para el prototipo.
//
// Uso:
//   const { t, lang, setLang } = useI18n();
//   <h1>{t('home.greeting', { name: 'Valentina' })}</h1>
//
// Strings desconocidas devuelven la propia key (fallback explícito durante migración).
// Por ahora cubrimos los strings de Home, Clientes, Perfil y Captura — las demás
// pantallas se traducen en fases posteriores. El bundle en-US es opcional: si no
// hay traducción para una key, cae a es-MX y luego a la key cruda.

const LX_LANGS = ['es-MX', 'en-US'];
const LX_LANG_DEFAULT = 'es-MX';
const LX_LANG_STORAGE = `${window.LX_NS || 'lx-clienteling:v1'}:lang`;

const LX_STRINGS = {
  'es-MX': {
    // App-wide
    'app.brand': "L'Oréal Luxe · Clienteling",
    'app.search': 'Buscar…',
    'app.cancel': 'Cancelar',
    'app.save': 'Guardar',
    'app.delete': 'Eliminar',
    'app.edit': 'Editar',
    'app.viewAll': 'Ver todo',
    'app.back': 'Volver',
    'app.next': 'Siguiente',
    'app.previous': 'Anterior',
    'app.online': 'Conectado',
    'app.offline': 'Sin conexión',
    'app.loading': 'Cargando…',
    'app.empty': 'Sin registros',
    'app.confirm': 'Confirmar',
    'app.close': 'Cerrar',

    // Rail
    'rail.home': 'Hoy',
    'rail.clients': 'Clientas',
    'rail.catalog': 'Catálogo',
    'rail.appointments': 'Agenda',
    'rail.followup': 'Seguimiento',
    'rail.commlog': 'Bitácora',
    'rail.samples': 'Muestras',
    'rail.purchases': 'Compras',
    'rail.perf': 'Mi desempeño',

    // Home
    'home.greeting.morning':   'Buenos días,',
    'home.greeting.afternoon': 'Buenas tardes,',
    'home.greeting.evening':   'Buenas noches,',
    'home.quick.title':        'Acción rápida',
    'home.quick.newClient':    'Nueva clienta',
    'home.quick.searchClient': 'Buscar clienta',
    'home.quick.registerSale': 'Registrar venta',
    'home.quick.bookAppt':     'Agendar cita',
    'home.pending':            'Pendientes',
    'home.pending.title':      'Requiere tu atención',
    'home.pending.urgent':     '{n} urgentes',
    'home.label.todayAppts':   'Citas hoy',
    'home.todayAppts':         'Hoy · {count} citas',
    'home.agenda.todayPrefix': 'Hoy ·',
    'home.agenda.todaySuffix': 'citas',
    'home.monthGoal':          'Objetivo mensual',
    'home.monthSales':         'Ventas del mes',
    'home.agenda':             'Agenda',
    'home.agenda.tomorrow':    'Mañana',
    'home.calendar':           'Calendario',
    'home.events.title':       'Próximos eventos',
    'home.events.window':      'Eventos de vida · próximos {days} días',
    'home.events.summary':     '{birthdays} cumpleaños · {replenishments} reposiciones',
    'home.event.in':           'en {n} días',
    'home.event.today':        'hoy',
    'home.event.tomorrow':     'mañana',
    'home.event.overdue':      'vencido {n}d',
    'event.birthday':          'Cumpleaños · {age} años',
    'event.anniversary':       'Aniversario · {years} años como clienta',
    'event.replenishment':     'Reposición · {product}',

    // Clients
    'clients.title': 'Clientas',
    'clients.new': 'Nueva clienta',
    'clients.search': 'Buscar por nombre, teléfono o email…',
    'clients.segment.all': 'Todas',
    'clients.segment.vip': 'VIP',
    'clients.segment.recurrent': 'Recurrente',
    'clients.segment.new': 'Nueva',
    'clients.segment.atRisk': 'En riesgo',
    'clients.col.client': 'CLIENTA · EMAIL',
    'clients.col.phone': 'TELÉFONO',
    'clients.col.segment': 'SEGMENTO',
    'clients.col.ltv': 'LTV',
    'clients.col.lastVisit': 'ÚLTIMA VISITA',
    'clients.count': '{n} de {total} clientas',
    'clients.export': 'Exportar',

    // Profile
    'profile.recommend': 'Recomendar productos',
    'profile.registerVisit': 'Registrar visita',
    'profile.registerSale': 'Registrar venta',
    'profile.giveSample': 'Dar muestra',
    'profile.followUp': 'Seguimiento',
    'profile.tab.timeline': 'Línea de tiempo',
    'profile.tab.purchases': 'Compras',
    'profile.tab.recs': 'Recomendaciones',
    'profile.tab.samples': 'Muestras',
    'profile.tab.comms': 'Comunicaciones',
    'profile.tab.consent': 'Consentimientos',
    'profile.card.loyalty': 'Lealtad',
    'profile.card.skin': 'Perfil de piel',
    'profile.card.affinities': 'Afinidades',
    'profile.card.interests': 'Intereses',
    'profile.card.upcoming': 'Próximas citas',
    'profile.skin.type': 'Tipo',
    'profile.skin.tone': 'Tono',
    'profile.skin.concerns': 'Preocupaciones',
    'profile.skin.allergies': 'Alergias y notas médicas',
    'profile.purchases.empty': 'Sin compras registradas.',
    'profile.purchases.total': 'Total',

    // Capture / new client
    'capture.step.basic': 'Datos básicos',
    'capture.step.interests': 'Intereses',
    'capture.step.privacy': 'Aviso de privacidad',
    'capture.firstName': 'Nombre(s)',
    'capture.lastName': 'Apellido(s)',
    'capture.gender': 'Género',
    'capture.gender.f': 'Femenino',
    'capture.gender.m': 'Masculino',
    'capture.gender.x': 'No binario',
    'capture.gender.np': 'Prefiero no decir',
    'capture.birthdate': 'Fecha de nacimiento',
    'capture.ageRange': 'Rango de edad',
    'capture.phone': 'Teléfono celular',
    'capture.email': 'Correo electrónico',
    'capture.privacy.accept': 'He leído y acepto el aviso de privacidad',
    'capture.privacy.version': 'Versión {version}',
    'capture.visitReason': 'Motivo de visita',
    'capture.reason.newPurchase': 'Nueva compra',
    'capture.reason.repurchase': 'Recompra',
    'capture.reason.gift': 'Regalo',
    'capture.reason.concern': 'Preocupación / consulta',
    'capture.reason.promo': 'Promoción',
    'capture.reason.discover': 'Conocer productos',

    // Auth
    'auth.welcome': 'Bienvenida',
    'auth.signIn': 'Inicio de sesión',
    'auth.pickUser': 'Toca tu usuario para continuar.',
    'auth.pin': 'PIN — 6 dígitos',
    'auth.pin.demo': '(cualquiera funciona en demo)',
    'auth.pin.incorrect': 'PIN incorrecto. Intentos restantes: {n}',
    'auth.locked': 'Cuenta bloqueada. Vuelve a intentar en {min} min.',
    'auth.enterAs': 'Entrar como {name}',
    'auth.pickUserFirst': 'Selecciona un usuario',
    'auth.logout': 'Cerrar sesión',
  },

  'en-US': {
    'app.brand': "L'Oréal Luxe · Clienteling",
    'app.search': 'Search…',
    'app.cancel': 'Cancel',
    'app.save': 'Save',
    'app.delete': 'Delete',
    'app.edit': 'Edit',
    'app.viewAll': 'View all',
    'app.back': 'Back',
    'app.next': 'Next',
    'app.previous': 'Previous',
    'app.online': 'Online',
    'app.offline': 'Offline',
    'app.loading': 'Loading…',
    'app.empty': 'No records',
    'app.confirm': 'Confirm',
    'app.close': 'Close',

    'rail.home': 'Today',
    'rail.clients': 'Clients',
    'rail.catalog': 'Catalog',
    'rail.appointments': 'Calendar',
    'rail.followup': 'Follow-up',
    'rail.commlog': 'Conversations',
    'rail.samples': 'Samples',
    'rail.purchases': 'Purchases',
    'rail.perf': 'My performance',

    'home.greeting.morning':   'Good morning,',
    'home.greeting.afternoon': 'Good afternoon,',
    'home.greeting.evening':   'Good evening,',
    'home.quick.title':        'Quick actions',
    'home.quick.newClient':    'New client',
    'home.quick.searchClient': 'Search client',
    'home.quick.registerSale': 'Register sale',
    'home.quick.bookAppt':     'Book appointment',
    'home.pending':            'Pending',
    'home.pending.title':      'Needs your attention',
    'home.pending.urgent':     '{n} urgent',
    'home.label.todayAppts':   'Appointments today',
    'home.todayAppts':         'Today · {count} appointments',
    'home.agenda.todayPrefix': 'Today ·',
    'home.agenda.todaySuffix': 'appointments',
    'home.monthGoal':          'Monthly goal',
    'home.monthSales':         'Month sales',
    'home.agenda':             'Schedule',
    'home.agenda.tomorrow':    'Tomorrow',
    'home.calendar':           'Calendar',
    'home.events.title':       'Upcoming events',
    'home.events.window':      'Life events · next {days} days',
    'home.events.summary':     '{birthdays} birthdays · {replenishments} replenishments',
    'home.event.in':           'in {n} days',
    'home.event.today':        'today',
    'home.event.tomorrow':     'tomorrow',
    'home.event.overdue':      'overdue {n}d',
    'event.birthday':          'Birthday · turning {age}',
    'event.anniversary':       'Anniversary · {years} years as a client',
    'event.replenishment':     'Replenishment · {product}',

    'clients.title': 'Clients',
    'clients.new': 'New client',
    'clients.search': 'Search by name, phone or email…',
    'clients.segment.all': 'All',
    'clients.segment.vip': 'VIP',
    'clients.segment.recurrent': 'Returning',
    'clients.segment.new': 'New',
    'clients.segment.atRisk': 'At risk',
    'clients.col.client': 'CLIENT · EMAIL',
    'clients.col.phone': 'PHONE',
    'clients.col.segment': 'SEGMENT',
    'clients.col.ltv': 'LTV',
    'clients.col.lastVisit': 'LAST VISIT',
    'clients.count': '{n} of {total} clients',
    'clients.export': 'Export',

    'profile.recommend': 'Recommend products',
    'profile.registerVisit': 'Register visit',
    'profile.registerSale': 'Register sale',
    'profile.giveSample': 'Give sample',
    'profile.followUp': 'Follow up',
    'profile.tab.timeline': 'Timeline',
    'profile.tab.purchases': 'Purchases',
    'profile.tab.recs': 'Recommendations',
    'profile.tab.samples': 'Samples',
    'profile.tab.comms': 'Communications',
    'profile.tab.consent': 'Consents',
    'profile.card.loyalty': 'Loyalty',
    'profile.card.skin': 'Skin profile',
    'profile.card.affinities': 'Affinities',
    'profile.card.interests': 'Interests',
    'profile.card.upcoming': 'Upcoming appointments',
    'profile.skin.type': 'Type',
    'profile.skin.tone': 'Tone',
    'profile.skin.concerns': 'Concerns',
    'profile.skin.allergies': 'Allergies and medical notes',
    'profile.purchases.empty': 'No purchases registered.',
    'profile.purchases.total': 'Total',

    'capture.step.basic': 'Basic info',
    'capture.step.interests': 'Interests',
    'capture.step.privacy': 'Privacy notice',
    'capture.firstName': 'First name(s)',
    'capture.lastName': 'Last name(s)',
    'capture.gender': 'Gender',
    'capture.gender.f': 'Female',
    'capture.gender.m': 'Male',
    'capture.gender.x': 'Non-binary',
    'capture.gender.np': 'Prefer not to say',
    'capture.birthdate': 'Date of birth',
    'capture.ageRange': 'Age range',
    'capture.phone': 'Mobile phone',
    'capture.email': 'Email',
    'capture.privacy.accept': 'I have read and accept the privacy notice',
    'capture.privacy.version': 'Version {version}',
    'capture.visitReason': 'Visit reason',
    'capture.reason.newPurchase': 'New purchase',
    'capture.reason.repurchase': 'Repurchase',
    'capture.reason.gift': 'Gift',
    'capture.reason.concern': 'Concern / consultation',
    'capture.reason.promo': 'Promotion',
    'capture.reason.discover': 'Discover products',

    'auth.welcome': 'Welcome',
    'auth.signIn': 'Sign in',
    'auth.pickUser': 'Tap your user to continue.',
    'auth.pin': 'PIN — 6 digits',
    'auth.pin.demo': '(any 6 digits work in demo)',
    'auth.pin.incorrect': 'Incorrect PIN. Attempts left: {n}',
    'auth.locked': 'Account locked. Try again in {min} min.',
    'auth.enterAs': 'Enter as {name}',
    'auth.pickUserFirst': 'Pick a user',
    'auth.logout': 'Sign out',
  },
};

function _interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
}

// Singleton de idioma activo + suscriptores.
const LxI18n = {
  langs: LX_LANGS,
  current: LX_LANG_DEFAULT,
  _subs: new Set(),

  init() {
    try {
      const stored = localStorage.getItem(LX_LANG_STORAGE);
      if (stored && LX_LANGS.includes(stored)) this.current = stored;
    } catch {}
  },

  setLang(lang) {
    if (!LX_LANGS.includes(lang)) return;
    this.current = lang;
    try { localStorage.setItem(LX_LANG_STORAGE, lang); } catch {}
    this._subs.forEach((fn) => fn(lang));
    window.dispatchEvent(new CustomEvent('lx-i18n', { detail: { lang } }));
  },

  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  },

  t(key, params) {
    const bundle = LX_STRINGS[this.current] || LX_STRINGS[LX_LANG_DEFAULT];
    const fallback = LX_STRINGS[LX_LANG_DEFAULT];
    const str = (bundle && bundle[key]) || (fallback && fallback[key]) || key;
    return _interpolate(str, params);
  },
};

LxI18n.init();

// Hook React — re-renderiza al cambiar idioma.
function useI18n() {
  const [lang, setLangState] = React.useState(LxI18n.current);
  React.useEffect(() => {
    const off = LxI18n.subscribe((l) => setLangState(l));
    return off;
  }, []);
  return {
    lang,
    t: (key, params) => LxI18n.t(key, params),
    setLang: (l) => LxI18n.setLang(l),
  };
}

// Para uso fuera de componentes React: window.LxI18n.t(key, params)

Object.assign(window, { LxI18n, useI18n });
