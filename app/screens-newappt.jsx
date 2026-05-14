// Screen: Nueva cita — appointment registration form
// Right column: live summary + availability + insights
// Plus: ScreenAppointmentsManagement — rescheduled/cancelled tracking

const EVENT_TYPES = [
  'Servicio de Cabina',
  'Facial',
  'Evento Aniversario',
  'Cabina VIP',
  'Seguimiento de productos',
  'Diagnóstico de piel',
  'Consulta de fragancia',
  'Maquillaje',
  'Otro',
];

const APPT_STATES = ['Programada', 'Reagendada', 'Cancelada', 'Completada'];

// Mock historical appointments for the management panel — includes reschedules/cancellations
const APPT_HISTORY = [
  { id:'ah-01', clientId:'cl-001', baId:'ba-01', brand:'Lancôme', type:'Diagnóstico de piel', date:'2026-05-02', time:'11:00', status:'Reagendada',  reason:'Cliente solicitó otra fecha', newDate:'2026-05-09', newTime:'12:30' },
  { id:'ah-02', clientId:'cl-004', baId:'ba-01', brand:'YSL',     type:'Consulta de fragancia', date:'2026-04-28', time:'13:00', status:'Cancelada',  reason:'Compromiso laboral imprevisto', newDate:null, newTime:null },
  { id:'ah-03', clientId:'cl-002', baId:'ba-02', brand:'YSL',     type:'Cabina VIP',           date:'2026-04-26', time:'16:00', status:'Reagendada',  reason:'Cabina ocupada por evento', newDate:'2026-05-03', newTime:'16:00' },
  { id:'ah-04', clientId:'cl-006', baId:'ba-01', brand:'Lancôme', type:'Facial',               date:'2026-04-22', time:'10:30', status:'Cancelada',  reason:'Clienta enferma', newDate:null, newTime:null },
  { id:'ah-05', clientId:'cl-003', baId:'ba-02', brand:'Lancôme', type:'Servicio de Cabina',   date:'2026-04-20', time:'12:00', status:'Completada', reason:null, newDate:null, newTime:null },
  { id:'ah-06', clientId:'cl-005', baId:'ba-01', brand:'YSL',     type:'Evento Aniversario',   date:'2026-05-12', time:'18:00', status:'Programada', reason:null, newDate:null, newTime:null },
  { id:'ah-07', clientId:'cl-001', baId:'ba-01', brand:'Lancôme', type:'Seguimiento de productos', date:'2026-04-15', time:'11:30', status:'Completada', reason:null, newDate:null, newTime:null },
  { id:'ah-08', clientId:'cl-004', baId:'ba-02', brand:'YSL',     type:'Maquillaje',           date:'2026-05-05', time:'15:00', status:'Reagendada',  reason:'Solicitud de la BA', newDate:'2026-05-07', newTime:'15:00' },
  { id:'ah-09', clientId:'cl-002', baId:'ba-01', brand:'Lancôme', type:'Facial',               date:'2026-04-18', time:'14:00', status:'Cancelada',  reason:'No-show sin aviso', newDate:null, newTime:null },
];

// Slots assumed to be available. Real impl would compute against APPOINTMENTS for date+BA.
const ALL_SLOTS = ['10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];

function ScreenNewAppointment({ onNav }) {
  const [q, setQ]              = React.useState('');
  const [client, setClient]    = React.useState(null);
  const [type, setType]        = React.useState(EVENT_TYPES[0]);
  const [date, setDate]        = React.useState('2026-05-12');
  const [time, setTime]        = React.useState('11:00');
  const [baId, setBaId]        = React.useState(window.CURRENT_BA?.id || 'ba-01');
  const [brand, setBrand]      = React.useState('Lancôme');
  const [comments, setComments]= React.useState('');
  const [status, setStatus]    = React.useState('Programada');
  const [saved, setSaved]      = React.useState(false);
  const [err, setErr]          = React.useState('');

  // Compute matches for client search
  const matches = React.useMemo(() => {
    if (!q.trim() || client) return [];
    const term = q.trim().toLowerCase();
    return (window.CLIENTS || []).filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.phone || '').includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    ).slice(0, 5);
  }, [q, client]);

  // Mock conflicts: simulate that 12:30 and 16:00 are busy on chosen date for selected BA
  const conflicts = ['12:30', '16:00'];
  const availableSlots = ALL_SLOTS.filter(s => !conflicts.includes(s));

  const handleSave = () => {
    if (!client) { setErr('Selecciona una clienta antes de guardar.'); return; }
    if (!date || !time) { setErr('Falta fecha u hora.'); return; }
    setErr('');

    const newAppt = {
      id: 'ap-' + Date.now().toString(36),
      clientId: client.id,
      baId,
      brand,
      at: `${date}T${time}`,
      duration: 45,
      type,
      status: 'confirmed',
      label: status,
      comments,
      createdAt: new Date().toISOString(),
    };
    if (Array.isArray(window.APPOINTMENTS)) window.APPOINTMENTS.unshift(newAppt);
    setSaved(true);
  };

  if (saved) {
    return (
      <div style={{ padding:'48px 40px', maxWidth: 720, margin:'0 auto' }}>
        <div className="lx-card-luxe" style={{ padding: 40, textAlign:'center', background:'var(--ok-08)', borderColor:'var(--ok-20)' }}>
          <div style={{ width: 64, height: 64, borderRadius:'50%', background:'var(--ok)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <I.check size={32}/>
          </div>
          <div className="lx-micro" style={{ color:'var(--ok)' }}>Cita guardada</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 32, letterSpacing:'-0.01em', marginTop: 6 }}>
            {client.name}
          </div>
          <div className="lx-small" style={{ marginTop: 8 }}>
            {type} · {date} · {time} · {brand}
          </div>
          <div style={{ display:'flex', gap: 12, justifyContent:'center', marginTop: 28 }}>
            <button className="lx-btn" onClick={() => { setSaved(false); setClient(null); setQ(''); setComments(''); }}>
              <I.plus/> Otra cita
            </button>
            <button className="lx-btn lx-btn--primary" onClick={() => onNav && onNav('cal')}>
              Ver agenda <I.arrowR/>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'24px 28px', maxWidth: 1320, margin:'0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 14 }}>
        <button className="lx-btn lx-btn--sm" onClick={() => onNav && onNav('cal')}>
          <I.arrowL size={14}/> Agenda
        </button>
        <span className="lx-small" style={{ color:'var(--ink-60)', fontSize: 12 }}>Agenda · Nueva cita</span>
      </div>

      {/* Title */}
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 20 }}>
        <div>
          <div className="lx-micro">Nueva cita</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 38, letterSpacing:'-0.01em', marginTop: 4 }}>
            Programa una <span style={{ fontStyle:'italic' }}>nueva visita</span>
          </div>
          <div className="lx-small" style={{ marginTop: 6, maxWidth: 560 }}>
            Programa una nueva visita, servicio o seguimiento con una clienta. La sincronización con WhatsApp y Email se realiza al guardar.
          </div>
        </div>
      </div>

      {err && (
        <div className="lx-card" style={{ padding: 12, marginBottom: 14, background:'var(--err-08)', borderColor:'var(--err-20)', color:'var(--err)', fontSize: 13 }}>
          {err}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, alignItems:'start' }}>

        {/* ── LEFT: FORM ── */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>

          {/* Cliente */}
          <div className="lx-card-luxe" style={{ padding: 24 }}>
            <div className="lx-micro">Cliente / consumidor</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4, marginBottom: 14 }}>¿Con quién será la cita?</div>

            {!client ? (
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left: 14, top:'50%', transform:'translateY(-50%)', color:'var(--ink-40)' }}><I.search/></span>
                <input className="lx-input" style={{ paddingLeft: 40 }} placeholder="Buscar por nombre, teléfono o email…" value={q} onChange={e=>setQ(e.target.value)} autoFocus/>
                {matches.length > 0 && (
                  <div className="lx-card" style={{ marginTop: 8, padding: 4 }}>
                    {matches.map(c => (
                      <button key={c.id} onClick={() => { setClient(c); setBrand(c.brands?.[0] || 'Lancôme'); setQ(''); }} style={{
                        display:'grid', gridTemplateColumns:'40px 1fr auto', gap: 12, alignItems:'center',
                        width:'100%', padding:'10px 12px', borderRadius: 10, border:'none', background:'transparent',
                        cursor:'pointer', textAlign:'left',
                      }} onMouseEnter={e=>e.currentTarget.style.background='var(--bone)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <LxAvatar label={c.initials} tone={c.brands?.[0]==='Lancôme'?'lancome':'ysl'} size={36}/>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                          <div className="lx-small" style={{ fontSize: 11 }}>{c.phone} · {c.tier}</div>
                        </div>
                        <span className="lx-chip" style={{ height: 22, fontSize: 10 }}>{c.brands?.[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
                {q && matches.length === 0 && (
                  <div className="lx-small" style={{ marginTop: 10, color:'var(--ink-60)' }}>
                    Sin coincidencias. ¿Aún no es clienta? <button className="lx-btn lx-btn--sm" style={{ marginLeft: 6 }} onClick={() => onNav && onNav('new')}>+ Alta nueva</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'56px 1fr auto', gap: 16, alignItems:'center', padding: 16, borderRadius: 14, background:'var(--bone)', border:'1px solid var(--line)' }}>
                <LxAvatar label={client.initials} tone={client.brands?.[0]==='Lancôme'?'lancome':'ysl'} size={52}/>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{client.name}</div>
                  <div className="lx-small" style={{ marginTop: 2 }}>
                    {client.phone}{client.email ? ' · ' + client.email : ''}
                  </div>
                  <div style={{ display:'flex', gap: 6, marginTop: 8, flexWrap:'wrap' }}>
                    {(client.brands || []).map(b => <LxBrandTag key={b} brand={b} small/>)}
                    <span className="lx-chip" style={{ height: 22, fontSize: 10 }}><I.star size={9}/> {client.tier}</span>
                    {client.lastVisit && <span className="lx-chip" style={{ height: 22, fontSize: 10 }}>Últ. visita {fmtRel(client.lastVisit)}</span>}
                  </div>
                </div>
                <button className="lx-btn lx-btn--sm" onClick={() => setClient(null)}>Cambiar</button>
              </div>
            )}
          </div>

          {/* Tipo + fecha + hora */}
          <div className="lx-card-luxe" style={{ padding: 24 }}>
            <div className="lx-micro">Detalles del servicio</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4, marginBottom: 14 }}>Tipo, fecha y hora</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn:'1 / -1' }}>
                <div className="lx-micro" style={{ marginBottom: 6 }}>Tipo de evento</div>
                <select className="lx-input" value={type} onChange={e=>setType(e.target.value)} style={{ width:'100%' }}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="lx-micro" style={{ marginBottom: 6 }}>Fecha</div>
                <input className="lx-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
              </div>
              <div>
                <div className="lx-micro" style={{ marginBottom: 6 }}>Hora</div>
                <input className="lx-input" type="time" value={time} onChange={e=>setTime(e.target.value)}/>
              </div>
              <div>
                <div className="lx-micro" style={{ marginBottom: 6 }}>Beauty Advisor asignada</div>
                <select className="lx-input" value={baId} onChange={e=>setBaId(e.target.value)} style={{ width:'100%' }}>
                  {(window.BAS || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <div className="lx-micro" style={{ marginBottom: 6 }}>Marca relacionada</div>
                <div style={{ display:'flex', gap: 8 }}>
                  {['Lancôme','YSL'].map(b => (
                    <button key={b} onClick={()=>setBrand(b)} className="lx-btn lx-btn--sm" style={{
                      flex: 1,
                      background: brand===b ? 'var(--ink)' : '#fff',
                      color: brand===b ? '#fff' : 'var(--ink)',
                      borderColor: brand===b ? 'var(--ink)' : 'var(--line)',
                    }}>{b}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="lx-card-luxe" style={{ padding: 24 }}>
            <div className="lx-micro" style={{ marginBottom: 6 }}>Comentarios</div>
            <textarea className="lx-input" style={{ minHeight: 110, resize:'vertical', fontFamily:'inherit', lineHeight: 1.5 }} placeholder="Notas, expectativas, productos de interés, detalles del servicio o recordatorios…" value={comments} onChange={e=>setComments(e.target.value)}/>
          </div>

          {/* Estado inicial */}
          <div className="lx-card-luxe" style={{ padding: 24 }}>
            <div className="lx-micro">Estado inicial</div>
            <div style={{ display:'flex', gap: 8, marginTop: 10, flexWrap:'wrap' }}>
              {APPT_STATES.map(s => (
                <button key={s} onClick={()=>setStatus(s)} className="lx-chip" style={{
                  cursor:'pointer', height: 36, padding:'0 16px',
                  background: status===s ? 'var(--ink)' : 'var(--bone)',
                  color: status===s ? '#fff' : 'var(--ink)',
                  borderColor: status===s ? 'var(--ink)' : 'var(--line)',
                }}>{s}</button>
              ))}
            </div>
            <div className="lx-small" style={{ fontSize: 11, color:'var(--ink-60)', marginTop: 10 }}>
              El flujo de creación normalmente usa <b>Programada</b>. Reagendadas y canceladas se gestionan después desde el panel de gestión.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', marginTop: 4 }}>
            <button className="lx-btn lx-btn--lg" onClick={() => onNav && onNav('cal')}>Cancelar</button>
            <button className="lx-btn lx-btn--primary lx-btn--lg" onClick={handleSave}>
              <I.check size={16}/> Guardar cita
            </button>
          </div>
        </div>

        {/* ── RIGHT: SUMMARY + AVAILABILITY + INSIGHTS ── */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16, position:'sticky', top: 16 }}>

          {/* Summary card */}
          <div className="lx-card-luxe" style={{ padding: 24, background:'var(--ink)', color:'var(--paper)' }}>
            <div className="lx-micro" style={{ color:'rgba(255,255,255,0.55)' }}>Resumen de la cita</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 24, letterSpacing:'-0.01em', marginTop: 4, color: brand==='YSL'?'var(--ysl-gold)':'#fff' }}>
              {client ? client.name : 'Selecciona una clienta'}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap: 0, marginTop: 18 }}>
              {[
                ['Tipo', type],
                ['Fecha', date],
                ['Hora', time],
                ['BA', (window.BAS||[]).find(b=>b.id===baId)?.name || '—'],
                ['Marca', brand],
                ['Estado', status],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
                  <span style={{ color:'rgba(255,255,255,0.55)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="lx-card-luxe" style={{ padding: 24 }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <div>
                <div className="lx-micro">Disponibilidad</div>
                <div style={{ fontFamily:'var(--f-display)', fontSize: 18, marginTop: 2 }}>{date}</div>
              </div>
              <span className="lx-chip" style={{ height: 22, fontSize: 10, background:'var(--ok-08)', color:'var(--ok)', borderColor:'var(--ok-20)' }}>
                {availableSlots.length} libres
              </span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6, marginTop: 14 }}>
              {ALL_SLOTS.map(s => {
                const busy = conflicts.includes(s);
                const selected = s === time;
                return (
                  <button key={s} disabled={busy} onClick={() => !busy && setTime(s)} style={{
                    height: 38, borderRadius: 8, fontFamily:'var(--f-mono)', fontSize: 12, fontWeight: 600,
                    border:'1px solid ' + (selected ? 'var(--ink)' : 'var(--line)'),
                    background: busy ? 'var(--err-08)' : (selected ? 'var(--ink)' : '#fff'),
                    color: busy ? 'var(--err)' : (selected ? '#fff' : 'var(--ink)'),
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.6 : 1,
                    textDecoration: busy ? 'line-through' : 'none',
                  }}>{s}</button>
                );
              })}
            </div>

            {conflicts.length > 0 && (
              <div className="lx-small" style={{ fontSize: 11, color:'var(--ink-60)', marginTop: 12, display:'flex', alignItems:'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background:'var(--err-08)', border:'1px solid var(--err-20)' }}/>
                {conflicts.length} conflicto{conflicts.length>1?'s':''} con citas existentes ({conflicts.join(', ')})
              </div>
            )}
          </div>

          {/* Insights */}
          {client && (
            <div className="lx-card-luxe" style={{ padding: 20 }}>
              <div className="lx-micro">Insight de la clienta</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><div className="lx-small" style={{ fontSize: 10 }}>Visitas</div><div className="lx-num" style={{ fontWeight: 600 }}>{client.stats?.visits || 0}</div></div>
                <div><div className="lx-small" style={{ fontSize: 10 }}>Ticket prom</div><div className="lx-num" style={{ fontWeight: 600 }}>{MXN(client.stats?.avgTicket || 0)}</div></div>
                <div><div className="lx-small" style={{ fontSize: 10 }}>LTV</div><div className="lx-num" style={{ fontWeight: 600 }}>{MXN(client.stats?.ltv || 0)}</div></div>
                <div><div className="lx-small" style={{ fontSize: 10 }}>Tier</div><div style={{ fontWeight: 600, fontSize: 13 }}>{client.tier}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Management panel — track rescheduled / cancelled appointments
// ─────────────────────────────────────────────────────────────────
function ApptMgmtPanel({ embedded }) {
  const [filter, setFilter] = React.useState('Todas');
  const filtered = filter === 'Todas' ? APPT_HISTORY : APPT_HISTORY.filter(a => a.status === filter);

  const totals = {
    Programadas:  APPT_HISTORY.filter(a => a.status === 'Programada').length,
    Reagendadas:  APPT_HISTORY.filter(a => a.status === 'Reagendada').length,
    Canceladas:   APPT_HISTORY.filter(a => a.status === 'Cancelada').length,
    Completadas:  APPT_HISTORY.filter(a => a.status === 'Completada').length,
  };
  const total = APPT_HISTORY.length;
  const rescheduleRate = Math.round(totals.Reagendadas / total * 100);
  const cancelRate     = Math.round(totals.Canceladas / total * 100);

  const statusTone = (s) => ({
    'Programada':  { bg:'var(--ok-08)',   fg:'var(--ok)',   bd:'var(--ok-20)' },
    'Reagendada':  { bg:'var(--warn-08)', fg:'var(--warn)', bd:'var(--warn-20)' },
    'Cancelada':   { bg:'var(--err-08)',  fg:'var(--err)',  bd:'var(--err-20)' },
    'Completada':  { bg:'var(--bone)',    fg:'var(--ink)',  bd:'var(--line)' },
  }[s] || { bg:'var(--bone)', fg:'var(--ink)', bd:'var(--line)' });

  return (
    <div style={{ padding: embedded ? 0 : '24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 12 }}>
        <div className="lx-card-luxe" style={{ padding: 18 }}>
          <div className="lx-micro">Total citas</div>
          <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>{total}</div>
          <div className="lx-small" style={{ fontSize: 11 }}>últimos 60 días</div>
        </div>
        <div className="lx-card-luxe" style={{ padding: 18, borderLeft:'3px solid var(--ok)' }}>
          <div className="lx-micro">Programadas</div>
          <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>{totals.Programadas}</div>
          <div className="lx-small" style={{ fontSize: 11 }}>activas</div>
        </div>
        <div className="lx-card-luxe" style={{ padding: 18, borderLeft:'3px solid var(--warn)' }}>
          <div className="lx-micro">Reagendadas</div>
          <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>{totals.Reagendadas}</div>
          <div className="lx-small" style={{ fontSize: 11 }}><b className="tn">{rescheduleRate}%</b> tasa</div>
        </div>
        <div className="lx-card-luxe" style={{ padding: 18, borderLeft:'3px solid var(--err)' }}>
          <div className="lx-micro">Canceladas</div>
          <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>{totals.Canceladas}</div>
          <div className="lx-small" style={{ fontSize: 11 }}><b className="tn">{cancelRate}%</b> tasa</div>
        </div>
        <div className="lx-card-luxe" style={{ padding: 18 }}>
          <div className="lx-micro">Completadas</div>
          <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>{totals.Completadas}</div>
          <div className="lx-small" style={{ fontSize: 11 }}>servicio cumplido</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="lx-card" style={{ padding: 14, display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
        <span className="lx-micro">Filtrar</span>
        {['Todas','Programada','Reagendada','Cancelada','Completada'].map(s => (
          <button key={s} onClick={()=>setFilter(s)} className="lx-chip" style={{
            cursor:'pointer', height: 28, padding:'0 12px',
            background: filter===s ? 'var(--ink)' : 'var(--bone)',
            color: filter===s ? '#fff' : 'var(--ink)',
            borderColor: filter===s ? 'var(--ink)' : 'var(--line)',
          }}>{s}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <button className="lx-btn lx-btn--sm"><I.download size={12}/> Exportar</button>
      </div>

      {/* Table */}
      <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1.2fr 0.9fr 0.9fr 1fr 1.6fr', gap: 12, padding:'12px 20px', background:'var(--bone)', borderBottom:'1px solid var(--line)' }}>
          {['Clienta','Tipo','Fecha original','Estado','Nueva fecha','Motivo'].map(h => (
            <div key={h} className="lx-micro" style={{ fontSize: 10 }}>{h}</div>
          ))}
        </div>
        {filtered.map(a => {
          const c = (window.CLIENTS || []).find(x => x.id === a.clientId);
          const tone = statusTone(a.status);
          return (
            <div key={a.id} style={{ display:'grid', gridTemplateColumns:'1.6fr 1.2fr 0.9fr 0.9fr 1fr 1.6fr', gap: 12, padding:'14px 20px', borderBottom:'1px solid var(--line)', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                {c && <LxAvatar label={c.initials} tone={a.brand==='Lancôme'?'lancome':'ysl'} size={32}/>}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c?.name || '—'}</div>
                  <div className="lx-small" style={{ fontSize: 11 }}>{a.brand}</div>
                </div>
              </div>
              <div style={{ fontSize: 13 }}>{a.type}</div>
              <div className="lx-num" style={{ fontSize: 12 }}>{a.date} <span style={{ color:'var(--ink-60)' }}>· {a.time}</span></div>
              <div>
                <span className="lx-chip" style={{ height: 24, fontSize: 11, padding:'0 10px', background: tone.bg, color: tone.fg, borderColor: tone.bd }}>
                  {a.status}
                </span>
              </div>
              <div className="lx-num" style={{ fontSize: 12 }}>
                {a.newDate ? <>{a.newDate} <span style={{ color:'var(--ink-60)' }}>· {a.newTime}</span></> : <span style={{ color:'var(--ink-40)' }}>—</span>}
              </div>
              <div className="lx-small" style={{ fontSize: 12, color:'var(--ink-60)' }}>{a.reason || '—'}</div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign:'center', color:'var(--ink-60)' }}>
            <div className="lx-small">Sin citas en este filtro.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Combined screen with tabs: Calendario / Gestión
function ScreenAppointmentsHub({ onNav, onOpenClient }) {
  const [tab, setTab] = React.useState('cal');
  return (
    <div>
      <div style={{ padding:'18px 28px 0', display:'flex', alignItems:'center', gap: 12, borderBottom:'1px solid var(--line)' }}>
        <div style={{ display:'flex', gap: 0 }}>
          {[
            ['cal','Calendario'],
            ['mgmt','Reagendadas y canceladas'],
          ].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:'14px 20px', border:'none', background:'transparent', cursor:'pointer',
              borderBottom: tab===k ? '2px solid var(--ink)' : '2px solid transparent',
              fontWeight: tab===k ? 600 : 500, fontSize: 13, color: tab===k ? 'var(--ink)' : 'var(--ink-60)',
              fontFamily:'inherit',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <button className="lx-btn lx-btn--primary" style={{ marginBottom: 8 }} onClick={() => onNav && onNav('new-appt')}>
          <I.plus/> Nueva cita
        </button>
      </div>

      {tab === 'cal' ? <ScreenAppointments onNav={onNav} onOpenClient={onOpenClient} hideHeaderCTA/> : <ApptMgmtPanel/>}
    </div>
  );
}

Object.assign(window, { ScreenNewAppointment, ApptMgmtPanel, ScreenAppointmentsHub, EVENT_TYPES, APPT_STATES, APPT_HISTORY });
