// Screen: Consultation / Diagnóstico + Catalog + Recommendation builder

function ScreenConsultation() {
  const [step, setStep] = React.useState(2);
  const [skinType, setSkinType] = React.useState('Mixta');
  const [concerns, setConcerns] = React.useState(['Luminosidad','Líneas finas']);
  const [tone, setTone] = React.useState('Medio cálido');
  const toggleConcern = (c) => setConcerns(cs => cs.includes(c) ? cs.filter(x=>x!==c) : [...cs, c]);

  const recs = PRODUCTS.filter(p => p.sku.startsWith('LC-GEN') || p.sku.startsWith('LC-ABS') || p.sku.startsWith('YS-OR'));

  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 340px', gap: 24 }}>
      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 28 }}>
          <div className="lx-micro">Diagnóstico para Ximena Cortázar</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 36, marginTop: 4, letterSpacing:'-0.01em' }}>Diagnóstico de piel</div>
          <div className="lx-small" style={{ fontSize: 13, marginTop: 4 }}>Lectura combinada Lancôme Skin Screen + ModiFace · toma ≈ 3 min</div>

          {/* Stepper */}
          <div style={{ display:'flex', gap: 0, marginTop: 24, background:'var(--bone)', borderRadius: 12, padding: 4 }}>
            {['Tipo de piel','Concerns','Tono','Rutina','Recomendación'].map((l,i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                flex: 1, height: 40, border:'none', borderRadius: 8, cursor:'pointer',
                background: step===i ? '#fff' : 'transparent',
                fontWeight: 600, fontSize: 12, color: step===i?'var(--ink)':'var(--ink-60)',
                boxShadow: step===i ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              }}>{i+1}. {l}</button>
            ))}
          </div>

          {/* Step content */}
          <div style={{ marginTop: 24 }}>
            {step===0 && (
              <div>
                <div className="lx-micro" style={{ marginBottom: 12 }}>Selecciona el tipo dominante</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
                  {['Seca','Normal','Mixta','Grasa'].map(t => (
                    <button key={t} onClick={() => setSkinType(t)} style={{
                      padding:'20px 16px', borderRadius: 12, cursor:'pointer',
                      border: skinType===t ? '2px solid var(--ink)' : '1px solid var(--line)',
                      background:'#fff', textAlign:'left',
                    }}>
                      <div style={{ fontFamily:'var(--f-display)', fontSize: 22 }}>{t}</div>
                      <div className="lx-small" style={{ fontSize: 11, marginTop: 2 }}>
                        {t==='Seca'?'Tirantez, descamación':t==='Normal'?'Equilibrada':t==='Mixta'?'Zona T grasa':'Brillo, poros'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step===1 && (
              <div>
                <div className="lx-micro" style={{ marginBottom: 12 }}>Concerns principales (máx. 3)</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap: 8 }}>
                  {['Luminosidad','Líneas finas','Arrugas profundas','Firmeza','Manchas','Poros','Textura','Hidratación','Ojeras','Rojeces','Sensibilidad','Acné adulto'].map(c => (
                    <button key={c} onClick={() => toggleConcern(c)} style={{
                      height: 36, padding:'0 16px', borderRadius: 999, cursor:'pointer',
                      border: concerns.includes(c) ? '1px solid var(--ink)' : '1px solid var(--line)',
                      background: concerns.includes(c) ? 'var(--ink)' : '#fff',
                      color: concerns.includes(c) ? 'var(--paper)' : 'var(--ink)',
                      fontWeight: 500, fontSize: 13,
                    }}>{c}</button>
                  ))}
                </div>
                <div style={{ marginTop: 20, padding: 16, background:'var(--bone)', borderRadius: 12, display:'flex', alignItems:'center', gap: 14 }}>
                  <I.camera/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>Análisis fotográfico</div>
                    <div className="lx-small" style={{ fontSize:11 }}>Captura con iluminación neutra · se procesa localmente (offline capable)</div>
                  </div>
                  <button className="lx-btn lx-btn--sm">Capturar</button>
                </div>
              </div>
            )}
            {step===2 && (
              <div>
                <div className="lx-micro" style={{ marginBottom: 12 }}>Undertone</div>
                <div style={{ display:'flex', gap: 10 }}>
                  {[
                    ['Muy claro','#F5E0CE'],['Claro','#EFCEB4'],['Medio','#D9AE8B'],['Medio cálido','#C69978'],['Oscuro','#8F5E3D'],['Muy oscuro','#5E3A22'],
                  ].map(([l,color]) => (
                    <button key={l} onClick={() => setTone(l)} style={{
                      flex: 1, padding: 12, borderRadius: 12, cursor:'pointer',
                      border: tone===l ? '2px solid var(--ink)' : '1px solid var(--line)',
                      background:'#fff',
                    }}>
                      <div style={{ width:'100%', height: 48, background: color, borderRadius: 8, marginBottom: 8 }}/>
                      <div className="lx-small" style={{ fontSize:11 }}>{l}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step===3 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
                {[['Mañana',['Limpiador','Sérum','Hidratante','SPF']],['Noche',['Desmaquillante','Tónico','Tratamiento','Crema noche']]].map(([t,steps]) => (
                  <div key={t} className="lx-card-flat" style={{ padding: 16 }}>
                    <div className="lx-micro">{t}</div>
                    {steps.map((s,i) => (
                      <div key={s} style={{ display:'flex', alignItems:'center', gap: 10, padding:'10px 0', borderBottom: i<steps.length-1?'1px dashed var(--line)':'none' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 999, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 11, fontWeight: 600 }}>{i+1}</span>
                        <span style={{ fontSize: 13 }}>{s}</span>
                        <span className="lx-small" style={{ marginLeft:'auto' }}>—</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {step===4 && (
              <div>
                <div className="lx-micro" style={{ marginBottom: 12 }}>Productos sugeridos para Ximena · {skinType} · {concerns.join(', ')}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12 }}>
                  {recs.map(p => (
                    <div key={p.sku} className="lx-card-flat" style={{ padding: 14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
                        <ProductThumb sku={p.sku} size={48}/>
                        <div style={{ minWidth:0 }}>
                          <LxBrandTag brand={p.brand} small/>
                          <div style={{ fontWeight:600, fontSize: 13, marginTop: 4 }}>{p.line}</div>
                        </div>
                      </div>
                      <div className="lx-small" style={{ fontSize: 11, lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 10 }}>
                        <span className="lx-num" style={{ fontSize: 14, fontWeight:600 }}>{MXN(p.price)}</span>
                        <button className="lx-btn lx-btn--sm" style={{ height: 28 }}><I.plus/> Añadir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop: 24, paddingTop: 20, borderTop:'1px solid var(--line)' }}>
            <button className="lx-btn" onClick={() => setStep(Math.max(0, step-1))}><I.arrowL/> Atrás</button>
            <div style={{ display:'flex', gap: 8 }}>
              <button className="lx-btn">Guardar borrador</button>
              <button className="lx-btn lx-btn--primary" onClick={() => setStep(Math.min(4, step+1))}>
                {step===4 ? 'Crear recomendación' : 'Siguiente'} <I.arrowR/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side summary */}
      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Resumen</div>
          <LxKV k="Tipo de piel" v={skinType}/>
          <LxKV k="Concerns" v={`${concerns.length} sel.`}/>
          <LxKV k="Tono" v={tone}/>
          <LxKV k="Productos" v={`${recs.length} sugeridos`}/>
          <LxDivider/>
          <div className="lx-small" style={{ fontSize: 11 }}>
            La sesión se guarda automáticamente en el historial de Ximena, incluso sin conexión.
          </div>
        </div>
        <div className="lx-card" style={{ padding: 20 }}>
          <div className="lx-micro">Integración diagnóstico</div>
          <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background:'var(--warn)' }}/>
            <span style={{ fontSize: 13, fontWeight: 600 }}>ModiFace SDK · sandbox</span>
          </div>
          <div className="lx-small" style={{ marginTop: 4 }}>Switch a modo live cuando HQ lo active.</div>
        </div>
      </div>
    </div>
  );
}

function ScreenCatalog({ onAdd }) {
  const [brand, setBrand] = React.useState('Todas');
  const [cat, setCat]     = React.useState('Todas');
  const [q, setQ] = React.useState('');
  const lock = useBrandLock();
  const filtered = PRODUCTS.filter(p => {
    if (lock && p.brand !== lock) return false;
    if (brand !== 'Todas' && p.brand !== brand) return false;
    if (cat !== 'Todas' && p.attrs.tipo !== cat) return false;
    if (q && !(p.line+p.name+p.sku).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const brandSegItems = lock ? ['Lancôme','YSL'].includes(lock) ? [lock] : ['Todas','Lancôme','YSL'] : ['Todas','Lancôme','YSL'];
  return (
    <div style={{ padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 360px', gap: 24 }}>
      <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
        <div className="lx-card" style={{ padding: 16, display:'flex', gap: 10, alignItems:'center' }}>
          <div style={{ flex: 1, position:'relative' }}>
            <span style={{ position:'absolute', left: 14, top:'50%', transform:'translateY(-50%)', color:'var(--ink-40)' }}><I.search/></span>
            <input className="lx-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar producto, SKU, línea…" style={{ paddingLeft: 42 }}/>
          </div>
          <LxSeg items={brandSegItems} value={lock || brand} onChange={lock ? ()=>{} : setBrand}/>
          <LxSeg items={['Todas','Sérum','Crema','Base','Fragancia','Labial','Corrector']} value={cat} onChange={setCat}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 14 }}>
          {filtered.map(p => (
            <div key={p.sku} className="lx-card" style={{ padding: 16, display:'flex', flexDirection:'column' }}>
              <div style={{ height: 120, borderRadius: 10, background: p.brand==='Lancôme'?'linear-gradient(135deg,#F5E4D7,#E8C4C0)':'linear-gradient(135deg,#0E0E0F,#2a2a2a)',
                color: p.brand==='Lancôme'?'#5a2230':'#C9A961', display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--f-display)', fontSize: 48, letterSpacing:'-0.02em', marginBottom: 12 }}>
                {p.line.charAt(0)}
              </div>
              <LxBrandTag brand={p.brand} small/>
              <div style={{ fontWeight:600, fontSize: 14, marginTop: 6 }}>{p.line}</div>
              <div className="lx-small" style={{ fontSize: 11, marginBottom: 8 }}>{p.name} · {p.size}</div>
              <div style={{ display:'flex', gap: 4, flexWrap:'wrap', marginBottom: 10 }}>
                {(p.attrs.concerns || p.attrs.piel || [p.attrs.familia || p.attrs.tipo].filter(Boolean)).slice(0,3).map(t => <span key={t} className="lx-chip" style={{ height: 20, fontSize: 10, padding:'0 8px' }}>{t}</span>)}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto' }}>
                <div>
                  <div className="lx-num" style={{ fontWeight:600, fontSize: 15 }}>{MXN(p.price)}</div>
                  <div className="lx-small" style={{ fontSize: 10 }}>
                    Stock Polanco: <b style={{ color: (p.stock['st-001']||0) < 5 ? 'var(--err)' : 'var(--ok)' }}>{p.stock['st-001']||0}</b>
                  </div>
                </div>
                <button className="lx-btn lx-btn--sm"><I.plus/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product detail sheet (first product) */}
      <aside className="lx-card" style={{ padding: 20, alignSelf:'start', position:'sticky', top: 20 }}>
        <LxBrandTag brand={filtered[0]?.brand || 'Lancôme'} small/>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 28, marginTop: 8, lineHeight:1.1 }}>{filtered[0]?.line}</div>
        <div className="lx-small" style={{ fontSize: 12 }}>{filtered[0]?.name}</div>
        <div style={{ height: 160, marginTop: 14, borderRadius: 12, background: (filtered[0]?.brand==='Lancôme')?'linear-gradient(135deg,#F5E4D7,#E8C4C0)':'linear-gradient(135deg,#0E0E0F,#2a2a2a)',
          display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-display)', fontSize: 60,
          color: (filtered[0]?.brand==='Lancôme')?'#5a2230':'#C9A961' }}>
          {filtered[0]?.line.charAt(0)}
        </div>
        <div className="lx-num" style={{ fontFamily:'var(--f-display)', fontSize: 30, marginTop: 14 }}>{MXN(filtered[0]?.price || 0)}</div>
        <LxDivider/>
        <div className="lx-micro">Argumentos de venta</div>
        <ul style={{ paddingLeft: 18, margin:'8px 0 12px 0' }}>
          {(filtered[0]?.selling || []).map(s => <li key={s} style={{ fontSize: 12, marginBottom: 4 }}>{s}</li>)}
        </ul>
        <div className="lx-micro">Cómo usar</div>
        <div className="lx-small" style={{ fontSize: 12, marginTop: 4 }}>{filtered[0]?.howTo}</div>
        <LxDivider/>
        <div className="lx-micro">Disponibilidad</div>
        <div style={{ marginTop: 8, display:'flex', flexDirection:'column', gap: 6 }}>
          {Object.entries(filtered[0]?.stock || {}).map(([sid, n]) => (
            <div key={sid} style={{ display:'flex', justifyContent:'space-between', fontSize: 12 }}>
              <span>{getStore(sid)?.name || sid}</span>
              <b style={{ color: n < 5 ? 'var(--err)' : 'var(--ok)' }}>{n} uds</b>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap: 8, marginTop: 16 }}>
          <button className="lx-btn lx-btn--sm" style={{ flex:1 }}><I.pdf/> Ficha técnica</button>
          <button className="lx-btn lx-btn--primary lx-btn--sm" style={{ flex:1 }}><I.plus/> A recomendar</button>
        </div>
      </aside>
    </div>
  );
}

Object.assign(window, { ScreenConsultation, ScreenCatalog });
