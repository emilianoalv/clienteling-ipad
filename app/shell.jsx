// App shell — iPad frame, left rail, top bar. All screens render inside <Shell>.

const RAIL_ITEMS_BA = [
  { id:'home',     label:'Hoy',         icon:<I.home/> },
  { id:'clients',  label:'Clientas',    icon:<I.users/> },
  { id:'cal',      label:'Citas',       icon:<I.cal/> },
  { id:'catalog',  label:'Catálogo',    icon:<I.bag/> },
  { id:'purchases',label:'Compras',     icon:<I.bag/> },
  { id:'followup', label:'Seguim.',     icon:<I.msg/> },
  { id:'samples',  label:'Muestras',    icon:<I.gift/> },
  { id:'perf',     label:'Mi KPI',      icon:<I.chart/> },
];

const RAIL_ITEMS_MGR = [
  { id:'home',     label:'Resumen',     icon:<I.home/> },
  { id:'team',     label:'Equipo',      icon:<I.users/> },
  { id:'segments', label:'Segmentos',   icon:<I.users/> },
  { id:'cal',      label:'Citas',       icon:<I.cal/> },
  { id:'devices',  label:'Dispositivos',icon:<I.device/> },
  { id:'reports',  label:'Reportes',    icon:<I.chart/> },
];

const RAIL_ITEMS_SUP = [
  { id:'home',     label:'Zona',        icon:<I.home/> },
  { id:'stores',   label:'Tiendas',     icon:<I.users/> },
  { id:'reports',  label:'Reportes',    icon:<I.chart/> },
  { id:'tickets',  label:'Incidencias', icon:<I.ticket/> },
];

const RAIL_ITEMS_HQ = [
  { id:'home',     label:'Regional',    icon:<I.home/> },
  { id:'stores',   label:'Tiendas',     icon:<I.users/> },
  { id:'catalog',  label:'Catálogo',    icon:<I.bag/> },
  { id:'devices',  label:'Flota',       icon:<I.device/> },
  { id:'reports',  label:'Reportes',    icon:<I.chart/> },
  { id:'intg',     label:'Integr.',     icon:<I.plug/> },
];

const RAIL_ITEMS_ADM = [
  { id:'home',     label:'Admin',       icon:<I.shield/> },
  { id:'reports',  label:'Reportes',    icon:<I.chart/> },
  { id:'segments', label:'Segmentos',   icon:<I.users/> },
  { id:'intg',     label:'Integr.',     icon:<I.plug/> },
];

function IpadFrame({ w=1194, h=834, children, landscape=true }) {
  const [W, H] = landscape ? [w, h] : [h, w];
  return (
    <div className="lx-ipad" style={{ width: W+24, height: H+24 }}>
      <div className="lx-ipad-camera"/>
      <div className="lx-ipad-screen" style={{ width: W, height: H }}>
        {children}
      </div>
    </div>
  );
}

function SyncBadge({ online = true }) {
  return (
    <span className="lx-chip" style={{ height: 24, gap:6, fontSize:11, background: online ? 'rgba(31,122,90,.08)' : 'rgba(181,134,31,.10)', borderColor: online ? 'rgba(31,122,90,.18)' : 'rgba(181,134,31,.22)', color: online ? 'var(--ok)' : 'var(--warn)' }}>
      {online ? <I.wifi size={12}/> : <I.offline size={12}/>}
      {online ? 'En línea · Sincronizado' : 'Offline · 3 pendientes'}
    </span>
  );
}

function ProfileMenu({ onLogout, forceOpen, forceConfirm, forceAvatarHover, forceLogoutHover }) {
  const [open, setOpen]       = React.useState(!!forceOpen);
  const [confirm, setConfirm] = React.useState(!!forceConfirm);
  const [hover, setHover]     = React.useState(!!forceAvatarHover);
  const [logoutHover, setLogoutHover] = React.useState(!!forceLogoutHover);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setConfirm(false); } };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setConfirm(false); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const ba = window.CURRENT_BA;
  const store = (typeof STORES !== 'undefined') ? (STORES.find(s => s.id === ba.storeId) || {}) : {};

  // Avatar — button with hover ring
  const avatarBtnStyle = {
    position:'relative', width: 38, height: 38, borderRadius: '50%',
    border: 'none', padding: 0, cursor:'pointer',
    background:'transparent',
    outline: open ? '2px solid var(--gold)' : (hover ? '2px solid rgba(181,134,31,.45)' : '2px solid transparent'),
    outlineOffset: 2,
    transition: 'outline-color .15s ease',
  };

  // Dark luxury palette (local to the dropdown — sits over a light shell)
  const DARK_BG     = '#1A1714';     // deep noir
  const DARK_BG_2   = '#221E1A';     // slightly lifted
  const DARK_LINE   = 'rgba(212,175,109,.18)';
  const GOLD        = '#C9A86A';
  const GOLD_DIM    = 'rgba(201,168,106,.65)';
  const TEXT        = '#F1ECE3';
  const TEXT_DIM    = 'rgba(241,236,227,.62)';
  const TERRA       = '#C97B5C';     // muted terracotta
  const TERRA_HOVER = 'rgba(201,123,92,.12)';
  const TERRA_LINE  = 'rgba(201,123,92,.32)';

  const itemStyle = (h) => ({
    width:'100%', display:'flex', alignItems:'center', gap: 12,
    padding:'10px 14px', borderRadius: 8, border:'none',
    background: h ? 'rgba(241,236,227,.04)' : 'transparent',
    color: TEXT, cursor:'pointer', textAlign:'left',
    fontFamily:'var(--f-sans)', fontSize: 13, letterSpacing:'.01em',
    transition:'background .12s ease',
  });

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <button
        onMouseEnter={() => !forceAvatarHover && setHover(true)}
        onMouseLeave={() => !forceAvatarHover && setHover(false)}
        onClick={() => setOpen(o => !o)}
        aria-label="Perfil"
        aria-expanded={open}
        style={avatarBtnStyle}
      >
        <span style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          width:'100%', height:'100%', borderRadius:'50%',
          background:'var(--ink)', color:'var(--paper)',
          fontFamily:'var(--f-display)', fontSize: 13, letterSpacing:'.04em',
        }}>{ba.initials}</span>
        {/* Online dot */}
        <span style={{
          position:'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius:'50%',
          background:'var(--ok)', border:'2px solid var(--paper)',
        }}/>
      </button>

      {open && (
        <div style={{
          position:'absolute', top: 'calc(100% + 12px)', right: 0, zIndex: 50,
          width: 280, background: DARK_BG, color: TEXT,
          border:`1px solid ${DARK_LINE}`, borderRadius: 14,
          boxShadow:'0 18px 48px -12px rgba(20,16,12,.55), 0 6px 18px -6px rgba(20,16,12,.35)',
          padding: 6, fontFamily:'var(--f-sans)',
          animation:'lx-pop-in .14s ease-out',
        }}>
          {/* small caret */}
          <span style={{
            position:'absolute', top:-6, right: 14, width: 12, height: 12,
            background: DARK_BG, transform:'rotate(45deg)',
            borderTop:`1px solid ${DARK_LINE}`, borderLeft:`1px solid ${DARK_LINE}`,
          }}/>

          {/* Profile header */}
          <div style={{
            padding:'14px 14px 12px', borderRadius: 10,
            background:`linear-gradient(180deg, ${DARK_BG_2}, ${DARK_BG})`,
            display:'flex', gap: 12, alignItems:'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius:'50%',
              background:`radial-gradient(120% 120% at 30% 25%, ${GOLD} 0%, #8C6C3A 70%)`,
              color:'#1A1714', display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--f-display)', fontSize: 15, letterSpacing:'.03em',
              boxShadow:`inset 0 0 0 1px rgba(255,255,255,.08), 0 0 0 1px ${DARK_LINE}`,
            }}>{ba.initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily:'var(--f-display)', fontSize: 15, lineHeight: 1.15,
                color: TEXT, letterSpacing:'-.005em',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>{ba.name}</div>
              <div style={{
                fontSize: 11, color: GOLD, marginTop: 3,
                letterSpacing:'.18em', textTransform:'uppercase',
              }}>{ba.role === 'Manager' ? 'Manager' : 'Beauty Advisor'} · {(ba.brands||[]).join(' / ')}</div>
              <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 4, display:'flex', alignItems:'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius:'50%', background:'var(--ok)' }}/>
                En línea · {store.name || '—'}
              </div>
            </div>
          </div>

          {/* Hairline */}
          <div style={{ height: 1, background: DARK_LINE, margin:'6px 4px' }}/>

          {/* Cerrar sesión */}
          {!confirm ? (
            <button
              onMouseEnter={() => !forceLogoutHover && setLogoutHover(true)}
              onMouseLeave={() => !forceLogoutHover && setLogoutHover(false)}
              onClick={() => setConfirm(true)}
              style={{
                ...itemStyle(false),
                background: logoutHover ? TERRA_HOVER : 'transparent',
                color: TERRA,
                marginTop: 2,
                border: `1px solid ${logoutHover ? TERRA_LINE : 'transparent'}`,
              }}>
              <I.power size={16}/>
              <span style={{ flex: 1, fontWeight: 500, letterSpacing:'.01em' }}>Cerrar sesión</span>
              <span style={{ fontSize: 10.5, color: GOLD_DIM, letterSpacing:'.16em', textTransform:'uppercase' }}>Salir</span>
            </button>
          ) : (
            <div style={{ padding:'10px 12px 12px' }}>
              <div style={{
                fontFamily:'var(--f-display)', fontSize: 14, color: TEXT, marginBottom: 4,
              }}>¿Cerrar sesión?</div>
              <div style={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.4, marginBottom: 12 }}>
                Volverás a la pantalla de selección de perfiles. Cualquier borrador sin enviar permanece guardado en este dispositivo.
              </div>
              <div style={{ display:'flex', gap: 8 }}>
                <button
                  onClick={() => setConfirm(false)}
                  style={{
                    flex: 1, height: 36, borderRadius: 8, cursor:'pointer',
                    background:'transparent', color: TEXT,
                    border:`1px solid ${DARK_LINE}`, fontSize: 12.5, fontWeight: 500,
                    fontFamily:'var(--f-sans)',
                  }}>Cancelar</button>
                <button
                  onClick={() => { setOpen(false); setConfirm(false); onLogout && onLogout(); }}
                  style={{
                    flex: 1, height: 36, borderRadius: 8, cursor:'pointer',
                    background: TERRA, color:'#1A1714',
                    border:'none', fontSize: 12.5, fontWeight: 600,
                    fontFamily:'var(--f-sans)', letterSpacing:'.02em',
                  }}>Cerrar sesión</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopBar({ title, subtitle, brandContext, setBrandContext, right, online=true, onLogout, demoMenuState }) {
  return (
    <div style={{ height: 72, padding: '0 28px', display:'flex', alignItems:'center', gap: 20, borderBottom:'1px solid var(--line)', background:'var(--paper)', position:'relative', zIndex: 5 }}>
      <div style={{ flex: '0 0 auto' }}>
        <div className="lx-micro" style={{ marginBottom: 2 }}>L'Oréal Luxe · Clienteling</div>
        <div style={{ fontFamily:'var(--f-display)', fontSize: 22, lineHeight: 1, letterSpacing:'-0.01em' }}>{title}</div>
      </div>
      <div style={{ flex: 1, display:'flex', alignItems:'center', gap: 10, marginLeft: 24 }}>
        {subtitle && <span className="lx-small" style={{ fontSize: 12 }}>{subtitle}</span>}
      </div>
      {setBrandContext ? (
        <div style={{ display:'flex', gap: 4, background:'var(--bone)', borderRadius: 999, padding: 3, border:'1px solid var(--line)' }}>
          {['Todas','Lancôme','YSL'].map(b => (
            <button key={b} onClick={() => setBrandContext(b)}
              style={{
                height: 28, padding:'0 14px', borderRadius: 999, border:'none', cursor:'pointer',
                background: brandContext===b ? '#fff' : 'transparent',
                boxShadow: brandContext===b ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                fontWeight: 600, fontSize: 12, color:'var(--ink)', letterSpacing: b==='YSL'?'0.14em':0,
              }}>
              {b}
            </button>
          ))}
        </div>
      ) : null}
      <SyncBadge online={online}/>
      {right}
      <button className="lx-btn lx-btn--sm lx-btn--icon" aria-label="Notif."><I.bell/></button>
      <ProfileMenu
        onLogout={onLogout}
        forceOpen={demoMenuState === 'open' || demoMenuState === 'logoutHover' || demoMenuState === 'confirm'}
        forceConfirm={demoMenuState === 'confirm'}
        forceAvatarHover={demoMenuState === 'avatarHover'}
        forceLogoutHover={demoMenuState === 'logoutHover'}
      />
    </div>
  );
}

function Rail({ items, active, onNav }) {
  return (
    <aside style={{
      width: 88, background:'var(--bone)', borderRight:'1px solid var(--line)',
      display:'flex', flexDirection:'column', alignItems:'center', padding:'18px 0 16px', gap: 4, flex: '0 0 auto',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background:'var(--ink)', color:'var(--paper)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-display)', fontSize: 20, letterSpacing:'-0.02em', marginBottom: 16 }}>
        L
      </div>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', gap: 2 }}>
        {items.map(it => (
          <LxRailItem key={it.id} icon={it.icon} label={it.label} active={active===it.id} onClick={() => onNav(it.id)} badge={it.badge}/>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap: 6, alignItems:'center', padding:'6px 0' }}>
        <button className="lx-btn lx-btn--icon" style={{ width:40, height:40, border:'none', background:'transparent' }} title="Exportar"><I.download/></button>
        <button className="lx-btn lx-btn--icon" style={{ width:40, height:40, border:'none', background:'transparent' }} title="Ajustes"><I.shield/></button>
      </div>
    </aside>
  );
}

function Shell({ role='BA', active, onNav, title, subtitle, brandContext, setBrandContext, online=true, children, rightBar, onLogout, demoMenuState }) {
  const items = role === 'Manager'   ? RAIL_ITEMS_MGR
              : role === 'Supervisor'? RAIL_ITEMS_SUP
              : role === 'HQ'        ? RAIL_ITEMS_HQ
              : role === 'Admin'     ? RAIL_ITEMS_ADM
              :                        RAIL_ITEMS_BA;
  return (
    <div style={{ display:'flex', width:'100%', height:'100%', background:'var(--paper)', fontFamily:'var(--f-sans)' }}>
      <Rail items={items} active={active} onNav={onNav}/>
      <main style={{ flex:1, display:'flex', flexDirection:'column', minWidth: 0 }}>
        <TopBar title={title} subtitle={subtitle} brandContext={brandContext} setBrandContext={setBrandContext} right={rightBar} online={online} onLogout={onLogout} demoMenuState={demoMenuState}/>
        <div className="lx-scroll" style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { IpadFrame, Shell, SyncBadge, ProfileMenu, RAIL_ITEMS_BA, RAIL_ITEMS_MGR, RAIL_ITEMS_SUP, RAIL_ITEMS_HQ, RAIL_ITEMS_ADM });
