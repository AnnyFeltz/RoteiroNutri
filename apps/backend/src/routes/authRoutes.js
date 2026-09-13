const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// RF01
router.post('/nutricionistas/registrar', asyncHandler(authController.registrarNutricionista));
// RF02
router.post('/nutricionistas/login', asyncHandler(authController.loginNutricionista));
// RF16
router.post('/pacientes/login', asyncHandler(authController.loginPaciente));
// RF03
router.post('/recuperar-senha', asyncHandler(authController.solicitarRecuperacaoSenha));
router.post('/redefinir-senha', asyncHandler(authController.redefinirSenha));

module.exports = router;
