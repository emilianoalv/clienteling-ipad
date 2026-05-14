// Screen: Appointments + Follow-up composer (WhatsApp simulator) + Basket handoff + Samples

// Helpers de calendario
const APPT_DOW_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const APPT_MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function _startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1; // lun=0..dom=6
  d.setDate(d.getDate() - dow);
  return d;
}
function _addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function _sameDay(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function _isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function ScreenAppointments({ onNav, onOpenClient, hideHeaderCTA }) {
  const lock = useBrandLock();
  const [view, setView] = React.useState('Semana');
  // Ancla — la fecha "actual" del calendario. Para el demo arrancamos en la
  // semana de las citas mock (24 abr 2026).
  const [anchor, setAnchor] = React.useState(new Date('2026-04-24T10:00:00'));
  // Cita seleccionada para detalle modal.
  const [selectedAppt, setSelectedAppt] = React.useState(null);
  // Tick para refrescar tras mutar una cita.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const on = (e) => { if (e.detail?.collection === 'APPOINTMENTS') setTick((n) => n + 1); };
    window.addEventListener('lx-state', on);
    return () => window.removeEventListener('lx-state', on);
  }, []);

  const filteredAppts = APPOINTMENTS.filter((a) => !lock || a.brand === lock);
  const openDetail = (a) => setSelectedAppt(a);

  // Header navegación
  const shift = (n) => {
    const d = new Date(anchor);
    if (view === 'Día') d.setDate(d.getDate() + n);
    else if (view === 'Semana') d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    setAnchor(d);
  };

  let title = '';
  if (view === 'Día') {
    title = anchor.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  } else if (view === 'Semana') {
    const start = _startOfWeek(anchor);
    const end = _addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    title = sameMonth
      ? `${start.getDate()} – ${end.getDate()} ${APPT_MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`
      : `${start.getDate()} ${APPT_MONTH_NAMES[start.getMonth()].slice(0,3)} – ${end.getDate()} ${APPT_MONTH_NAMES[end.getMonth()].slice(0,3)} ${end.getFullYear()}`;
  } else {
    title = `${APPT_MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }

  const ba = window.CURRENT_BA;
  const store = ba?.storeId ? getStore(ba.storeId) : null;
  const eyebrow = view === 'Semana'
    ? `Semana ${_isoWeek(_startOfWeek(anchor))} · ${store?.name || ''}`
    : view === 'Mes'
      ? `Vista mensual · ${store?.name || ''}`
      : `Día seleccionado · ${store?.name || ''}`;

  return (
    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>
      <div className="lx-card" style={{ padding: 16, display:'flex', alignItems:'center', gap: 12 }}>
        <div>
          <div className="lx-micro">{eyebrow}</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 24, textTransform:'capitalize' }}>{title}</div>
        </div>
        <div style={{ flex:1 }}/>
        <button className="lx-btn lx-btn--sm" onClick={() => shift(-1)} aria-label="Anterior" style={{ width: 32, padding: 0 }}>‹</button>
        <button className="lx-btn lx-btn--sm" onClick={() => setAnchor(new Date('2026-04-24T10:00:00'))}>Hoy</button>
        <button className="lx-btn lx-btn--sm" onClick={() => shift(1)} aria-label="Siguiente" style={{ width: 32, padding: 0 }}>›</button>
        <LxSeg items={['Día','Semana','Mes']} value={view} onChange={setView}/>
        <button className="lx-btn"><I.filter size={14}/> Filtros</button>
        {!hideHeaderCTA && <button className="lx-btn lx-btn--primary" onClick={() => onNav && onNav('new-appt')}><I.plus/> Nueva cita</button>}
      </div>

      {view === 'Semana' && <ApptWeekView anchor={anchor} appts={filteredAppts} onPick={openDetail}/>}
      {view === 'Día' && <ApptDayView anchor={anchor} appts={filteredAppts} onPick={openDetail}/>}
      {view === 'Mes' && <ApptMonthView anchor={anchor} appts={filteredAppts} onPickDay={(d) => { setAnchor(d); setView('Día'); }} onPickAppt={openDetail}/>}

      {selectedAppt && (
        <AppointmentDetailModal
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onOpenClientProfile={onOpenClient}
        />
      )}
    </div>
  );
}

function ApptWeekView({ anchor, appts, onPick }) {
  const start = _startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => _addDays(start, i));
  const hours = ['10','11','12','13','14','15','16','17','18'];
  const slotMap = {};
  appts.forEach((a) => {
    const d = new Date(a.at);
    const col = days.findIndex((x) => _sameDay(x, d));
    if (col < 0) return;
    const row = d.getHours() - 10;
    if (row >= 0 && row < hours.length) slotMap[`${col}-${row}`] = a;
  });
  return (
    <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'60px repeat(7, 1fr)' }}>
        <div/>
        {days.map((d, i) => (
          <div key={i} style={{ padding:'12px 10px', borderBottom:'1px solid var(--line)', borderLeft:'1px solid var(--line)', background:'var(--bone)' }}>
            <div className="lx-micro">{APPT_DOW_LABELS[i]}</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 22 }}>{d.getDate()}</div>
          </div>
        ))}
        {hours.map((h, hi) => (
          <React.Fragment key={h}>
            <div style={{ padding: 8, fontSize: 11, color:'var(--ink-60)', borderTop:'1px solid var(--line)', textAlign:'right' }}>{h}:00</div>
            {days.map((_, di) => {
              const a = slotMap[`${di}-${hi}`];
              const c = a && getClient(a.clientId);
              return (
                <div key={di+'-'+hi} style={{ borderTop:'1px solid var(--line)', borderLeft:'1px solid var(--line)', minHeight: 62, padding: 4, position:'relative' }}>
                  {a && (
                    <div onClick={() => onPick(a)} style={{
                      padding:'6px 10px', borderRadius: 8,
                      background: a.brand==='Lancôme' ? 'var(--lancome-rose)' : 'var(--ink)',
                      color: a.brand==='YSL' ? 'var(--ysl-gold)' : 'var(--ink)',
                      height: '100%', cursor:'pointer',
                    }}>
                      <div style={{ fontSize: 10, opacity: .7, fontWeight: 600, letterSpacing:'0.08em' }}>{fmtTime(a.at)} · {a.duration}m</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{c?.name}</div>
                      <div style={{ fontSize: 10, opacity: .8, marginTop: 2 }}>{a.type}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ApptDayView({ anchor, appts, onPick }) {
  const hours = Array.from({ length: 11 }, (_, i) => 9 + i); // 9-19
  const dayAppts = appts.filter((a) => _sameDay(new Date(a.at), anchor));
  const slotMap = {};
  dayAppts.forEach((a) => {
    const row = new Date(a.at).getHours() - hours[0];
    if (row >= 0 && row < hours.length) slotMap[row] = a;
  });
  return (
    <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'80px 1fr' }}>
        {hours.map((h, hi) => {
          const a = slotMap[hi];
          const c = a && getClient(a.clientId);
          return (
            <React.Fragment key={h}>
              <div style={{ padding:'12px 12px', fontSize: 12, color:'var(--ink-60)', borderTop:'1px solid var(--line)', textAlign:'right' }}>{h}:00</div>
              <div style={{ borderTop:'1px solid var(--line)', borderLeft:'1px solid var(--line)', minHeight: 72, padding: 8, position:'relative' }}>
                {a && (
                  <div onClick={() => onPick(a)} style={{
                    padding:'10px 14px', borderRadius: 10,
                    background: a.brand==='Lancôme' ? 'var(--lancome-rose)' : 'var(--ink)',
                    color: a.brand==='YSL' ? 'var(--ysl-gold)' : 'var(--ink)',
                    cursor:'pointer', display:'flex', alignItems:'center', gap: 14,
                  }}>
                    <div style={{ minWidth: 80 }}>
                      <div style={{ fontSize: 11, opacity: .7, fontWeight: 600, letterSpacing:'0.08em' }}>{fmtTime(a.at)}</div>
                      <div style={{ fontSize: 11, opacity: .6 }}>{a.duration}m</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c?.name}</div>
                      <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>{a.type} · {a.brand}</div>
                    </div>
                    <span className="lx-chip" style={{ height: 22, fontSize: 11, background:'rgba(0,0,0,.1)', borderColor:'transparent' }}>{a.status}</span>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ApptMonthView({ anchor, appts, onPickDay, onPickAppt }) {
  // Empezar en el primer lunes del mes (o del mes anterior si el día 1 cae a media semana)
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = _startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => _addDays(gridStart, i)); // 6 semanas
  const today = new Date('2026-04-24T10:00:00');

  const byDay = {};
  appts.forEach((a) => {
    const k = new Date(a.at).toDateString();
    (byDay[k] = byDay[k] || []).push(a);
  });

  return (
    <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)' }}>
        {APPT_DOW_LABELS.map((d) => (
          <div key={d} style={{ padding:'10px 12px', borderBottom:'1px solid var(--line)', background:'var(--bone)' }}>
            <div className="lx-micro">{d}</div>
          </div>
        ))}
        {cells.map((d, i) => {
          const outOfMonth = d.getMonth() !== anchor.getMonth();
          const isToday = _sameDay(d, today);
          const list = byDay[d.toDateString()] || [];
          return (
            <div key={i} onClick={() => onPickDay(d)} style={{
              borderTop:'1px solid var(--line)', borderLeft: i%7 ? '1px solid var(--line)' : 'none',
              minHeight: 96, padding: 8, cursor:'pointer',
              background: outOfMonth ? 'var(--bone)' : '#fff',
              opacity: outOfMonth ? .5 : 1,
              position:'relative',
            }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 6 }}>
                <span style={{
                  fontFamily:'var(--f-display)', fontSize: 18,
                  width: isToday ? 26 : 'auto', height: isToday ? 26 : 'auto',
                  borderRadius: '50%', background: isToday ? 'var(--ink)' : 'transparent',
                  color: isToday ? '#fff' : 'inherit',
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  lineHeight: 1,
                }}>{d.getDate()}</span>
                {list.length > 0 && <span className="lx-num lx-small" style={{ fontSize: 10 }}>{list.length}</span>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap: 3 }}>
                {list.slice(0, 3).map((a) => {
                  const c = getClient(a.clientId);
                  return (
                    <div key={a.id}
                      onClick={(e) => { if (onPickAppt) { e.stopPropagation(); onPickAppt(a); } }}
                      style={{
                        fontSize: 10.5, padding:'3px 6px', borderRadius: 4,
                        background: a.brand==='Lancôme' ? 'var(--lancome-rose)' : (a.brand==='YSL' ? 'var(--ink)' : 'var(--bone-2)'),
                        color: a.brand==='YSL' ? 'var(--ysl-gold)' : 'var(--ink)',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', cursor:'pointer',
                      }}>
                      {fmtTime(a.at)} · {c?.name?.split(' ')[0] || a.type}
                    </div>
                  );
                })}
                {list.length > 3 && <div className="lx-small" style={{ fontSize: 10 }}>+{list.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenFollowup() {
  const lock = useBrandLock();
  const tplPool = lock ? TEMPLATES.filter(t => t.brand === lock) : TEMPLATES;
  const [tpl, setTpl] = React.useState(tplPool[0] || TEMPLATES[0]);
  const [client] = React.useState(CLIENTS[0]);
  const store = getStore(window.CURRENT_BA.storeId);
  const bodyRendered = tpl.body
    .replace('{nombre}', client.name.split(' ')[0])
    .replace('{tienda}', store.name)
    .replace('{ba}', window.CURRENT_BA.name.split(' ')[0])
    .replace('{producto}', 'Libre Le Parfum Intense');

  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'320px 1fr 360px', gap: 20 }}>
      {/* Template list */}
      <div className="lx-card" style={{ padding: 16, alignSelf:'start' }}>
        <div className="lx-micro">Plantillas</div>
        <div style={{ display:'flex', gap: 4, margin:'10px 0 12px' }}>
          <LxSeg items={lock ? [lock] : ['Todas','Lancôme','YSL']} value={lock || 'Todas'} onChange={()=>{}}/>
        </div>
        {tplPool.map(t => (
          <button key={t.id} onClick={() => setTpl(t)} style={{
            display:'block', width:'100%', textAlign:'left', padding: 12, borderRadius: 10,
            border: tpl.id===t.id ? '1px solid var(--ink)' : '1px solid var(--line)',
            background: tpl.id===t.id ? 'var(--bone)' : '#fff',
            marginBottom: 8, cursor:'pointer',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
              <LxBrandTag brand={t.brand} small/>
              <span className="lx-small" style={{ fontSize: 10 }}>{t.channel}</span>
            </div>
            <div style={{ fontWeight:600, fontSize: 13 }}>{t.category}</div>
            <div className="lx-small" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.3 }}>{t.body.slice(0,60)}…</div>
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="lx-card" style={{ padding: 24 }}>
        <div className="lx-micro">Compositor</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 28, marginTop: 4 }}>{tpl.category} · {tpl.brand}</div>
        <div style={{ display:'flex', alignItems:'center', gap: 12, marginTop: 16, padding: 12, borderRadius: 12, background:'var(--bone)' }}>
          <LxAvatar label={client.initials} tone="lancome" size={40}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{client.name}</div>
            <div className="lx-small" style={{ fontSize: 11 }}>{client.phone} · Consent. WhatsApp: otorgado</div>
          </div>
          <button className="lx-btn lx-btn--sm">Cambiar</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="lx-micro" style={{ marginBottom: 6 }}>Canal</div>
          <div style={{ display:'flex', gap: 8 }}>
            {['WhatsApp','SMS','Email'].map(ch => (
              <button key={ch} className="lx-btn lx-btn--sm" style={{
                background: ch===tpl.channel ? 'var(--ink)' : '#fff',
                color: ch===tpl.channel ? 'var(--paper)' : 'var(--ink)',
                borderColor: ch===tpl.channel ? 'var(--ink)' : 'var(--line)',
              }}>
                {ch==='WhatsApp'?<I.whatsapp size={12}/>:ch==='SMS'?<I.sms size={12}/>:<I.email size={12}/>} {ch}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="lx-micro" style={{ marginBottom: 6 }}>Mensaje personalizado</div>
          <textarea className="lx-input" value={bodyRendered} readOnly
            style={{ height: 140, padding: 14, fontSize: 14, lineHeight: 1.5, fontFamily:'var(--f-sans)', resize:'none' }}/>
        </div>
        <div style={{ marginTop: 10, display:'flex', gap: 6, flexWrap:'wrap' }}>
          {tpl.tokens.map(tok => <span key={tok} className="lx-chip" style={{ height: 22, fontSize: 11 }}>{tok}</span>)}
        </div>
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background:'rgba(31,122,90,.05)', border:'1px solid rgba(31,122,90,.15)' }}>
          <div className="lx-micro" style={{ color:'var(--ok)' }}>Simulador WhatsApp Business API</div>
          <div className="lx-small" style={{ fontSize: 12, marginTop: 4 }}>
            Modo sandbox. Las métricas de entrega y lectura se simulan localmente y se almacenan en el historial de la clienta.
            Cambiará a modo live cuando HQ active la integración.
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop: 20 }}>
          <button className="lx-btn">Guardar borrador</button>
          <button className="lx-btn lx-btn--primary">Enviar ahora <I.arrowR/></button>
        </div>
      </div>

      {/* Phone preview */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width: 280, height: 520, borderRadius: 36, background:'#0a0a0a', padding: 10, boxShadow:'0 20px 40px -10px rgba(0,0,0,.3)' }}>
          <div style={{ width:'100%', height:'100%', background:'#E5DED1', borderRadius: 28, overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'32px 14px 10px', background:'#075E54', color:'#fff', display:'flex', alignItems:'center', gap: 10 }}>
              <I.arrowL size={16}/>
              <div style={{ width: 32, height: 32, borderRadius: 999, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 600 }}>VR</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{window.CURRENT_BA.name.split(' ')[0]} · Lancôme</div>
                <div style={{ fontSize: 10, opacity: .8 }}>en línea</div>
              </div>
            </div>
            <div style={{ flex: 1, padding: 14, display:'flex', flexDirection:'column', gap: 8, overflow:'hidden' }}>
              <div style={{ alignSelf:'flex-start', background:'#fff', padding:'8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.4, maxWidth:'85%' }}>
                {bodyRendered}
                <div style={{ fontSize: 9, color:'rgba(0,0,0,.4)', textAlign:'right', marginTop: 4 }}>14:32 ✓✓</div>
              </div>
            </div>
          </div>
        </div>
        <div className="lx-small" style={{ marginTop: 12, textAlign:'center', fontSize: 11 }}>Vista previa · tokens personalizados</div>
      </div>
    </div>
  );
}

function ScreenBasket() {
  const items = [
    { sku:'LC-ABS-50', qty: 1 },
    { sku:'LC-GEN-50', qty: 1 },
    { sku:'YS-RPC-01', qty: 2 },
  ];
  const total = items.reduce((s, it) => s + getProduct(it.sku).price * it.qty, 0);
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 380px', gap: 24 }}>
      <div className="lx-card" style={{ padding: 24 }}>
        <div className="lx-micro">Recomendación #rec-3 · para Ximena Cortázar</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 30, marginTop: 4 }}>Checkout · Handoff POS</div>
        <div style={{ marginTop: 20 }}>
          {items.map(it => {
            const p = getProduct(it.sku);
            return (
              <div key={it.sku} style={{ display:'grid', gridTemplateColumns:'56px 1fr auto auto auto', gap: 16, alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
                <ProductThumb sku={it.sku} size={56}/>
                <div>
                  <LxBrandTag brand={p.brand} small/>
                  <div style={{ fontWeight:600, fontSize: 14, marginTop: 4 }}>{p.line}</div>
                  <div className="lx-small" style={{ fontSize: 11 }}>{p.name} · {p.size}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 6, border:'1px solid var(--line)', borderRadius: 999, padding: 2 }}>
                  <button className="lx-btn lx-btn--ghost" style={{ height: 24, width: 24, padding: 0 }}>−</button>
                  <span className="lx-num" style={{ fontSize: 13, minWidth: 16, textAlign:'center' }}>{it.qty}</span>
                  <button className="lx-btn lx-btn--ghost" style={{ height: 24, width: 24, padding: 0 }}>+</button>
                </div>
                <span className="lx-num" style={{ fontSize: 14, fontWeight: 600 }}>{MXN(p.price * it.qty)}</span>
                <button className="lx-btn lx-btn--ghost lx-btn--sm" style={{ color:'var(--ink-60)' }}><I.trash size={14}/></button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, padding: 16, background:'var(--bone)', borderRadius: 12, display:'flex', alignItems:'center', gap: 12 }}>
          <I.gift/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Muestras sugeridas</div>
            <div className="lx-small" style={{ fontSize: 11 }}>Or Rouge sample · Libre travel 7.5ml</div>
          </div>
          <button className="lx-btn lx-btn--sm">Añadir</button>
        </div>
      </div>

      <aside style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20 }}>
          <LxKV k="Subtotal" v={MXN(total)} mono/>
          <LxKV k="Puntos Luxe Circle" v={`+${Math.round(total/10)}`}/>
          <LxKV k="IVA incluido (16%)" v={MXN(total*0.16)} mono/>
          <LxDivider/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <span className="lx-micro">Total</span>
            <span className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 36 }}>{MXN(total)}</span>
          </div>
        </div>
        <div className="lx-card" style={{ padding: 20, display:'flex', flexDirection:'column', alignItems:'center', gap: 12 }}>
          <div className="lx-micro">Handoff a POS</div>
          {/* Fake QR */}
          <div style={{ width: 160, height: 160, background:'#fff', border:'1px solid var(--line)', borderRadius: 12, padding: 10, display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gap: 2 }}>
            {Array.from({length:144}).map((_,i) => <div key={i} style={{ background: ((i*7)%5===0 || i<12 || i>131 || i%12===0 || i%12===11) && Math.random()>0.3 ? '#0E0E0F' : 'transparent', borderRadius: 1 }}/>)}
          </div>
          <div style={{ fontSize: 12, textAlign:'center' }}>
            Muestra este código al cajero.<br/>
            <span className="lx-small">Atribución: BA · Rec · Muestras linked</span>
          </div>
          <div className="lx-num" style={{ fontSize: 11, letterSpacing:'0.2em', color:'var(--ink-60)' }}>TCKT · 2026-0424-0221</div>
        </div>
        <div className="lx-card" style={{ padding: 16 }}>
          <div className="lx-micro">Atribución</div>
          <LxKV k="Beauty Advisor" v={window.CURRENT_BA.name}/>
          <LxKV k="Recomendación" v="rec-3"/>
          <LxKV k="Consulta" v="Diagnóstico 24 abr"/>
          <LxKV k="Muestras linked" v="2"/>
        </div>
      </aside>
    </div>
  );
}

function ScreenSamples() {
  const lock = useBrandLock();
  const sampleRows = [
    ['Rénergie H.C.F. sample 5ml', 42, 60, 'Lancôme'],
    ['Absolue crema 5ml',           18, 40, 'Lancôme'],
    ['Advanced Génifique 7ml',      31, 50, 'Lancôme'],
    ['Libre EDP 1.2ml vial',         9, 30, 'YSL'],
    ['Or Rouge crema 5ml',           4, 20, 'YSL'],
    ['Black Opium 1.2ml vial',      12, 30, 'YSL'],
  ].filter(r => !lock || r[3] === lock);
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1.3fr 1fr', gap: 24 }}>
      <div className="lx-card" style={{ padding: 20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div className="lx-micro">Muestras</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 28 }}>Entregadas esta semana</div>
          </div>
          <button className="lx-btn lx-btn--primary"><I.plus/> Registrar muestra</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
          {[
            { l:'Muestras entregadas', v: 22,  d:+8 },
            { l:'Tasa de conversión',  v:'34%', d:+3 },
            { l:'Revenue atribuible',  v: MXN(48200), d:+12 },
          ].map((k,i) => (
            <div key={i} className="lx-card-flat" style={{ padding: 16 }}><LxStat label={k.l} value={k.v} delta={k.d}/></div>
          ))}
        </div>
        <LxDivider/>
        {SAMPLES.map(s => {
          const c = getClient(s.clientId);
          return (
            <div key={s.id} style={{ display:'grid', gridTemplateColumns:'40px 1fr 1fr auto auto', gap: 12, alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--line)' }}>
              <LxAvatar label={c.initials} size={36}/>
              <div><div style={{ fontWeight:600, fontSize: 13 }}>{c.name}</div><div className="lx-small" style={{ fontSize:11 }}>{s.name}</div></div>
              <div className="lx-small" style={{ fontSize: 11 }}>Entregada {fmtDate(s.givenAt)} · Seguim. {fmtDate(s.followUp)}</div>
              <span className={`lx-chip ${s.converted?'lx-chip--ok':'lx-chip--warn'}`} style={{ height: 22, fontSize: 11 }}>
                {s.converted?'Convertida':'Pendiente'}
              </span>
              <button className="lx-btn lx-btn--sm">Seguir</button>
            </div>
          );
        })}
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Inventario de muestras</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4 }}>Disponible en counter</div>
        <LxDivider/>
        {sampleRows.map(([n, have, cap, br]) => (
          <div key={n} style={{ padding:'10px 0', borderBottom:'1px dashed var(--line)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <LxBrandTag brand={br} small/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{n}</span>
              </div>
              <span className="lx-num lx-small" style={{ fontSize: 11 }}>{have}/{cap}</span>
            </div>
            <LxProgress value={have} max={cap} color={have/cap < 0.2 ? 'var(--err)' : 'var(--ink)'}/>
          </div>
        ))}
        <button className="lx-btn lx-btn--sm" style={{ marginTop: 12 }}><I.plus/> Solicitar reposición</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AppointmentDetailModal — abre al hacer click en una cita (Home o Calendario).
// Muestra info de la cita y permite: Confirmar · Completar · Reagendar · Cancelar.
// "Ver perfil" sigue siendo una acción explícita (no por error).
// ─────────────────────────────────────────────────────────────────────────

const APPT_STATUS_META = {
  pending:     { label: 'Programada',  tone: 'var(--warn)',   bg: 'var(--warn-08)' },
  confirmed:   { label: 'Confirmada',  tone: 'var(--ok)',     bg: 'var(--ok-08)' },
  completed:   { label: 'Completada',  tone: 'var(--ink-60)', bg: 'var(--bone)' },
  rescheduled: { label: 'Reagendada',  tone: 'var(--warn)',   bg: 'var(--warn-08)' },
  cancelled:   { label: 'Cancelada',   tone: 'var(--err)',    bg: 'var(--err-08)' },
};

function AppointmentDetailModal({ appt, onClose, onOpenClientProfile }) {
  if (!appt) return null;
  const client = getClient(appt.clientId);
  const ba = getBA(appt.baId);
  const [mode, setMode] = React.useState('view'); // view | reschedule | cancel
  const [newDate, setNewDate] = React.useState(appt.at.slice(0, 10));
  const [newTime, setNewTime] = React.useState(appt.at.slice(11, 16));
  const [cancelReason, setCancelReason] = React.useState('');
  const [confirmation, setConfirmation] = React.useState(null);

  const statusMeta = APPT_STATUS_META[appt.status] || APPT_STATUS_META.pending;
  const isFinal = appt.status === 'completed' || appt.status === 'cancelled';

  const updateAppt = (patch, confirmMsg) => {
    if (window.LxState) {
      window.LxState.update('APPOINTMENTS', appt.id, patch);
    } else {
      Object.assign(appt, patch);
    }
    setConfirmation(confirmMsg || 'Cita actualizada');
    setTimeout(() => { setConfirmation(null); onClose(); }, 1200);
  };

  const handleConfirm   = () => updateAppt({ status: 'confirmed' },   'Cita confirmada');
  const handleComplete  = () => updateAppt({ status: 'completed' },   'Cita marcada como completada');
  const handleReschedule = () => {
    if (!newDate || !newTime) return;
    const newAt = `${newDate}T${newTime}:00`;
    updateAppt({ at: newAt, status: 'rescheduled', rescheduleAt: new Date().toISOString() }, 'Cita reagendada');
  };
  const handleCancel = () => {
    updateAppt({ status: 'cancelled', cancelReason: cancelReason || null, cancelledAt: new Date().toISOString() }, 'Cita cancelada');
  };

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset: 0, zIndex: 100,
      background:'rgba(20,18,16,0.55)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding: 24,
      color: 'var(--ink)',
    }}>
      <div className="lx-card" onClick={(e) => e.stopPropagation()}
        style={{ width: 560, maxWidth:'100%', maxHeight:'90vh', overflow:'auto', padding: 28, background:'#fff' }}>

        {confirmation ? (
          <div style={{ textAlign:'center', padding:'40px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius:'50%', background:'var(--ok-08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'var(--ok)' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="5,12 10,17 19,7"/></svg>
            </div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 24 }}>{confirmation}</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 14 }}>
              <div>
                <div className="lx-micro">Detalle de cita</div>
                <div style={{ fontFamily:'var(--f-display)', fontSize: 26, marginTop: 4, letterSpacing:'-0.01em' }}>{appt.type}</div>
                <div className="lx-small" style={{ marginTop: 4, display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
                  <span className="lx-chip" style={{ height: 22, fontSize: 11, background: statusMeta.bg, color: statusMeta.tone, borderColor:'transparent' }}>
                    {statusMeta.label}
                  </span>
                  {appt.brand && <LxBrandTag brand={appt.brand} small/>}
                </div>
              </div>
              <button onClick={onClose} className="lx-btn lx-btn--sm">Cerrar</button>
            </div>

            {/* Info grid */}
            <div className="lx-card" style={{ padding: 18, background:'var(--bone)', borderColor:'transparent', marginBottom: 18 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 14, marginBottom: 14 }}>
                <LxAvatar label={client?.initials || '??'} size={48} tone={appt.brand==='Lancôme'?'lancome':'ysl'}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily:'var(--f-display)', fontSize: 22, letterSpacing:'-0.01em' }}>{client?.name || 'Cliente desconocida'}</div>
                  <div className="lx-small" style={{ fontSize: 12, marginTop: 2 }}>{client?.phone || ''} {client?.email ? ' · ' + client.email : ''}</div>
                </div>
                {onOpenClientProfile && client && (
                  <button className="lx-btn lx-btn--sm" onClick={() => { onOpenClientProfile(client.id); onClose(); }}>
                    Ver perfil <I.arrowR/>
                  </button>
                )}
              </div>
              <LxDivider/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginTop: 12 }}>
                <LxKV k="Fecha" v={fmtDate(appt.at)}/>
                <LxKV k="Hora"  v={fmtTime(appt.at)}/>
                <LxKV k="Duración" v={`${appt.duration || 30} min`}/>
                <LxKV k="Beauty Advisor" v={ba?.name || '—'}/>
              </div>
              {appt.notes && (
                <>
                  <LxDivider dashed/>
                  <div className="lx-small" style={{ marginBottom: 4 }}>Notas</div>
                  <div style={{ fontSize: 13 }}>{appt.notes}</div>
                </>
              )}
              {appt.cancelReason && (
                <>
                  <LxDivider dashed/>
                  <div className="lx-small" style={{ color:'var(--err)', marginBottom: 4 }}>Motivo de cancelación</div>
                  <div style={{ fontSize: 13 }}>{appt.cancelReason}</div>
                </>
              )}
            </div>

            {/* Acciones según el modo */}
            {mode === 'view' && !isFinal && (
              <>
                <div className="lx-micro" style={{ marginBottom: 10 }}>Acciones</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 10 }}>
                  {appt.status !== 'confirmed' && (
                    <button className="lx-btn" onClick={handleConfirm}>
                      <I.check size={14}/> Confirmar
                    </button>
                  )}
                  <button className="lx-btn" onClick={handleComplete}>
                    <I.check size={14}/> Marcar como completada
                  </button>
                  <button className="lx-btn" onClick={() => setMode('reschedule')}>
                    <I.cal size={14}/> Reagendar
                  </button>
                  <button className="lx-btn" onClick={() => setMode('cancel')} style={{ color:'var(--err)', borderColor:'rgba(162,58,46,.3)' }}>
                    <I.trash size={14}/> Cancelar cita
                  </button>
                </div>
              </>
            )}

            {mode === 'view' && isFinal && (
              <div className="lx-small" style={{ padding: 12, background:'var(--bone)', borderRadius: 10, textAlign:'center' }}>
                Esta cita está {statusMeta.label.toLowerCase()}. No se puede modificar.
              </div>
            )}

            {mode === 'reschedule' && (
              <>
                <div className="lx-micro" style={{ marginBottom: 10 }}>Reagendar</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <div className="lx-small" style={{ marginBottom: 4 }}>Nueva fecha</div>
                    <input className="lx-input" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}/>
                  </div>
                  <div>
                    <div className="lx-small" style={{ marginBottom: 4 }}>Nueva hora</div>
                    <input className="lx-input" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap: 10, justifyContent:'flex-end' }}>
                  <button className="lx-btn" onClick={() => setMode('view')}>Volver</button>
                  <button className="lx-btn lx-btn--primary" onClick={handleReschedule}>Confirmar nuevo horario</button>
                </div>
              </>
            )}

            {mode === 'cancel' && (
              <>
                <div className="lx-micro" style={{ marginBottom: 10, color:'var(--err)' }}>Cancelar cita</div>
                <div className="lx-small" style={{ marginBottom: 10 }}>
                  Indica un motivo (opcional). Se notificará a {client?.name?.split(' ')[0] || 'la clienta'} por WhatsApp.
                </div>
                <input className="lx-input" placeholder="Motivo de cancelación (p. ej. enfermedad, conflicto de horario)"
                  value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} style={{ marginBottom: 14 }}/>
                <div style={{ display:'flex', gap: 10, justifyContent:'flex-end' }}>
                  <button className="lx-btn" onClick={() => setMode('view')}>Volver</button>
                  <button className="lx-btn" onClick={handleCancel} style={{ color:'#fff', background:'var(--err)', borderColor:'var(--err)' }}>
                    Confirmar cancelación
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenAppointments, ScreenFollowup, ScreenBasket, ScreenSamples, AppointmentDetailModal });
