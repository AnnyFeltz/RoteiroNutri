const { consultaSchema, atualizarConsultaSchema, dataSchema } = require('@RoteiroNutri/shared');
const consultaService = require('../services/consultaService');

async function listar(req, res) {
  const { inicio, fim, pacienteId } = req.query;
  res.json(await consultaService.listar(req.usuario.id, { inicio, fim, pacienteId }));
}

async function horariosOcupados(req, res) {
  const data = dataSchema.parse(req.query.data);
  res.json(await consultaService.horariosOcupados(req.usuario.id, data));
}

async function criar(req, res) {
  const dados = consultaSchema.parse(req.body);
  res.status(201).json(await consultaService.criar(req.usuario.id, dados));
}

async function atualizar(req, res) {
  const dados = atualizarConsultaSchema.parse(req.body);
  res.json(await consultaService.atualizar(req.usuario.id, req.params.id, dados));
}

async function remover(req, res) {
  await consultaService.remover(req.usuario.id, req.params.id);
  res.status(204).end();
}

module.exports = { listar, horariosOcupados, criar, atualizar, remover };
