// Shared UI primitives for L'Oréal Luxe Clienteling
// Icons are simple inline SVG (stroke). Exposed to window for cross-script use.

// ───── Icons ─────
const I = {
  search: (p={}) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  home:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/></svg>,
  user:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
  users:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 20c0-2.8 2-5 4.5-5"/></svg>,
  cal:     (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  bag:     (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>,
  sparkle: (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>,
  chart:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 20V6M10 20v-8M16 20v-4M22 20H2"/></svg>,
  msg:     (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 5h16v12H8l-4 3z"/></svg>,
  gift:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="8" width="18" height="5" rx="1"/><path d="M4 13v8h16v-8M12 8v13M8 8a2 2 0 1 1 2-2c0 2 0 2 0 2zM16 8a2 2 0 1 0-2-2c0 2 0 2 0 2z"/></svg>,
  device:  (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="18" r="0.5" fill="currentColor"/></svg>,
  ticket:  (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M10 7v2M10 11v2M10 15v2"/></svg>,
  cloud:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 18a5 5 0 0 1-.5-9.97A6 6 0 0 1 18 9.3 4.5 4.5 0 0 1 17.5 18z"/></svg>,
  plug:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 2v4M15 2v4M7 6h10v6a5 5 0 0 1-10 0zM12 17v5"/></svg>,
  download:(p={}) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16"/></svg>,
  plus:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  arrowR:  (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14m-6-6 6 6-6 6"/></svg>,
  arrowL:  (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5m6-6-6 6 6 6"/></svg>,
  bell:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/></svg>,
  check:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12 5 5L20 7"/></svg>,
  x:       (p={}) => <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  more:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="currentColor" {...p}><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>,
  chevR:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 6 15 12 9 18"/></svg>,
  power:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 5a7 7 0 1 0 6 0"/><path d="M12 3v9"/></svg>,
  chevD:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="6 9 12 15 18 9"/></svg>,
  shield:  (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6z"/></svg>,
  heart:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>,
  star:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="currentColor" {...p}><path d="m12 2 3 7h7l-5.5 4.5L18.5 21 12 16.8 5.5 21l2-7.5L2 9h7z"/></svg>,
  wifi:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" {...p}><path d="M5 12a10 10 0 0 1 14 0M8 15a6 6 0 0 1 8 0M11 18l1 1 1-1"/></svg>,
  offline: (p={}) => <svg viewBox="0 0 24 24" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" {...p}><path d="M5 12a10 10 0 0 1 14 0M4 4l16 16"/></svg>,
  filter:  (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 5h18l-7 9v5l-4 1v-6z"/></svg>,
  scan:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3M4 12h16"/></svg>,
  excel:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8l6 8M15 8l-6 8"/></svg>,
  pdf:     (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 13h2a1.5 1.5 0 0 1 0 3H9v-3zm0 0v4M15 13v4M14 15h2"/></svg>,
  camera:  (p={}) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  whatsapp:(p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="currentColor" {...p}><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2zm5.5 14.2c-.2.6-1.2 1.2-1.7 1.3-.5.1-1.1.1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6s.6-1.8.8-2.1c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5l-.3.4c-.1.1-.3.3-.4.4-.1.1-.3.3-.1.6.2.4.8 1.3 1.7 2.2 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.8-.9.9-1.2.2-.3.3-.2.6-.1.2.1 1.5.7 1.8.9.3.1.4.2.5.3.1.1.1.6-.1 1.2z"/></svg>,
  email:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
  sms:     (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12a8 8 0 0 1-12 7l-5 2 2-5a8 8 0 1 1 15-4z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></svg>,
  warning: (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18v.01"/></svg>,
  lock:    (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>,
  trash:   (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/></svg>,
  eye:     (p={}) => <svg viewBox="0 0 24 24" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  logoOreal: (p={}) => <svg viewBox="0 0 80 14" width={p.w||56} height={p.h||10} {...p}><text x="0" y="11" fontFamily="Manrope, sans-serif" fontWeight="700" fontSize="12" letterSpacing="0.18em" fill="currentColor">L'ORÉAL</text></svg>,
};

// Monogram-style avatar
function LxAvatar({ label, size=40, tone }) {
  const bg = tone === 'lancome' ? 'var(--lancome-rose)' : tone === 'ysl' ? '#000' : 'var(--bone-2)';
  const fg = tone === 'ysl' ? 'var(--ysl-gold)' : 'var(--ink)';
  return (
    <div className="lx-avatar" style={{ width:size, height:size, background:bg, color:fg, fontSize: size*0.36 }}>
      {label}
    </div>
  );
}

// Brand lock context — when set to a brand name, hides any chip/tag for OTHER brands.
// Used to scope a BA profile to a single house (e.g. Lancôme-only BA).
const BrandLockContext = React.createContext(null);
function useBrandLock() { return React.useContext(BrandLockContext); }

function LxBrandTag({ brand, small }) {
  const lock = useBrandLock();
  if (lock && brand !== lock) return null;
  if (brand === 'Lancôme') return <span className="lx-chip lx-chip--lancome" style={{ height: small ? 22 : 26, fontSize: small ? 10.5 : 11, letterSpacing: '0.14em', textTransform:'uppercase', fontWeight:600 }}>Lancôme</span>;
  if (brand === 'YSL')     return <span className="lx-chip lx-chip--ysl" style={{ height: small ? 22 : 26, fontSize: small ? 10.5 : 11, letterSpacing: '0.22em', textTransform:'uppercase', fontWeight:700 }}>YSL</span>;
  return <span className="lx-chip">{brand}</span>;
}

function LxDivider({ dashed }) {
  return <hr style={{ border:0, borderTop: `1px ${dashed?'dashed':'solid'} var(--line)`, margin:'12px 0' }} />;
}

function LxStat({ label, value, delta, hint, big }) {
  return (
    <div>
      <div className="lx-stat-label">{label}</div>
      <div className="lx-stat-value lx-num" style={big ? { fontSize: 44 } : null}>{value}</div>
      {(delta || hint) && <div className="lx-small" style={{ marginTop: 4 }}>
        {delta && <span style={{ color: delta > 0 ? 'var(--ok)' : 'var(--err)', fontWeight:600, marginRight:6 }}>{delta>0?'▲':'▼'} {Math.abs(delta)}%</span>}
        {hint}
      </div>}
    </div>
  );
}

// Sparkline — tiny inline chart
function LxSpark({ values, width=100, height=28, color='var(--ink)' }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v,i) => `${i*step},${height - ((v-min)/range)*height}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      <circle cx={(values.length-1)*step} cy={height - ((values[values.length-1]-min)/range)*height} r="2" fill={color}/>
    </svg>
  );
}

// Progress bar
function LxProgress({ value, max=1, color='var(--ink)' }) {
  const pct = Math.max(0, Math.min(1, value/max));
  return (
    <div style={{ height: 4, background: 'var(--ink-08)', borderRadius: 999, overflow:'hidden' }}>
      <div style={{ height: '100%', width: `${pct*100}%`, background: color, transition: 'width .5s var(--ease)' }}/>
    </div>
  );
}

// Segmented control
function LxSeg({ items, value, onChange }) {
  return (
    <div style={{ display:'inline-flex', background:'var(--bone)', borderRadius: 999, padding: 3, border:'1px solid var(--line)' }}>
      {items.map(it => (
        <button key={it.value||it} onClick={() => onChange(it.value||it)}
          className="lx-btn lx-btn--sm"
          style={{
            height: 28, padding: '0 14px', borderRadius: 999, border:'none',
            background: (it.value||it) === value ? '#fff' : 'transparent',
            boxShadow: (it.value||it) === value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            color: 'var(--ink)', fontWeight: 500,
          }}>
          {it.label || it}
        </button>
      ))}
    </div>
  );
}

// Key-value row
function LxKV({ k, v, mono }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'8px 0' }}>
      <span className="lx-small">{k}</span>
      <span style={{ fontSize:13, fontWeight:500, fontVariantNumeric: mono?'tabular-nums':'normal' }}>{v}</span>
    </div>
  );
}

// Rail item
function LxRailItem({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} title={label}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:4,
        width: 72, height: 68, border:'none', background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink-60)',
        borderRadius: 12, cursor:'pointer', position:'relative',
        transition: 'background .15s var(--ease), color .15s var(--ease)',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--ink-04)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.02 }}>{label}</span>
      {badge ? <span style={{ position:'absolute', top:10, right:14, minWidth: 16, height: 16, borderRadius:8, background:'var(--err)', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>{badge}</span> : null}
    </button>
  );
}

Object.assign(window, { I, LxAvatar, LxBrandTag, LxDivider, LxStat, LxSpark, LxProgress, LxSeg, LxKV, LxRailItem, BrandLockContext, useBrandLock });
