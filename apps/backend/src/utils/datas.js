// Datas "de calendário" (sem hora) no fuso do consultório.
// Evita que o "hoje" do servidor (UTC) seja diferente do "hoje" do paciente.
const FUSO = process.env.APP_TZ || 'America/Sao_Paulo';

/** Retorna a data no formato AAAA-MM-DD no fuso configurado. */
function hoje(data = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}

/** Soma (ou subtrai) dias de uma data AAAA-MM-DD. */
function somarDias(dataIso, dias) {
  const [a, m, d] = dataIso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

/** Diferença em dias entre duas datas AAAA-MM-DD (b - a). */
function diferencaDias(a, b) {
  const pa = Date.UTC(...a.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
  const pb = Date.UTC(...b.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
  return Math.round((pb - pa) / 86400000);
}

/** Horário atual HH:MM no fuso configurado. */
function horaAtual(data = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(data);
}

/** Normaliza "08:00:00" -> "08:00". */
function hhmm(horario) {
  return horario ? String(horario).slice(0, 5) : horario;
}

module.exports = { FUSO, hoje, somarDias, diferencaDias, horaAtual, hhmm };
