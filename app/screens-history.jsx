// Screen: Per-client full history views — Compras, Línea de tiempo, Recomendaciones, Muestras, Comunicaciones.
// Each is a dedicated screen reachable from the profile "Ver todo" buttons.

function getProfileClient() {
  const id = window.CURRENT_PROFILE_CLIENT_ID;
  return getClient(id) || CLIENTS[0];
}

function HistoryHeader({ eyebrow, title, subtitle, chips, onBack, extra }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="lx-small" style={{ marginBottom: 10 }}>
        <button className="lx-btn lx-btn--ghost lx-btn--sm" onClick={onBack} style={{ padding:0, height: 20 }}>
          <I.arrowL/> Volver al perfil
        </button>
      </div>
      <div className="lx-eyebrow">
        <div style={{ minWidth: 0 }}>
          <div className="lx-micro">{eyebrow}</div>
          <div className="lx-eyebrow-title" style={{ fontSize: 30 }}>{title}</div>
          {subtitle && <div className="lx-small" style={{ marginTop: 4 }}>{subtitle}</div>}
        </div>
        <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
          {chips}
          {extra}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, accent }) {
  return (
    <div className="lx-card" style={{ padding: 16 }}>
      <div className="lx-stat-label">{label}</div>
      <div style={{ fontFamily:'var(--f-display)', fontSize: 28, marginTop: 6, lineHeight: 1, color: accent || 'var(--ink)' }} className="lx-num">{value}</div>
      {sub && <div className="lx-small" style={{ fontSize: 11, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── Historial de compras ──────────────────────────────────────────────────
function ScreenHistoryPurchases({ onBack }) {
  const c = getProfileClient();
  const lock = useBrandLock();
  const all = clientPurchases(c.id);
  const [period, setPeriod] = React.useState('12m');
  const periods = { '3m':90, '6m':180, '12m':365, 'all':9999 };
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periods[period]);
  const filtered = all.filter(p => {
    // Solo compras de la marca de la BA actual (si hay brand lock).
    if (lock && p.brand !== lock) return false;
    if (period !== 'all' && new Date(p.at) < cutoff) return false;
    return true;
  });

  const total = filtered.reduce((s,p) => s + p.total, 0);
  const itemCount = filtered.reduce((s,p) => s + p.items.reduce((a,i)=>a+i.qty, 0), 0);
  const avg = filtered.length ? total / filtered.length : 0;
  const byBrand = filtered.reduce((acc,p) => { acc[p.brand] = (acc[p.brand]||0) + p.total; return acc; }, {});

  return (
    <div style={{ padding:'24px 28px', maxWidth: 1200, margin:'0 auto' }}>
      <HistoryHeader
        onBack={onBack}
        eyebrow={c.name}
        title="Historial de compras"
        subtitle="Cada transacción con desglose por SKU, pago y BA. Útil para reposiciones, reclamos y aniversarios."
        chips={<>
          <span className="lx-chip" style={{ height: 26, fontSize: 12 }}>{filtered.length} compras</span>
          <span className="lx-chip" style={{ height: 26, fontSize: 12 }}>{itemCount} unidades</span>
        </>}
      />

      {/* Filters — solo período (la marca está fijada por el brand lock de la BA) */}
      <div className="lx-card" style={{ padding: 14, display:'flex', gap: 16, alignItems:'center', marginBottom: 16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap: 6 }}>
          {[['3m','3 meses'],['6m','6 meses'],['12m','12 meses'],['all','Todo']].map(([id,l]) => (
            <button key={id} onClick={()=>setPeriod(id)} className="lx-chip"
              style={{
                cursor:'pointer', height: 32, padding:'0 14px',
                background: period===id?'var(--ink)':'#fff',
                color: period===id?'#fff':'var(--ink)',
                borderColor: period===id?'var(--ink)':'var(--line)',
              }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <button className="lx-btn lx-btn--sm"><I.pdf size={14}/> Exportar PDF</button>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <MiniStat label="Total comprado" value={MXN(total)}/>
        <MiniStat label="Ticket promedio" value={MXN(avg)}/>
        <MiniStat label="Última compra" value={filtered[0] ? fmtRel(filtered[0].at) : '—'}/>
        <MiniStat label="Marcas" value={Object.keys(byBrand).join(' · ') || '—'} sub={Object.entries(byBrand).map(([b,v])=>`${b} ${MXN(v)}`).join(' · ')}/>
      </div>

      {/* Purchases list */}
      <div className="lx-card-luxe" style={{ padding: 24 }}>
        {filtered.length === 0 && <div className="lx-small" style={{ padding: 20, textAlign:'center' }}>Sin compras en este rango.</div>}
        {filtered.map(p => {
          const ba = getBA(p.baId);
          return (
            <div key={p.id} style={{ padding:'18px 0', borderBottom:'1px solid var(--line)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <I.bag/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
                    <span style={{ fontFamily:'var(--f-display)', fontSize: 22 }} className="lx-num">{MXN(p.total)}</span>
                    <LxBrandTag brand={p.brand} small/>
                    <span className="lx-small" style={{ fontSize: 11 }}>Ticket {p.ticket || p.id.toUpperCase()}</span>
                  </div>
                  <div className="lx-small" style={{ fontSize: 11, marginTop: 2 }}>
                    {fmtDate(p.at)} · {fmtTime(p.at)} · {ba?.name} · {p.pay || 'Pago no registrado'}
                  </div>
                </div>
                <span className={`lx-chip ${p.status==='returned'?'lx-chip--err':p.status==='exchange'?'lx-chip--warn':'lx-chip--ok'}`} style={{ height: 24, fontSize: 11 }}>
                  {p.status==='returned'?'Devuelta':p.status==='exchange'?'Cambio':'Completada'}
                </span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 8, paddingLeft: 56 }}>
                {p.items.map((it,i) => {
                  const prod = getProduct(it.sku);
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 10px', background:'var(--bone)', borderRadius: 8 }}>
                      {prod && <ProductThumb sku={it.sku} size={32}/>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{prod?.line || it.sku}</div>
                        <div className="lx-small" style={{ fontSize: 10.5 }}>{prod?.name || ''} · {it.qty} ud.</div>
                      </div>
                      <div className="lx-num" style={{ fontSize: 12, fontWeight: 600 }}>{MXN(it.price * it.qty)}</div>
                    </div>
                  );
                })}
              </div>
              {p.notes && <div className="lx-small" style={{ fontSize: 11.5, marginTop: 10, paddingLeft: 56 }}>{p.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Línea de tiempo completa ─────────────────────────────────────────────
function ScreenHistoryTimeline({ onBack }) {
  const c = getProfileClient();
  const ints = clientInteractions(c.id);
  const [type, setType] = React.useState('Todas');
  const types = ['Todas', ...Array.from(new Set(ints.map(i => i.type)))];
  const filtered = type==='Todas' ? ints : ints.filter(i => i.type === type);

  return (
    <div style={{ padding:'24px 28px', maxWidth: 1100, margin:'0 auto' }}>
      <HistoryHeader
        onBack={onBack}
        eyebrow={`${c.name} · ${c.tier}`}
        title="Línea de tiempo completa"
        subtitle="Cada interacción registrada — consultas, compras, muestras, citas, mensajes. Filtra por tipo."
        chips={<span className="lx-chip" style={{ height: 26, fontSize: 12 }}>{filtered.length} de {ints.length} eventos</span>}
      />

      {/* Type filter */}
      <div className="lx-card" style={{ padding: 14, display:'flex', gap: 8, alignItems:'center', marginBottom: 16, flexWrap:'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={()=>setType(t)} className="lx-chip"
            style={{
              cursor:'pointer', height: 32, padding:'0 14px',
              background: type===t?'var(--ink)':'#fff',
              color: type===t?'#fff':'var(--ink)',
              borderColor: type===t?'var(--ink)':'var(--line)',
            }}>{t}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <button className="lx-btn lx-btn--sm"><I.pdf size={14}/> Exportar</button>
      </div>

      <div className="lx-card-luxe" style={{ padding: 24 }}>
        {filtered.length === 0 && <div className="lx-small" style={{ padding: 20, textAlign:'center' }}>Sin eventos en este filtro.</div>}
        {filtered.map(i => <TimelineItem key={i.id} item={i}/>)}
      </div>
    </div>
  );
}

// ─── Recomendaciones completas ────────────────────────────────────────────
function ScreenHistoryRecs({ onBack }) {
  const c = getProfileClient();
  const recs = clientRecs(c.id);
  const [status, setStatus] = React.useState('Todas');
  const filtered = status==='Todas' ? recs : recs.filter(r => status==='Convertidas'?r.status==='converted':r.status!=='converted');
  const converted = recs.filter(r => r.status === 'converted').length;
  const conversionRate = recs.length ? Math.round(converted/recs.length*100) : 0;

  return (
    <div style={{ padding:'24px 28px', maxWidth: 1100, margin:'0 auto' }}>
      <HistoryHeader
        onBack={onBack}
        eyebrow={`${c.name} · ${c.tier}`}
        title="Historial de recomendaciones"
        subtitle="Cada recomendación hecha por la BA, su fecha, productos sugeridos y si convirtió en venta."
        chips={<>
          <span className="lx-chip" style={{ height: 26, fontSize: 12 }}>{recs.length} totales</span>
          <span className="lx-chip lx-chip--ok" style={{ height: 26, fontSize: 12 }}>{conversionRate}% conversión</span>
        </>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        <MiniStat label="Convertidas" value={converted} accent="var(--ok)"/>
        <MiniStat label="Pendientes" value={recs.length - converted}/>
        <MiniStat label="Tasa conversión" value={conversionRate + '%'}/>
      </div>

      <div className="lx-card" style={{ padding: 14, display:'flex', gap: 8, marginBottom: 16 }}>
        {['Todas','Convertidas','Pendientes'].map(t => (
          <button key={t} onClick={()=>setStatus(t)} className="lx-chip"
            style={{
              cursor:'pointer', height: 32, padding:'0 14px',
              background: status===t?'var(--ink)':'#fff',
              color: status===t?'#fff':'var(--ink)',
              borderColor: status===t?'var(--ink)':'var(--line)',
            }}>{t}</button>
        ))}
      </div>

      <div className="lx-card-luxe" style={{ padding: 24 }}>
        {filtered.length === 0 && <div className="lx-small" style={{ padding: 20, textAlign:'center' }}>Sin recomendaciones en este filtro.</div>}
        {filtered.map(r => (
          <div key={r.id} style={{ display:'grid', gridTemplateColumns:'1fr', gap: 10, padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
              <span className="lx-micro">{fmtDate(r.at)}</span>
              <span className={`lx-chip ${r.status==='converted'?'lx-chip--ok':'lx-chip--warn'}`} style={{ height: 22, fontSize: 11 }}>
                {r.status==='converted' ? `Convertida → ${r.purchaseId}` : 'Pendiente'}
              </span>
              <span className="lx-small" style={{ fontSize: 11 }}>por {getBA(r.baId)?.name}</span>
              {r.context && <span className="lx-small" style={{ fontSize: 11, fontStyle:'italic' }}>· {r.context}</span>}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
              {r.items.map(sku => {
                const p = getProduct(sku);
                return (
                  <div key={sku} style={{ display:'flex', alignItems:'center', gap: 8, padding:'6px 10px', background:'var(--bone)', borderRadius: 8 }}>
                    <ProductThumb sku={sku} size={32}/>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p?.line}</div>
                      <div className="lx-small" style={{ fontSize: 10.5 }}>{p?.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Muestras completas ───────────────────────────────────────────────────
function ScreenHistorySamples({ onBack }) {
  const c = getProfileClient();
  const samps = clientSamples(c.id);
  const [filter, setFilter] = React.useState('Todas');
  const filtered = filter==='Todas' ? samps : samps.filter(s => filter==='Convertidas'?s.converted:!s.converted);
  const converted = samps.filter(s => s.converted).length;
  const conversionRate = samps.length ? Math.round(converted/samps.length*100) : 0;

  return (
    <div style={{ padding:'24px 28px', maxWidth: 1100, margin:'0 auto' }}>
      <HistoryHeader
        onBack={onBack}
        eyebrow={`${c.name} · ${c.tier}`}
        title="Historial de muestras"
        subtitle="Muestras entregadas, fecha de seguimiento y si convirtieron en compra."
        chips={<>
          <span className="lx-chip" style={{ height: 26, fontSize: 12 }}>{samps.length} muestras</span>
          <span className="lx-chip lx-chip--ok" style={{ height: 26, fontSize: 12 }}>{conversionRate}% conversión</span>
        </>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        <MiniStat label="Convertidas" value={converted} accent="var(--ok)"/>
        <MiniStat label="Pendientes" value={samps.length - converted}/>
        <MiniStat label="Tasa conversión" value={conversionRate + '%'}/>
      </div>

      <div className="lx-card" style={{ padding: 14, display:'flex', gap: 8, marginBottom: 16 }}>
        {['Todas','Convertidas','Pendientes'].map(t => (
          <button key={t} onClick={()=>setFilter(t)} className="lx-chip"
            style={{
              cursor:'pointer', height: 32, padding:'0 14px',
              background: filter===t?'var(--ink)':'#fff',
              color: filter===t?'#fff':'var(--ink)',
              borderColor: filter===t?'var(--ink)':'var(--line)',
            }}>{t}</button>
        ))}
      </div>

      <div className="lx-card-luxe" style={{ padding: 24 }}>
        {filtered.length === 0 && <div className="lx-small" style={{ padding: 20, textAlign:'center' }}>Sin muestras en este filtro.</div>}
        {filtered.map(s => (
          <div key={s.id} style={{ display:'grid', gridTemplateColumns:'52px 1fr auto auto auto', gap: 16, alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <I.gift size={22}/>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
              <div className="lx-small" style={{ fontSize: 11 }}>SKU {s.sku} · Entregada {fmtDate(s.givenAt)}</div>
              {s.notes && <div className="lx-small" style={{ fontSize: 11, marginTop: 2, fontStyle:'italic' }}>{s.notes}</div>}
            </div>
            <span className="lx-small" style={{ fontSize: 11 }}>Seguim. {fmtDate(s.followUp)}</span>
            <span className={`lx-chip ${s.converted?'lx-chip--ok':'lx-chip--warn'}`} style={{ height: 22, fontSize: 11 }}>
              {s.converted ? 'Convertida' : 'Pendiente'}
            </span>
            <button className="lx-btn lx-btn--sm" style={{ height: 30 }}>Seguir</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comunicaciones completas ─────────────────────────────────────────────
function ScreenHistoryMsgs({ onBack }) {
  const c = getProfileClient();
  const msgs = clientMsgs(c.id);
  const [ch, setCh] = React.useState('Todos');
  const channels = ['Todos', ...Array.from(new Set(msgs.map(m => m.channel)))];
  const filtered = ch==='Todos' ? msgs : msgs.filter(m => m.channel === ch);
  const read = msgs.filter(m => m.readAt).length;
  const responded = msgs.filter(m => m.respondedAt).length;
  const converted = msgs.filter(m => m.converted).length;

  return (
    <div style={{ padding:'24px 28px', maxWidth: 1100, margin:'0 auto' }}>
      <HistoryHeader
        onBack={onBack}
        eyebrow={`${c.name} · ${c.tier}`}
        title="Historial de comunicaciones"
        subtitle="Tracking E2E de cada mensaje — envío, entrega, lectura, respuesta y conversión a compra."
        chips={<span className="lx-chip" style={{ height: 26, fontSize: 12 }}>{filtered.length} mensajes</span>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        <MiniStat label="Enviados" value={msgs.length}/>
        <MiniStat label="Leídos" value={`${read} (${msgs.length?Math.round(read/msgs.length*100):0}%)`}/>
        <MiniStat label="Respondidos" value={`${responded} (${msgs.length?Math.round(responded/msgs.length*100):0}%)`}/>
        <MiniStat label="Conversiones" value={converted} accent="var(--ok)"/>
      </div>

      <div className="lx-card" style={{ padding: 14, display:'flex', gap: 8, marginBottom: 16 }}>
        {channels.map(t => (
          <button key={t} onClick={()=>setCh(t)} className="lx-chip"
            style={{
              cursor:'pointer', height: 32, padding:'0 14px',
              background: ch===t?'var(--ink)':'#fff',
              color: ch===t?'#fff':'var(--ink)',
              borderColor: ch===t?'var(--ink)':'var(--line)',
            }}>{t}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <button className="lx-btn lx-btn--sm"><I.plus size={14}/> Nuevo mensaje</button>
      </div>

      <div className="lx-card-luxe" style={{ padding: 24 }}>
        {filtered.length === 0 && <div className="lx-small" style={{ padding: 20, textAlign:'center' }}>Sin mensajes en este filtro.</div>}
        {filtered.map(m => (
          <div key={m.id} style={{ padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8, flexWrap:'wrap' }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {m.channel==='WhatsApp' ? <I.whatsapp size={14}/> : <I.email size={14}/>}
              </span>
              <LxBrandTag brand={m.brand} small/>
              <span className="lx-small" style={{ fontSize: 11 }}>{m.channel} · {fmtDate(m.sentAt)} · {fmtTime(m.sentAt)}</span>
              {m.template && <span className="lx-chip" style={{ height: 20, fontSize: 10 }}>Plantilla {m.template}</span>}
              {m.converted && <span className="lx-chip lx-chip--ok" style={{ height: 20, fontSize: 10, marginLeft:'auto' }}>→ Compra</span>}
            </div>
            <div style={{ fontSize: 13.5, paddingLeft: 36, marginBottom: 8, lineHeight: 1.5 }}>{m.preview}</div>
            <div style={{ display:'flex', gap: 18, paddingLeft: 36, flexWrap:'wrap' }} className="lx-small">
              <span>✓ Enviado {fmtTime(m.sentAt)}</span>
              {m.deliveredAt && <span>✓✓ Entregado {fmtTime(m.deliveredAt)}</span>}
              {m.readAt && <span style={{ color: 'var(--ok)' }}>✓✓ Leído {fmtTime(m.readAt)}</span>}
              {m.respondedAt && <span style={{ color:'var(--ok)' }}>↩ Respondió {fmtTime(m.respondedAt)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenHistoryPurchases,
  ScreenHistoryTimeline,
  ScreenHistoryRecs,
  ScreenHistorySamples,
  ScreenHistoryMsgs,
  ScreenPurchasesFull: ScreenHistoryPurchases,
  ScreenTimelineFull:  ScreenHistoryTimeline,
  ScreenRecsFull:      ScreenHistoryRecs,
  ScreenSamplesFull:   ScreenHistorySamples,
  ScreenMsgsFull:      ScreenHistoryMsgs,
});
