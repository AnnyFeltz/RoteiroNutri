const express = require('express');
const c = require('../controllers/pacienteController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// RF07 / RF04
router.get('/', asyncHandler(c.listar));
router.post('/', asyncHandler(c.cadastrar));
// RF05 / RF08
router.get('/:id', asyncHandler(c.detalhar));
router.put('/:id', asyncHandler(c.atualizar));
// RF06 / RN04
router.patch('/:id/desativar', asyncHandler(c.desativar));
router.patch('/:id/reativar', asyncHandler(c.reativar));
router.post('/:id/nova-senha', asyncHandler(c.gerarNovaSenha));
// RF10 / RF11 - cada POST gera uma nova versão do plano
router.get('/:id/planos', asyncHandler(c.listarPlanos));
router.post('/:id/planos', asyncHandler(c.criarPlano));
// RF21
router.post('/:id/evolucao', asyncHandler(c.registrarEvolucao));
router.delete('/:id/evolucao/:evolucaoId', asyncHandler(c.removerEvolucao));

module.exports = router;
