const express = require('express');
const c = require('../controllers/notificacaoController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(c.listar));
router.get('/contagem', asyncHandler(c.contagem));
router.patch('/alteracoes/lidas', asyncHandler(c.marcarLidas));
router.delete('/alteracoes', asyncHandler(c.limpar));

module.exports = router;
