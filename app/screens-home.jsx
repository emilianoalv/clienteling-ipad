// Screen: Login + Home / Hoy — refined for adoption + speed

function ScreenLogin({ onSignIn }) {
  const { t } = useI18n();
  const [picked, setPicked] = React.useState(null); // null | {role, name, store, ...}
  const [pin, setPin] = React.useState('');
  const tryEnter = () => { if (pin.length===6 && picked && onSignIn) onSignIn(picked, pin); };

  // 3 quick-pick personas — one per role we want to demo
  const personas = [
    { role:'BA',      name:'Valentina Ríos',  sub:'Beauty Advisor · Lancôme',         store:'Liverpool Polanco', initials:'VR', tone:'lancome' },
    { role:'Manager', name:'Mariana Castillo', sub:'Store Manager · Liverpool',     store:'Liverpool Polanco', initials:'MC', tone:'ink' },
    { role:'HQ',      name:'Andrea Solís',     sub:'Dirección regional · HQ México', store:'L\u2019Oréal Luxe MX', initials:'AS', tone:'ysl' },
  ];

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 1.15fr', background:'var(--paper)' }}>
      {/* Left — editorial brand panel */}
      <div style={{ position:'relative', background:'linear-gradient(180deg, #1a1715 0%, #0E0E0F 100%)', color:'#F2EEE8', padding:'56px 56px', display:'flex', flexDirection:'column', justifyContent:'space-between', overflow:'hidden' }}>
        <div>
          <div className="lx-micro" style={{ color:'rgba(242,238,232,.55)' }}>L'Oréal Luxe · México</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 72, lineHeight:0.95, letterSpacing:'-0.02em', marginTop: 18 }}>L'Oréal</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 72, lineHeight:0.95, letterSpacing:'-0.02em', fontStyle:'italic', color:'rgba(242,238,232,.7)' }}>Clienteling</div>
          <div className="lx-small" style={{ color:'rgba(242,238,232,.55)', marginTop: 22, maxWidth: 360, lineHeight: 1.55 }}>
            Plataforma única para Lancôme y YSL Beauty.
          </div>
        </div>
        <div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 22, lineHeight: 1.35, maxWidth: 360, fontStyle:'italic', color:'rgba(242,238,232,.85)' }}>
            "Cada clienta merece ser reconocida por su nombre, su historia, y su belleza."
          </div>
          <div className="lx-micro" style={{ color:'rgba(242,238,232,.5)', marginTop: 18 }}>Liverpool · Palacio de Hierro</div>
        </div>
        <div style={{ position:'absolute', inset: 0, background:'radial-gradient(ellipse at 80% 30%, rgba(201,169,97,.18), transparent 60%)', pointerEvents:'none' }}/>
      </div>

      {/* Right — sign-in */}
      <div style={{ padding:'56px 64px', display:'flex', flexDirection:'column', gap: 24, background:'var(--paper)', overflow:'auto' }} className="lx-scroll">
        <div>
          <div className="lx-micro">{t('auth.signIn')}</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 40, letterSpacing:'-0.01em', lineHeight:1.05 }}>{t('auth.welcome')}</div>
          <div className="lx-small" style={{ marginTop: 6 }}>{t('auth.pickUser')}</div>
        </div>

        {/* 3 user picker buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap: 10 }}>
          {personas.map(p => {
            const isSel = picked?.role === p.role;
            return (
              <button key={p.role}
                onClick={() => { setPicked(p); setPin(''); }}
                style={{
                  textAlign:'left', padding:'14px 16px', borderRadius: 14,
                  border: isSel ? '1.5px solid var(--ink)' : '1px solid var(--line)',
                  background: isSel ? '#fff' : 'var(--bone)',
                  boxShadow: isSel ? '0 2px 10px rgba(0,0,0,.05)' : 'none',
                  display:'flex', alignItems:'center', gap: 14, cursor:'pointer', transition:'all .15s',
                }}>
                <LxAvatar label={p.initials} tone={p.tone} size={48}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--f-display)', fontSize: 19, letterSpacing:'-0.005em', lineHeight:1.1 }}>{p.name}</div>
                  <div className="lx-small" style={{ marginTop: 3, fontSize: 12.5 }}>{p.sub}</div>
                  <div className="lx-micro" style={{ marginTop: 4, fontSize: 9.5 }}>{p.store}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: isSel?'6px solid var(--ink)':'1.5px solid var(--line)', background:'#fff' }}/>
              </button>
            );
          })}
        </div>

        {/* PIN pad */}
        <div>
          <div className="lx-micro" style={{ marginBottom: 8 }}>{t('auth.pin')} {picked && <span style={{ color:'var(--ink-40)' }}>· {t('auth.pin.demo')}</span>}</div>
          <div style={{ display:'flex', gap: 8, marginBottom: 12 }}>
            {Array.from({ length:6 }).map((_,i) => (
              <div key={i} style={{
                flex: 1, height: 48, border:'1px solid var(--line)', borderRadius: 10,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize: 22, fontWeight:600, background:'#fff',
                color: i < pin.length ? 'var(--ink)' : 'var(--ink-40)',
              }}>
                {i < pin.length ? '•' : ''}
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8 }}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d,i) => (
              <button key={i} disabled={!d || !picked}
                onClick={() => { if (d === '⌫') setPin(p=>p.slice(0,-1)); else if (d && pin.length<6) setPin(p=>p+d); }}
                style={{
                  height: 48, borderRadius: 10, border:'1px solid var(--line)',
                  background: d ? '#fff' : 'transparent',
                  fontSize: 18, fontWeight: 500,
                  cursor: (d && picked)?'pointer':'default',
                  opacity: (!picked && d) ? .4 : 1,
                  visibility: d?'visible':'hidden',
                }}>{d}</button>
            ))}
          </div>
        </div>

        <button className="lx-btn lx-btn--primary lx-btn--lg" style={{ width:'100%' }} disabled={pin.length<6 || !picked} onClick={tryEnter}>
          {picked ? t('auth.enterAs', { name: picked.name.split(' ')[0] }) : t('auth.pickUserFirst')}
        </button>
        <div className="lx-small" style={{ textAlign:'center', marginTop: -8, fontSize: 11.5 }}>
          Dispositivo <span style={{ fontWeight: 600 }}>LX-IPAD-001</span> · iPadOS 18.3 · v1.4.2
        </div>
      </div>
    </div>
  );
}

// — Quick Action tile (big, thumb-sized, elegant)
function QuickAction({ icon, label, sub, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className="lx-quick"
      style={primary ? { background:'var(--ink)', borderColor:'var(--ink)', color:'#fff' } : null}>
      <span className="lx-quick-icon" style={primary ? { background:'rgba(255,255,255,.12)', color:'#fff' } : null}>
        {icon}
      </span>
      <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
        <span className="lx-quick-label">{label}</span>
        <span className="lx-quick-sub" style={primary ? { color:'rgba(255,255,255,.65)' } : null}>{sub}</span>
      </div>
    </button>
  );
}

// — Pending action row (urgent, tap-to-resolve)
function PendingRow({ dot, title, sub, right, cta, onClick }) {
  return (
    <div className="lx-pending">
      <span className={`lx-pending-dot ${dot==='err'?'lx-pending-dot--err':dot==='ok'?'lx-pending-dot--ok':''}`}/>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing:'-0.005em' }}>{title}</div>
        <div className="lx-small" style={{ fontSize: 12 }}>{sub}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        {right && <span className="lx-small tn" style={{ fontSize: 12 }}>{right}</span>}
        <button className="lx-btn lx-btn--sm" style={{ height: 30 }} onClick={onClick}>{cta || 'Atender'}</button>
      </div>
    </div>
  );
}

function AgendaRow({ ap, onClick }) {
  const c = getClient(ap.clientId);
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap: 14, padding:'12px 0', borderBottom:'1px solid var(--line)', cursor: onClick?'pointer':'default', transition:'background .15s' }}
      onMouseEnter={e=>onClick && (e.currentTarget.style.background='var(--bone)')}
      onMouseLeave={e=>onClick && (e.currentTarget.style.background='transparent')}>
      <div style={{ width: 56, textAlign:'right' }}>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 20, lineHeight:1 }}>{fmtTime(ap.at)}</div>
        <div className="lx-small" style={{ fontSize: 10.5 }}>{ap.duration}m</div>
      </div>
      <div style={{ width: 1, height: 32, background: 'var(--line)' }}/>
      <LxAvatar label={c.initials} size={36} tone={ap.brand==='Lancôme'?'lancome':'ysl'}/>
      <div style={{ flex: 1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize: 14, letterSpacing:'-0.005em' }}>{c.name}</div>
        <div className="lx-small" style={{ fontSize: 12 }}>{ap.type}</div>
      </div>
      <LxBrandTag brand={ap.brand} small/>
    </div>
  );
}

// Color por tipo de evento de vida.
const EVENT_TYPE_STYLES = {
  birthday:      { bg:'rgba(232,196,192,.35)', border:'rgba(184,95,99,.4)', tint:'#B85F63', icon:'🎂' },
  anniversary:   { bg:'rgba(201,169,97,.18)',  border:'rgba(201,169,97,.45)', tint:'#9C7E36', icon:'★' },
  replenishment: { bg:'rgba(31,122,90,.10)',   border:'rgba(31,122,90,.30)', tint:'var(--ok)', icon:'⟳' },
};

function UpcomingEventRow({ client, event, onClick }) {
  const style = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.birthday;
  const { t } = useI18n();
  const whenLabel = event.daysUntil === 0 ? t('home.event.today')
    : event.daysUntil === 1 ? t('home.event.tomorrow')
    : event.daysUntil < 0 ? t('home.event.overdue', { n: -event.daysUntil })
    : t('home.event.in', { n: event.daysUntil });
  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap: 12, padding:'10px 14px',
      borderRadius: 10, background: style.bg, border: `1px solid ${style.border}`,
      cursor:'pointer', transition:'background .15s',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 18, background:'#fff', display:'flex',
        alignItems:'center', justifyContent:'center', fontSize: 18, color: style.tint,
      }}>{style.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing:'-0.005em' }}>{client.name}</div>
        <div className="lx-small" style={{ fontSize: 11.5, marginTop: 2 }}>{event.label}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="lx-num" style={{ fontSize: 12, fontWeight: 600, color: style.tint, textTransform:'lowercase' }}>{whenLabel}</div>
        <div className="lx-small" style={{ fontSize: 10, marginTop: 2 }}>{fmtDate(event.date)}</div>
      </div>
    </div>
  );
}

function ScreenHome({ onNav, onOpenClient }) {
  const lock = useBrandLock();
  const { t } = useI18n();
  // Cita seleccionada para modal de detalle.
  const [selectedAppt, setSelectedAppt] = React.useState(null);
  // Tick para refrescar tras mutar una cita.
  const [, setApptTick] = React.useState(0);
  React.useEffect(() => {
    const on = (e) => { if (e.detail?.collection === 'APPOINTMENTS') setApptTick((n) => n + 1); };
    window.addEventListener('lx-state', on);
    return () => window.removeEventListener('lx-state', on);
  }, []);
  const allToday = APPOINTMENTS.filter(a => a.at.startsWith('2026-04-24'));
  const allNext  = APPOINTMENTS.filter(a => a.at.startsWith('2026-04-25'));
  const todayAppts = lock ? allToday.filter(a => a.brand === lock) : allToday;
  const nextAppts  = lock ? allNext.filter(a => a.brand === lock)  : allNext;
  const pendingCount = TASKS.length + 2; // 2 appts to confirm

  // RF-09: eventos de vida próximos del portafolio del BA actual.
  const baEvents = getUpcomingEventsForBA(undefined, { windowDays: 45 }).slice(0, 5);
  const firstName = (window.CURRENT_BA?.name || '').split(' ')[0] || 'Valentina';

  return (
    <div style={{ padding: '28px 32px', display:'flex', flexDirection:'column', gap: 24 }}>

      {/* HERO — greeting + single decisive CTA */}
      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap: 20 }}>
        <div className="lx-card-luxe" style={{ padding:'32px 36px', background:'linear-gradient(180deg,#fff 0%, var(--paper) 100%)' }}>
          <div className="lx-micro">Viernes 24 · Abril · Liverpool Polanco</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 52, lineHeight:1, letterSpacing:'-0.02em', marginTop: 10 }}>
            {t('home.greeting.morning')} <span style={{ fontStyle:'italic' }}>{firstName}</span>.
          </div>
          <div style={{ marginTop: 18, display:'flex', alignItems:'center', gap: 28, flexWrap:'wrap' }}>
            <div><div className="lx-stat-label">{t('home.label.todayAppts')}</div><div className="lx-stat-value tn">{todayAppts.length}</div></div>
            <div style={{ width:1, height: 36, background:'var(--line)' }}/>
            <div><div className="lx-stat-label">{t('home.pending')}</div><div className="lx-stat-value tn" style={{ color: pendingCount>3?'var(--err)':'var(--ink)' }}>{pendingCount}</div></div>
            <div style={{ width:1, height: 36, background:'var(--line)' }}/>
            <div><div className="lx-stat-label">{t('home.monthGoal')}</div><div className="lx-stat-value tn">72<span style={{ fontSize:18, color:'var(--ink-60)' }}>%</span></div></div>
          </div>
        </div>

        {/* Objective mini */}
        <div className="lx-card-luxe" style={{ padding:'24px 28px', display:'flex', alignItems:'center', gap: 20 }}>
          <svg width="92" height="92" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="46" fill="none" stroke="var(--ink-08)" strokeWidth="8"/>
            <circle cx="55" cy="55" r="46" fill="none" stroke="var(--ink)" strokeWidth="8"
              strokeDasharray={`${2*Math.PI*46*0.72} 999`} strokeLinecap="round" transform="rotate(-90 55 55)"/>
            <text x="55" y="60" textAnchor="middle" fontFamily="var(--f-display)" fontSize="22" fill="var(--ink)">72%</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div className="lx-micro">{t('home.monthGoal')}</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4 }}>{MXN(1184020)}</div>
            <div className="lx-small">de {MXN(1650000)} · Proyección +6%</div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS — 4 tiles, finger-friendly */}
      <div>
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">{t('home.quick.title')}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
          <QuickAction icon={<I.plus size={18}/>}   label={t('home.quick.newClient')}      sub="Registra una nueva clienta"     onClick={()=>onNav('new')}/>
          <QuickAction icon={<I.search size={18}/>} label={t('home.quick.searchClient')}   sub="Encuentra una clienta"          onClick={()=>onNav('clients')}/>
          <QuickAction icon={<I.bag size={18}/>}    label={t('home.quick.registerSale')}   sub="Captura una compra"             onClick={()=>onNav('basket')}/>
          <QuickAction icon={<I.cal size={18}/>}    label={t('home.quick.bookAppt')}       sub="Programa una visita"            onClick={()=>onNav('new-appt')}/>
        </div>
      </div>

      {/* UPCOMING LIFE EVENTS (RF-09) — cumpleaños, aniversarios, reposiciones */}
      {baEvents.length > 0 && (
        <div className="lx-card-luxe" style={{ padding: 20 }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 12 }}>
            <div>
              <div className="lx-micro">{t('home.events.window', { days: 45 })}</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 2 }}>
                {t('home.events.title')} · <span className="tn">{baEvents.length}</span>
              </div>
            </div>
            <span className="lx-chip" style={{ height: 22, fontSize: 11, background:'var(--bone)' }}>
              {t('home.events.summary', {
                birthdays: baEvents.filter((e) => e.event.type === 'birthday').length,
                replenishments: baEvents.filter((e) => e.event.type === 'replenishment').length,
              })}
            </span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
            {baEvents.map((ev, i) => (
              <UpcomingEventRow key={i} client={ev.client} event={ev.event}
                onClick={() => (onOpenClient ? onOpenClient(ev.client.id) : onNav('profile'))}/>
            ))}
          </div>
        </div>
      )}

      {/* TWO-UP: Pending (priority) + Agenda */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr', gap: 20 }}>

        {/* PENDING — front and center */}
        <div className="lx-card-luxe" style={{ padding: 0 }}>
          <div style={{ padding:'20px 24px 8px 24px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <div>
              <div className="lx-micro">{t('home.pending.title')}</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 24, marginTop: 2 }}>{t('home.pending')} · <span className="tn">{pendingCount}</span></div>
            </div>
            <span className="lx-chip lx-chip--warn" style={{ height: 22, fontSize: 11 }}>{t('home.pending.urgent', { n: 3 })}</span>
          </div>
          <div style={{ padding: '0 8px 8px 8px' }}>
            <PendingRow dot="err"  title="Muestra Advanced Génifique vence hoy"
              sub="Carolina Mendoza · enviada hace 13 días" right="Hoy" cta="Pedir feedback" onClick={()=>onNav('profile')}/>
            <PendingRow dot="err"  title="Cita sin confirmar · mañana 11:00"
              sub="Sofía Ruiz · Ritual Absolue" right="Mañana" cta="Confirmar" onClick={()=>onNav('cal')}/>
            <PendingRow dot="warn" title="Recomendación sin abrir · 3 días"
              sub="Natalia Hernández · Rouge Volupté Shine" right="−3d" cta="Reenviar" onClick={()=>onNav('profile')}/>
            <PendingRow dot="warn" title="Cumpleaños esta semana · 2 clientas"
              sub="Ana Torres (sáb) · Paulina Ríos (dom)" right="+2" cta="Saludar" onClick={()=>onNav('clients')}/>
            <PendingRow dot="ok"   title="Seguimiento post-compra"
              sub="Isabella Ortega · Libre EDP · entrega hoy" right="Hoy" cta="Agendar" onClick={()=>onNav('profile')}/>
          </div>
        </div>

        {/* AGENDA */}
        <div className="lx-card-luxe">
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 6 }}>
            <div>
              <div className="lx-micro">{t('home.agenda')}</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 24, marginTop: 2 }}>{t('home.agenda.todayPrefix')} <span className="tn">{todayAppts.length}</span> {t('home.agenda.todaySuffix')}</div>
            </div>
            <button className="lx-btn lx-btn--sm" onClick={() => onNav('cal')}>{t('home.calendar')} <I.arrowR/></button>
          </div>
          {todayAppts.map(a => <AgendaRow key={a.id} ap={a} onClick={()=>setSelectedAppt(a)}/>)}
          <div className="lx-micro" style={{ marginTop: 18, marginBottom: 6 }}>{t('home.agenda.tomorrow')}</div>
          {nextAppts.slice(0, 2).map(a => <AgendaRow key={a.id} ap={a} onClick={()=>setSelectedAppt(a)}/>)}
        </div>
      </div>

      {selectedAppt && typeof AppointmentDetailModal !== 'undefined' && (
        <AppointmentDetailModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onOpenClientProfile={onOpenClient}
        />
      )}
    </div>
  );
}

Object.assign(window, { ScreenLogin, ScreenHome });
