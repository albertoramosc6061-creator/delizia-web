/* ═══════════════════════════════════════════════════════════
   DELIZIA — planificacion.js
   Planificación mensual de la producción con árbol de decisión
   y criterio del Valor Monetario Esperado (VME)
═══════════════════════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────────────────────
//  CAMPOS DEL FORMULARIO
// ─────────────────────────────────────────────────────────
const PLAN_CAMPOS = [
  { id:'plProducto',  nombre:'Producto' },
  { id:'plMes',       nombre:'Mes a planificar' },
  { id:'plHist1',     nombre:'Ventas hace 3 años',              num:true },
  { id:'plHist2',     nombre:'Ventas hace 2 años',              num:true },
  { id:'plHist3',     nombre:'Ventas del año pasado',           num:true },
  { id:'plAjuste',    nombre:'Ajuste por clima',                num:true, negativo:true },
  { id:'plVariacion', nombre:'Variación entre escenarios',      num:true },
  { id:'plPrecio',    nombre:'Precio de venta',                 num:true },
  { id:'plCosto',     nombre:'Costo de producción',             num:true },
  { id:'plRescate',   nombre:'Valor de recuperación del sobrante', num:true },
  { id:'plVida',      nombre:'Vida útil',                       num:true },
  { id:'plCapacidad', nombre:'Capacidad de cámara fría',        num:true },
  { id:'plLote',      nombre:'Unidades por lote',               num:true },
  { id:'plPAlta',     nombre:'Probabilidad de demanda alta',    num:true },
  { id:'plPMedia',    nombre:'Probabilidad de demanda media',   num:true },
  { id:'plPBaja',     nombre:'Probabilidad de demanda baja',    num:true },
];

const CLIMA_AJUSTE = { 'Cálido':10, 'Templado':0, 'Frío':-15 };
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Datos de ejemplo (referenciales) para mostrar el funcionamiento del modelo
const PLAN_EJEMPLO = {
  plMes:'2026-11', plClima:'Cálido', plAjuste:10,
  plHist1:7500, plHist2:8000, plHist3:8500, plVariacion:25,
  plPrecio:3, plCosto:1.5, plRescate:0, plVida:30,
  plCapacidad:10000, plLote:100, plPAlta:45, plPMedia:35, plPBaja:20,
};

let planIntentos  = 0;     // veces que se intentó calcular con datos incompletos
let planResultado = null;  // último cálculo válido

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
const fmtNum = n => Math.round(n).toLocaleString('es-BO');
const fmtBs  = n => 'Bs ' + n.toLocaleString('es-BO', { minimumFractionDigits:2, maximumFractionDigits:2 });

function nombreMes(valor) {
  if (!valor) return '—';
  const [a, m] = valor.split('-');
  return `${MESES[parseInt(m)-1]} ${a}`;
}

function planAviso(tipo, html) {
  const box = document.getElementById('planAvisos');
  if (box) box.insertAdjacentHTML('beforeend', `<div class="plan-alert ${tipo}">${html}</div>`);
}

function limpiarAvisos() {
  const box = document.getElementById('planAvisos');
  if (box) box.innerHTML = '';
}

// ─────────────────────────────────────────────────────────
//  RENDER DE LA SECCIÓN
// ─────────────────────────────────────────────────────────
function renderPlanificacion() {
  const sel = document.getElementById('plProducto');
  if (sel) {
    const actual = sel.value;
    sel.innerHTML = '<option value="">Seleccione un producto</option>' +
      DB.get('productos').map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    if (actual) sel.value = actual;
  }
  renderHistorialPlanes();
}

// Al elegir un producto se copian su precio, costo y vida útil del catálogo
function planProductoCambiado() {
  const id   = parseInt(document.getElementById('plProducto').value);
  const prod = DB.get('productos').find(p => p.id === id);
  if (!prod) return;
  document.getElementById('plPrecio').value = prod.precio;
  if (prod.costo     != null) document.getElementById('plCosto').value = prod.costo;
  if (prod.vidaUtil  != null) document.getElementById('plVida').value  = prod.vidaUtil;
}

function planClimaCambiado() {
  const clima = document.getElementById('plClima').value;
  document.getElementById('plAjuste').value = CLIMA_AJUSTE[clima] ?? 0;
}

function cargarEjemploPlan() {
  const prod = DB.get('productos').find(p => p.nombre.startsWith('Ice Fruit')) || DB.get('productos')[0];
  if (prod) document.getElementById('plProducto').value = prod.id;
  Object.entries(PLAN_EJEMPLO).forEach(([id, v]) => {
    const el = document.getElementById(id); if (el) el.value = v;
  });
  limpiarAvisos();
  planAviso('info', 'Se cargaron datos de ejemplo (referenciales) para mostrar el funcionamiento del modelo.');
}

function limpiarPlan() {
  PLAN_CAMPOS.forEach(c => { const el = document.getElementById(c.id); if (el) el.value = ''; });
  document.getElementById('plClima').value = 'Templado';
  planIntentos = 0; planResultado = null;
  limpiarAvisos();
  document.getElementById('planResultado').style.display = 'none';
}

// "Usar dato del mes anterior": completa solo los campos vacíos con el último cálculo guardado
function usarDatosMesAnterior() {
  const previo = JSON.parse(localStorage.getItem('dz_plan_ultimo') || 'null');
  if (!previo) { showToast('No hay datos de un mes anterior', 'error'); return; }
  let completados = 0;
  PLAN_CAMPOS.forEach(c => {
    const el = document.getElementById(c.id);
    if (el && el.value.trim() === '' && previo[c.id] != null && c.id !== 'plMes') { el.value = previo[c.id]; completados++; }
  });
  showToast(`${completados} dato(s) completados con el mes anterior`, 'info');
  calcularPlan();
}

// ─────────────────────────────────────────────────────────
//  LECTURA Y VALIDACIÓN
// ─────────────────────────────────────────────────────────
function leerDatosPlan() {
  const datos = {}, faltantes = [];
  PLAN_CAMPOS.forEach(c => {
    const el = document.getElementById(c.id);
    const v  = el ? el.value.trim() : '';
    if (v === '') { faltantes.push(c.nombre); return; }
    if (c.num) {
      const n = parseFloat(v);
      if (isNaN(n) || (!c.negativo && n < 0)) { faltantes.push(`${c.nombre} (valor no válido)`); return; }
      datos[c.id] = n;
    } else {
      datos[c.id] = v;
    }
  });
  return { datos, faltantes };
}

// ─────────────────────────────────────────────────────────
//  MODELO: ÁRBOL DE DECISIÓN CON VME
// ─────────────────────────────────────────────────────────
function gananciaLote(q, d, precio, costo, rescate) {
  return precio * Math.min(q, d) - costo * q + rescate * Math.max(q - d, 0);
}

function calcularPlan() {
  limpiarAvisos();
  const { datos: d, faltantes } = leerDatosPlan();

  // ¿Datos completos?
  if (faltantes.length) {
    planIntentos++;
    planAviso('error', `<strong>Faltan datos (intento ${planIntentos}):</strong> ${faltantes.join(', ')}. Solicite el dato faltante al área de ventas o a la planta.`);
    if (planIntentos >= 2 && localStorage.getItem('dz_plan_ultimo')) {
      planAviso('warn', `Ya se pidió el dato dos veces. <button class="btn-secondary plan-inline-btn" onclick="usarDatosMesAnterior()">Usar datos del mes anterior</button>`);
    }
    document.getElementById('planResultado').style.display = 'none';
    return;
  }
  planIntentos = 0;

  if (d.plPrecio <= d.plCosto) { planAviso('error', 'El precio de venta debe ser mayor al costo de producción.'); return; }
  if (d.plLote <= 0 || d.plCapacidad <= 0) { planAviso('error', 'La capacidad de la cámara fría y las unidades por lote deben ser mayores a cero.'); return; }
  if (d.plVariacion >= 100) { planAviso('error', 'La variación entre escenarios debe ser menor a 100 %.'); return; }

  // ¿Las probabilidades suman 100 %?
  let probs = [d.plPAlta, d.plPMedia, d.plPBaja];
  const suma = probs.reduce((s, p) => s + p, 0);
  if (suma === 0) { planAviso('error', 'Las probabilidades no pueden ser todas cero.'); return; }
  if (Math.abs(suma - 100) > 0.01) {
    const antes = probs.map(p => p + '%').join(' / ');
    probs = probs.map(p => p / suma * 100);
    planAviso('warn', `Las probabilidades sumaban ${suma}% (${antes}). Se normalizaron a ${probs.map(p => p.toFixed(1) + '%').join(' / ')}.`);
  }
  const p = probs.map(x => x / 100);

  // Estimar demanda del mes: promedio histórico + ajuste por clima
  const promedio = (d.plHist1 + d.plHist2 + d.plHist3) / 3;
  const media    = promedio * (1 + d.plAjuste / 100);
  const escenarios = [
    { nombre:'Alta',  demanda: Math.round(media * (1 + d.plVariacion / 100)), prob: p[0] },
    { nombre:'Media', demanda: Math.round(media),                              prob: p[1] },
    { nombre:'Baja',  demanda: Math.round(media * (1 - d.plVariacion / 100)), prob: p[2] },
  ];

  // Lo que sobra solo se recupera si el producto dura más que el ciclo mensual
  const rescate = d.plVida <= 30 ? 0 : d.plRescate;
  if (d.plVida <= 30 && d.plRescate > 0) {
    planAviso('info', `La vida útil (${d.plVida} días) no supera el ciclo mensual, por lo que el sobrante se considera merma (valor de recuperación = 0).`);
  }

  // Definir 3 tamaños de lote y validar la cámara fría
  const redondear = x => Math.max(d.plLote, Math.round(x / d.plLote) * d.plLote);
  const maxCamara = Math.floor(d.plCapacidad / d.plLote) * d.plLote;
  const lotes = ['Alto', 'Medio', 'Bajo'].map((nombre, i) => {
    const propuesto = redondear(escenarios[i].demanda);
    let q = propuesto, estado = 'Válido';
    if (propuesto > d.plCapacidad) { q = maxCamara; estado = 'Reducido'; }
    if (q <= 0) estado = 'Descartado';
    return { nombre, propuesto, q, estado };
  });
  // Un lote reducido que queda igual a otro ya no es una alternativa distinta
  lotes.forEach((l, i) => {
    if (l.estado !== 'Descartado' && lotes.slice(0, i).some(o => o.estado !== 'Descartado' && o.q === l.q)) l.estado = 'Descartado';
  });
  const validos = lotes.filter(l => l.estado !== 'Descartado');
  lotes.filter(l => l.estado === 'Reducido').forEach(l =>
    planAviso('warn', `El lote ${l.nombre.toLowerCase()} (${fmtNum(l.propuesto)} u) no cabe en la cámara fría (${fmtNum(d.plCapacidad)} u); se redujo a ${fmtNum(l.q)} u.`));
  lotes.filter(l => l.estado === 'Descartado').forEach(l =>
    planAviso('warn', `El lote ${l.nombre.toLowerCase()} se descartó porque, después de ajustarlo a la cámara fría, es igual a otra alternativa.`));

  // Ganancia o pérdida de cada lote según cada escenario, y su VME
  validos.forEach(l => {
    l.pagos = escenarios.map(e => gananciaLote(l.q, e.demanda, d.plPrecio, d.plCosto, rescate));
    l.vme   = l.pagos.reduce((s, g, i) => s + g * escenarios[i].prob, 0);
  });

  // Elegir el lote con mayor VME (en empate, el más pequeño por tener menos riesgo de merma)
  const mejor = validos.reduce((b, l) => (l.vme > b.vme + 1e-9 || (Math.abs(l.vme - b.vme) < 1e-9 && l.q < b.q)) ? l : b);

  // Valor esperado de la información perfecta
  const vecip = escenarios.reduce((s, e, j) => s + e.prob * Math.max(...validos.map(l => l.pagos[j])), 0);

  const prod = DB.get('productos').find(x => x.id === parseInt(d.plProducto));
  planResultado = {
    mes: d.plMes, productoId: prod?.id, producto: prod?.nombre || '—',
    precio: d.plPrecio, costo: d.plCosto, rescate,
    promedio, media, escenarios, lotes, validos, mejor, vecip, veip: vecip - mejor.vme,
  };

  localStorage.setItem('dz_plan_ultimo', JSON.stringify(Object.fromEntries(PLAN_CAMPOS.map(c => [c.id, d[c.id]]))));
  logEvent('planificacion', 'VME calculado', `${planResultado.producto} — ${nombreMes(d.plMes)}: lote ${mejor.nombre.toLowerCase()} (${fmtNum(mejor.q)} u)`);
  renderResultadoPlan();
}

// ─────────────────────────────────────────────────────────
//  RENDER DEL RESULTADO
// ─────────────────────────────────────────────────────────
function renderResultadoPlan() {
  const r = planResultado; if (!r) return;
  const box = document.getElementById('planResultado');
  box.style.display = '';

  document.getElementById('planDemanda').innerHTML = `
    <p class="plan-note">Promedio histórico: <strong>${fmtNum(r.promedio)} u</strong> · Demanda media ajustada por clima: <strong>${fmtNum(r.media)} u</strong></p>
    <table class="data-table plan-table">
      <thead><tr><th>Escenario</th><th>Demanda (u)</th><th>Probabilidad</th></tr></thead>
      <tbody>${r.escenarios.map(e => `<tr><td>${e.nombre}</td><td>${fmtNum(e.demanda)}</td><td>${(e.prob*100).toFixed(1)}%</td></tr>`).join('')}</tbody>
    </table>`;

  const estadoCls = { 'Válido':'tag-green', 'Reducido':'tag-cyan', 'Descartado':'tag-red' };
  document.getElementById('planLotes').innerHTML = `
    <table class="data-table plan-table">
      <thead><tr><th>Lote</th><th>Propuesto (u)</th><th>A producir (u)</th><th>Cámara fría</th></tr></thead>
      <tbody>${r.lotes.map(l => `<tr><td>${l.nombre}</td><td>${fmtNum(l.propuesto)}</td><td>${l.estado === 'Descartado' ? '—' : fmtNum(l.q)}</td>
        <td><span class="tag ${estadoCls[l.estado]}">${l.estado}</span></td></tr>`).join('')}</tbody>
    </table>`;

  document.getElementById('planMatriz').innerHTML = `
    <table class="data-table plan-table">
      <thead><tr><th>Lote (u)</th>${r.escenarios.map(e => `<th>Demanda ${e.nombre.toLowerCase()}<br><small>${fmtNum(e.demanda)} u · ${(e.prob*100).toFixed(0)}%</small></th>`).join('')}<th>VME</th></tr></thead>
      <tbody>${r.validos.map(l => `<tr class="${l === r.mejor ? 'vme-best' : ''}"><td>${l.nombre} (${fmtNum(l.q)})</td>
        ${l.pagos.map(g => `<td class="${g < 0 ? 'neg' : ''}">${fmtBs(g)}</td>`).join('')}<td><strong>${fmtBs(l.vme)}</strong></td></tr>`).join('')}</tbody>
    </table>
    <p class="plan-note">Ganancia = precio × unidades vendidas − costo × unidades producidas${r.rescate ? ' + recuperación del sobrante' : ''}. VME = Σ (ganancia × probabilidad).</p>`;

  document.getElementById('planArbol').innerHTML = arbolDecisionSVG(r);

  document.getElementById('planDecision').innerHTML = `
    <p class="decision-eyebrow">Recomendación para ${nombreMes(r.mes)}</p>
    <h3>Producir el lote ${r.mejor.nombre.toLowerCase()}</h3>
    <div class="decision-qty">${fmtNum(r.mejor.q)} <span>unidades</span></div>
    <p class="decision-prod">${r.producto}</p>
    <div class="decision-stats">
      <div><span>VME</span><strong>${fmtBs(r.mejor.vme)}</strong></div>
      <div><span>Con información perfecta</span><strong>${fmtBs(r.vecip)}</strong></div>
      <div><span>VEIP</span><strong>${fmtBs(r.veip)}</strong></div>
    </div>
    <button class="btn-light" onclick="emitirOrdenProduccion()">Emitir orden de producción</button>`;
}

function arbolDecisionSVG(r) {
  const W = 860, n = r.validos.length, banda = 118, H = banda * n + 20;
  const xD = 26, xC = 330, xF = 600;
  const yD = H / 2;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" class="tree-svg" font-family="Montserrat, sans-serif">`;
  r.validos.forEach((l, i) => {
    const yC = 10 + banda * (i + 0.5);
    const best = l === r.mejor;
    const col = best ? 'var(--blue-700)' : '#9FB3C8', w = best ? 3 : 1.6;
    s += `<path d="M${xD + 26} ${yD} L${xD + 70} ${yC} L${xC - 16} ${yC}" fill="none" stroke="${col}" stroke-width="${w}"/>`;
    s += `<text x="${xD + 82}" y="${yC - 8}" font-size="12.5" font-weight="700" fill="${best ? 'var(--blue-700)' : '#4A6080'}">Lote ${l.nombre.toLowerCase()} · ${fmtNum(l.q)} u</text>`;
    s += `<circle cx="${xC}" cy="${yC}" r="15" fill="${best ? 'var(--cyan-100)' : '#fff'}" stroke="${col}" stroke-width="2"/>`;
    s += `<text x="${xC - 22}" y="${yC + 26}" text-anchor="end" font-size="11.5" font-weight="700" fill="${best ? 'var(--red-500)' : '#4A6080'}">VME ${fmtBs(l.vme)}</text>`;
    r.escenarios.forEach((e, j) => {
      const yF = yC + (j - 1) * 34;
      s += `<path d="M${xC + 15} ${yC} L${xC + 50} ${yF} L${xF} ${yF}" fill="none" stroke="${col}" stroke-width="${best ? 2 : 1.2}"/>`;
      s += `<text x="${xC + 58}" y="${yF - 5}" font-size="11" fill="#4A6080">Demanda ${e.nombre.toLowerCase()} (${(e.prob*100).toFixed(0)}%)</text>`;
      s += `<polygon points="${xF},${yF - 6} ${xF + 10},${yF} ${xF},${yF + 6}" fill="${col}"/>`;
      s += `<text x="${xF + 16}" y="${yF + 4}" font-size="12" font-weight="600" fill="${l.pagos[j] < 0 ? 'var(--red-500)' : '#0D2545'}">${fmtBs(l.pagos[j])}</text>`;
    });
  });
  s += `<rect x="${xD}" y="${yD - 13}" width="26" height="26" rx="3" fill="var(--blue-700)"/>`;
  s += `</svg>`;
  return s;
}

// ─────────────────────────────────────────────────────────
//  ORDEN DE PRODUCCIÓN Y CIERRE DEL MES
// ─────────────────────────────────────────────────────────
function emitirOrdenProduccion() {
  const r = planResultado;
  if (!r) { showToast('Primero calcule el VME', 'error'); return; }
  const planes = DB.get('planes');
  const id = DB.nextId('planes');
  planes.push({
    id, orden:`OP-${String(id).padStart(4,'0')}`, mes:r.mes, productoId:r.productoId, producto:r.producto,
    lote:r.mejor.nombre, unidades:r.mejor.q, vme:r.mejor.vme, precio:r.precio, costo:r.costo, rescate:r.rescate,
    fecha:new Date().toLocaleDateString('es-BO'), estado:'Orden emitida',
    ventasReales:null, merma:null, faltante:null, gananciaReal:null, usuario:session?.nombre || '—',
  });
  DB.set('planes', planes);
  logEvent('planificacion', 'Orden de producción emitida', `OP-${String(id).padStart(4,'0')} · ${r.producto} — ${fmtNum(r.mejor.q)} u para la planta de El Alto`);
  renderHistorialPlanes();
  showToast('Orden de producción enviada a la planta', 'success');
}

function abrirVentasReales(id) {
  const plan = DB.get('planes').find(x => x.id === id); if (!plan) return;
  document.getElementById('vrPlanId').value = id;
  document.getElementById('vrInfo').textContent = `${plan.orden} · ${plan.producto} · ${nombreMes(plan.mes)} · ${fmtNum(plan.unidades)} u producidas`;
  document.getElementById('vrVentas').value = '';
  openModal('modalVentasReales');
}

function guardarVentasReales() {
  const id = parseInt(document.getElementById('vrPlanId').value);
  const ventas = parseFloat(document.getElementById('vrVentas').value);
  if (isNaN(ventas) || ventas < 0) { showToast('Ingrese las unidades vendidas', 'error'); return; }
  const planes = DB.get('planes'); const idx = planes.findIndex(x => x.id === id);
  if (idx < 0) return;
  const pl = planes[idx];
  pl.ventasReales = ventas;
  pl.merma        = Math.max(pl.unidades - ventas, 0);
  pl.faltante     = Math.max(ventas - pl.unidades, 0);
  pl.gananciaReal = gananciaLote(pl.unidades, ventas, pl.precio, pl.costo, pl.rescate || 0);
  pl.estado       = 'Cerrado';
  DB.set('planes', planes);
  logEvent('planificacion', 'Ventas reales registradas', `${pl.orden}: ${fmtNum(ventas)} u vendidas, merma ${fmtNum(pl.merma)} u`);
  closeModal(); renderHistorialPlanes(); showToast('Mes cerrado con las ventas reales', 'success');
}

function renderHistorialPlanes() {
  const tbody = document.getElementById('tbl-planes'); if (!tbody) return;
  const planes = DB.get('planes').slice().reverse();
  tbody.innerHTML = planes.map(pl => `
    <tr>
      <td><span class="id-badge">${pl.orden}</span></td>
      <td>${nombreMes(pl.mes)}</td>
      <td>${pl.producto}</td>
      <td>${fmtNum(pl.unidades)} u (${pl.lote.toLowerCase()})</td>
      <td>${fmtBs(pl.vme)}</td>
      <td><span class="order-status ${pl.estado === 'Cerrado' ? 'status-done' : 'status-process'}">${pl.estado}</span></td>
      <td>${pl.ventasReales == null
        ? `<button class="btn-secondary plan-inline-btn" style="margin-left:0" onclick="abrirVentasReales(${pl.id})">Registrar ventas</button>`
        : fmtNum(pl.ventasReales) + ' u'}</td>
      <td>${pl.merma == null ? '—' : fmtNum(pl.merma) + ' u'}</td>
      <td>${pl.gananciaReal == null ? '—' : fmtBs(pl.gananciaReal)}</td>
    </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted)">Aún no se emitieron órdenes de producción.</td></tr>';
}
