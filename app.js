/* ═══════════════════════════════════════════════════════════
   DELIZIA — app.js v2.0 — Profesional
   DB: localStorage | Roles: admin, empleado, cliente
   Fotos: productos, perfiles | Bitácora | Reportes
═══════════════════════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────────────────────
//  DB HELPERS
// ─────────────────────────────────────────────────────────
const DB = {
  get:    k  => JSON.parse(localStorage.getItem('dz_' + k) || '[]'),
  set:    (k,v) => localStorage.setItem('dz_' + k, JSON.stringify(v)),
  nextId: k  => { const a = DB.get(k); return a.length ? Math.max(...a.map(i=>i.id))+1 : 1; }
};

// ─────────────────────────────────────────────────────────
//  BITÁCORA
// ─────────────────────────────────────────────────────────
function logEvent(tipo, titulo, detalle, imgUrl) {
  const logs = DB.get('bitacora');
  const now  = new Date();
  logs.unshift({
    id:      Date.now(),
    tipo,
    titulo,
    detalle,
    imgUrl:  imgUrl || null,
    fecha:   now.toLocaleDateString('es-BO'),
    hora:    now.toLocaleTimeString('es-BO', { hour:'2-digit', minute:'2-digit' }),
    usuario: session ? session.nombre : 'Sistema'
  });
  DB.set('bitacora', logs.slice(0, 100)); // Máx 100 entradas
}

// ─────────────────────────────────────────────────────────
//  SEED DATA
// ─────────────────────────────────────────────────────────
function seedDB() {
  if (localStorage.getItem('dz_seeded_v4')) return;
  const sinDatos = k => !localStorage.getItem('dz_' + k);

  // Usuarios demo: se agregan sin borrar los que ya existen (clientes registrados desde el login)
  const users = DB.get('users');
  [
    { id:1, nombre:'Alexander Mendoza', usuario:'alexander@delizia.bo', password:'admin123', rol:'admin',    activo:true,  foto:null },
    { id:2, nombre:'Alan Flores',       usuario:'alan@delizia.bo',      password:'emp123',   rol:'empleado', activo:true,  foto:null },
    { id:3, nombre:'Patricia Soliz',    usuario:'paty@delizia.bo',      password:'paty123',  rol:'empleado', activo:true,  foto:null },
  ].forEach(b => { if (!users.find(u => u.usuario === b.usuario)) users.push(b); });
  DB.set('users', users);

  if (sinDatos('empleados')) DB.set('empleados', [
    { id:1, userId:2, nombre:'Alan Flores',    correo:'alan@delizia.bo',     telefono:'+591 77 100 200', cargo:'Ejecutivo de Ventas',    departamento:'Ventas',     activo:true, desde:'2021', foto:null },
    { id:2, userId:3, nombre:'Patricia Soliz', correo:'paty@delizia.bo',     telefono:'+591 70 300 400', cargo:'Jefa de Producción',     departamento:'Producción', activo:true, desde:'2019', foto:null },
    { id:3, userId:null, nombre:'Roberto Quispe', correo:'roberto@delizia.bo', telefono:'+591 68 500 600', cargo:'Coordinador Logístico', departamento:'Logística',  activo:true, desde:'2022', foto:null },
  ]);

  if (sinDatos('clientes')) DB.set('clientes', []); // Los clientes se registran solos

  if (sinDatos('proveedores')) DB.set('proveedores', [
    { id:1, empresa:'Agrobol S.A.',    rubro:'Granos y cereales',  ciudad:'El Alto, La Paz',   telefono:'+591 2 234 5678', correo:'ventas@agrobol.bo',    pago:'Crédito 30 días', activo:true },
    { id:2, empresa:'Cacao Alto Beni', rubro:'Cacao premium',      ciudad:'Alto Beni, Beni',   telefono:'+591 3 456 7890', correo:'info@cacaoaltobeni.bo', pago:'Contado',         activo:true },
    { id:3, empresa:'Hierbas Andinas', rubro:'Hierbas aromáticas', ciudad:'Sucre, Chuquisaca', telefono:'+591 4 567 8901', correo:'hierbas@andinas.bo',    pago:'Crédito 15 días', activo:true },
  ]);

  // Precio de venta a agencias, costo y vida útil son valores referenciales del equipo
  DB.set('productos', [
    { id:1, nombre:'Cono Tentación',           precio:3.50,  costo:1.80,  vidaUtil:180, stock:4200, categoria:'Helados', descripcion:'Helado de cono, línea impulsivos.',                 imgUrl:null },
    { id:2, nombre:'Megacono',                 precio:5.00,  costo:2.60,  vidaUtil:180, stock:2600, categoria:'Helados', descripcion:'Helado de cono grande, línea impulsivos.',          imgUrl:null },
    { id:3, nombre:'Bolo Delizia',             precio:1.00,  costo:0.45,  vidaUtil:180, stock:9000, categoria:'Helados', descripcion:'Bolo de fruta congelado.',                          imgUrl:null },
    { id:4, nombre:'Yogurt familiar frutilla', precio:18.00, costo:10.50, vidaUtil:30,  stock:640,  categoria:'Lácteos', descripcion:'Yogurt sabor frutilla, presentación familiar.',     imgUrl:null },
    { id:5, nombre:'Yogurt bebible durazno',   precio:6.00,  costo:3.40,  vidaUtil:25,  stock:1100, categoria:'Lácteos', descripcion:'Yogurt bebible sabor durazno.',                     imgUrl:null },
    { id:6, nombre:'Ice Fruit Citrus Punch',   precio:3.00,  costo:1.50,  vidaUtil:30,  stock:3500, categoria:'Bebidas', descripcion:'Bebida refrigerada sabor citrus punch.',            imgUrl:null },
    { id:7, nombre:'Néctar Frush durazno 2L',  precio:12.00, costo:7.00,  vidaUtil:90,  stock:800,  categoria:'Bebidas', descripcion:'Néctar de durazno, botella de 2 litros.',           imgUrl:null },
    { id:8, nombre:'Té helado Bongo durazno 2L', precio:10.00, costo:5.80, vidaUtil:90, stock:700,  categoria:'Bebidas', descripcion:'Té helado sabor durazno, botella de 2 litros.',     imgUrl:null },
  ]);

  DB.set('categorias', [
    { id:1, nombre:'Helados', descripcion:'Impulsivos, clásicos, bolos y conos', color:'var(--blue-400)' },
    { id:2, nombre:'Lácteos', descripcion:'Leches, yogurts, cremas y postres',   color:'var(--red-400)' },
    { id:3, nombre:'Bebidas', descripcion:'Ice Fruit, Néctar Frush, té helado',  color:'var(--cyan-300)' },
  ]);

  DB.set('pedidos', [
    { id:1, orden:'ORD-0001', clienteId:null, cliente:'Agencia Demo', fecha:'14/10/2026', productos:'Cono Tentación × 120, Bolo Delizia × 300', total:720.00, estado:'Entregado' },
    { id:2, orden:'ORD-0002', clienteId:null, cliente:'Agencia Demo', fecha:'20/10/2026', productos:'Ice Fruit Citrus Punch × 200',             total:600.00, estado:'En proceso' },
  ]);

  DB.set('planes', []);

  DB.set('bitacora', [
    { id:1, tipo:'sistema', titulo:'Sistema inicializado', detalle:'Base de datos Delizia creada con datos de ejemplo.', imgUrl:null, fecha:new Date().toLocaleDateString('es-BO'), hora:'08:00', usuario:'Sistema' },
  ]);

  localStorage.setItem('dz_seeded_v4', '1');
}

// ─────────────────────────────────────────────────────────
//  SESIÓN
// ─────────────────────────────────────────────────────────
let session = null;

function logout() {
  sessionStorage.removeItem('dz_session');
  window.location.href = 'login.html';
}

// ─────────────────────────────────────────────────────────
//  NAVEGACIÓN
// ─────────────────────────────────────────────────────────
const SECTION_NAMES = {
  dashboard:'Dashboard', nosotros:'Sobre Delizia', bitacora:'Bitácora',
  reportes:'Informes y Reportes', planificacion:'Planificación de la producción',
  administrador:'Administradores', empleados:'Empleados',
  clientes:'Clientes', proveedores:'Proveedores',
  productos:'Productos', categorias:'Categorías', pedidos:'Pedidos',
  'emp-dashboard':'Inicio', 'emp-pedidos':'Pedidos',
  'emp-productos':'Catálogo', 'emp-clientes':'Clientes', 'emp-perfil':'Mi Perfil',
  'cli-inicio':'Inicio', 'cli-catalogo':'Catálogo',
  'cli-mispedidos':'Mis Pedidos', 'cli-perfil':'Mi Perfil',
};

function navigate(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.getElementById('section-' + sectionId);
  if (target) target.classList.add('active');
  document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(n => n.classList.add('active'));
  document.getElementById('breadcrumb').innerHTML = `Delizia <span>/ ${SECTION_NAMES[sectionId] || sectionId}</span>`;
  document.getElementById('sidebar').classList.remove('mobile-open');
  renderSection(sectionId);
}

function renderSection(id) {
  const map = {
    dashboard:       renderDashboard,
    nosotros:        ()=>{},
    bitacora:        renderBitacora,
    reportes:        renderReportes,
    planificacion:   renderPlanificacion,
    administrador:   renderAdmins,
    empleados:       renderEmpleados,
    clientes:        renderClientes,
    proveedores:     renderProveedores,
    productos:       ()=>renderProductos('grid-productos', true),
    categorias:      renderCategorias,
    pedidos:         ()=>renderPedidos('tbl-pedidos', true),
    'emp-dashboard': renderEmpDashboard,
    'emp-pedidos':   ()=>renderPedidos('tbl-emp-pedidos', false),
    'emp-productos': ()=>renderProductos('grid-emp-productos', false),
    'emp-clientes':  renderEmpClientes,
    'emp-perfil':    renderPerfil,
    'cli-inicio':    renderCliInicio,
    'cli-catalogo':  ()=>renderProductos('grid-cli-productos', false),
    'cli-mispedidos':renderCliPedidos,
    'cli-perfil':    renderCliPerfil,
  };
  if (map[id]) map[id]();
}

// ─────────────────────────────────────────────────────────
//  RENDER — DASHBOARD ADMIN
// ─────────────────────────────────────────────────────────
function renderDashboard() {
  animateValue('kpiClientes',    DB.get('clientes').filter(c=>c.activo).length);
  animateValue('kpiProductos',   DB.get('productos').length);
  animateValue('kpiProveedores', DB.get('proveedores').filter(p=>p.activo).length);
  animateValue('kpiPedidos',     DB.get('pedidos').filter(p=>p.estado!=='Entregado').length);

  const logs = DB.get('bitacora').slice(0,5);
  const el   = document.getElementById('activityList');
  if (el) el.innerHTML = logs.map(l => {
    const ic = {producto:'bt-ic-blue',cliente:'bt-ic-red',pedido:'bt-ic-green',empleado:'bt-ic-cyan',proveedor:'bt-ic-gray',sistema:'bt-ic-blue'}[l.tipo]||'bt-ic-blue';
    return `<div class="activity-item">
      <div class="act-dot dot-${ic==='bt-ic-blue'?'blue':ic==='bt-ic-red'?'red':ic==='bt-ic-green'?'green':'cyan'}"></div>
      <div class="act-body">
        <p class="act-text"><strong>${l.titulo}</strong> — ${l.detalle}</p>
        <span class="act-time">${l.fecha} ${l.hora} · ${l.usuario}</span>
      </div>
    </div>`;
  }).join('') || '<p style="color:var(--text-muted);font-size:13px">Sin actividad reciente.</p>';
}

// ─────────────────────────────────────────────────────────
//  RENDER — BITÁCORA
// ─────────────────────────────────────────────────────────
const BT_ICON_MAP = {
  producto:'#ico-product', cliente:'#ico-user', pedido:'#ico-order',
  empleado:'#ico-users',   proveedor:'#ico-supplier', sistema:'#ico-log',
  planificacion:'#ico-tree',
};
const BT_IC_CLASS = {
  producto:'bt-ic-blue', cliente:'bt-ic-red', pedido:'bt-ic-green',
  empleado:'bt-ic-cyan', proveedor:'bt-ic-gray', sistema:'bt-ic-blue',
  planificacion:'bt-ic-red',
};
const BT_TAG_CLASS = {
  producto:'bt-tag-prod',cliente:'bt-tag-cli',pedido:'bt-tag-ped',
  empleado:'bt-tag-emp', proveedor:'bt-tag-prov', planificacion:'bt-tag-cli',
};
const BT_C = {
  producto:'var(--blue-400)',cliente:'var(--red-400)',pedido:'#4caf50',
  empleado:'var(--cyan-300)',proveedor:'#9c27b0',sistema:'var(--blue-300)',
  planificacion:'var(--red-500)',
};

function renderBitacora() {
  const filtro = document.getElementById('filtroBitacora')?.value || '';
  let logs = DB.get('bitacora');
  if (filtro) logs = logs.filter(l => l.tipo === filtro);

  const container = document.getElementById('bitacoraTimeline');
  if (!container) return;

  if (!logs.length) {
    container.innerHTML = '<div class="bt-empty">No hay eventos registrados.</div>';
    return;
  }

  container.innerHTML = logs.map((l,i) => {
    const ic  = BT_IC_CLASS[l.tipo] || 'bt-ic-blue';
    const ico = BT_ICON_MAP[l.tipo] || '#ico-log';
    const tag = BT_TAG_CLASS[l.tipo];
    const c   = BT_C[l.tipo] || 'var(--blue-400)';
    const ring= l.tipo==='cliente' ? 'var(--red-100)' : l.tipo==='pedido' ? '#d4f7d4' : 'var(--blue-100)';
    const imgHtml = l.imgUrl ? `<img src="${l.imgUrl}" class="bt-img" alt="imagen" />` : '';
    return `
      <div class="bt-item" style="--bt-c:${c};--bt-ring:${ring};animation-delay:${i*40}ms">
        <div class="bt-icon ${ic}">
          <svg width="18" height="18"><use href="${ico}"/></svg>
        </div>
        <div class="bt-body">
          <strong>${l.titulo}</strong>
          <p>${l.detalle}</p>
          <div class="bt-meta">
            <span class="bt-time">${l.fecha} a las ${l.hora}</span>
            <span class="bt-user">${l.usuario}</span>
            ${tag?`<span class="bt-tag ${tag}">${l.tipo}</span>`:''}
          </div>
        </div>
        ${imgHtml}
      </div>`;
  }).join('');
}

function limpiarBitacora() {
  if (!confirm('¿Limpiar toda la bitácora?')) return;
  DB.set('bitacora', []);
  renderBitacora();
  showToast('Bitácora limpiada', 'info');
}

// ─────────────────────────────────────────────────────────
//  RENDER — REPORTES
// ─────────────────────────────────────────────────────────
function renderReportes() {
  const pedidos   = DB.get('pedidos');
  const clientes  = DB.get('clientes');
  const productos = DB.get('productos');
  const empleados = DB.get('empleados');
  const proveedores = DB.get('proveedores');

  const pend   = pedidos.filter(p=>p.estado==='Pendiente').length;
  const proc   = pedidos.filter(p=>p.estado==='En proceso').length;
  const env    = pedidos.filter(p=>p.estado==='Enviado').length;
  const entr   = pedidos.filter(p=>p.estado==='Entregado').length;
  const total  = pedidos.length || 1;
  const ingresos = pedidos.reduce((s,p)=>s+p.total,0);

  // Pie pedidos
  const pie = buildPie([
    { label:'Pendiente',  val:pend, color:'#f05050' },
    { label:'En proceso', val:proc, color:'#4a9fd4' },
    { label:'Enviado',    val:env,  color:'#60bde4' },
    { label:'Entregado',  val:entr, color:'#4caf50' },
  ], total);

  // Productos por categoría
  const cats = DB.get('categorias').map(c => c.nombre);
  const catProds = cats.map(c => productos.filter(p=>p.categoria===c).length);
  const maxCat   = Math.max(...catProds, 1);

  const container = document.getElementById('reportContainer');
  if (!container) return;

  container.innerHTML = `
    <!-- KPI summary -->
    <div class="kpi-grid" style="margin-bottom:22px">
      <div class="kpi-card kpi-blue">
        <div class="kpi-icon-wrap kpi-ic-blue"><svg width="22" height="22"><use href="#ico-order"/></svg></div>
        <div class="kpi-data"><span class="kpi-value">${pedidos.length}</span><span class="kpi-label">Total pedidos</span></div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-icon-wrap kpi-ic-green"><svg width="22" height="22"><use href="#ico-chart"/></svg></div>
        <div class="kpi-data"><span class="kpi-value">Bs. ${ingresos.toFixed(0)}</span><span class="kpi-label">Ingresos totales</span></div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-icon-wrap kpi-ic-red"><svg width="22" height="22"><use href="#ico-user"/></svg></div>
        <div class="kpi-data"><span class="kpi-value">${clientes.length}</span><span class="kpi-label">Clientes registrados</span></div>
      </div>
      <div class="kpi-card kpi-cyan">
        <div class="kpi-icon-wrap kpi-ic-cyan"><svg width="22" height="22"><use href="#ico-product"/></svg></div>
        <div class="kpi-data"><span class="kpi-value">${productos.length}</span><span class="kpi-label">Productos en catálogo</span></div>
      </div>
    </div>

    <div class="report-grid">
      <!-- Pie estado pedidos -->
      <div class="report-card">
        <h3><svg width="18" height="18"><use href="#ico-order"/></svg> Estado de Pedidos</h3>
        <div class="pie-wrap">
          <div class="pie-chart" style="background: conic-gradient(
            #f05050 0% ${pend/total*100}%,
            #4a9fd4 ${pend/total*100}% ${(pend+proc)/total*100}%,
            #60bde4 ${(pend+proc)/total*100}% ${(pend+proc+env)/total*100}%,
            #4caf50 ${(pend+proc+env)/total*100}% 100%
          );"></div>
          <div class="pie-legend">
            <div class="pie-legend-item"><div class="pie-dot" style="background:#f05050"></div>Pendiente<span>${pend}</span></div>
            <div class="pie-legend-item"><div class="pie-dot" style="background:#4a9fd4"></div>En proceso<span>${proc}</span></div>
            <div class="pie-legend-item"><div class="pie-dot" style="background:#60bde4"></div>Enviado<span>${env}</span></div>
            <div class="pie-legend-item"><div class="pie-dot" style="background:#4caf50"></div>Entregado<span>${entr}</span></div>
          </div>
        </div>
      </div>

      <!-- Productos por categoría -->
      <div class="report-card">
        <h3><svg width="18" height="18"><use href="#ico-category"/></svg> Productos por Categoría</h3>
        ${cats.map((c,i)=>{
          const colors=['var(--blue-500)','var(--red-400)','var(--cyan-300)','#4caf50'];
          return `<div class="stat-row">
            <span class="stat-label">${c}</span>
            <div class="stat-bar-outer"><div class="stat-bar-inner" style="width:${catProds[i]/maxCat*100}%;background:${colors[i]}"></div></div>
            <span class="stat-val">${catProds[i]}</span>
          </div>`;
        }).join('')}
      </div>

      <!-- Diagrama del sistema (full width) -->
      <div class="report-card report-full">
        <h3><svg width="18" height="18"><use href="#ico-log"/></svg> Diagrama del Sistema — Flujo de Operación</h3>
        <div class="flow-diagram">
          <div class="flow-node">
            <div class="flow-node-box fn-blue">Administrador</div>
            <p>Gestión total</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-cyan">Empleados</div>
            <p>Operación diaria</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-green">Clientes</div>
            <p>Compras / Pedidos</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-red">Pedidos</div>
            <p>Procesamiento</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-gray">Entrega</div>
            <p>Logística</p>
          </div>
        </div>
        <hr style="margin:18px 0;border:none;border-top:1px solid var(--border)"/>
        <!-- Segunda fila: proveedores -->
        <div class="flow-diagram">
          <div class="flow-node">
            <div class="flow-node-box fn-gray">Proveedores</div>
            <p>Abastecimiento</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-blue">Almacén / Stock</div>
            <p>Inventario</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-cyan">Producción</div>
            <p>Elaboración</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-red">Catálogo</div>
            <p>${productos.length} productos</p>
          </div>
          <div class="flow-arrow">&#8594;</div>
          <div class="flow-node">
            <div class="flow-node-box fn-green">Venta</div>
            <p>Bs. ${ingresos.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <!-- Resumen equipo -->
      <div class="report-card">
        <h3><svg width="18" height="18"><use href="#ico-users"/></svg> Equipo Delizia</h3>
        ${[
          {label:'Administradores', val: DB.get('users').filter(u=>u.rol==='admin').length,    color:'var(--blue-500)'},
          {label:'Empleados activos',val: empleados.filter(e=>e.activo).length,                 color:'var(--cyan-300)'},
          {label:'Clientes activos', val: clientes.filter(c=>c.activo).length,                  color:'var(--red-400)'},
          {label:'Proveedores',      val: proveedores.filter(p=>p.activo).length,                color:'#4caf50'},
        ].map(r=>`
          <div class="stat-row">
            <span class="stat-label">${r.label}</span>
            <div class="stat-bar-outer"><div class="stat-bar-inner" style="width:${Math.min(r.val*15,100)}%;background:${r.color}"></div></div>
            <span class="stat-val">${r.val}</span>
          </div>`).join('')}
      </div>

      <!-- Stock crítico -->
      <div class="report-card">
        <h3><svg width="18" height="18"><use href="#ico-product"/></svg> Stock de Productos</h3>
        ${productos.map(p=>`
          <div class="stat-row">
            <span class="stat-label">${p.nombre}</span>
            <div class="stat-bar-outer">
              <div class="stat-bar-inner" style="width:${Math.min(p.stock/5,100)}%;background:${p.stock<50?'var(--red-400)':'var(--blue-400)'}"></div>
            </div>
            <span class="stat-val" style="color:${p.stock<50?'var(--red-500)':'var(--text-primary)'}">${p.stock}</span>
          </div>`).join('')}
      </div>
    </div>`;

  // Animar barras con delay
  setTimeout(()=>{
    container.querySelectorAll('.stat-bar-inner').forEach(b => {
      const w = b.style.width; b.style.width='0'; setTimeout(()=>b.style.width=w, 50);
    });
  }, 100);
}

function buildPie(slices, total) { return slices; } // CSS conic-gradient used directly

// ─────────────────────────────────────────────────────────
//  RENDER — ADMINS
// ─────────────────────────────────────────────────────────
function renderAdmins() {
  const users = DB.get('users').filter(u=>u.rol==='admin');
  const tbody = document.getElementById('tbl-admins');
  if (!tbody) return;
  tbody.innerHTML = users.map(u=>`
    <tr>
      <td><span class="id-badge">#${String(u.id).padStart(3,'0')}</span></td>
      <td>
        <div class="avatar-cell">
          <div class="av av-blue" style="${u.foto?'padding:0;overflow:hidden':''}">
            ${u.foto?`<img src="${u.foto}" style="width:100%;height:100%;object-fit:cover" />`:`${initials(u.nombre)}`}
          </div>
          ${u.nombre}
        </div>
      </td>
      <td>${u.usuario}</td>
      <td><span class="role-badge role-super">Admin</span></td>
      <td><span class="status-dot ${u.activo?'active':'inactive'}"></span>${u.activo?'Activo':'Inactivo'}</td>
      <td>
        <div class="action-btns">
          <button class="act-edit" title="Editar foto" onclick="abrirEditFotoUser(${u.id})">
            <svg width="14" height="14"><use href="#ico-image"/></svg>
          </button>
          <button class="act-del" title="Eliminar" onclick="confirmarEliminar('users',${u.id})">
            <svg width="14" height="14"><use href="#ico-trash"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Sin administradores</td></tr>';
}

// ─────────────────────────────────────────────────────────
//  RENDER — EMPLEADOS
// ─────────────────────────────────────────────────────────
const EMP_COLORS = ['bg-blue','bg-red','bg-cyan','bg-green'];

function renderEmpleados() {
  const filtro = (document.getElementById('filtroDepto')?.value||'').toLowerCase();
  let emps = DB.get('empleados');
  if (filtro) emps = emps.filter(e=>e.departamento.toLowerCase()===filtro);
  const container = document.getElementById('cards-empleados');
  if (!container) return;
  container.innerHTML = emps.map((e,i)=>`
    <div class="emp-card">
      <div class="emp-header ${EMP_COLORS[i%4]}">
        ${e.foto
          ? `<img src="${e.foto}" class="emp-avatar-img" alt="${e.nombre}" />`
          : `<div class="emp-avatar" style="background:rgba(255,255,255,0.25)">${initials(e.nombre)}</div>`}
      </div>
      <div class="emp-body">
        <h4>${e.nombre}</h4>
        <p class="emp-role">${e.cargo}</p>
        <p class="emp-dept">${e.departamento}</p>
        <div class="emp-contact">
          <span>${e.correo}</span>
          <span>${e.telefono}</span>
        </div>
        <div class="emp-footer">
          <span class="tag ${e.activo?'tag-green':'tag-red'}">${e.activo?'Activo':'Licencia'}</span>
          <span class="emp-date">Desde ${e.desde}</span>
        </div>
        <div class="action-btns" style="margin-top:10px;justify-content:flex-end">
          <button class="act-edit" title="Editar foto" onclick="abrirEditFotoEmp(${e.id})">
            <svg width="14" height="14"><use href="#ico-image"/></svg>
          </button>
          <button class="act-del" onclick="confirmarEliminar('empleados',${e.id})">
            <svg width="14" height="14"><use href="#ico-trash"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('') +
    `<div class="emp-card add-card" onclick="openModal('modalEmpleado')">
      <div class="add-icon"><svg width="24" height="24"><use href="#ico-plus"/></svg></div>
      <p>Añadir empleado</p>
    </div>`;
}

// ─────────────────────────────────────────────────────────
//  RENDER — CLIENTES
// ─────────────────────────────────────────────────────────
function renderClientes() {
  const filtro = (document.getElementById('filtroTipoCliente')?.value||'').toLowerCase();
  let clis = DB.get('clientes');
  if (filtro) clis = clis.filter(c=>c.tipo.toLowerCase()===filtro);
  const tbody = document.getElementById('tbl-clientes');
  if (!tbody) return;
  if (!clis.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted)">
      <svg width="32" height="32" style="display:block;margin:0 auto 10px;color:var(--blue-300)"><use href="#ico-users"/></svg>
      Los clientes se registran ellos mismos desde la pantalla de login.
    </td></tr>`;
    return;
  }
  tbody.innerHTML = clis.map(c=>`
    <tr>
      <td><span class="id-badge">#${String(c.id).padStart(3,'0')}</span></td>
      <td><div class="avatar-cell"><div class="av av-blue">${initials(c.nombre)}</div>${c.nombre}</div></td>
      <td>${c.correo}</td><td>${c.telefono||'—'}</td><td>${c.ciudad||'—'}</td>
      <td><span class="role-badge ${c.tipo==='Premium'?'role-premium':c.tipo==='Mayorista'?'role-mayor':'role-regular'}">${c.tipo}</span></td>
      <td>Bs. ${(c.totalCompras||0).toLocaleString()}</td>
      <td><span class="status-dot ${c.activo?'active':'inactive'}"></span>${c.activo?'Activo':'Inactivo'}</td>
      <td><div class="action-btns">
        <button class="act-del" onclick="confirmarEliminar('clientes',${c.id})"><svg width="14" height="14"><use href="#ico-trash"/></svg></button>
      </div></td>
    </tr>`).join('');
}

// ─────────────────────────────────────────────────────────
//  RENDER — PROVEEDORES
// ─────────────────────────────────────────────────────────
function renderProveedores() {
  const provs = DB.get('proveedores');
  const container = document.getElementById('cards-proveedores');
  if (!container) return;
  container.innerHTML = provs.map(p=>`
    <div class="prov-card">
      <div class="prov-header">
        <div class="prov-logo"><svg width="28" height="28" style="color:var(--blue-400)"><use href="#ico-supplier"/></svg></div>
        <div><h4>${p.empresa}</h4><p>${p.rubro}</p></div>
      </div>
      <div class="prov-details">
        <div class="prov-row"><svg width="13" height="13"><use href="#ico-profile"/></svg><span>${p.ciudad}</span></div>
        <div class="prov-row"><svg width="13" height="13"><use href="#ico-bell"/></svg><span>${p.telefono}</span></div>
        <div class="prov-row"><svg width="13" height="13"><use href="#ico-search"/></svg><span>${p.correo}</span></div>
        <div class="prov-row"><svg width="13" height="13"><use href="#ico-lock"/></svg><span>${p.pago}</span></div>
      </div>
      <div class="prov-footer">
        <span class="tag ${p.activo?'tag-green':'tag-red'}">${p.activo?'Activo':'Revisión'}</span>
        <button class="act-del" onclick="confirmarEliminar('proveedores',${p.id})" style="background:none;border:none;cursor:pointer">
          <svg width="14" height="14" style="color:var(--red-400)"><use href="#ico-trash"/></svg>
        </button>
      </div>
    </div>`).join('') +
    `<div class="prov-card add-card" onclick="openModal('modalProveedor')">
      <div class="add-icon"><svg width="24" height="24"><use href="#ico-plus"/></svg></div>
      <p>Añadir proveedor</p>
    </div>`;
}

// ─────────────────────────────────────────────────────────
//  RENDER — PRODUCTOS
// ─────────────────────────────────────────────────────────
const PROD_GRADS = [
  'linear-gradient(135deg,#EBF5FF,#BAD8F7)',
  'linear-gradient(135deg,#FFF0F0,#FFB3B3)',
  'linear-gradient(135deg,#D4F0FB,#A0D8F1)',
  'linear-gradient(135deg,#d4f7d4,#b2ebb2)',
  'linear-gradient(135deg,#EBF5FF,#D4F0FB)',
  'linear-gradient(135deg,#FFD6D6,#EBF5FF)',
];

function renderProductos(gridId, isAdmin) {
  const filtroMap = { 'grid-productos':'filtroCatProd', 'grid-emp-productos':'filtroEmpCat', 'grid-cli-productos':'filtroCliCat' };
  const filtro    = (document.getElementById(filtroMap[gridId])?.value||'').toLowerCase();
  let prods = DB.get('productos');
  if (filtro) prods = prods.filter(p=>p.categoria.toLowerCase()===filtro);
  const container = document.getElementById(gridId);
  if (!container) return;
  const isCli = gridId === 'grid-cli-productos';

  container.innerHTML = prods.map((p,i)=>`
    <div class="prod-card">
      ${p.imgUrl
        ? `<div class="prod-img-wrap">
             <img src="${p.imgUrl}" alt="${p.nombre}" />
             ${isAdmin ? `<button class="prod-edit-photo-btn" title="Cambiar foto" onclick="abrirEditFotoProd(${p.id})"><svg width="14" height="14"><use href="#ico-image"/></svg></button>` : ''}
           </div>`
        : `<div class="prod-img-placeholder" style="background:${PROD_GRADS[i%PROD_GRADS.length]}">
             ${isAdmin ? `<button class="prod-edit-photo-btn" style="opacity:1;position:relative;top:auto;right:auto" title="Añadir foto" onclick="abrirEditFotoProd(${p.id})">
               <svg width="14" height="14"><use href="#ico-image"/></svg>
             </button>` : `<svg width="40" height="40"><use href="#ico-product"/></svg>`}
           </div>`}
      <div class="prod-body">
        <span class="prod-cat">${p.categoria}</span>
        <h4>${p.nombre}</h4>
        <p>${p.descripcion}</p>
        <div class="prod-bottom">
          <span class="prod-price">Bs. ${p.precio.toFixed(2)}</span>
          ${isCli
            ? `<button class="btn-primary" style="padding:6px 14px;font-size:12px" onclick="pedirProducto(${p.id})">Pedir</button>`
            : `<span class="prod-stock ${p.stock<50?'stock-low':'stock-ok'}">Stock: ${p.stock}</span>`}
        </div>
        ${isAdmin ? `<div class="action-btns" style="margin-top:10px;justify-content:flex-end">
          <button class="act-edit" onclick="abrirEditFotoProd(${p.id})"><svg width="14" height="14"><use href="#ico-image"/></svg></button>
          <button class="act-del" onclick="confirmarEliminar('productos',${p.id})"><svg width="14" height="14"><use href="#ico-trash"/></svg></button>
        </div>` : ''}
      </div>
    </div>`).join('') +
    (isAdmin ? `<div class="prod-card add-card" onclick="openModal('modalProducto')">
      <div class="add-icon"><svg width="24" height="24"><use href="#ico-plus"/></svg></div><p>Añadir producto</p>
    </div>` : '');
}

// ─────────────────────────────────────────────────────────
//  RENDER — CATEGORIAS
// ─────────────────────────────────────────────────────────
function renderCategorias() {
  const cats = DB.get('categorias');
  const prods = DB.get('productos');
  const container = document.getElementById('grid-categorias');
  if (!container) return;
  container.innerHTML = cats.map((c,i)=>{
    const count = prods.filter(p=>p.categoria===c.nombre).length;
    return `<div class="cat-card" style="--cat-c:${c.color||'var(--blue-400)'}">
      <div class="pillar-icon-svg" style="margin-bottom:10px">
        <svg width="28" height="28"><use href="#ico-category"/></svg>
      </div>
      <h4>${c.nombre}</h4>
      <p>${count} productos</p>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:14px">${c.descripcion}</p>
      <div class="cat-bar"><div class="cat-fill" style="width:${Math.min(count*15,100)}%"></div></div>
      <div style="margin-top:10px;display:flex;justify-content:flex-end">
        <button class="act-del" onclick="confirmarEliminar('categorias',${c.id})" style="background:none;border:none;cursor:pointer">
          <svg width="14" height="14" style="color:var(--red-400)"><use href="#ico-trash"/></svg>
        </button>
      </div>
    </div>`;
  }).join('') +
  `<div class="cat-card add-card" onclick="openModal('modalCategoria')">
    <div class="add-icon"><svg width="24" height="24"><use href="#ico-plus"/></svg></div><p>Nueva categoría</p>
  </div>`;
}

// ─────────────────────────────────────────────────────────
//  RENDER — PEDIDOS
// ─────────────────────────────────────────────────────────
const ESTADO_CLASS = { 'Pendiente':'status-pending','En proceso':'status-process','Enviado':'status-sent','Entregado':'status-done' };
const ESTADO_COLORS = { 'Pendiente':'red','En proceso':'blue','Enviado':'cyan','Entregado':'green' };

function renderPedidos(tbodyId, isAdmin) {
  const filtroMap = { 'tbl-pedidos':'filtroEstadoPedido','tbl-emp-pedidos':'filtroEmpPedido' };
  const filtro    = (document.getElementById(filtroMap[tbodyId])?.value||'');
  let pedidos = DB.get('pedidos');
  if (session?.rol === 'cliente') pedidos = pedidos.filter(p=>p.clienteId===session.id);
  if (filtro) pedidos = pedidos.filter(p=>p.estado===filtro);
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = pedidos.map(p=>`
    <tr>
      <td><span class="id-badge">${p.orden}</span></td>
      <td><div class="avatar-cell"><div class="av av-blue">${initials(p.cliente)}</div>${p.cliente}</div></td>
      <td>${p.fecha}</td>
      <td>${p.productos}</td>
      <td><strong>Bs. ${p.total.toFixed(2)}</strong></td>
      <td><span class="order-status ${ESTADO_CLASS[p.estado]||''}">${p.estado}</span></td>
      <td><div class="action-btns">
        ${!isAdmin ? `<select onchange="cambiarEstadoPedido(${p.id},this.value)" style="padding:4px 8px;border-radius:8px;border:1px solid var(--border);font-size:12px;background:white">
            ${['Pendiente','En proceso','Enviado','Entregado'].map(e=>`<option${e===p.estado?' selected':''}>${e}</option>`).join('')}
          </select>`
          : `<button class="act-del" onclick="confirmarEliminar('pedidos',${p.id})"><svg width="14" height="14"><use href="#ico-trash"/></svg></button>`}
      </div></td>
    </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Sin pedidos</td></tr>`;
}

// ─────────────────────────────────────────────────────────
//  RENDER — EMPLEADO DASHBOARD
// ─────────────────────────────────────────────────────────
function renderEmpDashboard() {
  const pedidos = DB.get('pedidos');
  animateValue('empKpiPedidos', pedidos.filter(p=>p.estado!=='Entregado').length);
  animateValue('empKpiProd',    DB.get('productos').length);
  animateValue('empKpiCli',     DB.get('clientes').length);
  animateValue('empKpiEntr',    pedidos.filter(p=>p.estado==='Entregado').length);
  const el = document.getElementById('empHeroName');
  if (el && session) el.textContent = session.nombre.split(' ')[0];
  const actEl = document.getElementById('empActivityList');
  if (actEl) actEl.innerHTML = pedidos.slice(-4).reverse().map(p=>`
    <div class="activity-item">
      <div class="act-dot dot-${ESTADO_COLORS[p.estado]||'blue'}"></div>
      <div class="act-body">
        <p class="act-text"><strong>${p.orden}</strong> — ${p.cliente}</p>
        <span class="act-time">${p.fecha} · <span class="order-status ${ESTADO_CLASS[p.estado]}" style="padding:1px 6px;font-size:10px">${p.estado}</span></span>
      </div>
    </div>`).join('');
}

function renderEmpClientes() {
  const clis = DB.get('clientes');
  const tbody = document.getElementById('tbl-emp-clientes');
  if (!tbody) return;
  tbody.innerHTML = clis.length ? clis.map(c=>`
    <tr>
      <td><span class="id-badge">#${c.id}</span></td>
      <td><div class="avatar-cell"><div class="av av-blue">${initials(c.nombre)}</div>${c.nombre}</div></td>
      <td>${c.correo}</td><td>${c.telefono||'—'}</td><td>${c.ciudad||'—'}</td>
      <td><span class="role-badge ${c.tipo==='Premium'?'role-premium':c.tipo==='Mayorista'?'role-mayor':'role-regular'}">${c.tipo}</span></td>
      <td><span class="status-dot ${c.activo?'active':'inactive'}"></span>${c.activo?'Activo':'Inactivo'}</td>
    </tr>`).join('')
    : `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Sin clientes registrados aún</td></tr>`;
}

// ─────────────────────────────────────────────────────────
//  RENDER — PERFIL (empleado + admin)
// ─────────────────────────────────────────────────────────
function renderPerfil() {
  if (!session) return;
  const card = document.getElementById('empPerfilCard');
  if (!card) return;
  const user = DB.get('users').find(u=>u.id===session.id);
  const foto = user?.foto;
  card.innerHTML = `
    <div class="profile-big-av" onclick="abrirEditFotoUser(${session.id})">
      ${foto ? `<img src="${foto}" alt="${session.nombre}" />` : initials(session.nombre)}
    </div>
    <div>
      <div class="profile-info">
        <h3>${session.nombre}</h3>
        <p>${session.usuario}</p>
        <span class="profile-badge">${session.rol === 'admin' ? 'Administrador' : 'Empleado'} — Delizia Bolivia</span>
      </div>
      <span class="profile-change-photo" onclick="abrirEditFotoUser(${session.id})">Cambiar foto de perfil</span>
    </div>`;
}

// ─────────────────────────────────────────────────────────
//  RENDER — CLIENTE INICIO
// ─────────────────────────────────────────────────────────
function renderCliInicio() {
  if (!session) return;
  const el = document.getElementById('cliHeroName');
  if (el) el.textContent = session.nombre.split(' ')[0];
  const mis = DB.get('pedidos').filter(p=>p.clienteId===session.id);
  const gasto = mis.reduce((s,p)=>s+p.total,0);
  const entr  = mis.filter(p=>p.estado==='Entregado').length;
  const cliData = DB.get('clientes').find(c=>c.userId===session.id);
  animateValue('cliKpiPedidos', mis.length);
  const gEl = document.getElementById('cliKpiGasto');
  if (gEl) gEl.textContent = gasto.toFixed(0);
  animateValue('cliKpiEntr', entr);
  const tEl = document.getElementById('cliKpiTipo');
  if (tEl) tEl.textContent = cliData?.tipo || 'Regular';
  const actEl = document.getElementById('cliPedidosRecientes');
  if (actEl) actEl.innerHTML = mis.length ? mis.slice(-4).reverse().map(p=>`
    <div class="activity-item">
      <div class="act-dot dot-${ESTADO_COLORS[p.estado]||'blue'}"></div>
      <div class="act-body">
        <p class="act-text"><strong>${p.orden}</strong> — ${p.productos}</p>
        <span class="act-time">${p.fecha} · <span class="order-status ${ESTADO_CLASS[p.estado]}" style="padding:1px 6px;font-size:10px">${p.estado}</span></span>
      </div>
    </div>`).join('') : '<p style="color:var(--text-muted);font-size:13px">Aún no tienes pedidos.</p>';
}

function renderCliPedidos() {
  if (!session) return;
  const mis = DB.get('pedidos').filter(p=>p.clienteId===session.id);
  const tbody = document.getElementById('tbl-cli-pedidos');
  if (!tbody) return;
  tbody.innerHTML = mis.length ? mis.map(p=>`
    <tr>
      <td><span class="id-badge">${p.orden}</span></td>
      <td>${p.fecha}</td><td>${p.productos}</td>
      <td><strong>Bs. ${p.total.toFixed(2)}</strong></td>
      <td><span class="order-status ${ESTADO_CLASS[p.estado]}">${p.estado}</span></td>
    </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Sin pedidos. Haz tu primer pedido!</td></tr>';
}

function renderCliPerfil() {
  if (!session) return;
  const card = document.getElementById('cliPerfilCard');
  if (!card) return;
  const cliData = DB.get('clientes').find(c=>c.userId===session.id);
  card.innerHTML = `
    <div class="profile-big-av">${initials(session.nombre)}</div>
    <div>
      <div class="profile-info">
        <h3>${session.nombre}</h3>
        <p>${session.usuario}</p>
        <p>${cliData?.ciudad||'—'} · ${cliData?.telefono||'—'}</p>
        <span class="profile-badge">Cliente ${cliData?.tipo||'Regular'} — Delizia</span>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────
//  EDITAR FOTOS
// ─────────────────────────────────────────────────────────
let _editFotoTarget = null; // { type: 'user'|'emp'|'prod', id }

function abrirEditFotoUser(userId) {
  _editFotoTarget = { type:'user', id: userId };
  resetEditImgPreview();
  const title = document.querySelector('#modalEditImg .modal-header h3');
  if (title) title.textContent = 'Editar foto de perfil';
  openModal('modalEditImg');
}

function abrirEditFotoEmp(empId) {
  _editFotoTarget = { type:'emp', id: empId };
  resetEditImgPreview();
  const title = document.querySelector('#modalEditImg .modal-header h3');
  if (title) title.textContent = 'Editar foto del empleado';
  openModal('modalEditImg');
}

function abrirEditFotoProd(prodId) {
  _editFotoTarget = { type:'prod', id: prodId };
  resetEditImgPreview();
  const title = document.querySelector('#modalEditImg .modal-header h3');
  if (title) title.textContent = 'Editar foto del producto';
  openModal('modalEditImg');
}

function resetEditImgPreview() {
  const prev = document.getElementById('editImgPreview');
  if (prev) prev.innerHTML = `
    <svg width="36" height="36" style="color:var(--blue-300)"><use href="#ico-upload"/></svg>
    <p>Clic para seleccionar imagen</p>
    <span>JPG, PNG · Máx 2MB</span>`;
  const area = document.getElementById('editImgArea');
  if (area) area.classList.remove('has-image');
  const file = document.getElementById('editImgFile');
  if (file) file.value='';
  _editFotoDataUrl = null;
}

let _editFotoDataUrl = null;

function previewEditImg(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  if (file.size > 2*1024*1024) { showToast('Imagen demasiado grande (máx 2MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _editFotoDataUrl = e.target.result;
    const prev = document.getElementById('editImgPreview');
    if (prev) prev.innerHTML = `
      <img src="${e.target.result}" style="width:100%;height:200px;object-fit:cover;border-radius:12px" />
      <div class="img-upload-overlay"><svg width="18" height="18"><use href="#ico-image"/></svg> Cambiar</div>`;
    const area = document.getElementById('editImgArea');
    if (area) area.classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

function guardarImagenEdicion() {
  if (!_editFotoDataUrl || !_editFotoTarget) { showToast('Selecciona una imagen primero', 'error'); return; }
  const { type, id } = _editFotoTarget;
  if (type === 'user') {
    const users = DB.get('users'); const idx = users.findIndex(u=>u.id===id);
    if (idx>=0) { users[idx].foto = _editFotoDataUrl; DB.set('users', users); }
    logEvent('empleado', `Foto de perfil actualizada`, `Usuario ID ${id}`, _editFotoDataUrl);
    renderAdmins(); renderPerfil();
  } else if (type === 'emp') {
    const emps = DB.get('empleados'); const idx = emps.findIndex(e=>e.id===id);
    if (idx>=0) { emps[idx].foto = _editFotoDataUrl; DB.set('empleados', emps); }
    logEvent('empleado', `Foto de empleado actualizada`, `Empleado ID ${id}`, _editFotoDataUrl);
    renderEmpleados();
  } else if (type === 'prod') {
    const prods = DB.get('productos'); const idx = prods.findIndex(p=>p.id===id);
    if (idx>=0) { prods[idx].imgUrl = _editFotoDataUrl; DB.set('productos', prods); }
    logEvent('producto', `Foto de producto actualizada`, prods.find(p=>p.id===id)?.nombre||'', _editFotoDataUrl);
    renderProductos('grid-productos', true);
  }
  closeModal(); showToast('Foto guardada exitosamente', 'success');
}

function quitarImagenEdicion() {
  if (!_editFotoTarget) return;
  const { type, id } = _editFotoTarget;
  if (type === 'user') {
    const users = DB.get('users'); const idx = users.findIndex(u=>u.id===id);
    if (idx>=0) { users[idx].foto = null; DB.set('users', users); }
    renderAdmins(); renderPerfil();
  } else if (type === 'emp') {
    const emps = DB.get('empleados'); const idx = emps.findIndex(e=>e.id===id);
    if (idx>=0) { emps[idx].foto = null; DB.set('empleados', emps); }
    renderEmpleados();
  } else if (type === 'prod') {
    const prods = DB.get('productos'); const idx = prods.findIndex(p=>p.id===id);
    if (idx>=0) { prods[idx].imgUrl = null; DB.set('productos', prods); }
    renderProductos('grid-productos', true);
  }
  closeModal(); showToast('Imagen eliminada', 'info');
}

// Preview nueva imagen en modal de producto nuevo
function previewProductImg(evt) {
  const file = evt.target.files[0]; if (!file) return;
  if (file.size > 2*1024*1024) { showToast('Imagen demasiado grande', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const area = document.getElementById('imgUploadArea');
    const prev = document.getElementById('imgPreview');
    if (prev) prev.innerHTML = `
      <img src="${e.target.result}" class="prod-preview-img" />
      <div class="img-upload-overlay"><svg width="18" height="18"><use href="#ico-image"/></svg> Cambiar</div>`;
    if (area) area.classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

// ─────────────────────────────────────────────────────────
//  GUARDAR CRUD
// ─────────────────────────────────────────────────────────
function guardarAdmin() {
  const nombre  = document.getElementById('adminNombre').value.trim();
  const usuario = document.getElementById('adminCorreo').value.trim();
  const pass    = document.getElementById('adminPass').value;
  if (!nombre || !usuario || !pass) { showToast('Completa todos los campos', 'error'); return; }
  const users = DB.get('users');
  users.push({ id:DB.nextId('users'), nombre, usuario, password:pass, rol:'admin', activo:true, foto:null });
  DB.set('users', users);
  logEvent('empleado', `Nuevo administrador creado`, nombre);
  closeModal(); renderAdmins(); showToast('Administrador creado', 'success');
}

function guardarEmpleado() {
  const nombre = (document.getElementById('empNombre').value + ' ' + document.getElementById('empApellido').value).trim();
  const correo = document.getElementById('empCorreo').value.trim();
  const tel    = document.getElementById('empTelefono').value.trim();
  const cargo  = document.getElementById('empCargo').value.trim();
  const depto  = document.getElementById('empDepto').value;
  const pass   = document.getElementById('empPass').value;
  const desde  = document.getElementById('empDesde').value || new Date().getFullYear().toString();
  if (!nombre || !correo) { showToast('Completa nombre y correo', 'error'); return; }
  const emps = DB.get('empleados');
  emps.push({ id:DB.nextId('empleados'), nombre, correo, telefono:tel, cargo, departamento:depto, activo:true, desde, foto:null });
  DB.set('empleados', emps);
  if (pass) {
    const users = DB.get('users');
    users.push({ id:DB.nextId('users'), nombre, usuario:correo, password:pass, rol:'empleado', activo:true, foto:null });
    DB.set('users', users);
  }
  logEvent('empleado', `Nuevo empleado registrado`, `${nombre} — ${depto}`);
  closeModal(); renderEmpleados(); showToast('Empleado registrado', 'success');
}

function guardarCliente() {
  const nombre = (document.getElementById('cliNombre').value + ' ' + document.getElementById('cliApellido').value).trim();
  const correo = document.getElementById('cliCorreo').value.trim();
  const tel    = document.getElementById('cliTelefono').value.trim();
  const ciudad = document.getElementById('cliCiudad').value.trim();
  const tipo   = document.getElementById('cliTipo').value;
  const pass   = document.getElementById('cliPass').value;
  if (!nombre || !correo) { showToast('Completa nombre y correo', 'error'); return; }
  let userId = null;
  if (pass) {
    const users = DB.get('users');
    userId = DB.nextId('users');
    users.push({ id:userId, nombre, usuario:correo, password:pass, rol:'cliente', activo:true, foto:null });
    DB.set('users', users);
  }
  const clis = DB.get('clientes');
  clis.push({ id:DB.nextId('clientes'), userId, nombre, correo, telefono:tel, ciudad, tipo, totalCompras:0, activo:true });
  DB.set('clientes', clis);
  logEvent('cliente', `Nuevo cliente creado por admin`, `${nombre} — ${tipo}`);
  closeModal(); renderClientes(); showToast('Cliente registrado', 'success');
}

function guardarProveedor() {
  const empresa = document.getElementById('provEmpresa').value.trim();
  const rubro   = document.getElementById('provRubro').value.trim();
  const ciudad  = document.getElementById('provCiudad').value.trim();
  const tel     = document.getElementById('provTelefono').value.trim();
  const correo  = document.getElementById('provCorreo').value.trim();
  const pago    = document.getElementById('provPago').value;
  if (!empresa) { showToast('Ingresa el nombre de la empresa', 'error'); return; }
  const provs = DB.get('proveedores');
  provs.push({ id:DB.nextId('proveedores'), empresa, rubro, ciudad, telefono:tel, correo, pago, activo:true });
  DB.set('proveedores', provs);
  logEvent('proveedor', `Nuevo proveedor registrado`, empresa);
  closeModal(); renderProveedores(); showToast('Proveedor registrado', 'success');
}

function guardarProducto() {
  const nombre  = document.getElementById('prodNombre').value.trim();
  const desc    = document.getElementById('prodDesc').value.trim();
  const precio  = parseFloat(document.getElementById('prodPrecio').value)||0;
  const stock   = parseInt(document.getElementById('prodStock').value)||0;
  const cat     = document.getElementById('prodCat').value;
  if (!nombre) { showToast('Ingresa el nombre del producto', 'error'); return; }

  // Leer imagen si hay
  const fileInput = document.getElementById('prodImgFile');
  const file      = fileInput?.files[0];

  const saveProducto = (imgUrl) => {
    const editId = parseInt(document.getElementById('prodEditId')?.value)||0;
    const prods  = DB.get('productos');
    if (editId) {
      const idx = prods.findIndex(p=>p.id===editId);
      if (idx>=0) { prods[idx] = {...prods[idx], nombre, descripcion:desc, precio, stock, categoria:cat, ...(imgUrl!==undefined?{imgUrl}:{})}; }
    } else {
      prods.push({ id:DB.nextId('productos'), nombre, descripcion:desc, precio, stock, categoria:cat, imgUrl: imgUrl||null });
    }
    DB.set('productos', prods);
    logEvent('producto', `${editId?'Producto actualizado':'Nuevo producto añadido'}`, `${nombre} — ${cat}`, imgUrl||null);
    closeModal(); renderProductos('grid-productos', true); showToast(`Producto ${editId?'actualizado':'guardado'}`, 'success');
    if (fileInput) fileInput.value='';
    const area = document.getElementById('imgUploadArea');
    if (area) area.classList.remove('has-image');
    document.getElementById('imgPreview').innerHTML = `
      <svg width="36" height="36" style="color:var(--blue-300)"><use href="#ico-image"/></svg>
      <p>Clic para subir foto del producto</p><span>JPG, PNG · Máx 2MB</span>`;
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = e => saveProducto(e.target.result);
    reader.readAsDataURL(file);
  } else {
    saveProducto(undefined);
  }
}

function guardarCategoria() {
  const nombre = document.getElementById('catNombre').value.trim();
  const desc   = document.getElementById('catDesc').value.trim();
  const colors = ['var(--blue-400)','var(--red-400)','var(--cyan-300)','#66bb6a','#9c27b0'];
  if (!nombre) { showToast('Ingresa el nombre', 'error'); return; }
  const cats = DB.get('categorias');
  cats.push({ id:DB.nextId('categorias'), nombre, descripcion:desc, color:colors[cats.length%colors.length] });
  DB.set('categorias', cats);
  logEvent('producto', 'Nueva categoría creada', nombre);
  closeModal(); renderCategorias(); showToast('Categoría creada', 'success');
}

function guardarPedido() {
  const cliEl = document.getElementById('pedidoCliente');
  const cliente  = cliEl.options[cliEl.selectedIndex]?.text || '';
  const clienteId= parseInt(cliEl.value)||0;
  const prods  = document.getElementById('pedidoProductos').value.trim();
  const total  = parseFloat(document.getElementById('pedidoTotal').value)||0;
  const estado = document.getElementById('pedidoEstado').value;
  if (!prods) { showToast('Describe los productos', 'error'); return; }
  const pedidos = DB.get('pedidos');
  const newId   = DB.nextId('pedidos');
  pedidos.push({ id:newId, orden:`ORD-${String(newId).padStart(4,'0')}`, clienteId, cliente,
    fecha:new Date().toLocaleDateString('es-BO'), productos:prods, total, estado });
  DB.set('pedidos', pedidos);
  logEvent('pedido', 'Nuevo pedido creado', `${cliente} — Bs. ${total.toFixed(2)}`);
  closeModal(); renderPedidos('tbl-pedidos', true); showToast('Pedido creado', 'success');
}

function guardarPedidoCliente() {
  if (!session) return;
  const prodEl = document.getElementById('cliPedidoProd');
  const prodId = parseInt(prodEl.value);
  const prodNom= prodEl.options[prodEl.selectedIndex]?.text||'';
  const cant   = parseInt(document.getElementById('cliPedidoCant').value)||1;
  const nota   = document.getElementById('cliPedidoNota').value.trim();
  const prod   = DB.get('productos').find(p=>p.id===prodId);
  if (!prod) { showToast('Selecciona un producto', 'error'); return; }
  const total  = prod.precio * cant;
  const pedidos= DB.get('pedidos');
  const newId  = DB.nextId('pedidos');
  pedidos.push({ id:newId, orden:`ORD-${String(newId).padStart(4,'0')}`, clienteId:session.id,
    cliente:session.nombre, fecha:new Date().toLocaleDateString('es-BO'),
    productos:`${prod.nombre} × ${cant}${nota?' ('+nota+')':''}`, total, estado:'Pendiente' });
  DB.set('pedidos', pedidos);
  // Actualizar total compras cliente
  const clis = DB.get('clientes'); const idx = clis.findIndex(c=>c.userId===session.id);
  if (idx>=0) { clis[idx].totalCompras = (clis[idx].totalCompras||0) + total; DB.set('clientes', clis); }
  logEvent('pedido', `Pedido de cliente`, `${session.nombre} — ${prod.nombre} × ${cant}`);
  closeModal(); renderCliPedidos(); renderCliInicio(); showToast('Pedido realizado con éxito!', 'success');
}

function cambiarEstadoPedido(id, estado) {
  const pedidos = DB.get('pedidos'); const idx = pedidos.findIndex(p=>p.id===id);
  if (idx>=0) { pedidos[idx].estado = estado; DB.set('pedidos', pedidos); }
  logEvent('pedido', `Estado de pedido actualizado`, `ORD-${String(id).padStart(4,'0')} → ${estado}`);
  showToast('Estado actualizado', 'success');
  // Re-renderizar tabla de empleado para reflejar el nuevo estado
  if (document.getElementById('tbl-emp-pedidos')) renderPedidos('tbl-emp-pedidos', false);
  if (document.getElementById('tbl-pedidos')) renderPedidos('tbl-pedidos', true);
}

function pedirProducto(prodId) {
  const sel = document.getElementById('cliPedidoProd');
  if (sel) sel.value = prodId;
  navigate('cli-mispedidos');
  setTimeout(()=>openModal('modalNuevoPedidoCli'), 200);
}

function cambiarPassword() {
  const actual  = document.getElementById('passActual')?.value;
  const nueva   = document.getElementById('passNueva')?.value;
  const confirm = document.getElementById('passConfirm')?.value;
  if (!actual||!nueva||!confirm) { showToast('Completa todos los campos', 'error'); return; }
  if (nueva !== confirm) { showToast('Las contraseñas no coinciden', 'error'); return; }
  const users = DB.get('users'); const idx = users.findIndex(u=>u.id===session?.id);
  if (idx<0 || users[idx].password!==actual) { showToast('Contraseña actual incorrecta', 'error'); return; }
  users[idx].password = nueva; DB.set('users', users);
  showToast('Contraseña actualizada', 'success');
  ['passActual','passNueva','passConfirm'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
}

// ─────────────────────────────────────────────────────────
//  ELIMINAR
// ─────────────────────────────────────────────────────────
function confirmarEliminar(key, id) {
  // Proteger: no permitir eliminar el último administrador
  if (key === 'users') {
    const admins = DB.get('users').filter(u => u.rol === 'admin');
    const target = DB.get('users').find(u => u.id === id);
    if (target?.rol === 'admin' && admins.length <= 1) {
      showToast('No puedes eliminar el único administrador del sistema', 'error');
      return;
    }
  }
  const msg = document.getElementById('confirmMsg');
  if (msg) msg.textContent = `¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.`;
  document.getElementById('confirmBtn').onclick = () => {
    DB.set(key, DB.get(key).filter(i=>i.id!==id));
    closeModal();
    const fn = { users:renderAdmins, clientes:renderClientes, proveedores:renderProveedores,
      productos:()=>renderProductos('grid-productos',true), categorias:renderCategorias,
      pedidos:()=>renderPedidos('tbl-pedidos',true), empleados:renderEmpleados }[key];
    if (fn) fn();
    logEvent('sistema', `Registro eliminado`, `Tabla: ${key}, ID: ${id}`);
    showToast('Eliminado correctamente', 'info');
  };
  openModal('modalConfirm');
}

// ─────────────────────────────────────────────────────────
//  MODALES
// ─────────────────────────────────────────────────────────
let currentModal = null;

function openModal(id) {
  if (currentModal) { currentModal.style.display='none'; currentModal.classList.remove('open'); }
  const m = document.getElementById(id); if (!m) return;
  currentModal = m;
  document.getElementById('modalBackdrop').classList.add('open');
  m.style.display = 'flex';
  requestAnimationFrame(()=>m.classList.add('open'));
  document.body.style.overflow = 'hidden';
  if (id==='modalPedido') {
    const sel = document.getElementById('pedidoCliente');
    if (sel) sel.innerHTML = DB.get('clientes').map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('') || '<option>Sin clientes registrados</option>';
  }
  if (id==='modalNuevoPedidoCli') {
    const sel = document.getElementById('cliPedidoProd');
    if (sel) sel.innerHTML = DB.get('productos').map(p=>`<option value="${p.id}">${p.nombre} — Bs.${p.precio}</option>`).join('');
  }
}

function closeModal() {
  if (currentModal) {
    currentModal.classList.remove('open');
    const m = currentModal; setTimeout(()=>m.style.display='none',300); currentModal=null;
  }
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });

// ─────────────────────────────────────────────────────────
//  BÚSQUEDA
// ─────────────────────────────────────────────────────────
document.querySelectorAll('.tb-search').forEach(inp=>{
  inp.addEventListener('input', function(){
    const q = this.value.toLowerCase();
    const tid = this.dataset.target; if (!tid) return;
    const t = document.getElementById(tid); if (!t) return;
    t.querySelectorAll('tr:not(:first-child),.emp-card:not(.add-card),.prov-card:not(.add-card),.prod-card:not(.add-card)').forEach(el=>{
      el.style.display = (!q||el.textContent.toLowerCase().includes(q)) ? '' : 'none';
    });
  });
});

// ─────────────────────────────────────────────────────────
//  SIDEBAR TOGGLE
// ─────────────────────────────────────────────────────────
document.getElementById('menuToggle')?.addEventListener('click',()=>{
  document.getElementById('sidebar').classList.toggle('mobile-open');
});

// ─────────────────────────────────────────────────────────
//  BÚSQUEDA GLOBAL (topbar)
// ─────────────────────────────────────────────────────────
(function() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  let searchTimeout;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = this.value.toLowerCase().trim();
      if (!q) return;
      // Buscar en todas las secciones visibles
      const sections = ['productos','clientes','empleados','proveedores','pedidos'];
      let found = false;
      for (const sec of sections) {
        const el = document.getElementById('section-' + sec);
        if (!el) continue;
        const text = el.textContent || '';
        if (text.toLowerCase().includes(q)) {
          navigate(sec);
          found = true;
          break;
        }
      }
      if (!found) showToast(`Sin resultados para "${q}"`, 'info');
    }, 400);
  });
  // Buscar al presionar Enter
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.dispatchEvent(new Event('input'));
    }
  });
})();

// ─────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────
function showToast(msg, type='success') {
  const colors = { success:'linear-gradient(135deg,#d4f7d4,#b2ebb2)', error:'linear-gradient(135deg,var(--red-50),var(--red-100))', info:'linear-gradient(135deg,var(--blue-50),var(--blue-100))' };
  const icons  = { success:'✓', error:'✗', info:'i' };
  if (!document.getElementById('toast-kf')) {
    const s=document.createElement('style'); s.id='toast-kf';
    s.textContent='@keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes toastOut{to{opacity:0;transform:translateY(20px)}}';
    document.head.appendChild(s);
  }
  const t=document.createElement('div');
  t.style.cssText=`position:fixed;bottom:26px;right:26px;z-index:9999;background:${colors[type]};border:1px solid rgba(122,185,232,0.3);border-radius:14px;padding:13px 18px;font-family:'Montserrat',sans-serif;font-size:13.5px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:10px;box-shadow:0 8px 28px rgba(27,116,184,0.18);animation:toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;max-width:320px;`;
  t.innerHTML=`<span style="font-weight:800">${icons[type]}</span>${msg}`;
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.animation='toastOut 0.3s ease forwards'; setTimeout(()=>t.remove(),300); },3200);
}

// ─────────────────────────────────────────────────────────
//  ANIMAR KPI
// ─────────────────────────────────────────────────────────
function animateValue(elId, target) {
  const el=document.getElementById(elId); if (!el) return;
  const start=performance.now(), dur=1000, from=parseInt(el.textContent)||0;
  function tick(now) {
    const t=Math.min((now-start)/dur,1), ease=1-Math.pow(1-t,3);
    el.textContent=Math.floor(from+ease*(target-from));
    if (t<1) requestAnimationFrame(tick); else el.textContent=target;
  }
  requestAnimationFrame(tick);
}

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
function initials(str) {
  if (!str) return '?';
  return str.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

// ─────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  seedDB();

  const raw = sessionStorage.getItem('dz_session');
  if (!raw) { window.location.href = 'login.html'; return; }
  session = JSON.parse(raw);

  // Actualizar usuario en sidebar
  const rol = session.rol;
  document.getElementById('suAvatar').textContent = initials(session.nombre);
  document.getElementById('suName').textContent   = session.nombre;
  document.getElementById('suRole').textContent   = rol.charAt(0).toUpperCase()+rol.slice(1);

  const badge = document.getElementById('topRoleBadge');
  if (badge) { badge.textContent = rol.charAt(0).toUpperCase()+rol.slice(1); badge.className=`role-badge-top rbadge-${rol}`; }

  // Mostrar nav correcto
  ['navAdmin','navEmpleado','navCliente'].forEach(id=>{
    const nav=document.getElementById(id); if (nav) nav.style.display='none';
  });
  const navMap = { admin:'navAdmin', empleado:'navEmpleado', cliente:'navCliente' };
  const nav = document.getElementById(navMap[rol]);
  if (nav) nav.style.display='';

  // Vincular nav
  document.querySelectorAll('.nav-item').forEach(item=>{
    item.addEventListener('click', e=>{
      e.preventDefault();
      const sec = item.dataset.section; if (sec) navigate(sec);
    });
  });

  // Vincular botón guardar imagen en modal de edición
  const saveImgBtn = document.getElementById('saveEditImgBtn');
  if (saveImgBtn) saveImgBtn.onclick = guardarImagenEdicion;

  // Navegar a sección inicial
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const initSec = { admin:'dashboard', empleado:'emp-dashboard', cliente:'cli-inicio' }[rol];
  navigate(initSec);

  setTimeout(()=>showToast(`Bienvenido, ${session.nombre.split(' ')[0]}`, 'info'), 600);
});
