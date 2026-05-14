// Screen: Dashboards (BA perf, Manager, HQ) + Devices, Tickets, Sync, Exports, Integrations

function ScreenBAPerf() {
  const trend = [820,860,910,780,1040,990,1180];
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20 }}>
      <div className="lx-card" style={{ padding: 24, gridColumn:'1 / span 2' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div className="lx-micro">Mi desempeño · Abril 2026</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>Valentina Ríos</div>
            <div className="lx-small">Liverpool Polanco · Lancôme + YSL</div>
          </div>
          <div style={{ display:'flex', gap: 8 }}>
            <LxSeg items={['Hoy','Semana','Mes','Año']} value="Mes" onChange={()=>{}}/>
            <button className="lx-btn lx-btn--sm"><I.pdf/> PDF</button>
            <button className="lx-btn lx-btn--sm"><I.excel/> Excel</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 20, marginTop: 24 }}>
          <LxStat big label="Ventas mes" value={MXN(KPIS_BA.month.sales)} delta={+6}/>
          <LxStat big label="Clientas nuevas" value={KPIS_BA.month.newClients} delta={+3}/>
          <LxStat big label="Conversión" value={`${Math.round(KPIS_BA.month.conv*100)}%`} delta={+2}/>
          <LxStat big label="Recomend." value={KPIS_BA.month.recsSent} delta={+11}/>
          <LxStat big label="NPS" value="9.2" delta={+0.3} hint="últimos 30 días"/>
        </div>
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Tendencia de ventas (k MXN)</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4 }}>Últimos 7 días</div>
        <div style={{ marginTop: 20 }}>
          <LxSpark values={trend} width={440} height={120}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop: 8 }}>
            {['L','M','X','J','V','S','D'].map(d => <span key={d} className="lx-small" style={{ fontSize: 11 }}>{d}</span>)}
          </div>
        </div>
      </div>

      <div className="lx-card" style={{ padding: 20 }}>
        <div className="lx-micro">Mix por marca</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 22, marginTop: 4 }}>Lancôme vs YSL</div>
        <div style={{ display:'flex', gap: 24, alignItems:'center', marginTop: 20 }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="56" fill="none" stroke="var(--ink-08)" strokeWidth="18"/>
            <circle cx="70" cy="70" r="56" fill="none" stroke="var(--lancome-rose-deep)" strokeWidth="18" strokeDasharray={`${2*Math.PI*56*0.60} 999`} transform="rotate(-90 70 70)"/>
            <circle cx="70" cy="70" r="56" fill="none" stroke="#0E0E0F" strokeWidth="18" strokeDasharray={`${2*Math.PI*56*0.40} 999`} strokeDashoffset={`-${2*Math.PI*56*0.60}`} transform="rotate(-90 70 70)"/>
          </svg>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: 8 }}>
              <span style={{ width:10, height:10, borderRadius:999, background:'var(--lancome-rose-deep)' }}/>
              <span style={{ fontSize:13, fontWeight: 600 }}>Lancôme</span>
              <span className="lx-num lx-small" style={{ marginLeft:'auto' }}>60% · {MXN(712400)}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:10, height:10, borderRadius:999, background:'#0E0E0F' }}/>
              <span style={{ fontSize:13, fontWeight: 600 }}>YSL</span>
              <span className="lx-num lx-small" style={{ marginLeft:'auto' }}>40% · {MXN(471620)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lx-card" style={{ padding: 20, gridColumn:'1 / span 2' }}>
        <div className="lx-micro">Embudo de conversión</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 10, marginTop: 12 }}>
          {[
            ['Interacciones', 312, 1.00],
            ['Diagnósticos', 184, 0.59],
            ['Recomend.', 181, 0.58],
            ['Muestras',   94, 0.30],
            ['Compras',    174, 0.56],
          ].map(([l, n, p]) => (
            <div key={l} style={{ padding: 14, background:'var(--bone)', borderRadius: 12 }}>
              <div className="lx-micro">{l}</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 26, marginTop: 4 }} className="lx-num">{n}</div>
              <LxProgress value={p} max={1}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenManager() {
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 20 }}>
      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 24 }}>
          <div className="lx-micro">Liverpool Polanco · Store Manager</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 32, marginTop: 4 }}>Tienda Polanco</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 20, marginTop: 24 }}>
            <LxStat big label="Ventas equipo" value={MXN(KPIS_STORE.teamSales)} delta={+8}/>
            <div>
              <div className="lx-stat-label">Meta mes</div>
              <div className="lx-stat-value lx-num">{Math.round(KPIS_STORE.teamSales/KPIS_STORE.teamGoal*100)}%</div>
              <div style={{ marginTop: 6 }}><LxProgress value={KPIS_STORE.teamSales} max={KPIS_STORE.teamGoal}/></div>
            </div>
            <LxStat big label="Cobertura piso" value="89%" delta={+2}/>
            <LxStat big label="NPS tienda" value="9.1" delta={+0.2}/>
          </div>
        </div>

        <div className="lx-card" style={{ padding: 20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div className="lx-micro">Leaderboard</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 22 }}>Equipo · abril</div>
            </div>
            <button className="lx-btn lx-btn--sm"><I.excel/> Exportar</button>
          </div>
          <div style={{ marginTop: 12 }}>
            {KPIS_STORE.floor.map((f, i) => {
              const ba = getBA(f.baId);
              return (
                <div key={f.baId} style={{ display:'grid', gridTemplateColumns:'28px 40px 1fr 1fr 1fr 1fr 1fr', gap: 12, alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--line)' }}>
                  <span className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 20, color:'var(--ink-60)' }}>{i+1}</span>
                  <LxAvatar label={ba.initials} size={32}/>
                  <div><div style={{ fontWeight:600, fontSize: 13 }}>{ba.name}</div><div className="lx-small" style={{ fontSize: 11 }}>{ba.brands.join(' · ')}</div></div>
                  <div><div className="lx-small">Ventas</div><div className="lx-num" style={{ fontWeight: 600, fontSize: 14 }}>{MXN(f.sales)}</div></div>
                  <div><div className="lx-small">Conv.</div><div className="lx-num" style={{ fontWeight: 600, fontSize: 14 }}>{Math.round(f.conv*100)}%</div></div>
                  <div><div className="lx-small">NPS</div><div className="lx-num" style={{ fontWeight: 600, fontSize: 14 }}>{f.nps}</div></div>
                  <div><div className="lx-small">Cobertura</div><LxProgress value={f.coverage} max={1}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Cobertura de turno · hoy</div>
          <div style={{ display:'grid', gridTemplateColumns:'60px repeat(10, 1fr)', gap: 2, marginTop: 12 }}>
            <div/>
            {['10','','12','','14','','16','','18','20'].map(h => <div key={h} className="lx-small" style={{ fontSize: 10, textAlign:'center' }}>{h}</div>)}
            {KPIS_STORE.floor.map(f => {
              const ba = getBA(f.baId);
              const blocks = [1,1,1,1,1,1,0,1,1,1];
              return <React.Fragment key={f.baId}>
                <div className="lx-small" style={{ fontSize: 11, padding:'4px 0' }}>{ba.initials}</div>
                {blocks.map((b, i) => <div key={i} style={{ height: 18, background: b ? 'var(--ink)' : 'var(--ink-08)', borderRadius: 3 }}/>)}
              </React.Fragment>;
            })}
          </div>
        </div>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Alertas</div>
          {[
            ['Stock crítico: Or Rouge 50ml (0 uds)', 'err'],
            ['2 citas sin confirmar en las próximas 2h', 'warn'],
            ['iPad dv-04 en mantenimiento',  'warn'],
          ].map(([t, tone]) => (
            <div key={t} style={{ display:'flex', alignItems:'flex-start', gap: 10, padding:'10px 0', borderBottom:'1px dashed var(--line)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: tone==='err'?'var(--err)':'var(--warn)', marginTop: 6 }}/>
              <span style={{ fontSize: 13 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenHQ() {
  const maxSales = Math.max(...KPIS_HQ.byStore.map(s => s.sales));
  return (
    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 20 }}>
      <div className="lx-card" style={{ padding: 24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div className="lx-micro">Dirección regional · L'Oréal Luxe México</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 36, marginTop: 4, letterSpacing:'-0.015em' }}>Panorama Q2 2026</div>
            <div className="lx-small">5 tiendas · 24 BAs · 9,580 clientas activas</div>
          </div>
          <div style={{ display:'flex', gap: 8 }}>
            <LxSeg items={['Q1','Q2','YTD','12m']} value="Q2" onChange={()=>{}}/>
            <button className="lx-btn"><I.pdf/> PDF ejecutivo</button>
            <button className="lx-btn"><I.excel/> Excel</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap: 20, marginTop: 28 }}>
          <LxStat big label="Ventas trimestre" value={MXN(KPIS_HQ.revenueMxn)} delta={+9}/>
          <div>
            <div className="lx-stat-label">Vs objetivo</div>
            <div className="lx-stat-value lx-num">{Math.round(KPIS_HQ.revenueMxn/KPIS_HQ.revenueGoal*100)}%</div>
            <div style={{ marginTop: 6 }}><LxProgress value={KPIS_HQ.revenueMxn} max={KPIS_HQ.revenueGoal}/></div>
          </div>
          <LxStat big label="Conv. muestra→venta" value={`${Math.round(KPIS_HQ.sampleRoi*100)}%`} delta={+4}/>
          <LxStat big label="Conv. seguimiento" value={`${Math.round(KPIS_HQ.followUpConv*100)}%`} delta={+2}/>
          <LxStat big label="NPS promedio" value="9.0" delta={+0.1}/>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 20 }}>
        <div className="lx-card" style={{ padding: 20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div className="lx-micro">Ventas por tienda</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 22 }}>Ranking Q2</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            {KPIS_HQ.byStore.map(s => {
              const st = getStore(s.storeId);
              return (
                <div key={s.storeId} style={{ display:'grid', gridTemplateColumns:'1.4fr 2fr 0.6fr 0.6fr 0.6fr', gap: 14, alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize: 13 }}>{st.name}</div>
                    <div className="lx-small" style={{ fontSize: 11 }}>{st.chain} · {st.city}</div>
                  </div>
                  <div>
                    <LxProgress value={s.sales} max={maxSales}/>
                    <div className="lx-small lx-num" style={{ fontSize: 11, marginTop: 4 }}>{MXN(s.sales)}</div>
                  </div>
                  <div><div className="lx-small">Conv</div><b style={{ fontSize: 13 }} className="lx-num">{Math.round(s.conv*100)}%</b></div>
                  <div><div className="lx-small">NPS</div><b style={{ fontSize: 13 }} className="lx-num">{s.nps}</b></div>
                  <div><div className="lx-small">Clientas</div><b style={{ fontSize: 13 }} className="lx-num">{s.clients.toLocaleString('es-MX')}</b></div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
          <div className="lx-card" style={{ padding: 20 }}>
            <div className="lx-micro">Mix por marca</div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display:'flex', height: 44, borderRadius: 10, overflow:'hidden', border:'1px solid var(--line)' }}>
                <div style={{ width:'58%', background:'var(--lancome-rose-deep)', color:'#fff', display:'flex', alignItems:'center', padding:'0 12px', fontSize: 12, fontWeight: 600 }}>Lancôme 58%</div>
                <div style={{ width:'42%', background:'#0E0E0F', color:'var(--ysl-gold)', display:'flex', alignItems:'center', padding:'0 12px', fontSize: 12, fontWeight: 700, letterSpacing:'0.12em' }}>YSL 42%</div>
              </div>
            </div>
          </div>

          <div className="lx-card" style={{ padding: 20 }}>
            <div className="lx-micro">Consentimientos activos</div>
            <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap: 10 }}>
              {Object.entries(KPIS_HQ.consentRates).map(([ch, r]) => (
                <div key={ch}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{ch}</span><span className="lx-num">{Math.round(r*100)}%</span>
                  </div>
                  <LxProgress value={r}/>
                </div>
              ))}
            </div>
          </div>

          <div className="lx-card" style={{ padding: 20 }}>
            <div className="lx-micro">Integraciones</div>
            {INTEGRATIONS.map(i => (
              <div key={i.key} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 0', borderBottom:'1px dashed var(--line)' }}>
                <span style={{ width: 8, height: 8, borderRadius:999, background: i.status==='live'?'var(--ok)':i.status==='sandbox'?'var(--warn)':'var(--ink-40)' }}/>
                <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{i.label}</span>
                <span className="lx-chip" style={{ height: 20, fontSize: 10 }}>{i.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenDevices() {
  return (
    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>
      <div className="lx-card" style={{ padding: 20, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 20 }}>
        <LxStat big label="iPads totales" value={DEVICES.length}/>
        <LxStat big label="Activos" value={DEVICES.filter(d=>d.status==='active').length} hint="última sync <24h"/>
        <LxStat big label="Mantenimiento" value={DEVICES.filter(d=>d.status==='maintenance').length}/>
        <LxStat big label="Inactivos" value={DEVICES.filter(d=>d.status==='inactive').length}/>
      </div>
      <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 1fr 1fr 1fr 0.8fr 0.8fr', gap: 14, padding:'12px 20px', background:'var(--bone)', borderBottom:'1px solid var(--line)' }}>
          {['Serial','Tienda','BA asignada','Estado','Última sync','iPadOS','App'].map(h => <span key={h} className="lx-micro">{h}</span>)}
        </div>
        {DEVICES.map(d => {
          const st = getStore(d.storeId);
          const ba = d.assignedBA ? getBA(d.assignedBA) : null;
          const tone = d.status==='active' ? 'lx-chip--ok' : d.status==='maintenance' ? 'lx-chip--warn' : 'lx-chip--err';
          return (
            <div key={d.id} style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 1fr 1fr 1fr 0.8fr 0.8fr', gap: 14, padding:'14px 20px', borderBottom:'1px solid var(--line)', alignItems:'center' }}>
              <span style={{ fontFamily:'var(--f-mono)', fontSize: 12, fontWeight: 600 }}>{d.serial}</span>
              <span style={{ fontSize: 13 }}>{st.name}</span>
              <span style={{ fontSize: 13 }}>{ba?.name || <span className="lx-small">—</span>}</span>
              <span><span className={`lx-chip ${tone}`} style={{ height: 22, fontSize: 11 }}>{d.status}</span></span>
              <span className="lx-small" style={{ fontSize: 12 }}>{fmtDate(d.lastSync)} · {fmtTime(d.lastSync)}</span>
              <span className="lx-num" style={{ fontSize: 12 }}>{d.os}</span>
              <span className="lx-num" style={{ fontSize: 12 }}>{d.app}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenTickets() {
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 20 }}>
      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20, display:'flex', alignItems:'center', gap: 16 }}>
          <div>
            <div className="lx-micro">Incidencias</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 24 }}>Soporte técnico</div>
          </div>
          <div style={{ flex:1 }}/>
          <LxSeg items={['Todas','Abiertos','En curso','Resueltos']} value="Todas" onChange={()=>{}}/>
          <button className="lx-btn lx-btn--primary"><I.plus/> Nuevo ticket</button>
        </div>
        <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'0.8fr 2fr 1fr 1fr 0.8fr 0.8fr', gap: 12, padding:'12px 20px', background:'var(--bone)', borderBottom:'1px solid var(--line)' }}>
            {['ID','Título','Categoría','Estado','Abierto','Resuelto'].map(h => <span key={h} className="lx-micro">{h}</span>)}
          </div>
          {TICKETS.map(t => {
            const open = new Date(t.openedAt);
            const res  = t.resolvedAt ? new Date(t.resolvedAt) : new Date('2026-04-23');
            const days = Math.max(0, Math.round((res-open)/(1000*60*60*24)));
            const tone = t.status==='Resuelto' ? 'lx-chip--ok' : t.status==='En curso' ? 'lx-chip--warn' : 'lx-chip--err';
            return (
              <div key={t.id} style={{ display:'grid', gridTemplateColumns:'0.8fr 2fr 1fr 1fr 0.8fr 0.8fr', gap: 12, padding:'14px 20px', borderBottom:'1px solid var(--line)', alignItems:'center' }}>
                <span className="lx-num" style={{ fontFamily:'var(--f-mono)', fontSize: 12, fontWeight: 600 }}>{t.id}</span>
                <span style={{ fontSize: 13 }}>{t.title}</span>
                <span className="lx-chip" style={{ height: 22, fontSize: 11 }}>{t.category}</span>
                <span><span className={`lx-chip ${tone}`} style={{ height: 22, fontSize: 11 }}>{t.status}</span></span>
                <span className="lx-small" style={{ fontSize: 12 }}>{fmtDate(t.openedAt)}</span>
                <span className="lx-small" style={{ fontSize: 12 }}>{t.resolvedAt ? `${days}d` : <span style={{ color:'var(--warn)' }}>{days}d abierto</span>}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20 }}>
          <LxStat big label="Tiempo medio resol." value="1.2d" delta={-8}/>
          <LxStat big label="SLA cumplido" value="96%" delta={+3}/>
        </div>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Por categoría</div>
          <div style={{ marginTop: 12, display:'flex', flexDirection:'column', gap: 10 }}>
            {[['Hardware',1],['App',2],['Acceso',1],['Red',1]].map(([c,n]) => (
              <div key={c}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{c}</span><span className="lx-num">{n}</span>
                </div>
                <LxProgress value={n} max={3}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenSync() {
  const queue = [
    { id:1, ent:'Interacción', op:'Crear', cli:'Ximena Cortázar',   age:'4m' },
    { id:2, ent:'Muestra',     op:'Crear', cli:'Regina Iturbide',    age:'2m' },
    { id:3, ent:'Mensaje WA',  op:'Enviar',cli:'Paulina Azcárraga',  age:'1m' },
  ];
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 20 }}>
      <div className="lx-card" style={{ padding: 24 }}>
        <div className="lx-micro">Modo offline</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 30, marginTop: 4 }}>Sincronización en cola</div>
        <div className="lx-small" style={{ fontSize: 13, marginTop: 4, maxWidth: 560 }}>
          Las acciones realizadas sin conexión se guardan localmente y se envían automáticamente cuando se restablece la red.
          El orden y la atribución se preservan.
        </div>
        <div style={{ marginTop: 24 }}>
          {queue.map(q => (
            <div key={q.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap: 14, alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}><I.cloud size={16}/></span>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{q.op} · {q.ent}</div><div className="lx-small" style={{ fontSize: 11 }}>{q.cli}</div></div>
              <span className="lx-small" style={{ fontSize: 11 }}>hace {q.age}</span>
              <span className="lx-chip lx-chip--warn" style={{ height: 22, fontSize: 11 }}>En cola</span>
            </div>
          ))}
        </div>
        <button className="lx-btn" style={{ marginTop: 16 }}><I.cloud/> Forzar sincronización</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Capacidad offline</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 10, marginTop: 12 }}>
            {[
              ['Búsqueda de clientas', true],
              ['Perfil & historial',   true],
              ['Crear interacción',    true],
              ['Registrar muestra',    true],
              ['Crear recomendación',  true],
              ['Enviar WhatsApp',      false],
              ['Handoff POS',          false],
            ].map(([f, ok]) => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: ok?'var(--ok)':'var(--ink-12)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {ok ? <I.check size={10}/> : <I.x size={10}/>}
                </span>
                <span style={{ fontSize: 13 }}>{f}</span>
                <span className="lx-small" style={{ marginLeft:'auto', fontSize: 11 }}>{ok ? 'Sin red' : 'Requiere red'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Exportes ejecutados</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 10, marginTop: 12 }}>
            {[
              ['Clientas · Polanco',        'xlsx', 'hoy 09:04', 'Valentina'],
              ['Panorama Q2 · ejecutivo',   'pdf',  'ayer',       'HQ'],
              ['Muestras · conversión',     'xlsx', '22 abr',     'Paulina'],
            ].map(([n, k, when, who], i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 10, alignItems:'center', padding:'8px 0', borderBottom: i<2?'1px dashed var(--line)':'none' }}>
                {k==='pdf' ? <I.pdf/> : <I.excel/>}
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div><div className="lx-small" style={{ fontSize: 11 }}>{when} · {who}</div></div>
                <button className="lx-btn lx-btn--sm" style={{ height: 26 }}><I.download size={12}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenIntegrations() {
  return (
    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>
      <div className="lx-card" style={{ padding: 24 }}>
        <div className="lx-micro">Integraciones</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 30, marginTop: 4 }}>Estructura de sistema</div>
        <div className="lx-small" style={{ fontSize: 13, marginTop: 4, maxWidth: 620 }}>
          Todas las integraciones están preparadas como stub o sandbox. HQ puede activar el modo live sin cambios de código en el cliente.
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: 16 }}>
        {INTEGRATIONS.map(i => (
          <div key={i.key} className="lx-card" style={{ padding: 20 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}><I.plug size={18}/></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{i.label}</div>
                <div className="lx-small" style={{ fontSize: 11 }}>{i.mode}</div>
              </div>
              <span className={`lx-chip ${i.status==='live'?'lx-chip--ok':i.status==='sandbox'?'lx-chip--warn':''}`} style={{ height: 22, fontSize: 11 }}>{i.status}</span>
            </div>
            <LxDivider/>
            <LxKV k="Último evento" v={i.lastEvent}/>
            <LxKV k="Documentación" v="Ready for handoff"/>
            <div style={{ display:'flex', gap: 8, marginTop: 12 }}>
              <button className="lx-btn lx-btn--sm">Ver eventos</button>
              <button className="lx-btn lx-btn--sm">Configurar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenBAPerf, ScreenManager, ScreenHQ, ScreenDevices, ScreenTickets, ScreenSync, ScreenIntegrations });
