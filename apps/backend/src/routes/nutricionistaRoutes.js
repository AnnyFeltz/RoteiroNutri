const express = require('express');
const c = require('../controllers/nutricionistaController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/perfil', asyncHandler(c.perfil));
router.put('/perfil', asyncHandler(c.atualizarPerfil));
router.put('/senha', asyncHandler(c.alterarSenha));
router.put('/foto', asyncHandler(c.atualizarFoto));
router.put('/preferencias', asyncHandler(c.atualizarPreferencias));
// RF09
router.get('/dashboard', asyncHandler(c.dashboard));
// RF21
router.get('/evolucao', asyncHandler(c.evolucaoGeral));

module.exports = router;
