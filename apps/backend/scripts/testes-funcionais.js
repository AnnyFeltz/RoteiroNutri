// Testes funcionais da API do Roteiro Nutri: percorre os requisitos (RF/RN) como um usuário faria.
//
// Uso (com o PostgreSQL rodando e a TACO carregada):
//   1. suba a API sem SMTP, guardando o log (é dele que saem a senha inicial e o código de recuperação):
//        SMTP_HOST= node src/server.js > /tmp/api.log 2>&1 &
//   2. rode:  npm run test:funcional -- /tmp/api.log
// Os dados criados usam e-mails @teste.local e são apagados no fim.
const fs = require('fs');
const { Op } = require('sequelize');
const A = 'http://localhost:3001/api';
const LOG = process.argv[2];
if (!LOG) {
  console.error('Informe o arquivo de log da API. Ex.: npm run test:funcional -- /tmp/api.log');
  process.exit(1);
}
const sufixo = Date.now().toString(36);
const resultados = [];

async function req(m, u, token, body) {
  const r = await fetch(A + u, {
    method: m,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}
function caso(id, rf, descricao, esperado, ok, obtido) {
  resultados.push({ id, rf, descricao, esperado, obtido, ok: !!ok });
  console.log(`${ok ? 'PASSOU' : 'FALHOU'}  ${id} [${rf}] ${descricao} -> ${obtido}`);
}
const ultimoEmail = (para) => {
  const t = fs.readFileSync(LOG, 'utf8');
  const blocos = t.split('[e-mail não enviado: SMTP não configurado]').filter((b) => b.includes(`Para: ${para}`));
  return blocos[blocos.length - 1] || '';
};
const hojeISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const somar = (d, n) => { const [a, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(a, m - 1, dd + n)).toISOString().slice(0, 10); };

(async () => {
  const emailNutri = `nutri.${sufixo}@teste.local`;
  const emailPac = `paciente.${sufixo}@teste.local`;

  // CT01 - cadastro do nutricionista
  let r = await req('POST', '/auth/nutricionistas/registrar', null, { nome: 'Nutri Teste', email: emailNutri, senha: 'senha123', crn: 'CRN-8 0000' });
  caso('CT01', 'RF01', 'Cadastrar nutricionista com dados válidos', 'Conta criada (201)', r.status === 201, r.status);
  r = await req('POST', '/auth/nutricionistas/registrar', null, { nome: 'Outro', email: emailNutri, senha: 'senha123', crn: 'CRN-8 0001' });
  caso('CT02', 'RF01', 'Cadastrar nutricionista com e-mail já usado', 'Cadastro recusado', r.status >= 400 && r.status < 500, `${r.status} - ${r.data?.erro}`);
  r = await req('POST', '/auth/nutricionistas/registrar', null, { nome: 'Outro', email: `x${emailNutri}`, senha: '123', crn: 'CRN-8 0002' });
  caso('CT03', 'RN09', 'Cadastrar senha com menos de 6 caracteres', 'Cadastro recusado', r.status === 400, `${r.status} - ${r.data?.erro}`);

  // CT04 - login
  r = await req('POST', '/auth/nutricionistas/login', null, { email: emailNutri, senha: 'errada' });
  caso('CT04', 'RF02', 'Login do nutricionista com senha incorreta', 'Acesso negado', r.status === 401, `${r.status} - ${r.data?.erro}`);
  r = await req('POST', '/auth/nutricionistas/login', null, { email: emailNutri, senha: 'senha123' });
  const tn = r.data?.token;
  caso('CT05', 'RF02', 'Login do nutricionista com credenciais corretas', 'Acesso liberado (token JWT)', r.status === 200 && tn, r.status);

  // CT06 - cadastro do paciente com senha gerada e enviada por e-mail
  r = await req('POST', '/pacientes', tn, {
    nome: 'Paciente Teste', email: emailPac, idade: 30, sexo: 'F', alturaCm: 165, pesoInicialKg: 70, pesoMetaKg: 64, objetivo: 'emagrecimento',
  });
  const pac = r.data?.paciente;
  const senhaInicial = r.data?.senhaProvisoria;
  const email = ultimoEmail(emailPac);
  caso('CT06', 'RF04 / RN08', 'Cadastrar paciente', 'Paciente criado, senha inicial gerada e enviada ao e-mail do paciente',
    r.status === 201 && senhaInicial && email.includes(senhaInicial), `${r.status}; e-mail com a senha: ${email.includes(senhaInicial) ? 'sim' : 'não'}`);
  r = await req('POST', '/auth/pacientes/login', null, { email: emailPac, senha: senhaInicial });
  let tp = r.data?.token;
  caso('CT07', 'RF16 / RN08', 'Login do paciente no app com a senha recebida por e-mail', 'Acesso liberado', r.status === 200 && tp, r.status);

  // CT08 - controle de acesso
  r = await req('GET', '/pacientes', tp);
  const r2 = await req('GET', '/pacientes');
  caso('CT08', 'RNF02', 'Paciente tenta acessar rota do nutricionista / acesso sem login', 'Acesso negado', r.status === 403 && r2.status === 401, `${r.status} / ${r2.status}`);

  // CT09 - TACO
  r = await req('GET', '/alimentos?busca=arroz integral', tn);
  const est = await req('GET', '/alimentos/estatisticas', tn);
  caso('CT09', 'RF13', 'Consultar a tabela TACO pela busca "arroz integral"', 'Lista os alimentos encontrados', r.status === 200 && r.data.total > 0,
    `${r.data?.total} resultados; base com ${est.data?.total ?? est.data?.totalAlimentos ?? JSON.stringify(est.data).slice(0, 60)}`);

  // CT10 - plano inválido
  const refeicoesV1 = [
    { nome: 'Café da manhã', horario: '07:00', itens: [{ alimentoId: 52, gramas: 50, substitutos: [{ alimentoId: 7, gramas: 46 }] }, { alimentoId: 182, gramas: 100, substitutos: [] }] },
    { nome: 'Almoço', horario: '12:30', itens: [{ alimentoId: 1, gramas: 120, substitutos: [] }, { alimentoId: 410, gramas: 100, substitutos: [] }] },
  ];
  r = await req('POST', `/pacientes/${pac.id}/planos`, tn, { nome: 'Plano teste', kcalAlvo: 1700, pctCarbo: 50, pctProteina: 30, pctGordura: 30, refeicoes: refeicoesV1 });
  caso('CT10', 'RF10', 'Criar plano com macronutrientes somando 110%', 'Plano recusado', r.status === 400, `${r.status} - ${r.data?.erro}`);

  // CT11 - plano válido com substituto
  r = await req('POST', `/pacientes/${pac.id}/planos`, tn, { nome: 'Plano teste', kcalAlvo: 1700, pctCarbo: 50, pctProteina: 25, pctGordura: 25, refeicoes: refeicoesV1 });
  const planoV1 = r.data?.plano || r.data;
  caso('CT11', 'RF10 / RF12', 'Criar plano com refeições, alimentos e substituto', 'Plano criado como ativo (versão 1)',
    r.status === 201 && planoV1?.ativo && planoV1?.versao === 1, `${r.status}; versão ${planoV1?.versao}, ativo=${planoV1?.ativo}`);

  // CT12 - editar = nova versão, só um ativo
  r = await req('POST', `/pacientes/${pac.id}/planos`, tn, {
    nome: 'Plano teste', kcalAlvo: 1650, pctCarbo: 45, pctProteina: 30, pctGordura: 25,
    refeicoes: [...refeicoesV1, { nome: 'Jantar', horario: '19:30', itens: [{ alimentoId: 317, gramas: 120, substitutos: [] }] }],
  });
  const lista = await req('GET', `/pacientes/${pac.id}/planos`, tn);
  const planos = lista.data?.planos || lista.data || [];
  const ativos = planos.filter((p) => p.ativo);
  caso('CT12', 'RF11 / RN07 / RN20', 'Editar o plano ativo', 'Nova versão criada; só ela fica ativa e a anterior vai para o histórico',
    r.status === 201 && planos.length === 2 && ativos.length === 1 && ativos[0].versao === 2, `${planos.length} versões, ${ativos.length} ativa (v${ativos[0]?.versao})`);

  // CT13 - histórico pelo app
  r = await req('GET', '/app/planos', tp);
  caso('CT13', 'RF27', 'Paciente consulta o histórico de planos no app', 'Lista as 2 versões', r.status === 200 && r.data.length === 2, `${r.data?.length} versões`);

  // CT14/15 - agenda
  const dia = somar(hojeISO(), 3);
  r = await req('POST', '/consultas', tn, { pacienteId: pac.id, data: dia, horario: '14:00', tipo: 'Retorno' });
  caso('CT14', 'RF22 / RN16', 'Agendar consulta com data e horário', 'Consulta agendada', r.status === 201, r.status);
  r = await req('POST', '/consultas', tn, { pacienteId: pac.id, data: dia, horario: '14:00', tipo: 'Retorno' });
  caso('CT15', 'RN17', 'Agendar outra consulta no mesmo dia e horário', 'Agendamento recusado (conflito)', r.status === 409 || r.status === 422, `${r.status} - ${r.data?.erro}`);
  r = await req('GET', '/app/perfil', tp);
  caso('CT16', 'RF23 / RN15', 'Paciente vê a próxima consulta no app', 'Data e horário da consulta agendada',
    r.data?.proximaConsulta?.data === dia, `${r.data?.proximaConsulta?.data} ${r.data?.proximaConsulta?.horario}`);

  // CT17 - plano do dia, substituto e consumo
  r = await req('GET', '/app/plano', tp);
  const plano = r.data?.plano;
  const cafe = plano?.refeicoes.find((x) => x.nome === 'Café da manhã');
  const item = cafe?.itens.find((i) => i.substitutos?.length);
  caso('CT17', 'RF18 / RN11', 'Paciente abre o plano ativo no app', 'Exibe a versão ativa com as refeições', r.status === 200 && plano?.versao === 2, `versão ${plano?.versao}, ${plano?.refeicoes?.length} refeições`);
  r = await req('PUT', `/app/itens/${item.id}/substituto`, tp, { substitutoId: item.substitutos[0].id });
  const depois = await req('GET', '/app/plano', tp);
  const itemDepois = depois.data.plano.refeicoes.find((x) => x.id === cafe.id).itens.find((i) => i.id === item.id);
  caso('CT18', 'RF19 / RN13', 'Paciente troca o pão pelo substituto cadastrado', 'Substituto fica registrado no item',
    r.status === 200 && itemDepois.substitutoEscolhidoId === item.substitutos[0].id, r.status);
  r = await req('PUT', `/app/refeicoes/${cafe.id}/consumo`, tp, { consumida: true });
  const dash = await req('GET', `/pacientes/${pac.id}`, tn);
  caso('CT19', 'RF25 / RN19', 'Paciente marca o café da manhã como consumido', 'Registro salvo e visível para o nutricionista',
    r.status === 200, `${r.status}; ${JSON.stringify(dash.data?.adesao ?? dash.data?.adesaoHoje ?? '').slice(0, 60)}`);

  r = await req('GET', '/nutricionista/dashboard', tn);
  caso('CT20', 'RF20 / RN19', 'Nutricionista abre o dashboard depois do registro de consumo', 'Taxa de adesão dos pacientes calculada',
    r.status === 200 && r.data?.taxaAdesao > 0, `${r.status}; taxa ${r.data?.taxaAdesao}%`);

  // CT21 - medidas pelo paciente
  r = await req('POST', '/app/evolucao', tp, { pesoKg: 69.2, alturaCm: 166 });
  const ficha = await req('GET', `/pacientes/${pac.id}`, tn);
  const fp = ficha.data?.paciente || ficha.data;
  caso('CT21', 'RF26 / RN21', 'Paciente atualiza peso e altura pelo app', 'Valores novos aparecem para o nutricionista',
    r.status === 201 && fp.pesoAtualKg === 69.2 && fp.alturaCm === 166, `peso ${fp.pesoAtualKg} kg, altura ${fp.alturaCm} cm`);

  // CT22 - restrição de edição
  r = await req('PUT', '/app/perfil', tp, { nome: 'Paciente Teste', email: emailPac, telefone: '(41) 90000-0000', objetivo: 'hipertrofia', alergias: 'nenhuma' });
  const f2 = (await req('GET', `/pacientes/${pac.id}`, tn)).data;
  const p2 = f2.paciente || f2;
  caso('CT22', 'RF24 / RN18', 'Paciente edita o perfil tentando mudar também objetivo e alergias', 'Só os dados pessoais mudam',
    r.status === 200 && p2.telefone === '(41) 90000-0000' && p2.objetivo === 'emagrecimento' && !p2.alergias, `telefone ${p2.telefone}; objetivo ${p2.objetivo}`);

  // CT23-26 - recuperação de senha do paciente
  r = await req('POST', '/auth/pacientes/solicitar-senha', null, { email: emailPac });
  const codigo = (ultimoEmail(emailPac).match(/\b[A-Z2-9]{8}\b/g) || []).pop();
  caso('CT23', 'RF03 / RN09', 'Paciente pede a redefinição de senha', 'Código de 8 caracteres enviado ao e-mail cadastrado', r.status === 200 && codigo, codigo ? 'código recebido' : 'sem código');
  r = await req('POST', '/auth/pacientes/redefinir-senha', null, { email: emailPac, codigo: 'AAAAAAAA', novaSenha: 'nova1234' });
  caso('CT24', 'RN09', 'Redefinir com código errado', 'Redefinição recusada', r.status >= 400, `${r.status} - ${r.data?.erro}`);
  r = await req('POST', '/auth/pacientes/redefinir-senha', null, { email: emailPac, codigo, novaSenha: 'nova1234' });
  const loginNovo = await req('POST', '/auth/pacientes/login', null, { email: emailPac, senha: 'nova1234' });
  const loginVelho = await req('POST', '/auth/pacientes/login', null, { email: emailPac, senha: senhaInicial });
  caso('CT25', 'RF03 / RN09', 'Redefinir com o código correto', 'Nova senha passa a valer e a antiga não',
    r.status === 200 && loginNovo.status === 200 && loginVelho.status === 401, `${r.status}; nova ${loginNovo.status}, antiga ${loginVelho.status}`);
  r = await req('POST', '/auth/pacientes/redefinir-senha', null, { email: emailPac, codigo, novaSenha: 'outra123' });
  caso('CT26', 'RN09', 'Reutilizar o mesmo código', 'Código recusado (uso único)', r.status >= 400, `${r.status} - ${r.data?.erro}`);
  tp = loginNovo.data?.token;

  // CT27-28 - desativar e reativar
  r = await req('PATCH', `/pacientes/${pac.id}/desativar`, tn);
  const semAtivo = ((await req('GET', `/pacientes/${pac.id}/planos`, tn)).data || []);
  const ls = (semAtivo.planos || semAtivo).filter((p) => p.ativo).length;
  const loginBloq = await req('POST', '/auth/pacientes/login', null, { email: emailPac, senha: 'nova1234' });
  caso('CT27', 'RF06 / RN04', 'Desativar paciente com plano ativo', 'Plano suspenso e acesso ao app bloqueado',
    r.status === 200 && ls === 0 && loginBloq.status === 403, `${ls} planos ativos; login ${loginBloq.status}`);
  r = await req('PATCH', `/pacientes/${pac.id}/reativar`, tn);
  const volta = ((await req('GET', `/pacientes/${pac.id}/planos`, tn)).data || []);
  const ativo = (volta.planos || volta).find((p) => p.ativo);
  const loginOk = await req('POST', '/auth/pacientes/login', null, { email: emailPac, senha: 'nova1234' });
  caso('CT28', 'RF29 / RN04', 'Reativar o paciente', 'O plano suspenso volta a ser o ativo e o login é liberado',
    r.status === 200 && ativo?.versao === 2 && loginOk.status === 200, `ativo v${ativo?.versao}; login ${loginOk.status}`);

  console.log(`\n${resultados.filter((x) => x.ok).length}/${resultados.length} passaram`);
  process.exitCode = resultados.every((x) => x.ok) ? 0 : 1;
})()
  .finally(async () => {
    // limpeza: apagar o nutricionista de teste remove em cascata pacientes, planos e consultas
    const { Nutricionista, sequelize } = require('../src/models');
    await Nutricionista.destroy({ where: { email: { [Op.like]: '%@teste.local' } } });
    await sequelize.close();
  }).catch((e) => { console.error('ERRO NO ROTEIRO', e); process.exit(1); });
