// ==========================================================
// GestorUrbano Jalisco AMG / TrazaUrbana
// (c) 2026 Fernando H. - trazaurbana.mx
// Todos los derechos reservados.
// Reproduccion o uso no autorizado esta prohibido.
// ==========================================================

// gu-freemium.js — Control de uso gratuito sin login
// Gestor Urbano Jalisco AMG
const GU_LIMITES = {
  gu_m04_usos_mes: 3,
  gu_m05_usos_mes: 5,
  gu_m06_usos_mes: 5,
  gu_m08_usos_mes: 10,
  gu_m10_usos_mes: 3
};
function guGetMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}
function guVerificarLimite(key) {
  const limite = GU_LIMITES[key];
  if (!limite) return { permitido: true };
  const mes = guGetMesActual();
  let data = {};
  try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
  const usosEsteMes = data[mes] || 0;
  if (usosEsteMes >= limite) {
    return {
      permitido: false,
      usados: usosEsteMes,
      limite: limite,
      mensaje: `Has usado ${usosEsteMes} de ${limite} consultas gratuitas este mes.`
    };
  }
  return { permitido: true, usados: usosEsteMes, limite: limite };
}
function guRegistrarUso(key) {
  const mes = guGetMesActual();
  let data = {};
  try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
  data[mes] = (data[mes] || 0) + 1;
  // Limpiar meses anteriores
  Object.keys(data).forEach(k => { if (k !== mes) delete data[k]; });
  localStorage.setItem(key, JSON.stringify(data));
  return data[mes];
}
function guMostrarModalLimite(modulo, usados, limite) {
  // Modal simple sin dependencias
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.7);z-index:9999;
    display:flex;align-items:center;justify-content:center;
  `;
  modal.innerHTML = `
    <div style='background:var(--card-bg,#fff);border-radius:12px;padding:32px;
      max-width:400px;width:90%;text-align:center;font-family:var(--sans,sans-serif)'>
      <div style='font-size:32px;margin-bottom:12px'>🔒</div>
      <h2 style='font-size:18px;margin-bottom:8px;color:var(--text,#111)'>
        Límite del plan gratuito</h2>
      <p style='font-size:14px;color:var(--text2,#555);margin-bottom:20px'>
        Has usado ${usados} de ${limite} consultas gratuitas
        de ${modulo} este mes.</p>
      <p style='font-size:13px;color:var(--text2,#555);margin-bottom:24px'>
        El contador se reinicia el 1 de cada mes.<br>
        Próximamente: plan Pro con consultas ilimitadas.</p>
      <button onclick='this.closest("div").parentElement.remove()'
        style='background:var(--brand,#1F3A6E);color:#fff;border:none;
        border-radius:8px;padding:10px 24px;font-size:14px;cursor:pointer'>
        Entendido</button>
    </div>
  `;
  document.body.appendChild(modal);
}
