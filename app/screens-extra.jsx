// Additional screens to fully cover the brief:
// - Purchases (register + history)
// - SKU scan dialog
// - Communications log (comprehensive, client-scoped)
// - Segments overview
// - Reports (Admin/Supervisor)
// - Admin hub (users, stores, catalog governance)

function ScreenPurchases({ onNav, onOpenClient }) {
  const [q, setQ] = React.useState('');
  const lock = useBrandLock();
  // Reactivo: se re-renderiza cuando se registran nuevas compras.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const on = (e) => { if (e.detail?.collection === 'PURCHASES') setTick((n) => n + 1); };
    window.addEventListener('lx-state', on);
    return () => window.removeEventListener('lx-state', on);
  }, []);

  // Solo clientes con marca compatible al brand lock + ordenar por fecha desc.
  const filtered = PURCHASES
    .filter((p) => {
      if (lock && p.brand !== lock) return false;
      if (q) {
        const c = getClient(p.clientId);
        const needle = ((c?.name || '') + ' ' + (p.ticket || '') + ' ' + p.id).toLowerCase();
        if (!needle.includes(q.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at));

  const totalRev = filtered.reduce((s, p) => s + (p.total || 0), 0);

  return (
    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>
      <div className="lx-card" style={{ padding: 16, display:'flex', gap: 10, alignItems:'center' }}>
        <div style={{ flex:1, position:'relative' }}>
          <span style={{ position:'absolute', left: 14, top:'50%', transform:'translateY(-50%)', color:'var(--ink-40)' }}><I.search/></span>
          <input className="lx-input" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por clienta, ticket o #ID de compra…" style={{ paddingLeft: 42 }}/>
        </div>
        <span className="lx-chip" style={{ height: 30, fontSize: 12, background:'var(--bone)' }}>
          {filtered.length} ticket{filtered.length === 1 ? '' : 's'} · {MXN(totalRev)}
        </span>
        {lock && <LxBrandTag brand={lock} small/>}
      </div>

      <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'0.8fr 1.4fr 1.4fr 1.1fr 0.8fr 0.8fr 0.7fr', gap: 12, padding:'12px 20px', background:'var(--bone)', borderBottom:'1px solid var(--line)' }}>
          {['Ticket','Clienta','Producto(s)','Fecha','Marca','Total','BA'].map((h) => <span key={h} className="lx-micro">{h}</span>)}
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign:'center', color:'var(--ink-60)' }} className="lx-small">
            No hay compras registradas que coincidan con la búsqueda.
          </div>
        )}
        {filtered.map((p) => {
          const c = getClient(p.clientId);
          const ba = getBA(p.baId);
          const productLines = p.items.map((i) => getProduct(i.sku)?.line || i.productLine || i.sku).filter(Boolean).join(' · ');
          return (
            <div key={p.id}
              onClick={() => c && onOpenClient && onOpenClient(c.id)}
              style={{
                display:'grid', gridTemplateColumns:'0.8fr 1.4fr 1.4fr 1.1fr 0.8fr 0.8fr 0.7fr', gap: 12,
                padding:'14px 20px', borderBottom:'1px solid var(--line)', alignItems:'center',
                cursor: c ? 'pointer' : 'default', transition:'background .12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bone)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span className="lx-num" style={{ fontFamily:'var(--f-mono)', fontSize: 12, fontWeight: 600 }}>{p.ticket}</span>
              <div style={{ display:'flex', alignItems:'center', gap: 8, minWidth: 0 }}>
                {c && <LxAvatar label={c.initials} size={28}/>}
                <span style={{ fontSize: 13, fontWeight: 500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {c?.name || 'Cliente eliminado'}
                </span>
              </div>
              <div className="lx-small" style={{ fontSize: 11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={productLines}>
                {productLines}
              </div>
              <span className="lx-small" style={{ fontSize: 12 }}>{fmtDate(p.at)} · {fmtTime(p.at)}</span>
              <LxBrandTag brand={p.brand} small/>
              <span className="lx-num" style={{ fontSize: 13, fontWeight: 600 }}>{MXN(p.total)}</span>
              <span className="lx-small" style={{ fontSize: 11 }}>
                {ba?.name?.split(' ')[0] || '—'}
                {p.manual && <span className="lx-chip" style={{ height: 16, fontSize: 9, padding:'0 5px', marginLeft: 4, background:'var(--bone-2)' }}>manual</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenCommLog() {
  const lock = useBrandLock();
  const comms = lock
    ? COMMUNICATIONS.filter(m => {
        const tpl = m.templateId && TEMPLATES.find(t => t.id === m.templateId);
        if (tpl) return tpl.brand === lock;
        if (m.brand) return m.brand === lock;
        return true;
      })
    : COMMUNICATIONS;
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 360px', gap: 24 }}>
      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Bitácora de comunicaciones</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 28, marginTop: 4 }}>Historial por canal</div>
        <div style={{ marginTop: 18 }}>
          {comms.map(m => {
            const c = getClient(m.clientId);
            const ba = getBA(m.baId);
            const out = m.direction === 'out';
            return (
              <div key={m.id} style={{ display:'grid', gridTemplateColumns:'32px 1fr auto', gap: 12, alignItems:'flex-start', padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
                <span style={{ width: 32, height: 32, borderRadius: 999, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {m.channel==='WhatsApp'?<I.whatsapp size={14}/>:m.channel==='SMS'?<I.sms size={14}/>:<I.email size={14}/>}
                </span>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                    <span className="lx-chip" style={{ height: 18, fontSize: 10, padding:'0 8px' }}>{m.channel}</span>
                    <span className={`lx-chip ${out?'':'lx-chip--ok'}`} style={{ height: 18, fontSize: 10, padding:'0 8px' }}>{out?'Enviado':'Recibido'}</span>
                    {m.template && <span className="lx-small" style={{ fontSize: 11 }}>· plantilla {m.template}</span>}
                  </div>
                  <div style={{ fontSize: 13, color:'var(--ink-80)' }}>{m.body}</div>
                  <div className="lx-small" style={{ fontSize: 11, marginTop: 4 }}>
                    {fmtDate(m.at)} · {fmtTime(m.at)} · {ba?.name.split(' ')[0]} · estado {m.status}
                  </div>
                </div>
                <button className="lx-btn lx-btn--sm" style={{ height: 28 }}>Ver hilo</button>
              </div>
            );
          })}
        </div>
      </div>

      <aside style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Métricas (30d)</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 14, marginTop: 12 }}>
            <LxStat label="Enviados" value="824" delta={+6}/>
            <LxStat label="Tasa de lectura" value="71%" delta={+4}/>
            <LxStat label="Respuestas" value="312" delta={+11}/>
            <LxStat label="Opt-outs" value="9" delta={-2}/>
          </div>
        </div>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Mix de canales</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 10, marginTop: 10 }}>
            {[['WhatsApp',.62],['Email',.28],['SMS',.10]].map(([ch, v]) => (
              <div key={ch}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{ch}</span><span className="lx-num">{Math.round(v*100)}%</span>
                </div>
                <LxProgress value={v}/>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ScreenSegments() {
  const segments = CLIENTS.reduce((acc, c) => {
    const s = clientSegment(c);
    (acc[s] = acc[s] || []).push(c);
    return acc;
  }, {});
  const tone = { VIP:'#C9A961', Recurrent:'var(--ok)', New:'var(--ink)', AtRisk:'var(--err)' };
  return (
    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>
      <div className="lx-card" style={{ padding: 24 }}>
        <div className="lx-micro">Segmentación</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 30, marginTop: 4 }}>Estados de clienta</div>
        <div className="lx-small" style={{ fontSize: 13, maxWidth: 620, marginTop: 4 }}>
          Reglas aplicadas sobre LTV, visitas y recencia de compra. La etiqueta se recalcula en cada interacción.
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14 }}>
        {['VIP','Recurrent','New','AtRisk'].map(key => {
          const r = SEGMENT_RULES[key];
          const list = segments[key] || [];
          return (
            <div key={key} className="lx-card" style={{ padding: 20 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: tone[key] }}/>
                <div className="lx-micro">{r.label}</div>
              </div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 38, marginTop: 6 }} className="lx-num">{list.length}</div>
              <div className="lx-small" style={{ fontSize: 11, lineHeight: 1.35 }}>{r.rule}</div>
              <LxDivider/>
              {list.slice(0,3).map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap: 8, padding:'8px 0', borderBottom:'1px dashed var(--line)' }}>
                  <LxAvatar label={c.initials} size={28}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div className="lx-small" style={{ fontSize: 10 }}>{MXN(c.stats.ltv)} LTV</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenReports() {
  const reports = [
    { name:'Desempeño BA · mensual',       owner:'Supervisor', fmt:'xlsx', freq:'Mensual', lastRun:'2026-04-20' },
    { name:'Funnel de clienteling',         owner:'Admin CRM',  fmt:'pdf',  freq:'Semanal', lastRun:'2026-04-21' },
    { name:'Cobertura y turnos',            owner:'Supervisor', fmt:'xlsx', freq:'Semanal', lastRun:'2026-04-20' },
    { name:'Consentimientos por canal',     owner:'Admin CRM',  fmt:'xlsx', freq:'Mensual', lastRun:'2026-04-01' },
    { name:'Recomendación → conversión',    owner:'Admin Mkt',  fmt:'pdf',  freq:'Mensual', lastRun:'2026-04-15' },
    { name:'Muestras por SKU',              owner:'Admin Mkt',  fmt:'xlsx', freq:'Mensual', lastRun:'2026-04-15' },
    { name:'Inventario crítico (marketing)', owner:'Admin Ops', fmt:'xlsx', freq:'Diario',  lastRun:'2026-04-23' },
    { name:'Panorama regional ejecutivo',   owner:'Admin HQ',   fmt:'pdf',  freq:'Trimestral', lastRun:'2026-04-10' },
  ];
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 340px', gap: 24 }}>
      <div className="lx-card" style={{ padding: 20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div className="lx-micro">Reportes</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 28 }}>Biblioteca ejecutiva</div>
          </div>
          <button className="lx-btn lx-btn--primary"><I.plus/> Programar reporte</button>
        </div>
        <div style={{ marginTop: 16 }}>
          {reports.map(r => (
            <div key={r.name} style={{ display:'grid', gridTemplateColumns:'24px 1.8fr 1fr 0.8fr 0.9fr 0.7fr auto', gap: 12, alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--line)' }}>
              {r.fmt==='pdf' ? <I.pdf/> : <I.excel/>}
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div><div className="lx-small" style={{ fontSize: 11 }}>Última ejecución · {fmtDate(r.lastRun)}</div></div>
              <span className="lx-small" style={{ fontSize: 12 }}>{r.owner}</span>
              <span className="lx-chip" style={{ height: 22, fontSize: 11 }}>{r.freq}</span>
              <span className="lx-num lx-small" style={{ fontSize: 11, textTransform:'uppercase' }}>{r.fmt}</span>
              <button className="lx-btn lx-btn--sm" style={{ height: 28 }}><I.download size={12}/></button>
              <button className="lx-btn lx-btn--sm" style={{ height: 28 }}>Abrir</button>
            </div>
          ))}
        </div>
      </div>

      <aside style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Constructor rápido</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 20, marginTop: 4 }}>Armar reporte ad-hoc</div>
          {[
            ['Entidad','Clientas · Compras · Recomendaciones · Muestras'],
            ['Dimensiones','Tienda · BA · Marca · Canal'],
            ['Métricas','LTV · Ticket · Conv. muestra · Opt-in'],
            ['Período','Semana · Mes · Trimestre · Año'],
            ['Formato','PDF ejecutivo · Excel · CSV'],
          ].map(([k,v]) => <LxKV key={k} k={k} v={v}/>)}
          <button className="lx-btn lx-btn--primary" style={{ width:'100%', marginTop: 12 }}>Generar</button>
        </div>
      </aside>
    </div>
  );
}

function ScreenSupervisor() {
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20 }}>
      <div className="lx-card" style={{ padding: 24, gridColumn:'1 / span 2' }}>
        <div className="lx-micro">Supervisor de Zona · Centro</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>Diego Salvatierra</div>
        <div className="lx-small" style={{ fontSize: 13 }}>3 tiendas · 12 BAs a cargo · Liverpool Polanco, Interlomas · Palacio Polanco</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 20, marginTop: 24 }}>
          <LxStat big label="Ventas zona" value={MXN(3840000)} delta={+7}/>
          <LxStat big label="Conv. promedio" value="55%" delta={+3}/>
          <LxStat big label="NPS zona" value="9.1" delta={+0.2}/>
          <LxStat big label="Tickets abiertos" value="3"/>
        </div>
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Tiendas de la zona</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 22 }}>Ranking</div>
        <div style={{ marginTop: 12 }}>
          {KPIS_HQ.byStore.slice(0,3).map((s,i) => {
            const st = getStore(s.storeId);
            return (
              <div key={s.storeId} style={{ display:'grid', gridTemplateColumns:'24px 1.3fr 2fr 0.7fr', gap: 12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--line)' }}>
                <span className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 20, color:'var(--ink-60)' }}>{i+1}</span>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{st.name}</div><div className="lx-small" style={{ fontSize: 11 }}>{st.chain}</div></div>
                <LxProgress value={s.sales} max={5000000}/>
                <span className="lx-num" style={{ fontSize: 13, fontWeight: 600 }}>{MXN(s.sales)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Alertas zona</div>
        {[
          ['Polanco · 2 BAs con conversión < 35%',                'warn'],
          ['Interlomas · stock crítico Or Rouge (0 uds)',          'err'],
          ['Palacio Polanco · incidencia abierta tk-215 (red)',   'warn'],
          ['Meta mensual: 88% alcanzada (7 días restantes)',      ''],
        ].map(([t,tn]) => (
          <div key={t} style={{ display:'flex', alignItems:'center', gap: 10, padding:'10px 0', borderBottom:'1px dashed var(--line)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: tn==='err'?'var(--err)':tn==='warn'?'var(--warn)':'var(--ok)' }}/>
            <span style={{ fontSize: 13 }}>{t}</span>
          </div>
        ))}
      </div>

      <div className="lx-card" style={{ padding: 20, gridColumn:'1 / span 2' }}>
        <div className="lx-micro">BAs a cargo</div>
        <div style={{ marginTop: 12 }}>
          {KPIS_STORE.floor.map(f => {
            const ba = getBA(f.baId);
            return (
              <div key={f.baId} style={{ display:'grid', gridTemplateColumns:'40px 1.2fr 1fr 1fr 1fr 1fr', gap: 14, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--line)' }}>
                <LxAvatar label={ba.initials} size={32}/>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{ba.name}</div><div className="lx-small" style={{ fontSize: 11 }}>{getStore(ba.storeId)?.name}</div></div>
                <div><div className="lx-small">Ventas</div><div className="lx-num" style={{ fontWeight: 600, fontSize: 13 }}>{MXN(f.sales)}</div></div>
                <div><div className="lx-small">Conv</div><div className="lx-num" style={{ fontWeight: 600, fontSize: 13 }}>{Math.round(f.conv*100)}%</div></div>
                <div><div className="lx-small">NPS</div><div className="lx-num" style={{ fontWeight: 600, fontSize: 13 }}>{f.nps}</div></div>
                <button className="lx-btn lx-btn--sm">Coaching</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScreenAdmin() {
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 16 }}>
      <div className="lx-card" style={{ padding: 20, gridColumn:'1 / span 3' }}>
        <div className="lx-micro">Admin Central · L'Oréal Luxe México</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 30, marginTop: 4 }}>Gobernanza del sistema</div>
        <div className="lx-small" style={{ fontSize: 13 }}>
          Acceso completo a usuarios, catálogo, privacidad, auditoría. Los equipos corporativos (Marketing, CRM, Retail, HQ) comparten este rol con scopes distintos.
        </div>
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Usuarios & roles</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4 }}>{USERS.length + BAS.length} activos</div>
        {USERS.map(u => (
          <div key={u.id} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap: 8, padding:'8px 0', borderBottom:'1px dashed var(--line)', alignItems:'center' }}>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div><div className="lx-small" style={{ fontSize: 11 }}>{u.role} · {u.team || u.zone || getStore(u.storeId)?.name || (u.storeIds||[]).length+' tiendas'}</div></div>
            <span className="lx-chip" style={{ height: 22, fontSize: 11 }}>{u.role}</span>
          </div>
        ))}
        <button className="lx-btn lx-btn--sm" style={{ marginTop: 10 }}><I.plus/> Crear usuario</button>
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Permisos por rol</div>
        <div style={{ marginTop: 10, display:'flex', flexDirection:'column', gap: 8 }}>
          {[
            ['BA',         ['Ver sus clientas','Crear interacciones','Recomendar','Enviar seguimientos']],
            ['Manager',    ['Ver su tienda','Coaching','Dispositivos','Incidencias']],
            ['Supervisor', ['Ver su zona','Reportes de zona','Revisar BAs']],
            ['Admin',      ['Acceso global','Catálogo','Plantillas','Auditoría','Integraciones']],
          ].map(([r, scopes]) => (
            <div key={r} style={{ padding: 10, background:'var(--bone)', borderRadius: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{r}</div>
              <div className="lx-small" style={{ fontSize: 11, marginTop: 2 }}>{scopes.join(' · ')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Catálogo · gobernanza</div>
        <LxKV k="SKUs Lancôme" v={PRODUCTS.filter(p=>p.brand==='Lancôme').length}/>
        <LxKV k="SKUs YSL" v={PRODUCTS.filter(p=>p.brand==='YSL').length}/>
        <LxKV k="Plantillas seguimiento" v={TEMPLATES.length}/>
        <LxKV k="Aviso de privacidad" v={PRIVACY_NOTICE_VERSION}/>
        <LxDivider/>
        <button className="lx-btn lx-btn--sm" style={{ marginRight: 6 }}><I.plus/> Nueva plantilla</button>
        <button className="lx-btn lx-btn--sm">Actualizar catálogo</button>
      </div>

      <div className="lx-card" style={{ padding: 20, gridColumn:'1 / span 3' }}>
        <div className="lx-micro">Auditoría</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4 }}>Últimos eventos críticos</div>
        <div style={{ marginTop: 10 }}>
          {[
            ['Consent · revocación WhatsApp','Regina Iturbide', 'ba-03 · Palacio Polanco', '2026-02-08T09:22'],
            ['Nueva clienta','Ximena Cortázar', 'ba-01 · Liverpool Polanco', '2025-12-14T14:10'],
            ['Plantilla · edición',            'Cumpleaños Lancôme', 'us-04 · Admin CRM',   '2026-04-12T11:02'],
            ['Integración WhatsApp · ping',    '—',                'sistema',               '2026-04-23T08:00'],
          ].map(([t, subj, actor, at], i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1.1fr 0.7fr', gap: 12, padding:'10px 0', borderBottom:'1px dashed var(--line)', alignItems:'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
              <span className="lx-small" style={{ fontSize: 12 }}>{subj}</span>
              <span className="lx-small" style={{ fontSize: 12 }}>{actor}</span>
              <span className="lx-num lx-small" style={{ fontSize: 11 }}>{fmtDate(at)} · {fmtTime(at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPurchases, ScreenCommLog, ScreenSegments, ScreenReports, ScreenSupervisor, ScreenAdmin });
