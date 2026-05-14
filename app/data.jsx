// Mock data — L'Oréal Luxe Mexico clienteling
// Mexican names, Liverpool / Palacio de Hierro stores, plausible SKUs
// Attached to window for cross-script access.

const STORES = [
  { id: 'st-001', name: 'Liverpool Polanco',        chain: 'Liverpool', city: 'CDMX',        address: 'Mariano Escobedo 425' },
  { id: 'st-002', name: 'Liverpool Santa Fe',       chain: 'Liverpool', city: 'CDMX',        address: 'Vasco de Quiroga 3800' },
  { id: 'st-003', name: 'Palacio de Hierro Polanco',chain: 'Palacio',   city: 'CDMX',        address: 'Moliere 222' },
  { id: 'st-004', name: 'Palacio de Hierro Perisur',chain: 'Palacio',   city: 'CDMX',        address: 'Anillo Periférico Sur 4690' },
  { id: 'st-005', name: 'Liverpool Andares',        chain: 'Liverpool', city: 'Guadalajara', address: 'Blvd. Puerta de Hierro 4965' },
];

const BAS = [
  { id: 'ba-01', name: 'Valentina Ríos',    initials: 'VR', storeId: 'st-001', brands: ['Lancôme'],       role: 'BA' },
  { id: 'ba-02', name: 'Fernanda Oliveros', initials: 'FO', storeId: 'st-001', brands: ['Lancôme'],        role: 'BA' },
  { id: 'ba-03', name: 'Regina Mendoza',    initials: 'RM', storeId: 'st-003', brands: ['YSL'],            role: 'BA' },
  { id: 'ba-04', name: 'Paulina Treviño',   initials: 'PT', storeId: 'st-001', brands: ['Lancôme','YSL'], role: 'Manager' },
  { id: 'ba-05', name: 'Camila Santos',     initials: 'CS', storeId: 'st-004', brands: ['YSL'],            role: 'BA' },
];

// CURRENT_BA vive solo en window para que el login (auth.jsx) pueda reasignarlo
// y todas las pantallas lean el valor más reciente vía window.CURRENT_BA.
if (!window.CURRENT_BA) window.CURRENT_BA = BAS[0];

// Extra roles beyond BA/Manager — Zone Supervisor + Central Admin (LOréal HQ teams)
const USERS = [
  { id:'us-01', name:'Valentina Ríos',     role:'BA',          storeId:'st-001', brands:['Lancôme'] },
  { id:'us-02', name:'Paulina Treviño',    role:'Manager',     storeId:'st-001', brands:['Lancôme','YSL'] },
  { id:'us-03', name:'Diego Salvatierra',  role:'Supervisor',  storeIds:['st-001','st-002','st-003'], zone:'Centro' },
  { id:'us-04', name:'Ana Lucía Ferrer',   role:'Admin',       team:'Marketing CRM' },
  { id:'us-05', name:'Luis Felipe Bernal', role:'Admin',       team:'Operaciones Retail' },
];

// Reglas de segmentación / Luxe Circle (los segmentos SON los niveles).
//   Nueva       → 0-4 visitas (acaba de iniciar relación).
//   Recurrente  → 5-9 visitas o LTV < $150k (relación establecida).
//   VIP         → LTV ≥ $150,000 MXN Y 6+ visitas (top tier).
//   En riesgo   → Sin compra > 180 días con histórico ≥ 3 (necesita reactivación).
const SEGMENT_RULES = {
  VIP:       { label:'VIP',       rule:'LTV ≥ $150,000 MXN · 6+ visitas' },
  Recurrent: { label:'Recurrente',rule:'5+ visitas o LTV ≥ $50,000' },
  New:       { label:'Nueva',     rule:'< 5 visitas registradas' },
  AtRisk:    { label:'En riesgo', rule:'Sin compra > 180 días' },
};

// Devuelve los días desde la última compra usando la fecha real (no la hardcoded).
function _daysSinceLastPurchase(c) {
  if (!c.stats || !c.stats.lastPurchase) return 999;
  return (Date.now() - Date.parse(c.stats.lastPurchase)) / 86400000;
}

function clientSegment(c) {
  const ltv = (c.stats && c.stats.ltv) || 0;
  const visits = (c.stats && c.stats.visits) || 0;
  const daysSince = _daysSinceLastPurchase(c);
  if (daysSince > 180 && visits >= 3) return 'AtRisk';
  if (ltv >= 150000 && visits >= 6) return 'VIP';
  if (visits < 5 && ltv < 50000) return 'New';
  return 'Recurrent';
}

// Progreso de cliente hacia el siguiente nivel del Luxe Circle.
//   Retorna { current, next, hint, progress } donde:
//     - current/next: keys de segmento ('VIP', 'Recurrent', 'New', 'AtRisk')
//     - hint: texto breve para mostrar "qué falta"
//     - progress: 0..1 indicador visual
// NOTE: asignado a window de inmediato para garantizar visibilidad bajo Babel-standalone.
window.clientLevelProgress = function clientLevelProgress(c) {
  const seg = clientSegment(c);
  const ltv = (c.stats && c.stats.ltv) || 0;
  const visits = (c.stats && c.stats.visits) || 0;
  const MXNshort = (n) => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', maximumFractionDigits:0 }).format(Math.max(0, Math.round(n)));

  if (seg === 'AtRisk') {
    return {
      current: 'AtRisk',
      next: 'Recurrent',
      hint: 'Reactiva con 1 compra para volver a Recurrente',
      progress: 0,
    };
  }
  if (seg === 'New') {
    // Falta para Recurrent: 5 visitas o $50,000 LTV
    const remainingVisits = Math.max(0, 5 - visits);
    const progress = Math.min(1, Math.max(visits / 5, ltv / 50000));
    return {
      current: 'New',
      next: 'Recurrent',
      hint: remainingVisits > 0
        ? `${remainingVisits} visita${remainingVisits === 1 ? '' : 's'} para Recurrente`
        : `${MXNshort(50000 - ltv)} más en compras para Recurrente`,
      progress,
    };
  }
  if (seg === 'Recurrent') {
    // Falta para VIP: LTV ≥ 150k Y visitas ≥ 6
    const ltvNeeded = Math.max(0, 150000 - ltv);
    const visitsNeeded = Math.max(0, 6 - visits);
    const progress = Math.min(1, Math.min(ltv / 150000, visits / 6));
    let hint;
    if (ltvNeeded > 0 && visitsNeeded > 0)      hint = `${MXNshort(ltvNeeded)} y ${visitsNeeded} visita${visitsNeeded === 1 ? '' : 's'} para VIP`;
    else if (ltvNeeded > 0)                     hint = `${MXNshort(ltvNeeded)} más en compras para VIP`;
    else if (visitsNeeded > 0)                  hint = `${visitsNeeded} visita${visitsNeeded === 1 ? '' : 's'} para VIP`;
    else                                        hint = 'A un paso de VIP';
    return { current: 'Recurrent', next: 'VIP', hint, progress };
  }
  // VIP — máximo nivel
  return {
    current: 'VIP',
    next: null,
    hint: 'Nivel máximo · mantén actividad regular',
    progress: 1,
  };
};

const CLIENTS = [
  { id:'cl-001', name:'Ximena Cortázar', initials:'XC', tier:'Signature', brands:['Lancôme','YSL'], lastVisit:'2026-04-18', city:'CDMX', age:38, birthday:'1988-05-22', phone:'+52 55 1234 5678', email:'ximena.cortazar@icloud.com', preferredLang:'es', since:'2019',
    skin:{ type:'Mixta', concerns:['Luminosidad','Líneas finas'], tone:'Medio cálido' },
    allergies:['Fragancia sintética'],
    loyalty:{ name:'Luxe Circle', tier:'Signature', points: 14820, toNext: 1180 },
    stats:{ ltv: 184500, visits: 23, avgTicket: 8021, lastPurchase:'2026-04-18' },
    affinities: ['Skincare anti-edad','Lipstick mate','Fragancia floral amaderada'],
    interests: ['Antiedad','Luminosidad','Labial','Floral','Amaderada'],
    routine: 'Avanzada',
  },
  { id:'cl-002', name:'Regina Iturbide',  initials:'RI', tier:'Icon',      brands:['YSL'],            lastVisit:'2026-04-21', city:'CDMX', age:45, birthday:'1981-06-08', phone:'+52 55 2345 6789', email:'r.iturbide@gmail.com', preferredLang:'es', since:'2016',
    skin:{ type:'Seca', concerns:['Firmeza','Manchas'], tone:'Medio' },
    allergies:[],
    loyalty:{ name:'Luxe Circle', tier:'Icon', points: 42100, toNext: 0 },
    stats:{ ltv: 312000, visits: 41, avgTicket: 7609, lastPurchase:'2026-04-21' },
    affinities:['Libre EDP','Rouge Pur Couture','Cuidado nocturno'],
    interests: ['Antiedad','Manchas','Labial','Floral'],
    routine: 'Profesional',
  },
  { id:'cl-003', name:'Paulina Azcárraga',initials:'PA', tier:'Atelier',   brands:['Lancôme'],         lastVisit:'2026-04-02', city:'CDMX', age:32, birthday:'1994-05-15', phone:'+52 55 3456 7890', email:'pau.azcarraga@outlook.com', preferredLang:'es', since:'2022',
    skin:{ type:'Grasa', concerns:['Poros','Brillos'], tone:'Claro' },
    allergies:['Retinol a dosis altas'],
    loyalty:{ name:'Luxe Circle', tier:'Atelier', points: 6280, toNext: 3720 },
    stats:{ ltv: 54200, visits: 9, avgTicket: 6022, lastPurchase:'2026-04-02' },
    affinities:['Advanced Génifique','Base ligera','Labial nude'],
    interests: ['Poros','Acné','Base','Labial'],
    routine: 'Intermedia',
  },
  { id:'cl-004', name:'Mariana del Bosque',initials:'MB', tier:'Signature', brands:['Lancôme','YSL'], lastVisit:'2026-03-29', city:'Guadalajara', age:51, birthday:'1975-08-03', phone:'+52 33 8765 4321', email:'mariana.db@me.com', preferredLang:'es', since:'2014',
    skin:{ type:'Madura', concerns:['Arrugas profundas','Volumen'], tone:'Medio dorado' },
    allergies:[],
    loyalty:{ name:'Luxe Circle', tier:'Signature', points: 18740, toNext: 0 },
    stats:{ ltv: 241800, visits: 34, avgTicket: 7112, lastPurchase:'2026-03-29' },
    affinities:['Absolue','Touche Éclat','Mon Paris'],
    interests: ['Antiedad','Firmeza','Iluminador','Oriental'],
    routine: 'Avanzada',
  },
  { id:'cl-005', name:'Isabella Montemayor',initials:'IM', tier:'Atelier', brands:['YSL'],            lastVisit:'2026-04-19', city:'Monterrey', age:28, birthday:'1998-04-30', phone:'+52 81 9876 5432', email:'isa.montem@gmail.com', preferredLang:'es', since:'2024',
    skin:{ type:'Normal', concerns:['Hidratación'], tone:'Claro rosado' },
    allergies:[],
    loyalty:{ name:'Luxe Circle', tier:'Atelier', points: 2130, toNext: 7870 },
    stats:{ ltv: 18900, visits: 4, avgTicket: 4725, lastPurchase:'2026-04-19' },
    affinities:['Rouge Pur Couture The Slim','Black Opium'],
    interests: ['Hidratación','Labial','Oriental','Gourmand'],
    routine: 'Básica',
  },
  { id:'cl-006', name:'Sofía Arellano',   initials:'SA', tier:'Signature', brands:['Lancôme'],        lastVisit:'2026-04-10', city:'CDMX', age:41, birthday:'1985-05-09', phone:'+52 55 4321 0987', email:'sofia.arellano@hotmail.com', preferredLang:'es', since:'2018',
    skin:{ type:'Mixta', concerns:['Manchas','Textura'], tone:'Medio' },
    allergies:[],
    loyalty:{ name:'Luxe Circle', tier:'Signature', points: 11440, toNext: 4560 },
    stats:{ ltv: 148700, visits: 19, avgTicket: 7826, lastPurchase:'2026-04-10' },
    affinities:['Rénergie','La Vie Est Belle','Teint Idole'],
    interests: ['Manchas','Antiedad','Base','Floral'],
    routine: 'Intermedia',
  },
];

const PRODUCTS = [
  { sku:'LC-GEN-50',  brand:'Lancôme', line:'Advanced Génifique',       name:'Serum activador de juventud', size:'50 ml',  price: 2890, stock:{ 'st-001':14,'st-003':6,'st-004':0 },
    attrs:{ tipo:'Sérum', piel:['Todas'], concerns:['Luminosidad','Firmeza'], vegano:false },
    howTo:'Aplicar mañana y noche sobre rostro y cuello limpios, antes de la crema.',
    selling:['Tecnología probiótica','77% más luminosa en 7 días','Éxito de ventas global'],
    lifecycleDays: 90 },
  { sku:'LC-ABS-50',  brand:'Lancôme', line:'Absolue',                  name:'Crema suave regeneradora',    size:'60 ml',  price: 7450, stock:{ 'st-001':4,'st-003':2,'st-004':1 },
    attrs:{ tipo:'Crema',  piel:['Madura'], concerns:['Arrugas','Firmeza'], vegano:false },
    howTo:'Aplicar en rostro y cuello cada mañana, con masaje ascendente.',
    selling:['Rosa Centifolia de Grasse','Texture couture','Formulación premium'],
    lifecycleDays: 100 },
  { sku:'LC-TID-30',  brand:'Lancôme', line:'Teint Idole Ultra Wear',   name:'Base de maquillaje 24H',      size:'30 ml',  price: 1250, stock:{ 'st-001':22,'st-003':18,'st-004':14 },
    attrs:{ tipo:'Base',   piel:['Todas'], concerns:['Cobertura'], vegano:true },
    howTo:'Aplicar con brocha o esponja húmeda desde el centro del rostro.',
    selling:['24 horas de duración','45 tonos','Acabado natural luminoso'],
    lifecycleDays: 120 },
  { sku:'LC-LVE-100', brand:'Lancôme', line:'La Vie Est Belle',         name:'Eau de Parfum',               size:'100 ml', price: 3890, stock:{ 'st-001':9,'st-003':7,'st-004':3 },
    attrs:{ tipo:'Fragancia', familia:'Floral gourmand' },
    howTo:'Aplicar en puntos de pulso: cuello, muñecas, detrás de las orejas.',
    selling:['Iris · Jazmín · Azahar','Ícono de la casa','Frasco sonrisa Baccarat'],
    lifecycleDays: 180 },
  { sku:'YS-LIB-90',  brand:'YSL',    line:'Libre',                     name:'Le Parfum',                    size:'90 ml',  price: 4120, stock:{ 'st-001':6,'st-003':10,'st-004':8 },
    attrs:{ tipo:'Fragancia', familia:'Floral amaderado' },
    howTo:'Vaporizar sobre la piel a 15 cm.',
    selling:['Lavanda de Francia','Azahar de Marruecos','Ícono contemporáneo'],
    lifecycleDays: 180 },
  { sku:'YS-RPC-01',  brand:'YSL',    line:'Rouge Pur Couture',         name:'Labial The Bold',              size:'2.8 g',  price: 950, stock:{ 'st-001':30,'st-003':24,'st-004':20 },
    attrs:{ tipo:'Labial', acabado:'Mate saturado' },
    howTo:'Aplicar directo del tubo; para mayor precisión usar pincel.',
    selling:['Pigmentación saturada','Confort 8 horas','Tubo icónico YSL'],
    lifecycleDays: 240 },
  { sku:'YS-TCL-02',  brand:'YSL',    line:'Touche Éclat',              name:'Iluminador corrector',         size:'2.5 ml', price: 1180, stock:{ 'st-001':18,'st-003':12,'st-004':6 },
    attrs:{ tipo:'Corrector' },
    howTo:'Aplicar en ángulos del rostro: ojeras, entrecejo, arco de cupido.',
    selling:['40 millones vendidos mundialmente','Ilumina sin cobertura','Icono absoluto'],
    lifecycleDays: 150 },
  { sku:'YS-OR-100',  brand:'YSL',    line:'Or Rouge',                  name:'Sérum iluminador',             size:'50 ml',  price: 6490, stock:{ 'st-001':2,'st-003':3,'st-004':0 },
    attrs:{ tipo:'Sérum', piel:['Todas'], concerns:['Luminosidad','Arrugas'] },
    howTo:'Mañana y noche antes del tratamiento.',
    selling:['Azafrán Premium Sativus','Bioactivos concentrados','Alta gama YSL'],
    lifecycleDays: 100 },
];

// Consent notice version — drives the privacy audit trail
const PRIVACY_NOTICE_VERSION = 'v2026.03';

const CONSENTS = [
  { clientId:'cl-001', channel:'SMS',      status:'granted', at:'2026-01-12T10:04:00', version:'v2026.01', source:'Liverpool Polanco' },
  { clientId:'cl-001', channel:'Email',    status:'granted', at:'2026-01-12T10:04:00', version:'v2026.01', source:'Liverpool Polanco' },
  { clientId:'cl-001', channel:'WhatsApp', status:'granted', at:'2026-03-20T16:30:00', version:'v2026.03', source:'Liverpool Polanco' },
  { clientId:'cl-002', channel:'Email',    status:'granted', at:'2025-11-04T12:10:00', version:'v2025.11', source:'Palacio Polanco' },
  { clientId:'cl-002', channel:'WhatsApp', status:'revoked', at:'2026-02-08T09:22:00', version:'v2026.01', source:'Cliente (web)' },
  { clientId:'cl-002', channel:'SMS',      status:'granted', at:'2025-11-04T12:10:00', version:'v2025.11', source:'Palacio Polanco' },
];

const INTERACTIONS = [
  { id:'int-1', clientId:'cl-001', baId:'ba-01', type:'Consulta skincare',  brand:'Lancôme', at:'2026-04-18T11:20', notes:'Interesada en rutina anti-edad nocturna. Recomendó Absolue Nuit.' },
  { id:'int-2', clientId:'cl-001', baId:'ba-01', type:'Compra',             brand:'Lancôme', at:'2026-04-18T11:55', notes:'Absolue + Génifique. Obsequió muestra de Rénergie.' },
  { id:'int-3', clientId:'cl-001', baId:'ba-03', type:'Descubrimiento',     brand:'YSL',     at:'2026-02-14T17:00', notes:'Aplicación Libre EDP. Le encantó el sillage.' },
  { id:'int-4', clientId:'cl-001', baId:'ba-01', type:'Seguimiento WhatsApp',brand:'Lancôme',at:'2026-03-02T10:14', notes:'Respondió positivo. Pidió cita para masaje facial.' },
  { id:'int-5', clientId:'cl-001', baId:'ba-01', type:'Cita atendida',      brand:'Lancôme', at:'2026-03-14T13:00', notes:'Ritual Absolue 30 min. Convirtió en sérum Or Rouge.' },
];

const RECOMMENDATIONS = [
  { id:'rec-1', clientId:'cl-001', baId:'ba-01', at:'2026-04-18', items:['LC-ABS-50','LC-GEN-50'], status:'converted', purchaseId:'pu-221' },
  { id:'rec-2', clientId:'cl-001', baId:'ba-03', at:'2026-02-14', items:['YS-LIB-90'],             status:'converted', purchaseId:'pu-198' },
  { id:'rec-3', clientId:'cl-001', baId:'ba-01', at:'2026-04-22', items:['YS-OR-100','LC-TID-30'], status:'pending' },
];

const PURCHASES = [
  { id:'pu-221', clientId:'cl-001', baId:'ba-01', storeId:'st-001', at:'2026-04-18T11:55', brand:'Lancôme', items:[{sku:'LC-ABS-50',qty:1,price:7450},{sku:'LC-GEN-50',qty:1,price:2890}], total:10340, pay:'Tarjeta · Amex', ticket:'LV-220418-0892', recId:'rec-1' },
  { id:'pu-215', clientId:'cl-001', baId:'ba-03', storeId:'st-003', at:'2026-03-14T13:45', brand:'YSL',     items:[{sku:'YS-OR-100',qty:1,price:6490}], total:6490, pay:'Tarjeta · Visa', ticket:'PH-220314-0441' },
  { id:'pu-198', clientId:'cl-001', baId:'ba-03', storeId:'st-003', at:'2026-02-14T17:35', brand:'YSL',     items:[{sku:'YS-LIB-90',qty:1,price:4120}], total:4120, pay:'Efectivo', ticket:'PH-220214-0118', recId:'rec-2' },
  { id:'pu-176', clientId:'cl-002', baId:'ba-03', storeId:'st-003', at:'2026-04-21T12:10', brand:'YSL',     items:[{sku:'YS-RPC-01',qty:3,price:950}],  total:2850, pay:'Tarjeta · MC',   ticket:'PH-220421-0054' },
  { id:'pu-164', clientId:'cl-002', baId:'ba-03', storeId:'st-003', at:'2026-03-02T15:40', brand:'Lancôme', items:[{sku:'LC-LVE-100',qty:1,price:3890}], total:3890, pay:'Tarjeta · Amex', ticket:'PH-220302-0220' },
  { id:'pu-142', clientId:'cl-004', baId:'ba-04', storeId:'st-001', at:'2026-03-29T10:18', brand:'Lancôme', items:[{sku:'LC-ABS-50',qty:1,price:7450}], total:7450, pay:'Tarjeta · Amex', ticket:'LV-220329-0099' },
];

const COMMUNICATIONS = [
  { id:'co-1', clientId:'cl-001', baId:'ba-01', channel:'WhatsApp', direction:'out', at:'2026-04-22T14:32', template:'Seguimiento 72h', body:'Hola Ximena, ¿cómo te sentiste con el sérum Or Rouge?', status:'read' },
  { id:'co-2', clientId:'cl-001', baId:'ba-01', channel:'WhatsApp', direction:'in',  at:'2026-04-22T18:04', body:'Increíble, notó mi marido el brillo!', status:'read' },
  { id:'co-3', clientId:'cl-001', baId:'ba-01', channel:'Email',    direction:'out', at:'2026-04-10T09:00', template:'Cumpleaños', body:'Feliz cumpleaños — obsequio en tienda.', status:'delivered' },
  { id:'co-4', clientId:'cl-002', baId:'ba-03', channel:'SMS',      direction:'out', at:'2026-04-20T11:00', template:'Reposición', body:'Tu Libre Le Parfum está por terminarse…', status:'read' },
];

const SAMPLES = [
  { id:'sm-1', clientId:'cl-001', baId:'ba-01', sku:'LC-REN-05', name:'Rénergie H.C.F. Triple Serum', givenAt:'2026-04-18', followUp:'2026-04-25', converted:false },
  { id:'sm-2', clientId:'cl-001', baId:'ba-03', sku:'YS-LIB-05', name:'Libre Le Parfum 1.2ml',        givenAt:'2026-02-14', followUp:'2026-02-21', converted:true,  purchaseId:'pu-198' },
  { id:'sm-3', clientId:'cl-001', baId:'ba-01', sku:'LC-ABS-05', name:'Absolue crema muestra 5ml',    givenAt:'2026-03-14', followUp:'2026-03-21', converted:false },
];

const MESSAGES = [
  { id:'msg-1', clientId:'cl-001', channel:'WhatsApp', brand:'Lancôme', templateId:'tpl-postvisit-es', sentAt:'2026-04-18T18:02', deliveredAt:'2026-04-18T18:02', readAt:'2026-04-18T18:14', respondedAt:'2026-04-18T19:33', converted:true, baId:'ba-01',
    preview:'Ximena, fue un placer atenderte hoy. Te dejo tu rutina personalizada Absolue…' },
  { id:'msg-2', clientId:'cl-001', channel:'WhatsApp', brand:'YSL',     templateId:'tpl-launch-es',    sentAt:'2026-03-28T10:00', deliveredAt:'2026-03-28T10:00', readAt:'2026-03-28T11:17', respondedAt:null,             converted:false, baId:'ba-03',
    preview:'Descubre Libre Le Parfum Intense. Reserva tu prueba personal…' },
  { id:'msg-3', clientId:'cl-001', channel:'Email',    brand:'Lancôme', templateId:'tpl-birthday-es',  sentAt:'2026-01-22T08:00', deliveredAt:'2026-01-22T08:00', readAt:'2026-01-22T09:44', respondedAt:null,             converted:true, baId:'ba-01',
    preview:'Feliz cumpleaños, Ximena. Te esperamos con un obsequio especial…' },
];

const TEMPLATES = [
  { id:'tpl-postvisit-es', brand:'Lancôme', channel:'WhatsApp', category:'Post-visita',
    body:'{nombre}, fue un placer atenderte hoy en {tienda}. Te comparto la rutina que personalicé para ti. Cualquier duda, aquí estoy. — {ba}',
    tokens:['{nombre}','{tienda}','{ba}'] },
  { id:'tpl-launch-es',    brand:'YSL',     channel:'WhatsApp', category:'Lanzamiento',
    body:'{nombre}, acaba de llegar {producto}. ¿Te gustaría reservar tu prueba? — {ba}, YSL Beauty',
    tokens:['{nombre}','{producto}','{ba}'] },
  { id:'tpl-birthday-es',  brand:'Lancôme', channel:'Email',    category:'Cumpleaños',
    body:'Feliz cumpleaños, {nombre}. Te esperamos en {tienda} con un obsequio especial durante el mes.',
    tokens:['{nombre}','{tienda}'] },
  { id:'tpl-replenish-es', brand:'Lancôme', channel:'WhatsApp', category:'Reposición',
    body:'Hola {nombre}, ¿cómo vas con tu {producto}? Si te está por acabar, te reservo uno nuevo.',
    tokens:['{nombre}','{producto}'] },
  { id:'tpl-sample-es',    brand:'YSL',     channel:'WhatsApp', category:'Muestra',
    body:'{nombre}, ¿cómo te sentiste con la muestra de {producto}? Me encantaría escuchar tu experiencia.',
    tokens:['{nombre}','{producto}'] },
];

const APPOINTMENTS = [
  { id:'ap-1', clientId:'cl-001', baId:'ba-01', brand:'Lancôme', at:'2026-04-24T11:00', duration:45, type:'Ritual Absolue',        status:'confirmed' },
  { id:'ap-2', clientId:'cl-002', baId:'ba-01', brand:'YSL',     at:'2026-04-24T13:30', duration:30, type:'Maquillaje de noche',   status:'confirmed' },
  { id:'ap-3', clientId:'cl-006', baId:'ba-01', brand:'Lancôme', at:'2026-04-24T16:00', duration:45, type:'Diagnóstico de piel',   status:'pending' },
  { id:'ap-4', clientId:'cl-003', baId:'ba-01', brand:'Lancôme', at:'2026-04-25T10:30', duration:30, type:'Prueba de base',        status:'confirmed' },
  { id:'ap-5', clientId:'cl-004', baId:'ba-01', brand:'YSL',     at:'2026-04-25T12:00', duration:60, type:'Consulta de fragancia', status:'confirmed' },
];

const TASKS = [
  { id:'tk-1', clientId:'cl-001', baId:'ba-01', kind:'Seguimiento muestra',    due:'2026-04-25', priority:'alta' },
  { id:'tk-2', clientId:'cl-004', baId:'ba-01', kind:'Reposición fragancia',  due:'2026-04-24', priority:'media' },
  { id:'tk-3', clientId:'cl-006', baId:'ba-01', kind:'Confirmar cita',         due:'2026-04-24', priority:'alta' },
  { id:'tk-4', clientId:'cl-005', baId:'ba-01', kind:'Mensaje de bienvenida',  due:'2026-04-24', priority:'baja' },
  { id:'tk-5', clientId:'cl-003', baId:'ba-01', kind:'Agradecer compra',       due:'2026-04-24', priority:'media' },
];

const DEVICES = [
  { id:'dv-01', serial:'LX-IPAD-001', storeId:'st-001', status:'active',      assignedBA:'ba-01', lastSync:'2026-04-23T09:12', os:'iPadOS 18.3', app:'1.4.2' },
  { id:'dv-02', serial:'LX-IPAD-002', storeId:'st-001', status:'active',      assignedBA:'ba-02', lastSync:'2026-04-23T08:55', os:'iPadOS 18.3', app:'1.4.2' },
  { id:'dv-03', serial:'LX-IPAD-003', storeId:'st-003', status:'active',      assignedBA:'ba-03', lastSync:'2026-04-23T09:04', os:'iPadOS 18.3', app:'1.4.2' },
  { id:'dv-04', serial:'LX-IPAD-004', storeId:'st-003', status:'maintenance', assignedBA:null,    lastSync:'2026-04-20T18:00', os:'iPadOS 18.2', app:'1.4.0' },
  { id:'dv-05', serial:'LX-IPAD-005', storeId:'st-004', status:'active',      assignedBA:'ba-05', lastSync:'2026-04-23T09:20', os:'iPadOS 18.3', app:'1.4.2' },
  { id:'dv-06', serial:'LX-IPAD-006', storeId:'st-002', status:'inactive',    assignedBA:null,    lastSync:'2026-03-12T14:30', os:'iPadOS 18.1', app:'1.3.8' },
];

const TICKETS = [
  { id:'tc-01', category:'Hardware',  title:'Pantalla con artefactos en iPad 04',  deviceId:'dv-04', status:'En curso',   openedAt:'2026-04-20', resolvedAt:null,         priority:'alta' },
  { id:'tc-02', category:'App',       title:'Sincronización lenta tras venta',     deviceId:'dv-02', status:'Resuelto',   openedAt:'2026-04-18', resolvedAt:'2026-04-19', priority:'media' },
  { id:'tc-03', category:'Acceso',    title:'BA nueva requiere alta',              deviceId:null,    status:'Abierto',    openedAt:'2026-04-22', resolvedAt:null,         priority:'baja' },
  { id:'tc-04', category:'Red',       title:'Wi-Fi del counter intermitente',      deviceId:'dv-03', status:'En curso',   openedAt:'2026-04-21', resolvedAt:null,         priority:'alta' },
  { id:'tc-05', category:'App',       title:'Plantilla de WhatsApp sin tokens',    deviceId:null,    status:'Resuelto',   openedAt:'2026-04-15', resolvedAt:'2026-04-16', priority:'baja' },
];

const INTEGRATIONS = [
  { key:'POS',       label:'POS Liverpool / Palacio',     status:'sandbox', lastEvent:'Handoff ticket #pu-221', mode:'Stub · QR' },
  { key:'ECOM',      label:'e-Commerce L\'Oréal Luxe MX', status:'stub',    lastEvent:'—',                     mode:'Preparado' },
  { key:'DIAGNOSIS', label:'Skin Diagnostics (ModiFace)', status:'sandbox', lastEvent:'Análisis demo',          mode:'SDK simulado' },
  { key:'WHATSAPP',  label:'WhatsApp Business API',       status:'sandbox', lastEvent:'Mensaje msg-1 entregado',mode:'Simulador' },
];

// KPI snapshot
const KPIS_BA = {
  today:   { newClients: 3,  interactions: 14, recsSent: 8, conv: 0.58, sales: 48230, samples: 6 },
  week:    { newClients: 11, interactions: 72, recsSent: 41, conv: 0.61, sales: 268400, samples: 22 },
  month:   { newClients: 38, interactions: 312, recsSent: 181, conv: 0.56, sales: 1184020, samples: 94 },
};

const KPIS_STORE = {
  teamSales: 4820000,
  teamGoal:  5500000,
  floor: [
    { baId:'ba-01', sales: 1184020, conv: 0.56, nps: 9.2, coverage: 0.92 },
    { baId:'ba-02', sales: 912300,  conv: 0.49, nps: 8.8, coverage: 0.88 },
    { baId:'ba-03', sales: 1345600, conv: 0.61, nps: 9.4, coverage: 0.95 },
    { baId:'ba-05', sales: 842900,  conv: 0.44, nps: 8.6, coverage: 0.81 },
  ],
};

const KPIS_HQ = {
  revenueMxn: 38_420_000,
  revenueGoal: 42_000_000,
  brandSplit: { 'Lancôme': 0.58, 'YSL': 0.42 },
  byStore: [
    { storeId:'st-001', sales: 11_240_000, conv: 0.54, clients: 2840, nps: 9.1 },
    { storeId:'st-003', sales:  9_860_000, conv: 0.58, clients: 2210, nps: 9.3 },
    { storeId:'st-004', sales:  7_420_000, conv: 0.51, clients: 1830, nps: 8.9 },
    { storeId:'st-002', sales:  5_190_000, conv: 0.47, clients: 1420, nps: 8.7 },
    { storeId:'st-005', sales:  4_710_000, conv: 0.50, clients: 1280, nps: 9.0 },
  ],
  consentRates:  { SMS: 0.82, Email: 0.91, WhatsApp: 0.74 },
  sampleRoi:     0.34, // 34% conversion
  followUpConv:  0.28,
};

// Calcula edad en años desde un ISO date (YYYY-MM-DD) o cualquier formato Date-parseable.
window.calcAge = function calcAge(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a >= 0 && a < 150 ? a : null;
};

// Currency + date helpers
const MXN = (n) => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', maximumFractionDigits:0 }).format(n);
const MXNc = (n) => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(n);
const fmtDate = (iso) => { try { return new Intl.DateTimeFormat('es-MX', { day:'2-digit', month:'short', year:'numeric' }).format(new Date(iso)); } catch { return iso; } };
const fmtTime = (iso) => { try { return new Intl.DateTimeFormat('es-MX', { hour:'2-digit', minute:'2-digit' }).format(new Date(iso)); } catch { return iso; } };
const fmtRel  = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const days = Math.round((Date.now() - d.getTime()) / (1000*60*60*24));
  // Fechas en el futuro o "casi ahora" se muestran como hoy.
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7)   return `hace ${days} días`;
  if (days < 30)  return `hace ${Math.round(days/7)} sem`;
  if (days < 365) return `hace ${Math.round(days/30)} meses`;
  return `hace ${Math.round(days/365)} años`;
};

const getClient  = (id) => CLIENTS.find(c => c.id === id);
const getBA      = (id) => BAS.find(b => b.id === id);
const getStore   = (id) => STORES.find(s => s.id === id);
const getProduct = (sku) => PRODUCTS.find(p => p.sku === sku);
const clientConsents = (id) => CONSENTS.filter(c => c.clientId === id);
const clientSamples  = (id) => SAMPLES.filter(s => s.clientId === id);
const clientMsgs     = (id) => MESSAGES.filter(m => m.clientId === id);
const clientRecs     = (id) => RECOMMENDATIONS.filter(r => r.clientId === id);
const clientInteractions = (id) => INTERACTIONS.filter(i => i.clientId === id).sort((a,b) => new Date(b.at) - new Date(a.at));
const clientPurchases = (id) => PURCHASES.filter(p => p.clientId === id).sort((a,b) => new Date(b.at) - new Date(a.at));
const clientComms     = (id) => COMMUNICATIONS.filter(c => c.clientId === id).sort((a,b) => new Date(b.at) - new Date(a.at));

// ── Eventos de vida (RF-09) ──────────────────────────────────────────────
// Calcula eventos próximos para una clienta: cumpleaños, aniversario como
// clienta (basado en `since`), y reposiciones detectadas por producto
// comprado (lastPurchaseDate + lifecycleDays cae dentro de la ventana).
//
//   getUpcomingEvents(client, { now?, windowDays? })
//     → [{ type, label, date, daysUntil, meta? }, ...]
//
//   type ∈ 'birthday' | 'anniversary' | 'replenishment'

function _daysBetween(a, b) {
  const ms = b.setHours(0,0,0,0) - a.setHours(0,0,0,0);
  return Math.round(ms / 86400000);
}

function getUpcomingEvents(client, opts) {
  if (!client) return [];
  const now = (opts && opts.now) || new Date();
  const windowDays = (opts && opts.windowDays) || 60;
  const events = [];

  // Cumpleaños
  if (client.birthday) {
    const bd = new Date(client.birthday);
    const candidate = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      candidate.setFullYear(now.getFullYear() + 1);
    }
    const days = _daysBetween(new Date(now), candidate);
    if (days >= 0 && days <= windowDays) {
      events.push({
        type: 'birthday',
        label: `Cumpleaños · ${candidate.getFullYear() - bd.getFullYear()} años`,
        date: candidate.toISOString().slice(0,10),
        daysUntil: days,
      });
    }
  }

  // Aniversario como clienta (basado en `since` — año o fecha)
  if (client.since) {
    const sinceStr = String(client.since);
    const sinceDate = sinceStr.length === 4
      ? new Date(parseInt(sinceStr, 10), 0, 1) // solo año → 1 enero
      : new Date(sinceStr);
    if (!isNaN(sinceDate.getTime())) {
      const candidate = new Date(now.getFullYear(), sinceDate.getMonth(), sinceDate.getDate());
      if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        candidate.setFullYear(now.getFullYear() + 1);
      }
      const days = _daysBetween(new Date(now), candidate);
      const years = candidate.getFullYear() - sinceDate.getFullYear();
      if (days >= 0 && days <= windowDays && years >= 1) {
        events.push({
          type: 'anniversary',
          label: `Aniversario · ${years} año${years === 1 ? '' : 's'} como clienta`,
          date: candidate.toISOString().slice(0,10),
          daysUntil: days,
        });
      }
    }
  }

  // Reposiciones detectadas — última compra de cada SKU + lifecycleDays.
  const purchases = clientPurchases(client.id);
  const lastBySku = {};
  purchases.forEach((p) => {
    p.items.forEach((it) => {
      if (!lastBySku[it.sku] || new Date(p.at) > new Date(lastBySku[it.sku].at)) {
        lastBySku[it.sku] = { at: p.at, brand: p.brand };
      }
    });
  });
  Object.entries(lastBySku).forEach(([sku, last]) => {
    const product = getProduct(sku);
    if (!product || !product.lifecycleDays) return;
    const ran = new Date(last.at);
    const due = new Date(ran);
    due.setDate(due.getDate() + product.lifecycleDays);
    const days = _daysBetween(new Date(now), due);
    if (days >= -7 && days <= windowDays) {
      events.push({
        type: 'replenishment',
        label: `Reposición · ${product.line}`,
        date: due.toISOString().slice(0,10),
        daysUntil: days,
        meta: { sku, brand: product.brand, productName: product.name },
      });
    }
  });

  events.sort((a, b) => a.daysUntil - b.daysUntil);
  return events;
}

// Eventos próximos en todo el portafolio de un BA (para Home).
//   getUpcomingEventsForBA(baId?, opts?) → [{ client, event }, ...]
//
// Estrategia de scope (en orden de preferencia):
//   1. Clientes con interacción previa con este BA (compras, recs, muestras).
//   2. Si no hay suficientes (≥3), agregamos clientes cuyas marcas intersecan
//      con las del BA — así una BA Lancôme ve cumpleaños de toda clienta
//      Lancôme aunque nunca la haya atendido aún.
//   3. Para roles Manager/Supervisor/Admin (sin brands específicas), todos.
function getUpcomingEventsForBA(baId, opts) {
  const id = baId || (window.CURRENT_BA && window.CURRENT_BA.id);
  if (!id) return [];
  const ba = getBA(id) || (window.USERS || []).find((u) => u.id === id);
  const baBrands = ba && Array.isArray(ba.brands) ? ba.brands : null;
  const isPrivileged = ba && ['Manager','Supervisor','Admin','HQ'].includes(ba.role);

  const hadInteraction = (c) =>
    PURCHASES.some((p) => p.clientId === c.id && p.baId === id) ||
    RECOMMENDATIONS.some((r) => r.clientId === c.id && r.baId === id) ||
    SAMPLES.some((s) => s.clientId === c.id && s.baId === id) ||
    INTERACTIONS.some((i) => i.clientId === c.id && i.baId === id);

  const sharesBrand = (c) =>
    !baBrands || (Array.isArray(c.brands) && c.brands.some((b) => baBrands.includes(b)));

  const scoped = CLIENTS.filter((c) => {
    if (isPrivileged) return true;
    if (hadInteraction(c)) return true;
    return sharesBrand(c);
  });

  const allEvents = [];
  scoped.forEach((c) => {
    const evs = getUpcomingEvents(c, opts);
    evs.forEach((ev) => allEvents.push({ client: c, event: ev }));
  });
  allEvents.sort((a, b) => a.event.daysUntil - b.event.daysUntil);
  return allEvents;
}

Object.assign(window, {
  STORES, BAS, CLIENTS, PRODUCTS, CONSENTS, INTERACTIONS, RECOMMENDATIONS,
  SAMPLES, MESSAGES, TEMPLATES, APPOINTMENTS, TASKS, DEVICES, TICKETS, INTEGRATIONS,
  KPIS_BA, KPIS_STORE, KPIS_HQ, PRIVACY_NOTICE_VERSION,
  USERS, SEGMENT_RULES, PURCHASES, COMMUNICATIONS,
  MXN, MXNc, fmtDate, fmtTime, fmtRel,
  clientSegment, clientLevelProgress,
  getClient, getBA, getStore, getProduct,
  clientConsents, clientSamples, clientMsgs, clientRecs, clientInteractions,
  clientPurchases, clientComms,
  getUpcomingEvents, getUpcomingEventsForBA,
});
