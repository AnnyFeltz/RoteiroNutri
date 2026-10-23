const express = require('express');
const c = require('../controllers/appPacienteController');
const asyncHandler = require('../utils/asyncHandler');

// Rotas do app mobile do paciente. Tudo é sempre do paciente logado (req.usuario.id).
const router = express.Router();

// RF17 / RF24
router.get('/perfil', asyncHandler(c.perfil));
router.put('/perfil', asyncHandler(c.atualizarPerfil));
router.put('/senha', asyncHandler(c.alterarSenha));
router.put('/foto', asyncHandler(c.atualizarFoto));
router.put('/preferencias', asyncHandler(c.atualizarPreferencias));
// RF18
router.get('/plano', asyncHandler(c.planoDoDia));
router.get('/planos', asyncHandler(c.historicoPlanos));
// RF20 / RF25
router.put('/refeicoes/:refeicaoId/consumo', asyncHandler(c.registrarConsumo));
// RF19
router.put('/itens/:itemId/substituto', asyncHandler(c.escolherSubstituto));
// RF23
router.get('/consultas', asyncHandler(c.consultas));
// RF21
router.get('/evolucao', asyncHandler(c.evolucao));
router.post('/evolucao', asyncHandler(c.registrarPeso));

module.exports = router;
