// Role-based dashboards — built to spec.
// Exports: DashBA, DashManager, DashSupervisor, DashDirector
// Shared primitives live at the top, then one component per dashboard.

// ─── Shared primitives ──────────────────────────────────────────────────────

// Big KPI tile used everywhere. Supports delta, spark, hint, tone, drill arrow.
function DKpi({ label, value, delta, spark, hint, tone, onDrill, tall }) {
  const toneBg = tone === 'warn' ? 'var(--warn-08)' : tone === 'err' ? 'var(--err-08)' : tone === 'ok' ? 'var(--ok-08)' : 'transparent';
  const drillable = !!onDrill;
  const handleClick = typeof onDrill === 'function' ? onDrill : undefined;
  return (
    <button
      onClick={handleClick}
      className="lx-card"
      style={{
        padding: 16, textAlign:'left', cursor: drillable?'pointer':'default', background: toneBg || 'var(--paper)',
        minHeight: tall?128:96, display:'flex', flexDirection:'column', justifyContent:'space-between',
        border:'1px solid var(--line)',
      }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8 }}>
        <span className="lx-micro" style={{ letterSpacing:'0.12em' }}>{label}</span>
        {drillable && <span style={{ color:'var(--ink-40)' }}><I.chevR size={14}/></span>}
      </div>
      <div>
        <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: tall?36:28, lineHeight: 1.05, letterSpacing:'-0.01em' }}>{value}</div>
        <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 4, minHeight: 18 }}>
          {delta !== undefined && delta !== null && (
            <span style={{ fontSize: 11, fontWeight: 600, color: delta>=0?'var(--ok)':'var(--err)' }}>
              {delta>=0?'▲':'▼'} {Math.abs(delta)}%
            </span>
          )}
          {hint && <span className="lx-small" style={{ fontSize: 11 }}>{hint}</span>}
          {spark && <div style={{ marginLeft:'auto' }}><LxSpark values={spark} width={72} height={22}/></div>}
        </div>
      </div>
    </button>
  );
}

// Block header
function DBlock({ title, subtitle, right, children }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <header style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', padding:'0 4px 10px', marginBottom: 16, borderBottom:'1px solid var(--line)' }}>
        <div>
          {title && <div className="lx-micro">{title}</div>}
          {subtitle && <div style={{ fontFamily:'var(--f-display)', fontSize: 22, letterSpacing:'-0.01em' }}>{subtitle}</div>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

// Small filter/scope pill (inline, no state — illustrative)
function DScope({ label, value, icon }) {
  return (
    <span className="lx-chip" style={{ height: 28, padding:'0 12px', fontSize: 12, background:'#fff' }}>
      {icon}<span style={{ color:'var(--ink-60)', marginLeft: icon?6:0 }}>{label}</span>
      <span style={{ marginLeft: 6, fontWeight: 600 }}>{value}</span>
      <I.chevD size={12}/>
    </span>
  );
}

// Tiny column/bar chart
function DBars({ values, labels, height=88, color='var(--ink)', highlight=-1 }) {
  const max = Math.max(...values);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap: 6, height, padding:'4px 0' }}>
      {values.map((v,i) => (
        <div key={i} style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 4 }}>
          <div style={{
            width:'100%', height: `${(v/max)*100}%`,
            background: i===highlight?'var(--accent)':color, opacity: i===highlight?1:.55, borderRadius: 3,
            transition:'height .5s var(--ease)',
          }}/>
          {labels && <span className="lx-small" style={{ fontSize: 9 }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

// Horizontal stacked bar (two-segment split)
function DSplit({ a, b, aLabel, bLabel, aColor='var(--ink)', bColor='#C9A961' }) {
  const tot = a+b;
  return (
    <div>
      <div style={{ display:'flex', height: 10, borderRadius: 999, overflow:'hidden', background:'var(--ink-08)' }}>
        <div style={{ width:`${(a/tot)*100}%`, background: aColor }}/>
        <div style={{ width:`${(b/tot)*100}%`, background: bColor }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop: 6, fontSize: 11 }}>
        <span style={{ display:'flex', alignItems:'center', gap: 6 }}><span style={{ width:8, height:8, background:aColor, borderRadius:2 }}/>{aLabel} · <b className="lx-num">{Math.round(a/tot*100)}%</b></span>
        <span style={{ display:'flex', alignItems:'center', gap: 6 }}>{bLabel} · <b className="lx-num">{Math.round(b/tot*100)}%</b><span style={{ width:8, height:8, background:bColor, borderRadius:2 }}/></span>
      </div>
    </div>
  );
}

// Line chart w/ x labels — used for 12-week trends
function DLine({ series, labels, height=120, colors=['var(--ink)'], legend }) {
  const W = 560;
  const flat = series.flat();
  const min = Math.min(...flat), max = Math.max(...flat);
  const range = max - min || 1;
  const step = W / (series[0].length - 1);
  const yFor = v => height - ((v-min)/range)*(height-16) - 4;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ overflow:'visible' }}>
        {[0,0.25,0.5,0.75,1].map((g,i) => (
          <line key={i} x1="0" x2={W} y1={yFor(min + range*g)} y2={yFor(min + range*g)} stroke="var(--line)" strokeDasharray="2 4"/>
        ))}
        {series.map((s, si) => {
          const pts = s.map((v,i)=>`${i*step},${yFor(v)}`).join(' ');
          return (
            <g key={si}>
              <polyline fill="none" stroke={colors[si] || 'var(--ink)'} strokeWidth="1.8" points={pts}
                strokeLinecap="round" strokeLinejoin="round"/>
              {s.map((v,i) => <circle key={i} cx={i*step} cy={yFor(v)} r="2" fill={colors[si] || 'var(--ink)'}/>)}
            </g>
          );
        })}
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop: 4 }}>
        {labels.map((l,i) => <span key={i} className="lx-small" style={{ fontSize: 9, color:'var(--ink-60)' }}>{l}</span>)}
      </div>
      {legend && <div style={{ display:'flex', gap: 14, marginTop: 8 }}>
        {legend.map((l,i) => (
          <span key={l} className="lx-small" style={{ fontSize: 11, display:'flex', alignItems:'center', gap: 6 }}>
            <span style={{ width: 10, height: 2, background: colors[i] }}/>{l}
          </span>
        ))}
      </div>}
    </div>
  );
}

// Scatter — adoption (x) vs sales (y). Used in Supervisor.
function DScatter({ points, height=220 }) {
  const W = 520;
  const xMin=0, xMax=100, yMin=0, yMax=5000000;
  const xFor = x => (x-xMin)/(xMax-xMin)*W;
  const yFor = y => height - (y-yMin)/(yMax-yMin)*(height-24) - 16;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height}>
      {/* quadrant lines */}
      <line x1={xFor(60)} x2={xFor(60)} y1={0} y2={height} stroke="var(--line)" strokeDasharray="3 3"/>
      <line y1={yFor(3200000)} y2={yFor(3200000)} x1={0} x2={W} stroke="var(--line)" strokeDasharray="3 3"/>
      {/* quadrant labels */}
      <text x={10} y={14} fontSize="9" fill="var(--ink-60)">ALTAS VENTAS · BAJA ADOPCIÓN</text>
      <text x={W-10} y={14} fontSize="9" fill="var(--ink-60)" textAnchor="end">ESTRELLA</text>
      <text x={10} y={height-6} fontSize="9" fill="var(--ink-60)">REZAGADA</text>
      <text x={W-10} y={height-6} fontSize="9" fill="var(--ink-60)" textAnchor="end">ALTA ADOPCIÓN · BAJAS VENTAS</text>
      {points.map((p,i) => {
        const tone = p.adoption >= 60 && p.sales >= 3200000 ? 'var(--ok)'
                   : p.adoption < 60 && p.sales < 3200000  ? 'var(--err)'
                   : 'var(--warn)';
        return (
          <g key={i}>
            <circle cx={xFor(p.adoption)} cy={yFor(p.sales)} r={6} fill={tone} opacity=".85"/>
            <text x={xFor(p.adoption)+9} y={yFor(p.sales)+3} fontSize="10" fill="var(--ink-80)">{p.label}</text>
          </g>
        );
      })}
      {/* axes */}
      <text x={W/2} y={height} fontSize="9" fill="var(--ink-60)" textAnchor="middle">Adopción BA (%) →</text>
      <text x={2} y={height/2} fontSize="9" fill="var(--ink-60)" transform={`rotate(-90 8 ${height/2})`}>Ventas MTD →</text>
    </svg>
  );
}

// Heatmap (simple grid, used for national coverage view)
function DHeatmap({ cells }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap: 6 }}>
      {cells.map((c,i) => {
        const a = c.intensity;
        return (
          <div key={i} style={{
            padding:'10px 8px', borderRadius: 8, background: `rgba(14,14,15,${0.06 + a*0.6})`,
            color: a > 0.5 ? '#fff' : 'var(--ink)',
            display:'flex', flexDirection:'column', gap: 2,
          }}>
            <div className="lx-small" style={{ fontSize: 10, color: a > 0.5 ? 'rgba(255,255,255,.8)' : 'var(--ink-60)' }}>{c.region}</div>
            <div className="lx-num" style={{ fontSize: 14, fontWeight: 600 }}>{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}

// Traffic-light pill — Supervisor semáforo
function DLight({ status }) {
  const map = {
    verde:   { bg:'var(--ok-08)',  dot:'var(--ok)',  label:'Verde' },
    amarillo:{ bg:'var(--warn-08)',dot:'var(--warn)',label:'Amarillo' },
    rojo:    { bg:'var(--err-08)', dot:'var(--err)', label:'Rojo' },
  };
  const s = map[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap: 8, padding:'4px 10px', borderRadius: 999, background: s.bg, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: s.dot }}/>{s.label}
    </span>
  );
}

// Dashboard header with scopes/filters
function DHeader({ title, subtitle, scopes, actions }) {
  return (
    <div style={{ padding:'22px 28px 14px', borderBottom:'1px solid var(--line)', background:'var(--paper)' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap: 20 }}>
        <div>
          <div className="lx-micro">{subtitle}</div>
          <h1 style={{ fontFamily:'var(--f-display)', fontSize: 38, margin:'2px 0 0', letterSpacing:'-0.02em', fontWeight: 400 }}>{title}</h1>
        </div>
        <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>{actions}</div>
      </div>
      {scopes && (
        <div style={{ display:'flex', gap: 8, marginTop: 14, flexWrap:'wrap' }}>
          {scopes.map((s,i) => <DScope key={i} {...s}/>)}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard 1 · Beauty Advisor — “Mi desempeño” ─────────────────────────

function DashBA() {
  return (
    <div style={{ height:'100%', overflow:'auto', background:'var(--bone)' }} className="lx-scroll">
      <DHeader
        title="Mi desempeño"
        subtitle="Beauty Advisor · Valentina Ríos · Liverpool Polanco"
        scopes={[
          { label:'Período', value:'Abril 2026', icon:<I.cal size={12}/> },
          { label:'Marca',   value:'Todas' },
          { label:'Comparar', value:'vs. Marzo' },
        ]}
        actions={<>
          <button className="lx-btn lx-btn--sm"><I.download size={12}/> Exportar</button>
          <button className="lx-btn lx-btn--sm lx-btn--primary">Ver objetivos</button>
        </>}
      />

      <div style={{ padding: 24, display:'flex', flexDirection:'column', gap: 6 }}>

        {/* IMPACTO — hero stats */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Impacto de negocio</div>
          <span className="lx-eyebrow-sub">Toca para desglosar</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
          <DKpi tall label="Ventas mes"            value={MXN(486200)}  delta={+12} spark={[320,340,380,360,410,430,486]} hint="vs. marzo" onDrill/>
          <DKpi tall label="Ventas trimestre"      value={MXN(1264000)} delta={+9}  spark={[380,420,470,480,460,510,486]} hint="Q2 en curso" onDrill/>
          <DKpi tall label="% vs objetivo"         value="108%"         delta={+8}  hint={`Meta ${MXN(450000)}`} tone="ok" onDrill/>
          <DKpi tall label="Ticket promedio"       value={MXN(5820)}    delta={+4}  spark={[5100,5300,5420,5500,5620,5700,5820]} onDrill/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginTop: 12, marginBottom: 28 }}>
          <DKpi label="Conversión recomendación → compra" value="58%" delta={+6} hint="42/72 recomendaciones" onDrill/>
          <DKpi label="Clientes nuevos"                    value="14"  delta={+2}  hint="mes actual" onDrill/>
          <DKpi label="Recompra 90 días"                   value="41%" delta={+3}  hint="68/164 clientas" onDrill/>
        </div>

        {/* CARTERA */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Gestión de cartera</div>
          <button className="lx-btn lx-btn--sm">Abrir cartera <I.arrowR/></button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          <DKpi label="Clientes activos"        value="164" hint="contacto < 180 días" onDrill/>
          <DKpi label="Clientes en riesgo"      value="22"  tone="warn" hint="sin compra 90–180 días" onDrill/>
          <DKpi label="Seguimientos hoy"        value="7"   tone="err"  hint="pendientes de enviar" onDrill/>
          <DKpi label="Citas semana"            value="9"   hint="4 confirmadas · 5 propuestas" onDrill/>
          <DKpi label="Eventos"                 value="11"  hint="3 cumpleaños · 8 reposición" onDrill/>
          <DKpi label="Muestras con conversión" value="32%" delta={+5} hint="14 de 44 muestras cerraron venta" onDrill/>
        </div>

        {/* ADOPCIÓN */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Adopción</div>
          <span className="lx-eyebrow-sub">Uso · completitud · ranking</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap: 12 }}>
            <div className="lx-card" style={{ padding: 16 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <div className="lx-micro">Perfiles semana</div>
                  <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 36 }}>18</div>
                  <div className="lx-small" style={{ fontSize: 11 }}>meta 15/sem · <span style={{ color:'var(--ok)', fontWeight: 600 }}>+20%</span></div>
                </div>
                <DBars values={[2,3,4,2,3,2,2]} labels={['L','M','X','J','V','S','D']} height={62}/>
              </div>
            </div>
            <DKpi tall label="Completitud de perfil" value="87%" delta={+4} hint="Objetivo ≥ 80%" tone="ok"/>
            <DKpi tall label="Días consecutivos usando app" value="23" hint="racha actual · récord 41"/>
          </div>
          <div className="lx-card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <div className="lx-micro">Ranking adopción (sin nombres)</div>
              <span className="lx-small" style={{ fontSize: 11 }}>mi posición entre 12 BAs Polanco</span>
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', gap: 4, height: 66, marginTop: 10 }}>
              {[95,92,90,88,85,82,80,78,75,70,65,60].map((v,i) => (
                <div key={i} style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 4 }}>
                  <div style={{ width:'100%', height:`${v}%`, background: i===3?'var(--accent)':'var(--ink-08)', borderRadius: 3 }}/>
                  <span className="lx-small" style={{ fontSize: 9, fontWeight: i===3?600:400, color: i===3?'var(--accent)':'var(--ink-60)' }}>{i===3?'TÚ':`#${i+1}`}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 8 }}>
              <span className="lx-small">Top 25% del equipo</span>
              <span className="lx-small lx-num">#4 de 12</span>
            </div>
          </div>
      </div>
    </div>
  );
}

// ─── Dashboard 2 · Store Manager — “Mi tienda” ────────────────────────────

function DashManager() {
  return (
    <div style={{ height:'100%', overflow:'auto', background:'var(--bone)' }} className="lx-scroll">
      <DHeader
        title="Mi tienda"
        subtitle="Store Manager · Liverpool Polanco"
        scopes={[
          { label:'Período', value:'MTD · Abril 2026', icon:<I.cal size={12}/> },
          { label:'Comparar',value:'vs. Marzo' },
          { label:'Turno',   value:'Todos' },
        ]}
        actions={<>
          <button className="lx-btn lx-btn--sm"><I.download size={12}/> Exportar</button>
          <button className="lx-btn lx-btn--sm lx-btn--primary">Coaching semanal</button>
        </>}
      />

      <div style={{ padding: 24, display:'flex', flexDirection:'column', gap: 6 }}>

        {/* Performance */}
        <DBlock title="" subtitle="Performance">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr) 1.4fr', gap: 12 }}>
            <DKpi tall label="Ventas MTD" value={MXN(5_820_000)} delta={+7}  spark={[420,440,460,480,520,540,582]} onDrill/>
            <DKpi tall label="Ventas QTD" value={MXN(15_240_000)} delta={+6} onDrill/>
            <DKpi tall label="Ventas YTD" value={MXN(58_120_000)} delta={+9} onDrill/>
            <div className="lx-card" style={{ padding: 16, background:'var(--ok-08)', border:'1px solid var(--ok-20)' }}>
              <div className="lx-micro">HIGHLIGHT · Lift clienteling</div>
              <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 32 }}>+38%</div>
              <div className="lx-small" style={{ fontSize: 11 }}>
                Ticket promedio con perfil ({MXN(7850)}) vs. sin perfil ({MXN(5680)}).
                <br/><span style={{ color:'var(--ok)', fontWeight: 600 }}>Clienteling justifica la adopción.</span>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <DKpi label="% vs objetivo"       value="112%" delta={+5}  hint={`Meta ${MXN(5_200_000)}`} tone="ok" onDrill/>
            <DKpi label="Ticket promedio"     value={MXN(6820)} delta={+4} onDrill/>
            <DKpi label="Ventas clienteling"  value={MXN(3_210_000)} delta={+14} hint="55% del total · atribuido a perfil" onDrill/>
          </div>

          <div className="lx-card" style={{ padding: 16, marginTop: 12 }}>
            <div className="lx-micro" style={{ marginBottom: 10 }}>Split Lancôme · YSL</div>
            <DSplit a={3_490_000} b={2_330_000} aLabel="Lancôme" bLabel="YSL" aColor="#B85F63" bColor="#0E0E0F"/>
            <div style={{ display:'flex', gap: 20, marginTop: 10 }}>
              <div><span className="lx-small">Lancôme</span><div className="lx-num" style={{ fontWeight: 600 }}>{MXN(3_490_000)}</div></div>
              <div><span className="lx-small">YSL</span><div className="lx-num" style={{ fontWeight: 600 }}>{MXN(2_330_000)}</div></div>
              <div style={{ marginLeft:'auto' }}><span className="lx-small">Balance objetivo</span><div style={{ fontSize: 12 }}>60% / 40%</div></div>
            </div>
          </div>
        </DBlock>

        {/* Equipo */}
        <DBlock title="" subtitle="Equipo"
          right={<button className="lx-btn lx-btn--sm">Gestionar BAs</button>}>
          <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr 1fr 1fr', gap: 12 }}>
            {/* Ranking BAs */}
            <div className="lx-card" style={{ padding: 16, gridRow:'span 2' }}>
              <div className="lx-micro">Ranking BAs · ventas MTD</div>
              <div style={{ marginTop: 10 }}>
                {[
                  { n:'Valentina R.',  v: 486200, p: 108 },
                  { n:'Fernanda O.',   v: 442800, p: 98 },
                  { n:'Paulina T.',    v: 418500, p: 93 },
                  { n:'Regina M.',     v: 388100, p: 86 },
                  { n:'Camila S.',     v: 310400, p: 69 },
                  { n:'Daniela V.',    v: 284700, p: 63 },
                ].map((r,i) => (
                  <div key={r.n} style={{ display:'grid', gridTemplateColumns:'18px 1.1fr 1fr 0.5fr', gap: 10, alignItems:'center', padding:'8px 0', borderBottom:'1px dashed var(--line)' }}>
                    <span className="lx-num" style={{ fontSize: 12, color:'var(--ink-60)' }}>#{i+1}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{r.n}</span>
                    <LxProgress value={r.p} max={120} color={r.p>=100?'var(--ok)':r.p>=80?'var(--ink)':'var(--warn)'}/>
                    <span className="lx-num" style={{ fontSize: 11, fontWeight: 600, textAlign:'right' }}>{MXN(r.v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <DKpi tall label="Adopción equipo" value="87%" delta={+6} hint="11 de 12 BAs activos" tone="ok"/>
            <DKpi tall label="BAs inactivos 3 días" value="1" tone="err" hint="Daniela V. · notificada"/>
            <DKpi tall label="Perfiles nuevos (sem.)" value="96" delta={+18} hint="meta 80/sem"/>
            <DKpi tall label="Calidad perfiles (>80%)" value="84%" delta={+3} hint="10 de 12 BAs sobre la meta"/>
          </div>
        </DBlock>

        {/* Clientes */}
        <DBlock title="" subtitle="Clientes">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 12 }}>
            <DKpi label="Activos"       value="1,842" delta={+4} onDrill/>
            <DKpi label="En riesgo"     value="214"   tone="warn" hint="sin compra 90–180 días" onDrill/>
            <DKpi label="VIP (top 20%)" value="368"   hint={`LTV ≥ ${MXN(150_000)}`} onDrill/>
            <DKpi label="Retención 12m" value="71%"   delta={+2} onDrill/>
            <DKpi label="NPS"           value="9.1"   delta={+0.3} hint="n = 342 respuestas" tone="ok" onDrill/>
          </div>
        </DBlock>

        {/* Operación */}
        <DBlock title="" subtitle="Operación">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
            <DKpi label="Citas"           value="142" hint="semana · 18 hoy" onDrill/>
            <DKpi label="No-show"         value="7%"  tone="warn" hint="objetivo ≤ 10%" onDrill/>
            <DKpi label="Seguimientos"    value="312" hint="enviados semana" onDrill/>
            <DKpi label="Eventos"         value="48"  hint="14 cumpleaños · 34 reposición" onDrill/>
          </div>
        </DBlock>
      </div>
    </div>
  );
}

// ─── Dashboard 3 · Supervisor — “Mis tiendas” ─────────────────────────────

function DashSupervisor() {
  const stores = [
    { id:'st-001', label:'Liverpool Polanco',      sales: 5_820_000, pct: 112, yoy: +14, adoption: 87, clients: 1842, status:'verde'    },
    { id:'st-002', label:'Liverpool Interlomas',   sales: 3_410_000, pct: 94,  yoy: +6,  adoption: 72, clients: 1140, status:'amarillo' },
    { id:'st-003', label:'Palacio Polanco',        sales: 4_980_000, pct: 104, yoy: +9,  adoption: 82, clients: 1520, status:'verde'    },
    { id:'st-004', label:'Palacio Santa Fe',       sales: 2_140_000, pct: 71,  yoy: -3,  adoption: 54, clients:  820, status:'rojo'     },
    { id:'st-005', label:'Liverpool Perisur',      sales: 3_820_000, pct: 96,  yoy: +5,  adoption: 76, clients: 1290, status:'amarillo' },
  ];
  return (
    <div style={{ height:'100%', overflow:'auto', background:'var(--bone)' }} className="lx-scroll">
      <DHeader
        title="Mis tiendas"
        subtitle="Supervisor de zona · Diego Salvatierra · Centro CDMX"
        scopes={[
          { label:'Zona',     value:'Centro · 5 tiendas', icon:<I.cal size={12}/> },
          { label:'Período',  value:'MTD · Abril 2026' },
          { label:'Cadena',   value:'Todas' },
        ]}
        actions={<>
          <button className="lx-btn lx-btn--sm"><I.download size={12}/> Exportar</button>
          <button className="lx-btn lx-btn--sm lx-btn--primary">Abrir coaching</button>
        </>}
      />

      <div style={{ padding: 24, display:'flex', flexDirection:'column', gap: 6 }}>

        {/* Overview */}
        <DBlock title="" subtitle="Overview">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 12 }}>
            <DKpi tall label="Ventas"           value={MXN(20_170_000)} delta={+8}  spark={[14,15,16,17,18,19,20]} onDrill/>
            <DKpi tall label="% objetivo"       value="96%"             hint={`Meta ${MXN(21_000_000)}`} tone="warn" onDrill/>
            <DKpi tall label="Growth YoY"       value="+8%"             delta={+8}  tone="ok" onDrill/>
            <DKpi tall label="Adopción"         value="74%"             delta={+5}  hint="de 52 BAs en zona" onDrill/>
            <DKpi tall label="Clientes activos" value="6,612"           delta={+4}  onDrill/>
          </div>
        </DBlock>

        {/* SEMÁFORO — CRITICAL */}
        <DBlock title="Crítico" subtitle="Semáforo de tiendas"
          right={<span className="lx-small" style={{ fontSize: 11 }}>Basado en <b>ventas vs objetivo</b> + <b>adopción BA</b></span>}>
          <div className="lx-card" style={{ padding: 16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom:'1px solid var(--line)' }}>
              <div style={{ padding: 14, background:'var(--ok-08)', borderRadius: 10 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}><span style={{ width:10,height:10,borderRadius:999,background:'var(--ok)' }}/><b>Verde</b></div>
                <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 36, marginTop: 4 }}>2</div>
                <div className="lx-small" style={{ fontSize: 11 }}>≥100% objetivo · ≥80% adopción</div>
              </div>
              <div style={{ padding: 14, background:'var(--warn-08)', borderRadius: 10 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}><span style={{ width:10,height:10,borderRadius:999,background:'var(--warn)' }}/><b>Amarillo</b></div>
                <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 36, marginTop: 4 }}>2</div>
                <div className="lx-small" style={{ fontSize: 11 }}>85–99% objetivo · 60–79% adopción</div>
              </div>
              <div style={{ padding: 14, background:'var(--err-08)', borderRadius: 10 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}><span style={{ width:10,height:10,borderRadius:999,background:'var(--err)' }}/><b>Rojo</b></div>
                <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 36, marginTop: 4 }}>1</div>
                <div className="lx-small" style={{ fontSize: 11 }}>&lt;85% objetivo · &lt;60% adopción · intervención</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1.6fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr auto', gap: 12, padding:'8px 4px', borderBottom:'1px solid var(--line)', marginBottom: 4 }}>
              {['Tienda','Estado','Ventas','% obj.','YoY','Adopción','Acción'].map(h => <span key={h} className="lx-micro" style={{ fontSize: 10 }}>{h}</span>)}
            </div>
            {stores.map(s => (
              <div key={s.id} style={{ display:'grid', gridTemplateColumns:'1.6fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr auto', gap: 12, alignItems:'center', padding:'12px 4px', borderBottom:'1px dashed var(--line)' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</span>
                <DLight status={s.status}/>
                <span className="lx-num" style={{ fontSize: 12, fontWeight: 600 }}>{MXN(s.sales)}</span>
                <span className="lx-num" style={{ fontSize: 12, fontWeight: 600, color: s.pct>=100?'var(--ok)':s.pct>=85?'var(--warn)':'var(--err)' }}>{s.pct}%</span>
                <span className="lx-num" style={{ fontSize: 12, color: s.yoy>=0?'var(--ok)':'var(--err)', fontWeight: 600 }}>{s.yoy>=0?'+':''}{s.yoy}%</span>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <LxProgress value={s.adoption} max={100} color={s.adoption>=80?'var(--ok)':s.adoption>=60?'var(--warn)':'var(--err)'}/>
                  <span className="lx-num" style={{ fontSize: 11, width: 30 }}>{s.adoption}%</span>
                </div>
                <button className="lx-btn lx-btn--sm" style={{ height: 26 }}>Drill →</button>
              </div>
            ))}
          </div>
        </DBlock>

        {/* Ranking */}
        <DBlock title="" subtitle="Ranking">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
            <div className="lx-card" style={{ padding: 16 }}>
              <div className="lx-micro">Top / Bottom · Ventas</div>
              {[...stores].sort((a,b)=>b.sales-a.sales).map((s,i,arr) => {
                const isTop = i < 2, isBot = i >= arr.length - 1;
                return (
                  <div key={s.id} style={{ display:'grid', gridTemplateColumns:'24px 1fr auto auto', gap: 10, alignItems:'center', padding:'8px 0', borderBottom:'1px dashed var(--line)' }}>
                    <span className="lx-num" style={{ fontSize: 12, color: isTop?'var(--ok)':isBot?'var(--err)':'var(--ink-60)', fontWeight: 600 }}>#{i+1}</span>
                    <span style={{ fontSize: 12 }}>{s.label}</span>
                    <span className="lx-num" style={{ fontSize: 12, fontWeight: 600 }}>{MXN(s.sales)}</span>
                    {isTop && <span className="lx-chip lx-chip--ok" style={{ height: 18, fontSize: 10 }}>TOP</span>}
                    {isBot && <span className="lx-chip lx-chip--err" style={{ height: 18, fontSize: 10 }}>BOTTOM</span>}
                    {!isTop && !isBot && <span/>}
                  </div>
                );
              })}
            </div>
            <div className="lx-card" style={{ padding: 16 }}>
              <div className="lx-micro">Top / Bottom · Adopción</div>
              {[...stores].sort((a,b)=>b.adoption-a.adoption).map((s,i,arr) => {
                const isTop = i < 2, isBot = i >= arr.length - 1;
                return (
                  <div key={s.id} style={{ display:'grid', gridTemplateColumns:'24px 1fr auto auto', gap: 10, alignItems:'center', padding:'8px 0', borderBottom:'1px dashed var(--line)' }}>
                    <span className="lx-num" style={{ fontSize: 12, color: isTop?'var(--ok)':isBot?'var(--err)':'var(--ink-60)', fontWeight: 600 }}>#{i+1}</span>
                    <span style={{ fontSize: 12 }}>{s.label}</span>
                    <span className="lx-num" style={{ fontSize: 12, fontWeight: 600 }}>{s.adoption}%</span>
                    {isTop && <span className="lx-chip lx-chip--ok" style={{ height: 18, fontSize: 10 }}>TOP</span>}
                    {isBot && <span className="lx-chip lx-chip--err" style={{ height: 18, fontSize: 10 }}>BOTTOM</span>}
                    {!isTop && !isBot && <span/>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lx-card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <div>
                <div className="lx-micro">Scatter · adopción vs ventas</div>
                <div style={{ fontFamily:'var(--f-display)', fontSize: 18 }}>Correlación por tienda</div>
              </div>
              <span className="lx-small" style={{ fontSize: 11 }}>Cuadrantes: Estrella · Rezagada · Alta adopción · Altas ventas</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <DScatter points={stores.map(s => ({ label: s.label.split(' ').slice(-1)[0], adoption: s.adoption, sales: s.sales }))}/>
            </div>
            <div className="lx-card" style={{ padding: 12, marginTop: 10, background:'var(--err-08)', border:'1px solid var(--err-20)' }}>
              <div className="lx-micro" style={{ color:'var(--err)' }}>Desviación detectada</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>
                <b>Palacio Santa Fe</b> cayó a 54% adopción y 71% objetivo — revisar turnos y plan de coaching esta semana.
              </div>
            </div>
          </div>
        </DBlock>

        {/* Operación */}
        <DBlock title="" subtitle="Operación">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
            <DKpi tall label="% iPads activos"      value="94%" hint="47 de 50 dispositivos" tone="ok" onDrill/>
            <DKpi tall label="Tickets abiertos"     value="6"   tone="warn" onDrill/>
            <DKpi tall label="Tiempo resolución"    value="14h" hint="mediana · SLA 24h" onDrill/>
            <div className="lx-card" style={{ padding: 14 }}>
              <div className="lx-micro">Categorías de tickets</div>
              {[['Login',2],['Sincronización',2],['Impresora recibo',1],['Red tienda',1]].map(([cat, n]) => (
                <div key={cat} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'center', padding:'6px 0', borderBottom:'1px dashed var(--line)' }}>
                  <span style={{ fontSize: 12 }}>{cat}</span>
                  <span className="lx-num" style={{ fontSize: 12, fontWeight: 600 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </DBlock>

        {/* Tendencias */}
        <DBlock title="" subtitle="Tendencias">
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.2fr', gap: 12 }}>
            <div className="lx-card" style={{ padding: 16 }}>
              <div className="lx-micro">12 semanas · Ventas zona</div>
              <div style={{ marginTop: 8 }}>
                <DLine
                  series={[[3.8,4.0,4.1,3.9,4.2,4.4,4.6,4.5,4.7,4.9,5.0,5.1]]}
                  labels={['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12']}
                  colors={['var(--ink)']}/>
              </div>
            </div>
            <div className="lx-card" style={{ padding: 16 }}>
              <div className="lx-micro">12 semanas · Adopción zona</div>
              <div style={{ marginTop: 8 }}>
                <DLine
                  series={[[58,60,62,64,66,68,70,72,73,74,74,75]]}
                  labels={['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12']}
                  colors={['var(--ok)']}/>
              </div>
            </div>

            <div className="lx-card" style={{ padding: 16 }}>
              <div className="lx-micro">Liverpool vs Palacio · ventas 12s</div>
              <div style={{ marginTop: 8 }}>
                <DLine
                  series={[
                    [2.1,2.2,2.3,2.2,2.4,2.5,2.7,2.6,2.8,2.9,3.0,3.1],
                    [1.7,1.8,1.8,1.7,1.8,1.9,1.9,1.9,1.9,2.0,2.0,2.0],
                  ]}
                  labels={['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12']}
                  colors={['#B85F63','#0E0E0F']}
                  legend={['Liverpool','Palacio']}/>
              </div>
            </div>

            <div className="lx-card" style={{ padding: 16 }}>
              <div className="lx-micro">Heatmap México · ventas por región</div>
              <div style={{ marginTop: 10 }}>
                <DHeatmap cells={[
                  { region:'CDMX Norte',  value:'5.8M', intensity: 0.95 },
                  { region:'CDMX Sur',    value:'4.2M', intensity: 0.75 },
                  { region:'Santa Fe',    value:'2.1M', intensity: 0.30 },
                  { region:'GDL',         value:'3.4M', intensity: 0.55 },
                  { region:'MTY',         value:'3.9M', intensity: 0.65 },
                  { region:'Puebla',      value:'1.8M', intensity: 0.25 },
                  { region:'Querétaro',   value:'1.2M', intensity: 0.20 },
                  { region:'Cancún',      value:'2.6M', intensity: 0.42 },
                  { region:'Mérida',      value:'0.9M', intensity: 0.15 },
                  { region:'Toluca',      value:'0.8M', intensity: 0.12 },
                  { region:'León',        value:'1.1M', intensity: 0.18 },
                  { region:'Tijuana',     value:'1.4M', intensity: 0.22 },
                ]}/>
              </div>
            </div>
          </div>
        </DBlock>
      </div>
    </div>
  );
}

// ─── Dashboard 4 · Dirección — “El negocio” ───────────────────────────────

function DashDirector() {
  return (
    <div style={{ height:'100%', overflow:'auto', background:'var(--bone)' }} className="lx-scroll">
      <DHeader
        title="El negocio"
        subtitle="Dirección regional · L'Oréal Luxe México"
        scopes={[
          { label:'País',       value:'México',          icon:<I.cal size={12}/> },
          { label:'Período',    value:'YTD · 2026' },
          { label:'Casa',       value:'Lancôme + YSL' },
          { label:'Cadena',     value:'Liverpool + Palacio' },
        ]}
        actions={<>
          <button className="lx-btn lx-btn--sm"><I.download size={12}/> Board pack</button>
          <button className="lx-btn lx-btn--sm lx-btn--primary">Vista ejecutiva</button>
        </>}
      />

      <div style={{ padding: 28, display:'flex', flexDirection:'column', gap: 6 }}>

        {/* EXECUTIVE HERO */}
        <div className="lx-hero" style={{ marginBottom: 28 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap: 40, alignItems:'end' }}>
            <div>
              <div className="lx-micro">Ventas año a la fecha · L'Oréal Luxe México</div>
              <div className="lx-hero-num tn" style={{ marginTop: 8 }}>{MXN(168_420_000)}</div>
              <div style={{ display:'flex', gap: 14, marginTop: 12, alignItems:'center' }}>
                <span className="lx-chip" style={{ height: 26, fontSize: 12, background:'var(--ok-08)', color:'var(--ok)', borderColor:'var(--ok-20)' }}>▲ +11% YoY</span>
                <span className="lx-small" style={{ fontSize: 12 }}>Proyección cierre anual <b className="tn">{MXN(210_500_000)}</b></span>
              </div>
            </div>
            <div>
              <div className="lx-stat-label">Ventas incrementales</div>
              <div className="lx-hero-num-sm tn" style={{ marginTop: 6 }}>{MXN(28_700_000)}</div>
              <div className="lx-small" style={{ fontSize: 12, marginTop: 4 }}>17% del total · atribuido a clienteling</div>
            </div>
            <div>
              <div className="lx-stat-label">ROI del programa</div>
              <div className="lx-hero-num-sm tn" style={{ marginTop: 6 }}>3.4<span style={{ fontSize: 24 }}>×</span></div>
              <div className="lx-small" style={{ fontSize: 12, marginTop: 4 }}>Payback <b className="tn">7.2 meses</b></div>
            </div>
            <div>
              <div className="lx-stat-label">Adopción BA nacional</div>
              <div className="lx-hero-num-sm tn" style={{ marginTop: 6 }}>86<span style={{ fontSize: 24 }}>%</span></div>
              <div className="lx-small" style={{ fontSize: 12, marginTop: 4 }}><b className="tn">324 / 378</b> BAs · <b style={{ color:'var(--ok)' }}>+8 pts</b></div>
            </div>
          </div>
        </div>

        {/* ── FINANCIERO ── 6 KPIs */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Financiero</div>
          <span className="lx-eyebrow-sub">Ventas · Growth · Incremental · ROI · Payback · Ticket</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <DKpi tall label="Ventas MTD" value={MXN(42_180_000)}  delta={+9}  spark={[36,37,38,40,41,41,42]} hint="abril 2026" onDrill/>
          <DKpi tall label="Ventas YTD" value={MXN(168_420_000)} delta={+11} spark={[120,128,135,142,150,158,168]} onDrill/>
          <DKpi tall label="Growth YoY" value="+11%" delta={+11} tone="ok" hint="vs. YTD 2025" onDrill/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          <DKpi tall label="Ventas incrementales" value={MXN(28_700_000)} delta={+22} tone="ok" hint="17% del total · vs. base sin perfil" onDrill/>
          <DKpi tall label="ROI del programa"     value="3.4×" delta={+0.4} tone="ok" hint={`Payback 7.2 meses · inv. ${MXN(8_450_000)}`} onDrill/>
          <DKpi tall label="Ticket nacional"      value={MXN(6_410)} delta={+5} hint="con perfil 7 850 · sin perfil 5 680" onDrill/>
        </div>

        {/* ── CLIENTES ── 6 KPIs */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Clientes</div>
          <span className="lx-eyebrow-sub">Base · Growth · VIP · Retención · CLV · Conversión</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <DKpi tall label="Base activa"           value="28,412"  delta={+7}  hint="compra &lt; 180 días" onDrill/>
          <DKpi tall label="Growth base"           value="+18%"    delta={+18} tone="ok" hint="+4,320 clientas vs YE 2025" onDrill/>
          <DKpi tall label="VIP · contribución"    value="18% / 42%" tone="ok" hint="% clientas / % revenue" onDrill/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          <DKpi tall label="Retención 12m"         value="73%"     delta={+3}  hint="meta ≥ 70%" tone="ok" onDrill/>
          <DKpi tall label="CLV promedio"          value={MXN(41_800)} delta={+9} hint="modelo 5 años" onDrill/>
          <DKpi tall label="Conversión 1→2 compra" value="46%"     delta={+6}  hint="dentro de 90 días" onDrill/>
        </div>

        {/* ── PERFORMANCE ── Split marca · Tier · Cadena · Top tiendas · Categorías */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Performance</div>
          <span className="lx-eyebrow-sub">Marca · Tier · Cadena · Top tiendas · Categorías</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12 }}>
          <div className="lx-card-luxe" style={{ padding: 20 }}>
            <div className="lx-micro">Split por marca</div>
            <div style={{ marginTop: 14 }}>
              <DSplit a={101_060_000} b={67_360_000} aLabel="Lancôme" bLabel="YSL" aColor="#B85F63" bColor="#0E0E0F"/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 14, fontSize: 12 }}>
              <span><b className="tn">{MXN(101_060_000)}</b> · Lancôme · <span style={{ color:'var(--ok)' }}>+9%</span></span>
              <span><b className="tn">{MXN(67_360_000)}</b> · YSL · <span style={{ color:'var(--ok)' }}>+14%</span></span>
            </div>
          </div>
          <div className="lx-card-luxe" style={{ padding: 20 }}>
            <div className="lx-micro">Split por cadena</div>
            <div style={{ marginTop: 14 }}>
              <DSplit a={96_000_000} b={72_420_000} aLabel="Liverpool" bLabel="Palacio" aColor="#C9A961" bColor="#0E0E0F"/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 14, fontSize: 12 }}>
              <span><b className="tn">{MXN(96_000_000)}</b> · Liverpool · <span style={{ color:'var(--ok)' }}>+10%</span></span>
              <span><b className="tn">{MXN(72_420_000)}</b> · Palacio · <span style={{ color:'var(--ok)' }}>+12%</span></span>
            </div>
          </div>
        </div>

        <div className="lx-card-luxe" style={{ padding: 20, marginTop: 12 }}>
          <div className="lx-micro">Mix por tier de clienta</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 18, marginTop: 14 }}>
            {[
              ['Icon',       18, 42, '#C9A961'],
              ['Signature',  32, 28, '#B85F63'],
              ['Atelier',    28, 18, '#8B8680'],
              ['Nueva',      22, 12, '#E3DED4'],
            ].map(([t, base, rev, c]) => (
              <div key={t}>
                <div style={{ height: 6, background: c, borderRadius: 999 }}/>
                <div style={{ marginTop: 10 }}>
                  <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 26 }}>{base}%</div>
                  <div className="lx-small" style={{ fontSize: 11 }}><b>{t}</b> · base</div>
                  <div className="lx-small" style={{ fontSize: 10, color:'var(--ink-60)', marginTop: 2 }}>{rev}% del revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lx-card-luxe" style={{ padding: 20, marginTop: 12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <div className="lx-micro">Top tiendas · YTD</div>
            <button className="lx-btn lx-btn--sm">Ver 22 tiendas →</button>
          </div>
          <div style={{ marginTop: 8 }}>
            {[
              ['Liverpool Polanco',    28.4, +14],
              ['Palacio Polanco',      23.7, +11],
              ['Liverpool Perisur',    18.2, +9],
              ['Liverpool Interlomas', 15.9, +6],
              ['Palacio Santa Fe',     12.1, -3],
              ['Liverpool Andares',    11.4, +8],
              ['Palacio Perisur',      10.8, +4],
            ].map(([n, v, yoy], i) => (
              <button key={n} className="lx-card" style={{ display:'grid', gridTemplateColumns:'22px 1.4fr 1fr auto auto', gap: 12, alignItems:'center', padding:'12px 8px', borderBottom:'1px dashed var(--line)', textAlign:'left', width:'100%', background:'transparent', border:'none', borderRadius: 0, cursor:'pointer' }}>
                <span className="lx-num" style={{ fontSize: 11, color:'var(--ink-60)', fontWeight: 600 }}>#{i+1}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{n}</span>
                <LxProgress value={v} max={30}/>
                <span className="lx-num" style={{ fontSize: 12, fontWeight: 600 }}>{MXN(v*1_000_000)}</span>
                <span className="lx-num" style={{ fontSize: 11, fontWeight: 600, color: yoy>=0?'var(--ok)':'var(--err)', minWidth: 40, textAlign:'right' }}>{yoy>=0?'+':''}{yoy}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lx-card-luxe" style={{ padding: 20, marginTop: 12, marginBottom: 28 }}>
          <div className="lx-micro">Top categorías · % del revenue YTD</div>
          <div style={{ marginTop: 12 }}>
            <DBars
              values={[42, 36, 28, 24, 22, 18, 12]}
              labels={['Fragancia','Skincare premium','Base/Teint','Labial','Sérum','Corrector','Set regalo']}
              height={96}
            />
          </div>
        </div>

        {/* ── ADOPCIÓN ── 5 KPIs */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Adopción</div>
          <span className="lx-eyebrow-sub">BAs · Tiendas · Perfiles · Calidad · Cobertura</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          <DKpi tall label="% BAs activos"          value="86%"     delta={+8}  tone="ok" hint="324 / 378" onDrill/>
          <DKpi tall label="Tiendas al 100%"        value="14 / 22" delta={+3}  hint="meta 18 en Q2" onDrill/>
          <DKpi tall label="Perfiles creados YTD"   value="41,280"  delta={+28} onDrill/>
          <DKpi tall label="Calidad de perfiles"    value="82%"     delta={+5}  hint="completitud > 80%" onDrill/>
          <DKpi tall label="Cobertura nacional"     value="68%"     delta={+11} hint="clientela con perfil" onDrill/>
        </div>

        {/* ── OPERACIÓN ── 3 KPIs */}
        <div className="lx-eyebrow">
          <div className="lx-eyebrow-title">Operación</div>
          <span className="lx-eyebrow-sub">Plataforma · flota · inversión</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12 }}>
          <DKpi tall label="Uptime plataforma"     value="99.92%"        hint="SLA 99.5% · sin incidentes P1" tone="ok" onDrill/>
          <DKpi tall label="iPads activos"         value="412 / 430"     hint="96% de flota · 18 fuera de servicio" onDrill/>
          <DKpi tall label="Costos operativos YTD" value={MXN(8_450_000)} delta={+4} hint={`~${MXN(515_244)}/mes · licencias + soporte`} onDrill/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashBA, DashManager, DashSupervisor, DashDirector });
