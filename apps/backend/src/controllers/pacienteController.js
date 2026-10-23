const {
  cadastrarPacienteSchema,
  atualizarPacienteSchema,
  planoAlimentarSchema,
  evolucaoSchema,
} = require('@RoteiroNutri/shared');
const pacienteService = require('../services/pacienteService');
const planoService = require('../services/planoService');

const nutri = (req) => req.usuario.id;

async function listar(req, res) {
  const { busca, status } = req.query;
  res.json(await pacienteService.listar(nutri(req), { busca, status }));
}

async function cadastrar(req, res) {
  const dados = cadastrarPacienteSchema.parse(req.body);
  res.status(201).json(await pacienteService.cadastrar(nutri(req), dados));
}

async function detalhar(req, res) {
  res.json(await pacienteService.detalhar(nutri(req), req.params.id));
}

async function atualizar(req, res) {
  const dados = atualizarPacienteSchema.parse(req.body);
  res.json(await pacienteService.atualizar(nutri(req), req.params.id, dados));
}

async function desativar(req, res) {
  res.json(await pacienteService.desativar(nutri(req), req.params.id));
}

async function reativar(req, res) {
  res.json(await pacienteService.reativar(nutri(req), req.params.id));
}

async function gerarNovaSenha(req, res) {
  res.json(await pacienteService.gerarNovaSenha(nutri(req), req.params.id));
}

async function listarPlanos(req, res) {
  res.json(await planoService.listarDoPaciente(nutri(req), req.params.id));
}

async function criarPlano(req, res) {
  const dados = planoAlimentarSchema.parse(req.body);
  res.status(201).json(await planoService.criarVersao(nutri(req), req.params.id, dados));
}

async function registrarEvolucao(req, res) {
  const dados = evolucaoSchema.parse(req.body);
  res.status(201).json(await pacienteService.registrarEvolucao(nutri(req), req.params.id, dados));
}

async function removerEvolucao(req, res) {
  await pacienteService.removerEvolucao(nutri(req), req.params.id, req.params.evolucaoId);
  res.status(204).end();
}

module.exports = {
  listar,
  cadastrar,
  detalhar,
  atualizar,
  desativar,
  reativar,
  gerarNovaSenha,
  listarPlanos,
  criarPlano,
  registrarEvolucao,
  removerEvolucao,
};
