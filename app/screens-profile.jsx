// Screen: Client profile (deep polish). The heart of the app.

function ConsentMatrix({ clientId }) {
  const cons = clientConsents(clientId);
  const byChannel = (ch) => cons.filter(c => c.channel === ch).sort((a,b) => new Date(b.at) - new Date(a.at))[0];
  const ICONS = { SMS: <I.sms/>, Email: <I.email/>, WhatsApp: <I.whatsapp/> };
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      {['SMS','Email','WhatsApp'].map(ch => {
        const c = byChannel(ch);
        const granted = c?.status === 'granted';
        return (
          <div key={ch} style={{ display:'grid', gridTemplateColumns:'32px 1fr auto', alignItems:'center', gap: 12, padding:'10px 0', borderBottom:'1px dashed var(--line)' }}>
            <span style={{ color:'var(--ink-60)' }}>{ICONS[ch]}</span>
            <div>
              <div style={{ fontWeight:600, fontSize: 13 }}>{ch}</div>
              <div className="lx-small" style={{ fontSize: 11 }}>
                {c ? `${c.version} · ${fmtDate(c.at)} · ${c.source}` : 'Sin registro'}
              </div>
            </div>
            <span className={`lx-chip ${granted?'lx-chip--ok':'lx-chip--err'}`} style={{ height: 22, fontSize: 11 }}>
              {granted ? 'Otorgado' : 'Revocado'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TimelineItem({ item }) {
  const ba = getBA(item.baId);
  const icons = {
    'Consulta skincare': <I.sparkle/>,
    'Compra': <I.bag/>,
    'Descubrimiento': <I.heart/>,
    'Seguimiento WhatsApp': <I.whatsapp/>,
    'Cita atendida': <I.cal/>,
  };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'24px 1fr', gap: 14, padding:'10px 0', position:'relative' }}>
      <div style={{ position:'relative' }}>
        <span style={{ width: 24, height: 24, borderRadius:999, background:'#fff', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink)' }}>
          {icons[item.type] || <I.sparkle/>}
        </span>
      </div>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.type}</span>
          <LxBrandTag brand={item.brand} small/>
          <span className="lx-small" style={{ fontSize: 11, marginLeft:'auto' }}>{fmtDate(item.at)} · {fmtTime(item.at)}</span>
        </div>
        <div className="lx-small" style={{ fontSize: 12, lineHeight: 1.4 }}>{item.notes}</div>
        <div className="lx-small" style={{ fontSize: 11, marginTop: 4 }}>Por {ba?.name}</div>
      </div>
    </div>
  );
}

function ProductThumb({ sku, size=44 }) {
  const p = getProduct(sku);
  if (!p) return null;
  const tone = p.brand === 'Lancôme'
    ? { bg: 'linear-gradient(135deg,#E8C4C0,#F5E4D7)', fg: '#5a2230' }
    : { bg: 'linear-gradient(135deg,#0a0a0a,#2a2a2a)', fg: '#C9A961' };
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: tone.bg, color: tone.fg,
      display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-display)',
      fontSize: size*0.4, letterSpacing:'-0.02em', flex:'0 0 auto', border: '1px solid var(--line)',
    }}>
      {p.line.charAt(0)}
    </div>
  );
}

// Motivos de visita estándar (RF-06).
const VISIT_REASONS = [
  { id:'new_purchase', label:'Nueva compra',         icon:'🛍️' },
  { id:'repurchase',   label:'Recompra',             icon:'🔁' },
  { id:'gift',         label:'Regalo',               icon:'🎁' },
  { id:'concern',      label:'Preocupación / consulta', icon:'💬' },
  { id:'promo',        label:'Promoción',            icon:'✨' },
  { id:'discover',     label:'Conocer productos',    icon:'🔍' },
];

// Pantalla completa para registrar una visita (RF-34).
// Migrada desde el modal flotante a una pantalla completa con back button.
function ScreenRegisterVisit({ clientId, onBack, initialReason }) {
  const client = getClient(clientId) || CLIENTS[0];
  const [vtype, setVtype] = React.useState('consulta');
  const [reason, setReason] = React.useState(initialReason || client.lastVisitReason || 'concern');
  const [brand, setBrand] = React.useState(client.brands[0] || 'Lancôme');
  const [notes, setNotes] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [products, setProducts] = React.useState('');
  const [followUpDays, setFollowUpDays] = React.useState(7);
  const [duration, setDuration] = React.useState(20);
  const [outcome, setOutcome] = React.useState('positive');
  const [saved, setSaved] = React.useState(false);

  const VISIT_TYPES = [
    { id:'consulta',    label:'Consulta',       icon:<I.sparkle/>,    desc:'Diagnóstico de piel, asesoría sin compra' },
    { id:'venta',       label:'Venta',          icon:<I.bag/>,        desc:'Compra registrada en POS o app' },
    { id:'muestra',     label:'Muestra',        icon:<I.gift/>,       desc:'Entrega de muestras o producto descubrimiento' },
    { id:'cortesia',    label:'Visita cortesía',icon:<I.heart/>,      desc:'Visita social, sin transacción' },
    { id:'devolucion',  label:'Devolución',     icon:<I.arrowL/>,     desc:'Devolución, cambio o queja' },
    { id:'seguimiento', label:'Seguimiento',    icon:<I.whatsapp/>,   desc:'Visita programada por seguimiento previo' },
  ];

  const handleSave = () => {
    const reasonMeta = VISIT_REASONS.find((r) => r.id === reason);
    const visit = {
      id: 'int-' + Date.now().toString(36),
      clientId: client.id,
      type: ({ consulta:'Consulta skincare', venta:'Compra', muestra:'Descubrimiento', cortesia:'Cita atendida', devolucion:'Devolución', seguimiento:'Seguimiento WhatsApp' })[vtype],
      brand,
      at: new Date().toISOString(),
      notes: notes || `${VISIT_TYPES.find(v=>v.id===vtype).label} registrada en tienda${reasonMeta ? ' · motivo: ' + reasonMeta.label : ''}`,
      baId: window.CURRENT_BA?.id,
      duration: vtype==='consulta' ? duration : null,
      amount: vtype==='venta' ? parseFloat(amount)||0 : null,
      products: products ? products.split(',').map(s=>s.trim()).filter(Boolean) : [],
      outcome,
      reason,
      reasonLabel: reasonMeta?.label || null,
    };
    if (Array.isArray(window.INTERACTIONS)) {
      window.INTERACTIONS.unshift(visit);
    }
    // Update client stats
    client.stats = client.stats || { ltv:0, visits:0, avgTicket:0, lastPurchase:null };
    if (vtype === 'venta' && visit.amount > 0) {
      client.stats.ltv = (client.stats.ltv || 0) + visit.amount;
      client.stats.lastPurchase = visit.at.slice(0,10);
    }
    client.stats.visits = (client.stats.visits || 0) + 1;
    // Recalcular ticket promedio si hubo venta (LTV / # visitas).
    if (client.stats.ltv > 0 && client.stats.visits > 0) {
      client.stats.avgTicket = Math.round(client.stats.ltv / client.stats.visits);
    }
    client.lastVisit = visit.at.slice(0,10);
    client.lastVisitReason = reason;
    client.lastVisitReasonLabel = reasonMeta?.label || null;
    if (window.LxState) window.LxState.saveAll();
    setSaved(true);
    setTimeout(() => onBack && onBack(), 1400);
  };

  // Dynamic form fields per visit type
  const isVenta = vtype === 'venta';
  const isConsulta = vtype === 'consulta';
  const isMuestra = vtype === 'muestra';
  const isDevolucion = vtype === 'devolucion';

  if (saved) {
    return (
      <div style={{ padding: '48px 40px', maxWidth: 720, margin:'0 auto' }}>
        <div className="lx-card-luxe" style={{ padding: 48, textAlign:'center', background:'var(--ok-08)', borderColor:'var(--ok-20)' }}>
          <div style={{ width: 72, height: 72, borderRadius:'50%', background:'var(--ok)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="5,12 10,17 19,7"/></svg>
          </div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 32, letterSpacing:'-0.01em' }}>Visita registrada</div>
          <div className="lx-small" style={{ marginTop: 8 }}>Aparecerá en la línea de tiempo de {client.name}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'24px 32px', maxWidth: 920, margin:'0 auto' }}>
      {/* Breadcrumb */}
      <div className="lx-small" style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 16 }}>
        <button className="lx-btn lx-btn--ghost lx-btn--sm" onClick={onBack} style={{ padding:0, height: 20 }}><I.arrowL/> {client.name}</button>
        <span>/</span>
        <span>Registrar visita</span>
      </div>

      <div className="lx-card-luxe" style={{ padding: 32 }}>
        <>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 16 }}>
              <div>
                <div className="lx-micro">Registrar visita</div>
                <div style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4, letterSpacing:'-0.01em' }}>{client.name}</div>
                <div className="lx-small" style={{ fontSize: 12, marginTop: 6, display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
                  <span>{fmtDate(new Date().toISOString())}</span>
                  <span>·</span>
                  <span className="lx-chip" style={{ height: 22, fontSize: 11, background:'var(--ink)', color:'#fff', borderColor:'var(--ink)' }}>
                    Atribuir a {window.CURRENT_BA?.name || 'BA actual'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visit type picker */}
            <div className="lx-micro" style={{ marginBottom: 10 }}>Tipo de visita *</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {VISIT_TYPES.map(v => (
                <button key={v.id} onClick={() => setVtype(v.id)}
                  style={{
                    textAlign:'left', padding: '12px 14px', borderRadius: 10,
                    border: '1px solid ' + (vtype===v.id ? 'var(--ink)' : 'var(--line)'),
                    background: vtype===v.id ? 'var(--ink)' : '#fff',
                    color:      vtype===v.id ? '#fff' : 'var(--ink)',
                    cursor:'pointer', transition:'all .15s',
                  }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
                    {v.icon}
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{v.label}</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.35 }}>{v.desc}</div>
                </button>
              ))}
            </div>

            {/* Motivo de visita (RF-06) */}
            <div className="lx-micro" style={{ marginBottom: 8 }}>Motivo de visita *</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              {VISIT_REASONS.map((r) => (
                <button key={r.id} onClick={() => setReason(r.id)} className="lx-chip"
                  style={{
                    height: 38, justifyContent:'flex-start', padding:'0 12px', fontSize: 12.5,
                    background: reason===r.id ? 'var(--ink)' : '#fff',
                    color:      reason===r.id ? '#fff' : 'var(--ink)',
                    borderColor: reason===r.id ? 'var(--ink)' : 'var(--line)',
                    cursor:'pointer',
                  }}>
                  <span style={{ marginRight: 8 }}>{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Brand */}
            <div className="lx-micro" style={{ marginBottom: 8 }}>Marca</div>
            <div style={{ display:'flex', gap: 8, marginBottom: 20 }}>
              {['Lancôme','YSL'].map(b => (
                <button key={b} onClick={() => setBrand(b)} className="lx-btn lx-btn--sm"
                  style={{
                    flex: 1, height: 38, fontSize: 13,
                    background: brand===b ? 'var(--ink)' : '#fff',
                    color:      brand===b ? '#fff' : 'var(--ink)',
                    borderColor: brand===b ? 'var(--ink)' : 'var(--line)',
                  }}>{b}</button>
              ))}
            </div>

            {/* DYNAMIC FORM — fields change per visit type */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 16 }}>
              {isVenta && (
                <>
                  <div>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>Monto (MXN) *</div>
                    <input className="lx-input" inputMode="decimal" placeholder="3,500" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^\d.]/g,''))}/>
                  </div>
                  <div>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>SKUs (separados por coma)</div>
                    <input className="lx-input" placeholder="LC-AT-50, YS-LIB-90" value={products} onChange={e=>setProducts(e.target.value)}/>
                  </div>
                </>
              )}

              {isConsulta && (
                <>
                  <div>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>Duración (minutos)</div>
                    <input className="lx-input" inputMode="numeric" value={duration} onChange={e=>setDuration(parseInt(e.target.value)||0)}/>
                  </div>
                  <div>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>Resultado</div>
                    <div style={{ display:'flex', gap: 6 }}>
                      {[['positive','Positivo'],['neutral','Neutro'],['follow','Requiere seguimiento']].map(([id,label]) => (
                        <button key={id} onClick={()=>setOutcome(id)} className="lx-chip"
                          style={{
                            flex: 1, height: 32, justifyContent:'center', cursor:'pointer', fontSize: 11.5,
                            background: outcome===id ? 'var(--ink)' : '#fff',
                            color:      outcome===id ? '#fff' : 'var(--ink)',
                            borderColor: outcome===id ? 'var(--ink)' : 'var(--line)',
                          }}>{label}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isMuestra && (
                <>
                  <div style={{ gridColumn:'1/-1' }}>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>SKUs entregados (separados por coma) *</div>
                    <input className="lx-input" placeholder="LC-AT-50, YS-LIB-MINI" value={products} onChange={e=>setProducts(e.target.value)}/>
                  </div>
                  <div>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>Seguimiento programado en</div>
                    <div style={{ display:'flex', gap: 6 }}>
                      {[3, 7, 14, 30].map(d => (
                        <button key={d} onClick={()=>setFollowUpDays(d)} className="lx-chip"
                          style={{
                            flex: 1, height: 32, justifyContent:'center', cursor:'pointer', fontSize: 12,
                            background: followUpDays===d ? 'var(--ink)' : '#fff',
                            color:      followUpDays===d ? '#fff' : 'var(--ink)',
                            borderColor: followUpDays===d ? 'var(--ink)' : 'var(--line)',
                          }}>{d}d</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isDevolucion && (
                <>
                  <div>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>Monto devuelto (MXN) *</div>
                    <input className="lx-input" inputMode="decimal" placeholder="1,200" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^\d.]/g,''))}/>
                  </div>
                  <div>
                    <div className="lx-micro" style={{ marginBottom: 6 }}>SKU devuelto</div>
                    <input className="lx-input" placeholder="LC-AT-50" value={products} onChange={e=>setProducts(e.target.value)}/>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="lx-micro" style={{ marginBottom: 6 }}>Notas {isVenta||isDevolucion?'(opcional)':'*'}</div>
              <textarea className="lx-input" rows={3} style={{ minHeight: 72, padding: 12, fontFamily:'inherit', resize:'vertical' }}
                placeholder={
                  isConsulta ? 'Resumen del diagnóstico, productos discutidos, recomendaciones…' :
                  isVenta ? 'Notas adicionales sobre la venta…' :
                  isMuestra ? 'Qué se entregó y por qué, para guiar el seguimiento…' :
                  isDevolucion ? 'Razón de la devolución…' :
                  'Notas sobre la visita…'
                }
                value={notes} onChange={e=>setNotes(e.target.value)}/>
            </div>

            <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <button className="lx-btn" onClick={onBack}>Cancelar</button>
              <button className="lx-btn lx-btn--primary" onClick={handleSave}
                disabled={
                  (isVenta && !amount) ||
                  (isMuestra && !products) ||
                  (isDevolucion && !amount)
                }>
                <I.cal/> Guardar visita
              </button>
            </div>
        </>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ScreenRegisterSale — pantalla completa para registrar una venta manual
// (RF-20, RF-23). Atribución automática a la BA logueada (RF-25). Captura
// fecha, items con SKU/nombre/marca/precio/cantidad, método de pago y total.
// ─────────────────────────────────────────────────────────────────────────

function ProductPicker({ value, onSelect, brand }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const candidates = (window.PRODUCTS || []).filter((p) => {
    if (brand && brand !== 'Todas' && p.brand !== brand) return false;
    if (!q) return true;
    const hay = (p.sku + ' ' + p.line + ' ' + p.name + ' ' + p.brand).toLowerCase();
    return hay.includes(q.toLowerCase());
  }).slice(0, 8);

  return (
    <div style={{ position:'relative' }}>
      <input className="lx-input"
        value={value ? `${value.sku} · ${value.line}` : q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); if (value) onSelect(null); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar por SKU, línea o nombre…"
        style={{ paddingLeft: 38 }}/>
      <span style={{ position:'absolute', left: 12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-40)' }}>
        <I.search size={16}/>
      </span>
      {open && candidates.length > 0 && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
          background:'#fff', border:'1px solid var(--line)', borderRadius: 10,
          boxShadow:'0 8px 24px rgba(0,0,0,.08)', maxHeight: 280, overflowY:'auto',
        }}>
          {candidates.map((p) => (
            <div key={p.sku} onClick={() => { onSelect(p); setQ(''); setOpen(false); }}
              style={{ padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap: 10 }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bone)'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
                  <span className="lx-num lx-small" style={{ fontSize: 10 }}>{p.sku}</span>
                  <LxBrandTag brand={p.brand} small/>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{p.line}</div>
                <div className="lx-small" style={{ fontSize: 11 }}>{p.name} · {p.size}</div>
              </div>
              <div className="lx-num" style={{ fontSize: 13, fontWeight: 600 }}>{MXN(p.price)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScreenRegisterSale({ clientId, onBack }) {
  const client = getClient(clientId) || CLIENTS[0];
  const ba = window.CURRENT_BA;
  const todayISO = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [saleDate, setSaleDate] = React.useState(todayISO);
  const [saleTime, setSaleTime] = React.useState(nowTime);
  const [pay, setPay]           = React.useState('Tarjeta');
  const [payDetail, setPayDetail] = React.useState('');
  const [ticket, setTicket]     = React.useState('');
  const [notes, setNotes]       = React.useState('');
  // Items: { product (PRODUCTS object | null), qty }
  const [items, setItems] = React.useState([{ product: null, qty: 1 }]);
  const [saved, setSaved] = React.useState(false);

  const setItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const addItem = () => setItems((prev) => [...prev, { product: null, qty: 1 }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const filledItems = items.filter((it) => it.product);
  const lineTotal = (it) => (it.product?.price || 0) * (it.qty || 0);
  const total = filledItems.reduce((s, it) => s + lineTotal(it), 0);
  const brandsInSale = Array.from(new Set(filledItems.map((it) => it.product.brand)));
  const dominantBrand = brandsInSale[0] || client.brands[0] || 'Lancôme';

  const canSave = filledItems.length > 0 && total > 0 && ba;

  const handleSave = () => {
    if (!canSave) return;
    const at = `${saleDate}T${saleTime}:00`;
    const paySummary = payDetail ? `${pay} · ${payDetail}` : pay;
    const purchase = {
      clientId: client.id,
      baId: ba.id,
      storeId: ba.storeId,
      at,
      brand: dominantBrand,
      items: filledItems.map((it) => ({
        sku: it.product.sku,
        qty: it.qty,
        price: it.product.price,
        productName: it.product.name,
        productLine: it.product.line,
        brand: it.product.brand,
      })),
      total: Math.round(total),
      pay: paySummary,
      ticket: ticket || `MAN-${Date.now().toString(36).toUpperCase()}`,
      manual: true,
      notes: notes || null,
    };
    if (window.LxState) {
      window.LxState.addPurchase(purchase);
    } else if (Array.isArray(window.PURCHASES)) {
      window.PURCHASES.unshift({ id: 'pu-' + Date.now().toString(36), ...purchase });
    }

    // Update client stats — LTV, visitas, avgTicket recalculado, última compra.
    client.stats = client.stats || { ltv:0, visits:0, avgTicket:0, lastPurchase:null };
    client.stats.ltv = (client.stats.ltv || 0) + purchase.total;
    client.stats.visits = (client.stats.visits || 0) + 1;
    client.stats.avgTicket = Math.round(client.stats.ltv / client.stats.visits);
    client.stats.lastPurchase = saleDate;
    client.lastVisit = saleDate;

    // Agregar evento a la línea de tiempo del cliente (INTERACTIONS).
    const productSummary = filledItems.map((it) => it.product.line).join(' + ');
    const interaction = {
      id: 'int-' + Date.now().toString(36),
      clientId: client.id,
      baId: ba.id,
      type: 'Compra',
      brand: dominantBrand,
      at,
      notes: `Venta registrada · ${productSummary} · ${MXN(purchase.total)} · ${paySummary}`,
      amount: purchase.total,
      products: filledItems.map((it) => it.product.sku),
      manual: true,
    };
    if (Array.isArray(window.INTERACTIONS)) {
      window.INTERACTIONS.unshift(interaction);
    }

    if (window.LxState) window.LxState.saveAll();
    setSaved(true);
    setTimeout(() => onBack && onBack(), 1600);
  };

  if (saved) {
    return (
      <div style={{ padding: '48px 40px', maxWidth: 720, margin:'0 auto' }}>
        <div className="lx-card-luxe" style={{ padding: 48, textAlign:'center', background:'var(--ok-08)', borderColor:'var(--ok-20)' }}>
          <div style={{ width: 72, height: 72, borderRadius:'50%', background:'var(--ok)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="5,12 10,17 19,7"/></svg>
          </div>
          <div className="lx-micro" style={{ color:'var(--ok)' }}>Venta registrada</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 36, letterSpacing:'-0.01em', marginTop: 6 }}>
            {MXN(total)}
          </div>
          <div className="lx-small" style={{ marginTop: 8 }}>
            {filledItems.length} producto{filledItems.length === 1 ? '' : 's'} · atribuida a {ba?.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'24px 32px', maxWidth: 1080, margin:'0 auto' }}>
      {/* Breadcrumb */}
      <div className="lx-small" style={{ display:'flex', alignItems:'center', gap: 6, marginBottom: 16 }}>
        <button className="lx-btn lx-btn--ghost lx-btn--sm" onClick={onBack} style={{ padding:0, height: 20 }}><I.arrowL/> {client.name}</button>
        <span>/</span>
        <span>Registrar venta</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap: 20, alignItems:'flex-start' }}>
        {/* MAIN — capture form */}
        <div className="lx-card-luxe" style={{ padding: 28 }}>
          <div style={{ marginBottom: 18 }}>
            <div className="lx-micro">Registrar venta · manual</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 30, letterSpacing:'-0.01em', marginTop: 4 }}>
              Captura una compra
            </div>
            <div className="lx-small" style={{ marginTop: 6 }}>
              Usa esta vista cuando no haya integración con POS. La venta se atribuye automáticamente a {ba?.name || 'la BA actual'}.
            </div>
          </div>

          {/* Client + BA attribution */}
          <div className="lx-card" style={{ padding: 16, background:'var(--bone)', borderColor:'transparent', marginBottom: 20, display:'flex', alignItems:'center', gap: 14 }}>
            <LxAvatar label={client.initials} size={44} tone={client.brands[0]==='Lancôme'?'lancome':'ysl'}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{client.name}</div>
              <div className="lx-small" style={{ fontSize: 12 }}>{client.phone} · {client.email}</div>
            </div>
            <span className="lx-chip" style={{ height: 24, fontSize: 11, background:'var(--ink)', color:'#fff', borderColor:'var(--ink)' }}>
              Atribuir a {ba?.name?.split(' ')[0] || 'BA'}
            </span>
          </div>

          {/* Fecha y hora */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <div className="lx-micro" style={{ marginBottom: 6 }}>Fecha de la compra *</div>
              <input className="lx-input" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}/>
            </div>
            <div>
              <div className="lx-micro" style={{ marginBottom: 6 }}>Hora</div>
              <input className="lx-input" type="time" value={saleTime} onChange={(e) => setSaleTime(e.target.value)}/>
            </div>
          </div>

          {/* Items */}
          <div className="lx-micro" style={{ marginBottom: 10 }}>Productos vendidos *</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 12, marginBottom: 14 }}>
            {items.map((it, idx) => (
              <div key={idx} className="lx-card" style={{ padding: 14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 120px 28px', gap: 10, alignItems:'flex-end' }}>
                  <div>
                    <div className="lx-small" style={{ marginBottom: 4 }}>SKU / producto</div>
                    <ProductPicker value={it.product} brand={dominantBrand !== it.product?.brand ? null : dominantBrand}
                      onSelect={(p) => setItem(idx, { product: p })}/>
                  </div>
                  <div>
                    <div className="lx-small" style={{ marginBottom: 4 }}>Cantidad</div>
                    <input className="lx-input" type="number" min={1} value={it.qty}
                      onChange={(e) => setItem(idx, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}/>
                  </div>
                  <div>
                    <div className="lx-small" style={{ marginBottom: 4 }}>Precio</div>
                    <div className="lx-input" style={{
                      display:'flex', alignItems:'center', background:'var(--bone)',
                      color: it.product ? 'var(--ink)' : 'var(--ink-40)', fontWeight: it.product ? 600 : 400,
                    }}>
                      {it.product ? MXN(it.product.price) : '—'}
                    </div>
                  </div>
                  <button className="lx-btn lx-btn--sm" onClick={() => removeItem(idx)} title="Quitar"
                    disabled={items.length === 1}
                    style={{ width: 28, height: 28, padding: 0, color:'var(--err)', borderColor:'rgba(162,58,46,.25)' }}>×</button>
                </div>
                {it.product && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 10, paddingTop: 10, borderTop:'1px dashed var(--line)' }}>
                    <div className="lx-small" style={{ fontSize: 12 }}>
                      <b>{it.product.line}</b> · {it.product.name} · {it.product.brand}
                    </div>
                    <span className="lx-num" style={{ fontWeight: 600, fontSize: 14 }}>{MXN(lineTotal(it))}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="lx-btn" onClick={addItem}><I.plus/> Agregar otro producto</button>

          {/* Pay */}
          <div style={{ marginTop: 24 }}>
            <div className="lx-micro" style={{ marginBottom: 8 }}>Método de pago</div>
            <div style={{ display:'flex', gap: 8, marginBottom: 12, flexWrap:'wrap' }}>
              {['Tarjeta','Efectivo','Transferencia','Crédito tienda'].map((p) => (
                <button key={p} onClick={() => setPay(p)} className="lx-chip"
                  style={{
                    height: 34, padding:'0 14px', cursor:'pointer', fontSize: 12,
                    background: pay === p ? 'var(--ink)' : '#fff',
                    color:      pay === p ? '#fff' : 'var(--ink)',
                    borderColor: pay === p ? 'var(--ink)' : 'var(--line)',
                  }}>{p}</button>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14 }}>
              <div>
                <div className="lx-small" style={{ marginBottom: 4 }}>Detalle (opcional)</div>
                <input className="lx-input" placeholder={pay === 'Tarjeta' ? 'Visa · 4321' : 'Detalle del pago'}
                  value={payDetail} onChange={(e) => setPayDetail(e.target.value)}/>
              </div>
              <div>
                <div className="lx-small" style={{ marginBottom: 4 }}>Ticket / folio (opcional)</div>
                <input className="lx-input" placeholder="LV-260511-XXXX (vacío → folio MAN-…)"
                  value={ticket} onChange={(e) => setTicket(e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 18 }}>
            <div className="lx-small" style={{ marginBottom: 4 }}>Notas (opcional)</div>
            <textarea className="lx-input" rows={2} style={{ minHeight: 60, padding: 12, fontFamily:'inherit', resize:'vertical' }}
              placeholder="Comentarios sobre la venta, regalo, instrucciones especiales…"
              value={notes} onChange={(e) => setNotes(e.target.value)}/>
          </div>

          <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', paddingTop: 20, marginTop: 20, borderTop:'1px solid var(--line)' }}>
            <button className="lx-btn" onClick={onBack}>Cancelar</button>
            <button className="lx-btn lx-btn--primary" onClick={handleSave} disabled={!canSave}>
              <I.bag/> Registrar venta {total > 0 ? `· ${MXN(total)}` : ''}
            </button>
          </div>
        </div>

        {/* SIDE — running total + integration hint */}
        <div style={{ display:'flex', flexDirection:'column', gap: 16, position:'sticky', top: 16 }}>
          <div className="lx-card-luxe" style={{ padding: 24, background:'linear-gradient(180deg,#fff,#F7F2EB)' }}>
            <div className="lx-micro">Total venta</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 48, letterSpacing:'-0.02em', marginTop: 4 }} className="lx-num">
              {MXN(total)}
            </div>
            <LxDivider/>
            <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
              <LxKV k="Productos" v={`${filledItems.length}`}/>
              <LxKV k="Unidades" v={`${filledItems.reduce((s, it) => s + (it.qty || 0), 0)}`}/>
              <LxKV k="Marcas" v={brandsInSale.join(', ') || '—'}/>
              <LxKV k="Atribución" v={ba?.name || '—'}/>
              <LxKV k="Tienda" v={ba?.storeId ? (getStore(ba.storeId)?.name || ba.storeId) : '—'}/>
            </div>
          </div>

          <div className="lx-card" style={{ padding: 16, background:'var(--bone)', borderColor:'transparent' }}>
            <div className="lx-micro" style={{ marginBottom: 6 }}>Integración POS</div>
            <div className="lx-small" style={{ fontSize: 12, lineHeight: 1.55 }}>
              En tiendas con integración bidireccional, las compras llegan automáticamente desde el POS. Esta pantalla es para captura manual cuando no hay sincronización.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenClientProfile({ clientId, onBack, onNav }) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState('timeline');
  const c = getClient(clientId) || CLIENTS[0];
  React.useEffect(() => { window.CURRENT_PROFILE_CLIENT_ID = c.id; }, [c.id]);
  const cons   = clientConsents(c.id);
  const ints   = clientInteractions(c.id);
  const recs   = clientRecs(c.id);
  const msgs   = clientMsgs(c.id);
  const samps  = clientSamples(c.id);
  const purs   = clientPurchases(c.id);
  const samplesConv = samps.filter(s => s.converted).length;
  const goTo = (id) => onNav && onNav(id);
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'2fr 1fr', gap: 24 }}>
      {/* LEFT: header + timeline / tabs */}
      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        {/* Breadcrumb */}
        <div className="lx-small" style={{ display:'flex', alignItems:'center', gap: 6 }}>
          <button className="lx-btn lx-btn--ghost lx-btn--sm" onClick={onBack} style={{ padding:0, height: 20 }}><I.arrowL/> {t('clients.title')}</button>
          <span>/</span>
          <span>{c.name}</span>
        </div>

        {/* Hero card */}
        <div className="lx-card-luxe" style={{ padding: 28, display:'grid', gridTemplateColumns:'auto 1fr', gap: 24, alignItems:'center', background:'linear-gradient(180deg,#fff 0%, var(--paper) 100%)' }}>
          <LxAvatar label={c.initials} size={92} tone={c.brands[0]==='Lancôme'?'lancome':'ysl'}/>
          <div style={{ minWidth: 0 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6, flexWrap:'wrap' }}>
              {c.brands.map(b => <LxBrandTag key={b} brand={b} small/>)}
              <span className="lx-chip" style={{ height: 22, fontSize: 11 }}>Desde {c.since}</span>
              {c.lastVisitReasonLabel && (
                <span className="lx-chip" style={{ height: 22, fontSize: 11, background:'var(--ok-08)', borderColor:'var(--ok-20)', color:'var(--ok)' }}>
                  Última visita · {c.lastVisitReasonLabel}
                </span>
              )}
            </div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 44, lineHeight:1.02, letterSpacing:'-0.015em' }}>{c.name}</div>
            <div className="lx-small" style={{ fontSize: 13, marginTop: 6 }}>
              {(window.calcAge && window.calcAge(c.birthday)) || c.age || '—'} años · {c.city} · {c.phone} · {c.email}
            </div>
          </div>
        </div>

        {/* ACTION STRIP — search→recommend→sell→follow-up path */}
        <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr 1fr 1fr 1fr', gap: 10 }}>
          <button className="lx-btn lx-btn--lg" style={{ height: 56, fontSize: 15 }}>
            <I.sparkle/> {t('profile.recommend')}
          </button>
          <button className="lx-btn lx-btn--lg" style={{ height: 56 }} onClick={() => onNav && onNav('register-visit')}>
            <I.cal/> {t('profile.registerVisit')}
          </button>
          <button className="lx-btn lx-btn--lg" style={{ height: 56 }} onClick={() => onNav && onNav('register-sale')}>
            <I.bag/> {t('profile.registerSale')}
          </button>
          <button className="lx-btn lx-btn--lg" style={{ height: 56 }}>
            <I.gift/> {t('profile.giveSample')}
          </button>
          <button className="lx-btn lx-btn--lg" style={{ height: 56 }}>
            <I.whatsapp/> {t('profile.followUp')}
          </button>
        </div>

        {/* KPI strip — 3 priority stats */}
        <div className="lx-card" style={{ padding: 20, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 0 }}>
          {[
            { l:'Lifetime value',  v: MXN(c.stats.ltv) },
            { l:'Ticket promedio', v: MXN(c.stats.avgTicket) },
            { l:'Últ. compra',     v: fmtRel(c.stats.lastPurchase), sub:`${c.stats.visits} visitas · ${samplesConv}/${samps.length} muestras conv.` },
          ].map((k,i) => (
            <div key={i} style={{ paddingLeft: i===0?0:20, borderLeft: i===0?'none':'1px solid var(--line)', paddingRight: 20 }}>
              <div className="lx-stat-label">{k.l}</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4, lineHeight: 1 }} className="lx-num">{k.v}</div>
              {k.sub && <div className="lx-small" style={{ fontSize: 11, marginTop: 6 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap: 2, borderBottom:'1px solid var(--line)', marginTop: 4 }}>
          {[
            ['timeline', t('profile.tab.timeline'),  ints.length],
            ['purchases',t('profile.tab.purchases'), purs.length],
            ['recs',     t('profile.tab.recs'),      recs.length],
            ['samples',  t('profile.tab.samples'),   samps.length],
            ['msgs',     t('profile.tab.comms'),     msgs.length],
            ['consent',  t('profile.tab.consent'),   cons.length],
          ].map(([id,l,n]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding:'12px 16px', border:'none', background:'transparent', cursor:'pointer',
              borderBottom: tab===id ? '2px solid var(--ink)' : '2px solid transparent',
              fontSize: 13, fontWeight: tab===id?600:500, color: tab===id?'var(--ink)':'var(--ink-60)',
              display:'flex', alignItems:'center', gap: 6,
            }}>
              {l} <span className="lx-chip" style={{ height: 20, fontSize: 10, padding:'0 7px' }}>{n}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="lx-card" style={{ padding: 20, minHeight: 280 }}>
          {tab==='timeline' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
                <div>
                  <div className="lx-micro">Historial unificado · compras, visitas, muestras y consultas</div>
                  <div className="lx-small" style={{ fontSize: 12, marginTop: 2 }}>
                    Cada evento muestra tipo, marca, BA, fecha y notas. Las compras aparecen como “Venta” con monto.
                  </div>
                </div>
                <div style={{ flex: 1 }}/>
                <span className="lx-chip" style={{ height: 22, fontSize: 11, background:'var(--bone)' }}>
                  {ints.filter(i=>i.type==='Compra'||i.type==='Venta').length} compras
                </span>
                <span className="lx-chip" style={{ height: 22, fontSize: 11, background:'var(--bone)' }}>
                  {ints.filter(i=>i.type==='Cita atendida'||i.type==='Consulta skincare').length} visitas
                </span>
                <button className="lx-btn lx-btn--sm" onClick={()=>goTo('timeline-full')}>Ver todo <I.arrowR/></button>
              </div>
              <div>{ints.slice(0,4).map(i => <TimelineItem key={i.id} item={i}/>)}</div>
            </div>
          )}
          {tab==='recs' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
                <div>
                  <div className="lx-micro">Historial de recomendaciones</div>
                  <div className="lx-small" style={{ fontSize: 12, marginTop: 2 }}>
                    Cada tarjeta muestra fecha, BA, productos sugeridos y si la clienta convirtió en compra.
                  </div>
                </div>
                <div style={{ flex: 1 }}/>
                <span className="lx-chip lx-chip--ok" style={{ height: 22, fontSize: 11 }}>
                  {recs.filter(r=>r.status==='converted').length} convertidas
                </span>
                <span className="lx-chip lx-chip--warn" style={{ height: 22, fontSize: 11 }}>
                  {recs.filter(r=>r.status!=='converted').length} pendientes
                </span>
                <button className="lx-btn lx-btn--sm" onClick={()=>goTo('recs-full')}>Ver todo <I.arrowR/></button>
              </div>
              {recs.slice(0,3).map(r => (
                <div key={r.id} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap: 12, padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
                      <span className="lx-micro">{fmtDate(r.at)}</span>
                      <span className={`lx-chip ${r.status==='converted'?'lx-chip--ok':'lx-chip--warn'}`} style={{ height: 22, fontSize: 11 }}>
                        {r.status==='converted' ? `Convertida → ${r.purchaseId}` : 'Pendiente'}
                      </span>
                      <span className="lx-small" style={{ fontSize: 11 }}>por {getBA(r.baId).name}</span>
                    </div>
                    <div style={{ display:'flex', gap: 8 }}>
                      {r.items.map(sku => {
                        const p = getProduct(sku);
                        return <div key={sku} style={{ display:'flex', alignItems:'center', gap: 8, padding:'6px 10px', background:'var(--bone)', borderRadius: 8 }}>
                          <ProductThumb sku={sku} size={28}/>
                          <div><div style={{ fontSize:12, fontWeight:600 }}>{p.line}</div><div className="lx-small" style={{ fontSize:10 }}>{p.name}</div></div>
                        </div>;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==='samples' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
                <div className="lx-micro">Muestras entregadas · conversión {Math.round(samplesConv/samps.length*100)}%</div>
                <div style={{ flex:1 }}/>
                <button className="lx-btn lx-btn--sm" onClick={()=>goTo('samples-full')}>Ver todo <I.arrowR/></button>
              </div>
              {samps.slice(0,4).map(s => (
                <div key={s.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr auto auto auto', gap: 14, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--line)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}><I.gift/></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div className="lx-small" style={{ fontSize: 11 }}>SKU {s.sku} · Entregada {fmtDate(s.givenAt)}</div>
                  </div>
                  <span className="lx-small" style={{ fontSize: 11 }}>Seguim. {fmtDate(s.followUp)}</span>
                  <span className={`lx-chip ${s.converted?'lx-chip--ok':'lx-chip--warn'}`} style={{ height: 22, fontSize: 11 }}>
                    {s.converted ? 'Convertida' : 'Pendiente'}
                  </span>
                  <button className="lx-btn lx-btn--sm" style={{ height: 26, padding:'0 10px' }}>Seguir</button>
                </div>
              ))}
              <button className="lx-btn" style={{ marginTop: 12 }}><I.plus/> Registrar muestra</button>
            </div>
          )}
          {tab==='msgs' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
                <div className="lx-micro">Historial de comunicaciones · tracking E2E</div>
                <div style={{ flex:1 }}/>
                <button className="lx-btn lx-btn--sm" onClick={()=>goTo('msgs-full')}>Ver todo <I.arrowR/></button>
              </div>
              {msgs.slice(0,4).map(m => (
                <div key={m.id} style={{ padding:'12px 0', borderBottom:'1px solid var(--line)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 6, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {m.channel==='WhatsApp' ? <I.whatsapp size={12}/> : <I.email size={12}/>}
                    </span>
                    <LxBrandTag brand={m.brand} small/>
                    <span className="lx-small" style={{ fontSize: 11 }}>{m.channel} · {fmtDate(m.sentAt)} · {fmtTime(m.sentAt)}</span>
                    {m.converted && <span className="lx-chip lx-chip--ok" style={{ height: 20, fontSize: 10, marginLeft:'auto' }}>→ Compra</span>}
                  </div>
                  <div style={{ fontSize: 13, paddingLeft: 32, marginBottom: 6 }}>{m.preview}</div>
                  <div style={{ display:'flex', gap: 16, paddingLeft: 32 }} className="lx-small">
                    <span>✓ Enviado {fmtTime(m.sentAt)}</span>
                    {m.deliveredAt && <span>✓✓ Entregado</span>}
                    {m.readAt && <span style={{ color: 'var(--ok)' }}>✓✓ Leído {fmtTime(m.readAt)}</span>}
                    {m.respondedAt && <span style={{ color:'var(--ok)' }}>↩ Respondió</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==='purchases' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
                <div>
                  <div className="lx-micro">Historial de compras</div>
                  <div className="lx-small" style={{ fontSize: 12, marginTop: 2 }}>
                    Tickets registrados con SKUs, monto y BA responsable.
                  </div>
                </div>
                <div style={{ flex:1 }}/>
                <span className="lx-chip" style={{ height: 22, fontSize: 11, background:'var(--bone)' }}>
                  {MXN(purs.reduce((s,p)=>s+(p.total||0),0))}
                </span>
                <button className="lx-btn lx-btn--sm" onClick={()=>goTo('purchases-full')}>Ver todo <I.arrowR/></button>
              </div>
              {purs.length === 0 && <div className="lx-small" style={{ padding: 16, textAlign:'center' }}>Sin compras registradas.</div>}
              {purs.slice(0,4).map(p => (
                <div key={p.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr auto auto', gap: 14, alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--line)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}><I.bag/></div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Ticket {p.id.replace('pu-','#')}</div>
                      <LxBrandTag brand={p.brand} small/>
                    </div>
                    <div className="lx-small" style={{ fontSize: 11, marginTop: 2 }}>
                      {fmtDate(p.at)} · {p.items.length} producto{p.items.length===1?'':'s'} · por {getBA(p.baId).name}
                    </div>
                  </div>
                  <span className="lx-num" style={{ fontWeight: 600, fontSize: 14 }}>{MXN(p.total)}</span>
                  <button className="lx-btn lx-btn--sm" onClick={()=>goTo('purchases-full')} style={{ height: 26, padding:'0 10px' }}>Detalle</button>
                </div>
              ))}
            </div>
          )}
          {tab==='consent' && <ConsentMatrix clientId={c.id}/>}
        </div>
      </div>

      {/* RIGHT: profile detail panes */}
      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        {/* Luxe Circle — nivel = segmento real del cliente (RF-11) */}
        {(() => {
          const prog = window.clientLevelProgress(c);
          const segMeta = {
            VIP:       { label:'VIP',        color:'#9C7E36', bg:'rgba(201,169,97,.18)',   border:'rgba(201,169,97,.45)' },
            Recurrent: { label:'Recurrente', color:'var(--ok)', bg:'rgba(31,122,90,.10)',  border:'rgba(31,122,90,.30)'  },
            New:       { label:'Nueva',     color:'var(--ink)', bg:'var(--bone)',          border:'var(--line)'          },
            AtRisk:    { label:'En riesgo',  color:'var(--err)', bg:'rgba(162,58,46,.08)', border:'rgba(162,58,46,.30)'  },
          };
          const m = segMeta[prog.current] || segMeta.New;
          return (
            <div className="lx-card" style={{ padding: 20, background:'linear-gradient(180deg,#fff,#F7F2EB)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                <div className="lx-micro">Luxe Circle</div>
                <span className="lx-chip" style={{ height: 22, fontSize: 11, background: m.bg, color: m.color, borderColor: m.border }}>{m.label}</span>
              </div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 42, marginTop: 6, lineHeight: 1 }} className="lx-num">
                {(c.stats?.visits || 0)}
              </div>
              <div className="lx-small" style={{ fontSize: 12 }}>
                {c.stats?.visits === 1 ? 'visita' : 'visitas'} · {MXN(c.stats?.ltv || 0)} LTV
              </div>
              <LxDivider/>
              <div className="lx-small" style={{ fontSize: 12, marginBottom: 8 }}>{prog.hint}</div>
              <LxProgress value={Math.round(prog.progress * 100)} max={100} color={m.color}/>
            </div>
          );
        })()}

        {/* Skin profile */}
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">{t('profile.card.skin')}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginTop: 10 }}>
            <div><div className="lx-small">{t('profile.skin.type')}</div><div style={{ fontWeight:600, fontSize: 14 }}>{c.skin.type}</div></div>
            <div><div className="lx-small">{t('profile.skin.tone')}</div><div style={{ fontWeight:600, fontSize: 14 }}>{c.skin.tone}</div></div>
          </div>
          <LxDivider dashed/>
          <div className="lx-small" style={{ marginBottom: 6 }}>{t('profile.skin.concerns')}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {c.skin.concerns.map(co => <span key={co} className="lx-chip" style={{ height: 22, fontSize: 11 }}>{co}</span>)}
          </div>
          {(() => {
            // Defensivo: allergies puede ser array, string o nada.
            const raw = c.allergies;
            const list = Array.isArray(raw) ? raw
              : (typeof raw === 'string' && raw.trim() && !/^ningun[ao]s?$/i.test(raw.trim()))
                ? raw.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            if (list.length === 0) return null;
            return (
              <>
                <LxDivider dashed/>
                <div className="lx-small" style={{ marginBottom: 6 }}><I.warning size={11}/> {t('profile.skin.allergies')}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                  {list.map(a => <span key={a} className="lx-chip lx-chip--err" style={{ height: 22, fontSize: 11 }}>{a}</span>)}
                </div>
              </>
            );
          })()}
        </div>

        {/* Interests — refleja lo capturado en alta (RF-05) */}
        {(c.interests && c.interests.length > 0) || c.routine ? (
          <div className="lx-card" style={{ padding: 20 }}>
            <div className="lx-micro">{t('profile.card.interests')}</div>
            {c.routine && (
              <div style={{ display:'flex', alignItems:'baseline', gap: 6, marginTop: 8, flexWrap:'wrap' }}>
                <span className="lx-small" style={{ fontSize: 12, marginRight: 4 }}>Rutina actual</span>
                <span className="lx-chip" style={{ height: 22, fontSize: 11 }}>{c.routine}</span>
                {Array.isArray(c.routineTiming) && c.routineTiming.map((tm) => {
                  const label = ({ morning:'🌅 Mañana', evening:'🌙 Noche', event:'✨ Eventos' })[tm] || tm;
                  return <span key={tm} className="lx-chip" style={{ height: 22, fontSize: 11, background:'var(--bone)' }}>{label}</span>;
                })}
              </div>
            )}
            {c.interests && c.interests.length > 0 && (() => {
              const groups = {
                Skincare:        ['Hidratación','Antiedad','Luminosidad','Manchas','Acné','Poros','Firmeza','Brillos','Textura'],
                Maquillaje:      ['Labial','Base','Ojos','Cejas','Rubor','Iluminador'],
                Fragancia:       ['Floral','Oriental','Amaderada','Cítrica','Gourmand','Almizclada'],
                'Cuidado capilar': ['Anti-frizz','Volumen','Brillo','Reparación','Color','Densidad'],
              };
              const grouped = Object.entries(groups)
                .map(([cat, items]) => [cat, c.interests.filter((i) => items.includes(i))])
                .filter(([_, items]) => items.length > 0);
              return grouped.map(([cat, items]) => (
                <React.Fragment key={cat}>
                  <LxDivider dashed/>
                  <div className="lx-small" style={{ marginBottom: 6 }}>{cat}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                    {items.map((it) => <span key={it} className="lx-chip" style={{ height: 22, fontSize: 11 }}>{it}</span>)}
                  </div>
                </React.Fragment>
              ));
            })()}
          </div>
        ) : null}

        {/* Upcoming life events (RF-09) — para esta clienta */}
        {(() => {
          const evs = (typeof getUpcomingEvents === 'function') ? getUpcomingEvents(c, { windowDays: 60 }) : [];
          if (evs.length === 0) return null;
          const eventColor = {
            birthday:'#B85F63', anniversary:'#9C7E36', replenishment:'var(--ok)',
          };
          const eventIcon = { birthday:'🎂', anniversary:'★', replenishment:'⟳' };
          return (
            <div className="lx-card" style={{ padding: 20 }}>
              <div className="lx-micro">Próximos eventos</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 10, marginTop: 12 }}>
                {evs.slice(0, 4).map((ev, i) => {
                  const days = ev.daysUntil;
                  const whenLabel = days === 0 ? 'hoy'
                    : days === 1 ? 'mañana'
                    : days < 0 ? `vencido ${-days}d`
                    : `en ${days} días`;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 14, background:'var(--bone)',
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                        fontSize: 14, color: eventColor[ev.type],
                      }}>{eventIcon[ev.type]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.label}</div>
                        <div className="lx-small" style={{ fontSize: 11 }}>{fmtDate(ev.date)}</div>
                      </div>
                      <span className="lx-num lx-small" style={{ fontSize: 11, fontWeight: 600, color: eventColor[ev.type] }}>{whenLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Próximas citas — citas del cliente que no están canceladas/completadas */}
        {(() => {
          const all = (window.APPOINTMENTS || []).filter((a) => a.clientId === c.id);
          const upcoming = all
            .filter((a) => a.status !== 'cancelled' && a.status !== 'completed' && new Date(a.at).getTime() >= Date.now() - 86400000)
            .sort((a, b) => new Date(a.at) - new Date(b.at));
          const past = all
            .filter((a) => a.status === 'completed' || new Date(a.at).getTime() < Date.now() - 86400000)
            .sort((a, b) => new Date(b.at) - new Date(a.at))
            .slice(0, 2);
          const upcomingApptStatus = {
            confirmed:   { label:'Confirmada', color:'var(--ok)' },
            pending:     { label:'Programada', color:'var(--warn)' },
            rescheduled: { label:'Reagendada', color:'var(--warn)' },
          };
          return (
            <div className="lx-card" style={{ padding: 20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
                <div className="lx-micro">{t('profile.card.upcoming') || 'Próximas citas'}</div>
                <button className="lx-btn lx-btn--sm" onClick={() => onNav && onNav('new-appt')}
                  style={{ height: 26, padding:'0 10px', fontSize: 11.5 }}>
                  <I.plus size={11}/> Nueva
                </button>
              </div>
              {upcoming.length === 0 ? (
                <div className="lx-small" style={{ fontSize: 12, color:'var(--ink-60)', marginBottom: past.length > 0 ? 10 : 0 }}>
                  Sin citas próximas.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
                  {upcoming.slice(0, 3).map((a) => {
                    const meta = upcomingApptStatus[a.status] || upcomingApptStatus.pending;
                    return (
                      <div key={a.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 10px', borderRadius: 8, background:'var(--bone)' }}>
                        <div style={{ minWidth: 56 }}>
                          <div className="lx-num" style={{ fontSize: 13, fontWeight: 600 }}>{fmtTime(a.at)}</div>
                          <div className="lx-small" style={{ fontSize: 10 }}>{fmtDate(a.at)}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.type}</div>
                          <div className="lx-small" style={{ fontSize: 10.5 }}>{a.duration || 30} min · {a.brand || '—'}</div>
                        </div>
                        <span className="lx-chip" style={{ height: 18, fontSize: 9.5, color: meta.color, borderColor:'transparent', background: 'transparent', padding:'0 4px' }}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                  {upcoming.length > 3 && (
                    <div className="lx-small" style={{ fontSize: 11, color:'var(--ink-60)' }}>+{upcoming.length - 3} más</div>
                  )}
                </div>
              )}
              {past.length > 0 && (
                <>
                  <LxDivider dashed/>
                  <div className="lx-small" style={{ fontSize: 11, color:'var(--ink-60)', marginBottom: 6 }}>Citas pasadas</div>
                  {past.map((a) => (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap: 8, padding:'4px 0' }}>
                      <I.check size={11}/>
                      <div style={{ fontSize: 11.5, flex: 1, minWidth: 0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.type}</div>
                      <span className="lx-small" style={{ fontSize: 10.5 }}>{fmtDate(a.at)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })()}

        {/* Affinities */}
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">{t('profile.card.affinities')}</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8, marginTop: 10 }}>
            {(Array.isArray(c.affinities) ? c.affinities : []).map(a => (
              <div key={a} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <I.heart size={14}/>
                <span style={{ fontSize: 13 }}>{a}</span>
              </div>
            ))}
            {(!Array.isArray(c.affinities) || c.affinities.length === 0) && (
              <div className="lx-small" style={{ fontSize: 12, color:'var(--ink-60)' }}>
                Aún no hay afinidades. Se irán acumulando con compras y consultas.
              </div>
            )}
          </div>
        </div>

        {/* Consent mini */}
        <div className="lx-card" style={{ padding: 20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div className="lx-micro">Consentimientos</div>
            <span className="lx-small" style={{ fontSize: 11 }}>Vigente · {PRIVACY_NOTICE_VERSION}</span>
          </div>
          <div style={{ marginTop: 8 }}><ConsentMatrix clientId={c.id}/></div>
        </div>

        {/* Right to be forgotten */}
        <div className="lx-card" style={{ padding: 20, borderColor:'rgba(162,58,46,.25)' }}>
          <div className="lx-micro" style={{ color:'var(--err)' }}>Derechos ARCO</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 18, marginTop: 4 }}>Derecho al olvido</div>
          <div className="lx-small" style={{ fontSize: 12, marginTop: 4 }}>
            Solicita la eliminación completa de datos personales. Requiere doble confirmación y genera ticket auditable.
          </div>
          <button className="lx-btn lx-btn--sm" style={{ marginTop: 12, color:'var(--err)', borderColor:'rgba(162,58,46,.3)' }}>
            <I.trash/> Iniciar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenClientProfile, ConsentMatrix, ScreenRegisterVisit, ScreenRegisterSale, ProductPicker });
