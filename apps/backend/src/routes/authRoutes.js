const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middlewares/authMiddleware');

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
// RF03 / RN09 - paciente (app): código por e-mail e redefinição no próprio app
router.post('/pacientes/solicitar-senha', asyncHandler(authController.solicitarSenhaPaciente));
router.post('/pacientes/redefinir-senha', asyncHandler(authController.redefinirSenhaPaciente));

router.get('/me', autenticar, asyncHandler(authController.me));

module.exports = router;
