// Screen: Client list + New client form

// Segment chip colors map
const SEGMENT_TONE = {
  VIP:       { bg:'#1F2A24', fg:'#E9D6A6', label:'VIP' },
  Recurrent: { bg:'#E6EEE7', fg:'#1F7A5A', label:'Recurrente' },
  New:       { bg:'#FFF1DE', fg:'#9F6A18', label:'Nueva' },
  AtRisk:    { bg:'#FBE6E2', fg:'#A23A2E', label:'En riesgo' },
};

function ClientListRow({ c, onOpen }) {
  const brandTone = c.brands[0] === 'Lancôme' ? 'lancome' : 'ysl';
  const seg = clientSegment(c);
  const segTone = SEGMENT_TONE[seg] || SEGMENT_TONE.New;
  return (
    <div onClick={() => onOpen(c.id)} style={{
      display:'grid', gridTemplateColumns:'44px 1.8fr 1fr 1.1fr 1fr 1fr 30px',
      alignItems:'center', gap: 16, padding:'14px 20px', borderBottom:'1px solid var(--line)',
      cursor:'pointer', transition:'background .15s',
    }} onMouseEnter={e=>e.currentTarget.style.background='var(--bone)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <LxAvatar label={c.initials} tone={brandTone} size={40}/>
      <div style={{ minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:14 }}>{c.name}</div>
        <div className="lx-small" style={{ fontSize: 11.5, color:'var(--ink-60)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.email || '—'}</div>
      </div>
      <div className="lx-num" style={{ fontSize: 13, color:'var(--ink-80)' }}>{c.phone || '—'}</div>
      <span style={{
        display:'inline-flex', alignItems:'center', gap: 6,
        height: 26, padding:'0 10px', borderRadius: 999,
        background: segTone.bg, color: segTone.fg,
        fontSize: 11, fontWeight: 600, letterSpacing:'0.02em',
        width:'fit-content',
      }}>● {segTone.label}</span>
      <div className="lx-num" style={{ fontSize: 14, fontWeight: 500 }}>{MXN(c.stats.ltv)}</div>
      <div className="lx-small" style={{ fontSize: 12 }}>{fmtRel(c.lastVisit)}</div>
      <I.arrowR/>
    </div>
  );
}

function ScreenClients({ onOpenClient, onNav, brandContext }) {
  const { t } = useI18n();
  const lock = useBrandLock();
  const [q, setQ] = React.useState('');
  const [seg, setSeg] = React.useState('Todas');
  // Scope por marca de la BA — sólo mostrar clientas que tienen al menos una
  // marca compatible con el brand lock activo.
  const inBrandScope = (c) => !lock || (Array.isArray(c.brands) && c.brands.includes(lock));
  const filtered = CLIENTS.filter(c => {
    if (!inBrandScope(c)) return false;
    if (q) {
      const needle = q.toLowerCase();
      const hay = (c.name + ' ' + (c.email||'') + ' ' + (c.phone||'')).toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (seg !== 'Todas') {
      const cs = clientSegment(c);
      if (cs !== seg) return false;
    }
    return true;
  });
  // Counts per segment — también respetan el scope de marca.
  const inScope = CLIENTS.filter(inBrandScope);
  const counts = inScope.reduce((a,c) => { const s = clientSegment(c); a[s]=(a[s]||0)+1; return a; }, {});
  return (
    <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap: 16 }}>
      {/* Search + new */}
      <div className="lx-card-luxe" style={{ padding: 16, display:'flex', gap: 10, alignItems:'center' }}>
        <div style={{ flex: 1, position:'relative' }}>
          <span style={{ position:'absolute', left: 16, top:'50%', transform:'translateY(-50%)', color:'var(--ink-40)' }}><I.search size={20}/></span>
          <input className="lx-input" value={q} onChange={e=>setQ(e.target.value)}
            placeholder={t('clients.search')}
            style={{ paddingLeft: 48, height: 52, fontSize: 16, border:'none', background:'var(--bone)' }}/>
        </div>
        <button className="lx-btn lx-btn--primary" style={{ height: 52, padding:'0 20px' }} onClick={() => onNav && onNav('new')}><I.plus/> {t('clients.new')}</button>
      </div>

      {/* Real segment filters from clientSegment() */}
      <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
        <span className="lx-micro" style={{ marginRight: 4 }}>{t('clients.col.segment')}</span>
        {[
          { id:'Todas',     label: t('clients.segment.all'),       count: inScope.length,      tone:{ bg:'var(--bone)', fg:'var(--ink)' } },
          { id:'VIP',       label: t('clients.segment.vip'),       count: counts.VIP||0,       tone: SEGMENT_TONE.VIP },
          { id:'Recurrent', label: t('clients.segment.recurrent'), count: counts.Recurrent||0, tone: SEGMENT_TONE.Recurrent },
          { id:'New',       label: t('clients.segment.new'),       count: counts.New||0,       tone: SEGMENT_TONE.New },
          { id:'AtRisk',    label: t('clients.segment.atRisk'),    count: counts.AtRisk||0,    tone: SEGMENT_TONE.AtRisk },
        ].map(opt => (
          <button key={opt.id} onClick={() => setSeg(opt.id)}
            style={{
              display:'inline-flex', alignItems:'center', gap: 6,
              height: 30, padding:'0 12px', borderRadius: 999,
              background: seg === opt.id ? opt.tone.bg : '#fff',
              color:      seg === opt.id ? opt.tone.fg : 'var(--ink-60)',
              border: '1px solid ' + (seg === opt.id ? 'transparent' : 'var(--line)'),
              fontSize: 12, fontWeight: 600, letterSpacing:'0.01em', cursor:'pointer',
            }}>
            {opt.label}
            <span style={{ opacity: 0.7, fontWeight: 500 }}>· {opt.count}</span>
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <span className="lx-small">{t('clients.count', { n: filtered.length, total: inScope.length })}</span>
        <button className="lx-btn lx-btn--sm"><I.download/> {t('clients.export')}</button>
      </div>

      {/* List */}
      <div className="lx-card" style={{ padding: 0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'44px 1.8fr 1fr 1.1fr 1fr 1fr 30px', gap: 16, padding: '12px 20px', background:'var(--bone)', borderBottom: '1px solid var(--line)' }}>
          <span/>
          <span className="lx-micro">{t('clients.col.client')}</span>
          <span className="lx-micro">{t('clients.col.phone')}</span>
          <span className="lx-micro">{t('clients.col.segment')}</span>
          <span className="lx-micro">{t('clients.col.ltv')}</span>
          <span className="lx-micro">{t('clients.col.lastVisit')}</span>
          <span/>
        </div>
        {filtered.map(c => <ClientListRow key={c.id} c={c} onOpen={onOpenClient}/>)}
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign:'center', color:'var(--ink-60)' }}>
            <div className="lx-small">No hay clientas que coincidan con esta búsqueda o segmento.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScreenNewClient({ onNav }) {
  const { t } = useI18n();
  const [step, setStep] = React.useState(1);
  const [consents, setConsents] = React.useState({ SMS: true, Email: true, WhatsApp: false });
  const [gender, setGender] = React.useState('Femenino');
  const [skin, setSkin] = React.useState('Normal');
  const [routine, setRoutine] = React.useState('Básica');
  const [routineTiming, setRoutineTiming] = React.useState(new Set(['morning']));
  const toggleRoutineTiming = (id) => setRoutineTiming((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const [concerns, setConcerns] = React.useState(new Set(['Hidratación']));
  const [fragrance, setFragrance] = React.useState('Sin preferencia');
  const [ageRange, setAgeRange] = React.useState('');
  const brand = (window.CURRENT_BA?.brands && window.CURRENT_BA.brands[0]) || 'Lancôme';
  const toggleConcern = (c) => setConcerns(s => { const n = new Set(s); n.has(c)?n.delete(c):n.add(c); return n; });

  // Form fields
  const [first, setFirst] = React.useState('');
  const [last,  setLast]  = React.useState('');
  const [dialCode, setDialCode] = React.useState('+52');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [bday,  setBday]  = React.useState('');
  const [allergies, setAllergies] = React.useState('');
  const [interests, setInterests] = React.useState(new Set(['Skincare']));
  const [acceptPrivacy, setAcceptPrivacy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [err, setErr] = React.useState('');
  const toggleInterest = (i) => setInterests(s => { const n = new Set(s); n.has(i)?n.delete(i):n.add(i); return n; });

  const steps = [
    { n:1, l: t('capture.step.basic') },
    { n:2, l: t('capture.step.interests') },
    { n:3, l: t('capture.step.privacy') },
  ];

  const INCOMPLETE_MSG = 'Completa todos los datos antes de continuar';

  const goNext = () => {
    if (step === 1) {
      if (!first.trim() || !last.trim() || !phone.trim() || !email.trim() || !bday.trim() || !ageRange) {
        setErr(INCOMPLETE_MSG);
        return;
      }
      if (!/^\d{10,}$/.test(phone.replace(/\D/g,''))) {
        setErr('El teléfono debe tener al menos 10 dígitos');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErr('Revisa el correo electrónico — formato inválido');
        return;
      }
    }
    if (step === 2) {
      if (!skin || interests.size === 0 || !routine || routineTiming.size === 0 || !allergies.trim()) {
        setErr(INCOMPLETE_MSG);
        return;
      }
    }
    setErr('');
    setStep(Math.min(3, step+1));
  };

  const handleSave = () => {
    if (!acceptPrivacy) {
      setErr('Debes aceptar el aviso de privacidad para continuar.');
      return;
    }
    setErr('');

    const fullName = `${first.trim()} ${last.trim()}`;
    const initials = (first.trim()[0] || '') + (last.trim()[0] || '');
    const id = 'cl-new-' + Date.now().toString(36);
    const today = new Date().toISOString().slice(0,10);
    const year = String(new Date().getFullYear());
    // Allergies: convertir el string a array (o array vacío si "ninguna")
    const allergiesStr = allergies.trim();
    const allergiesArr = (!allergiesStr || /^ningun[ao]s?$/i.test(allergiesStr))
      ? []
      : allergiesStr.split(',').map((s) => s.trim()).filter(Boolean);
    const baBrands = (window.CURRENT_BA?.brands && window.CURRENT_BA.brands.length)
      ? window.CURRENT_BA.brands.slice()
      : ['Lancôme'];
    const newClient = {
      id,
      name: fullName,
      initials: initials.toUpperCase(),
      tier: 'Atelier',                   // tier inicial real de Luxe Circle
      brands: baBrands,                  // marcas que la BA puede atender
      lastVisit: today,
      since: year,                       // año como en clientes existentes
      city: 'CDMX',
      age: (window.calcAge && window.calcAge(bday)) || 0,
      ageRange,
      gender,
      phone: `${dialCode} ${phone.trim()}`,
      email: email.trim(),
      birthday: bday,
      preferredLang: 'es',
      skin: { type: skin, concerns: [...concerns], tone: '—' },
      allergies: allergiesArr,           // array, no string (el perfil hace .map sobre esto)
      affinities: [],                    // el perfil mapea esto — debe existir
      loyalty: { name: 'Luxe Circle', tier: 'Atelier', points: 0, toNext: 10000 },
      fragrance,
      routine,
      routineTiming: [...routineTiming],
      interests: [...interests],
      stats: { ltv: 0, avgTicket: 0, visits: 0, lastPurchase: null, samplesGiven: 0 },
      tags: ['Nueva'],
      notes: 'Alta nueva por BA · ' + window.CURRENT_BA?.name,
      createdBy: window.CURRENT_BA?.id,
      createdAt: new Date().toISOString(),
    };

    // Persist to runtime database
    if (Array.isArray(window.CLIENTS)) {
      window.CLIENTS.unshift(newClient);
    }

    // Persist consents
    if (Array.isArray(window.CONSENTS)) {
      Object.entries(consents).forEach(([channel, granted]) => {
        window.CONSENTS.push({
          clientId: id,
          channel,
          status: granted ? 'granted' : 'revoked',
          at: new Date().toISOString(),
          version: window.PRIVACY_NOTICE_VERSION || 'v1',
          baId: window.CURRENT_BA?.id,
          storeId: window.CURRENT_BA?.storeId,
        });
      });
    }

    // Persist a localStorage para que el cliente sobreviva al refresh.
    if (window.LxState) window.LxState.saveAll();

    setSaved(true);
  };

  // Success toast
  if (saved) {
    return (
      <div style={{ padding:'48px 40px', maxWidth: 720, margin:'0 auto' }}>
        <div className="lx-card-luxe" style={{ padding: 40, textAlign:'center', background:'var(--ok-08)', borderColor:'var(--ok-20)' }}>
          <div style={{ width: 64, height: 64, borderRadius:'50%', background:'var(--ok)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <I.check size={32}/>
          </div>
          <div className="lx-micro" style={{ color:'var(--ok)' }}>Clienta guardada</div>
          <div style={{ fontFamily:'var(--f-display)', fontSize: 32, letterSpacing:'-0.01em', marginTop: 6 }}>
            {first} {last}
          </div>
          <div className="lx-small" style={{ marginTop: 8 }}>
            Perfil creado · {brand} · {skin} · {concerns.size} preocupaciones · consentimientos registrados.
          </div>
          <div style={{ display:'flex', gap: 12, justifyContent:'center', marginTop: 28 }}>
            <button className="lx-btn" onClick={() => { setSaved(false); setStep(1); setFirst(''); setLast(''); setPhone(''); setEmail(''); setBday(''); setAllergies(''); setConcerns(new Set()); }}>
              <I.plus/> Otra alta
            </button>
            <button className="lx-btn lx-btn--primary" onClick={() => onNav && onNav('clients')}>
              Ver en mi cartera <I.arrowR/>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'32px 40px', maxWidth: 880, margin:'0 auto' }}>
      {/* Header + 3-step indicator */}
      <div className="lx-eyebrow">
        <div>
          <div className="lx-micro">{t('clients.new')}</div>
          <div className="lx-eyebrow-title" style={{ fontSize: 28 }}>
            Alta en <span style={{ fontStyle:'italic' }}>3 pasos</span>
          </div>
        </div>
        <div className="lx-steps">
          {steps.map((s,i) => (
            <React.Fragment key={s.n}>
              <div className={`lx-step ${step===s.n?'lx-step--active':''} ${s.n<step?'lx-step--done':''}`}>
                <span className="lx-step-num">{s.n<step?'✓':s.n}</span>
                <span>{s.l}</span>
              </div>
              {i<steps.length-1 && <span className="lx-step-bar"/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {err && (
        <div className="lx-card" style={{ padding: 12, marginBottom: 14, background:'var(--err-08)', borderColor:'var(--err-20)', color:'var(--err)', fontSize: 13 }}>
          {err}
        </div>
      )}

      <div className="lx-card-luxe" style={{ padding: 32 }}>
        {step===1 && <>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 20 }}>
            <div>
              <div className="lx-micro">Paso 1 · Identidad</div>
              <div style={{ fontFamily:'var(--f-display)', fontSize: 30, letterSpacing:'-0.01em', marginTop: 4 }}>¿A quién vamos a consentir?</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
            <div><div className="lx-micro" style={{ marginBottom: 6 }}>{t('capture.firstName')} *</div><input className="lx-input" placeholder="María Fernanda" autoFocus value={first} onChange={e=>setFirst(e.target.value)}/></div>
            <div><div className="lx-micro" style={{ marginBottom: 6 }}>{t('capture.lastName')} *</div><input className="lx-input" placeholder="González Ruíz" value={last} onChange={e=>setLast(e.target.value)}/></div>
            <div>
              <div className="lx-micro" style={{ marginBottom: 6 }}>{t('capture.phone')} *</div>
              <div style={{ display:'flex', gap: 6 }}>
                <select className="lx-input" value={dialCode} onChange={(e) => setDialCode(e.target.value)}
                  style={{ width: 120, flex:'0 0 120px', paddingRight: 8, cursor:'pointer' }}>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+51">🇵🇪 +51</option>
                  <option value="+58">🇻🇪 +58</option>
                  <option value="+593">🇪🇨 +593</option>
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>
                <input className="lx-input" type="tel" inputMode="numeric" pattern="[0-9]*"
                  placeholder="55 1234 5678" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))}
                  style={{ flex: 1 }}/>
              </div>
            </div>
            <div><div className="lx-micro" style={{ marginBottom: 6 }}>{t('capture.email')} *</div><input className="lx-input" type="email" placeholder="maria@correo.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
            <div><div className="lx-micro" style={{ marginBottom: 6 }}>{t('capture.birthdate')} *</div><input className="lx-input" type="date" max={new Date().toISOString().slice(0,10)} value={bday} onChange={e=>setBday(e.target.value)}/></div>
            <div>
              <div className="lx-micro" style={{ marginBottom: 6 }}>{t('capture.gender')} *</div>
              <div style={{ display:'flex', gap: 8 }}>
                {[
                  ['Femenino',          t('capture.gender.f')],
                  ['Masculino',         t('capture.gender.m')],
                  ['No binario',        t('capture.gender.x')],
                  ['Prefiero no decir', t('capture.gender.np')],
                ].map(([g, label]) => (
                  <button key={g} onClick={()=>setGender(g)}
                    className="lx-btn lx-btn--sm"
                    style={{
                      flex:1,
                      background: gender===g?'var(--ink)':'#fff',
                      color: gender===g?'#fff':'var(--ink)',
                      borderColor: gender===g?'var(--ink)':'var(--line)',
                      fontSize: 11.5, padding:'0 6px',
                    }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="lx-micro" style={{ marginBottom: 6 }}>{t('capture.ageRange')} *</div>
            <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
              {['18–24','25–34','35–44','45–54','55–64','65+'].map(r => (
                <button key={r} onClick={()=>setAgeRange(r)}
                  className="lx-btn lx-btn--sm"
                  style={{
                    flex:'1 1 0', minWidth: 80,
                    background: ageRange===r?'var(--ink)':'#fff',
                    color: ageRange===r?'#fff':'var(--ink)',
                    borderColor: ageRange===r?'var(--ink)':'var(--line)',
                    fontSize: 12.5, padding:'0 10px',
                  }}>{r}</button>
              ))}
            </div>
          </div>
          <div className="lx-small" style={{ marginTop: 16, color:'var(--ink-60)' }}>
            Todos los campos son obligatorios. La validación ocurre al pasar al siguiente paso.
          </div>
        </>}

        {step===2 && <>
          <div style={{ marginBottom: 20 }}>
            <div className="lx-micro">Paso 2 · Perfil de belleza</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 30, letterSpacing:'-0.01em', marginTop: 4 }}>Esencial para recomendar bien</div>
          </div>

          <div className="lx-micro" style={{ marginBottom: 10 }}>Tipo de piel *</div>
          <div style={{ display:'flex', gap: 8, marginBottom: 20, flexWrap:'wrap' }}>
            {['Normal','Seca','Mixta','Grasa','Sensible','Madura'].map(s => (
              <button key={s} onClick={()=>setSkin(s)}
                className="lx-chip"
                style={{
                  cursor:'pointer', height: 34, padding:'0 14px',
                  background: skin===s?'var(--ink)':'var(--bone)',
                  color: skin===s?'#fff':'var(--ink)',
                  borderColor: skin===s?'var(--ink)':'var(--line)',
                }}>{s}</button>
            ))}
          </div>

          <div className="lx-micro" style={{ marginBottom: 10 }}>Intereses de belleza * · elige al menos una</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { cat:'Skincare',   items:['Hidratación','Antiedad','Luminosidad','Manchas','Acné','Poros'] },
              { cat:'Maquillaje', items:['Labial','Base','Ojos','Cejas','Rubor','Iluminador'] },
              { cat:'Fragancia',  items:['Floral','Oriental','Amaderada','Cítrica','Gourmand','Almizclada'] },
            ].map(group => (
              <div key={group.cat} style={{ padding: 12, background:'var(--bone)', borderRadius: 10 }}>
                <div className="lx-micro" style={{ marginBottom: 8 }}>{group.cat}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                  {group.items.map(it => (
                    <button key={it} onClick={()=>toggleInterest(it)}
                      className="lx-chip"
                      style={{
                        cursor:'pointer', height: 28, padding:'0 10px', fontSize: 11.5,
                        background: interests.has(it)?'var(--ink)':'#fff',
                        color: interests.has(it)?'#fff':'var(--ink)',
                        borderColor: interests.has(it)?'var(--ink)':'var(--line)',
                      }}>{it}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rutina — momento (multiselect) + nivel (single) — RF-05 */}
          <div className="lx-micro" style={{ marginBottom: 10 }}>Rutina actual *</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div style={{ padding: 12, background:'var(--bone)', borderRadius: 10 }}>
              <div className="lx-small" style={{ marginBottom: 8, fontSize: 11.5 }}>
                ¿Cuándo aplica su rutina? · elige una o varias
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                {[
                  ['morning', '🌅 Mañana'],
                  ['evening', '🌙 Noche'],
                  ['event',   '✨ Solo en eventos'],
                ].map(([id, label]) => {
                  const active = routineTiming.has(id);
                  return (
                    <button key={id} onClick={() => toggleRoutineTiming(id)}
                      className="lx-chip"
                      style={{
                        cursor:'pointer', height: 32, padding:'0 12px', fontSize: 12,
                        background: active ? 'var(--ink)' : '#fff',
                        color:      active ? '#fff' : 'var(--ink)',
                        borderColor: active ? 'var(--ink)' : 'var(--line)',
                      }}>{label}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: 12, background:'var(--bone)', borderRadius: 10 }}>
              <div className="lx-small" style={{ marginBottom: 8, fontSize: 11.5 }}>
                Nivel de elaboración
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
                {[
                  ['Ninguna',     'Sin rutina'],
                  ['Básica',      'Básica · 2-3 pasos'],
                  ['Intermedia',  'Intermedia · 4-5'],
                  ['Avanzada',    'Avanzada · 6+'],
                  ['Profesional', 'Profesional'],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => setRoutine(id)} className="lx-chip"
                    style={{
                      cursor:'pointer', height: 32, padding:'0 12px', fontSize: 12,
                      background: routine===id ? 'var(--ink)' : '#fff',
                      color:      routine===id ? '#fff' : 'var(--ink)',
                      borderColor: routine===id ? 'var(--ink)' : 'var(--line)',
                    }}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background:'var(--bone)', border:'1px solid var(--line)', display:'flex', gap: 10, alignItems:'flex-start' }}>
            <span style={{ color:'var(--ink-60)' }}><I.warning size={16}/></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Alergias conocidas *</div>
              <input className="lx-input" style={{ marginTop: 8, background:'#fff' }} placeholder="p.ej. fragancia, parabenos, níquel… o escribe “ninguna”" value={allergies} onChange={e=>setAllergies(e.target.value)}/>
            </div>
          </div>
        </>}

        {step===3 && <>
          <div style={{ marginBottom: 20 }}>
            <div className="lx-micro">Paso 3 · Aviso de privacidad</div>
            <div style={{ fontFamily:'var(--f-display)', fontSize: 30, letterSpacing:'-0.01em', marginTop: 4 }}>Consentimiento y aviso</div>
            <div className="lx-small" style={{ marginTop: 6 }}>
              Versión vigente · <b>{PRIVACY_NOTICE_VERSION}</b> · La clienta puede revocar cualquier canal en cualquier momento.
            </div>
          </div>

          {/* Privacy notice block */}
          <div className="lx-card" style={{ padding: 18, background:'#fff', maxHeight: 220, overflow:'auto', marginBottom: 18, fontSize: 12.5, lineHeight: 1.6, color:'var(--ink-80)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Aviso de privacidad simplificado · L'Oréal Luxe México</div>
            <p style={{ margin:'0 0 8px' }}>L'Oréal México, S.A. de C.V. (“L'Oréal”), con domicilio en Av. Paseo de la Reforma, Ciudad de México, es responsable del tratamiento de tus datos personales conforme a la LFPDPPP.</p>
            <p style={{ margin:'0 0 8px' }}><b>Datos recabados:</b> nombre, contacto, fecha de nacimiento, género, preferencias de belleza, historial de compras y comunicaciones.</p>
            <p style={{ margin:'0 0 8px' }}><b>Finalidades:</b> brindar atención personalizada de clienteling, recomendar productos, registrar consentimientos, y enviar comunicaciones por los canales que autorices.</p>
            <p style={{ margin:'0 0 8px' }}><b>Transferencias:</b> a empresas del Grupo L'Oréal y proveedores técnicos bajo contrato; nunca a terceros con fines comerciales sin consentimiento adicional.</p>
            <p style={{ margin:'0' }}><b>Derechos ARCO:</b> Acceso, Rectificación, Cancelación u Oposición en privacidad.mx@loreal.com.</p>
          </div>

          <div className="lx-micro" style={{ marginBottom: 10 }}>Canales de comunicación autorizados</div>
          {['SMS','Email','WhatsApp'].map(ch => (
            <div key={ch} style={{ display:'flex', alignItems:'center', gap: 14, padding:'14px 0', borderBottom:'1px solid var(--line)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background:'var(--bone)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {ch==='SMS' ? <I.sms/> : ch==='Email' ? <I.email/> : <I.whatsapp/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ch}</div>
                <div className="lx-small" style={{ fontSize: 12 }}>Comunicaciones comerciales por {ch}</div>
              </div>
              <button onClick={() => setConsents(c => ({ ...c, [ch]: !c[ch] }))}
                style={{
                  width: 48, height: 28, borderRadius: 999, border: 'none', cursor:'pointer',
                  background: consents[ch] ? 'var(--ink)' : 'var(--ink-12)',
                  position:'relative', transition:'background .2s',
                }}>
                <span style={{ position:'absolute', top: 3, left: consents[ch] ? 23 : 3, width: 22, height: 22, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
              </button>
            </div>
          ))}

          {/* Explicit acceptance checkbox */}
          <label style={{ display:'flex', alignItems:'flex-start', gap: 12, marginTop: 18, padding: 14, borderRadius: 10, background: acceptPrivacy?'var(--ok-08)':'var(--bone)', border: '1px solid '+(acceptPrivacy?'var(--ok-20)':'var(--line)'), cursor:'pointer' }}>
            <input type="checkbox" checked={acceptPrivacy} onChange={e=>setAcceptPrivacy(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>He leído y acepto el aviso de privacidad *</div>
              <div className="lx-small" style={{ fontSize: 11.5, marginTop: 4 }}>
                Confirmo que la clienta ha sido informada y otorga su consentimiento expreso para el tratamiento de sus datos personales bajo el aviso versión <b>{PRIVACY_NOTICE_VERSION}</b>.
              </div>
            </div>
          </label>

          <div style={{ marginTop: 20, padding: 16, background:'var(--bone)', borderRadius: 12 }}>
            <div className="lx-micro">Registro legal (automático al guardar)</div>
            <div className="lx-small" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.55 }}>
              Marca temporal UTC · IP del dispositivo · versión del aviso <b>{PRIVACY_NOTICE_VERSION}</b> · ubicación <b>{getStore('st-001').name}</b> · BA <b>{window.CURRENT_BA.name}</b>.
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 16, background:'var(--bone)', borderRadius: 12 }}>
            <div className="lx-micro">Resumen para guardar</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10, marginTop: 8, fontSize: 12 }}>
              <div><span className="lx-small">Nombre</span><div style={{ fontWeight: 600 }}>{first || '—'} {last}</div></div>
              <div><span className="lx-small">Teléfono</span><div style={{ fontWeight: 600 }} className="tn">{phone || '—'}</div></div>
              <div><span className="lx-small">Marca</span><div style={{ fontWeight: 600 }}>{brand}</div></div>
              <div><span className="lx-small">Piel</span><div style={{ fontWeight: 600 }}>{skin}</div></div>
              <div><span className="lx-small">Preocupaciones</span><div style={{ fontWeight: 600 }}>{concerns.size}</div></div>
              <div><span className="lx-small">Canales activos</span><div style={{ fontWeight: 600 }}>{Object.entries(consents).filter(([,v])=>v).map(([k])=>k).join(' · ') || 'Ninguno'}</div></div>
            </div>
          </div>
        </>}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 28, paddingTop: 20, borderTop:'1px solid var(--line)' }}>
          <button className="lx-btn" onClick={() => setStep(Math.max(1, step-1))} disabled={step===1}>
            <I.arrowL/> Atrás
          </button>
          <div className="lx-small" style={{ color:'var(--ink-60)' }}>
            Paso <b className="tn">{step}</b> de 3
          </div>
          <button className="lx-btn lx-btn--primary lx-btn--lg" onClick={() => {
            if (step === 3) handleSave();
            else goNext();
          }}>
            {step===3?'Guardar clienta':'Continuar'} <I.arrowR/>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenClients, ScreenNewClient });
