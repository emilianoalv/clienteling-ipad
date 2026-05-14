// Control de acceso por rol (RBAC) para el prototipo.
//
// Reglas:
//   BA        → solo su tienda + marcas asignadas. Ve sus propios clientes y los
//               atendidos por su BA principal.
//   Manager   → todos los BAs y datos de su tienda. Marcas de la tienda.
//   Supervisor→ múltiples tiendas (user.storeIds). Marcas combinadas.
//   Admin     → todo, sin restricciones.
//
// Uso:
//   const scope = useScope();
//   const visible = clients.filter(c => scope.canSeeClient(c));
//   if (scope.canEdit('templates')) { ... }

function _userScope(user) {
  if (!user) return { role: 'guest', storeIds: [], brandIds: [], isAdmin: false };

  const role = user.role;

  // Resolver tiendas
  let storeIds = [];
  if (role === 'Admin') storeIds = (window.STORES || []).map((s) => s.id);
  else if (role === 'Supervisor') storeIds = user.storeIds || [];
  else if (user.storeId) storeIds = [user.storeId];

  // Resolver marcas (Admin y Supervisor = todas)
  let brandIds = [];
  if (role === 'Admin' || role === 'Supervisor') {
    brandIds = ['Lancôme', 'YSL'];
  } else if (Array.isArray(user.brands) && user.brands.length) {
    brandIds = user.brands.slice();
  } else {
    brandIds = ['Lancôme', 'YSL'];
  }

  const isAdmin = role === 'Admin';

  return {
    role,
    user,
    storeIds,
    brandIds,
    isAdmin,

    // ── Cliente visible ─
    canSeeClient(client) {
      if (!client) return false;
      if (isAdmin) return true;

      // Filtro por marca: alguna marca del cliente debe estar en el scope.
      const clientBrands = client.brands || [];
      if (clientBrands.length && !clientBrands.some((b) => brandIds.includes(b))) return false;

      // Filtro por tienda: si hay scope de tienda, el cliente debe haber visitado
      // alguna de ellas. Como CLIENTS no tiene storeId directo, derivamos vía
      // compras / interacciones: si alguna compra del cliente fue en una tienda
      // del scope, lo dejamos pasar.
      if (storeIds.length) {
        const purchases = (window.PURCHASES || []).filter((p) => p.clientId === client.id);
        if (purchases.length) {
          const seen = purchases.some((p) => storeIds.includes(p.storeId));
          if (!seen) return false;
        }
        // Si nunca ha comprado, lo asignamos por BA: ¿algún BA del scope lo registró?
        else {
          const recs = (window.RECOMMENDATIONS || []).filter((r) => r.clientId === client.id);
          const myBaIds = (window.BAS || []).filter((b) => storeIds.includes(b.storeId)).map((b) => b.id);
          if (recs.length && !recs.some((r) => myBaIds.includes(r.baId))) return false;
        }
      }

      // BA: si el cliente fue atendido por otro BA y nunca por mí, no debería verlo.
      // Esto es opcional y configurable — para demo lo dejamos relajado.
      return true;
    },

    // ── BA visible ─
    canSeeBA(ba) {
      if (isAdmin) return true;
      if (!ba) return false;
      if (storeIds.length && !storeIds.includes(ba.storeId)) return false;
      return true;
    },

    // ── Tienda visible ─
    canSeeStore(store) {
      if (isAdmin) return true;
      if (!store) return false;
      return storeIds.includes(store.id);
    },

    // ── Permisos de escritura por área ─
    canEdit(area) {
      if (isAdmin) return true;
      switch (area) {
        case 'clients':       return ['BA', 'Manager', 'Supervisor'].includes(role);
        case 'purchases':     return ['BA', 'Manager'].includes(role);
        case 'recommendations': return ['BA', 'Manager'].includes(role);
        case 'appointments':  return ['BA', 'Manager'].includes(role);
        case 'communications': return ['BA', 'Manager'].includes(role);
        case 'templates':     return ['Manager', 'Supervisor', 'Admin'].includes(role);
        case 'users':         return ['Admin'].includes(role);
        case 'integrations':  return ['Admin'].includes(role);
        case 'stores':        return ['Admin'].includes(role);
        default:              return false;
      }
    },

    // ── Filtros listos para usar ─
    filterClients(list) { return (list || []).filter((c) => this.canSeeClient(c)); },
    filterBAs(list) { return (list || []).filter((b) => this.canSeeBA(b)); },
    filterStores(list) { return (list || []).filter((s) => this.canSeeStore(s)); },
  };
}

// Hook: scope del usuario actual. Re-renderiza cuando CURRENT_BA cambia.
function useScope() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const onSession = () => setTick((n) => n + 1);
    window.addEventListener('lx-session', onSession);
    return () => window.removeEventListener('lx-session', onSession);
  }, []);
  return _userScope(window.CURRENT_BA);
}

// Versión funcional (sin React) — útil en helpers.
function getScope() {
  return _userScope(window.CURRENT_BA);
}

Object.assign(window, { useScope, getScope });
