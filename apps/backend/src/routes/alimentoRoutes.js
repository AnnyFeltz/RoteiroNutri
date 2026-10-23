const express = require('express');
const c = require('../controllers/alimentoController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// RF13 - tabela TACO
router.get('/', asyncHandler(c.listar));
router.get('/categorias', asyncHandler(c.categorias));
router.get('/estatisticas', asyncHandler(c.estatisticas));
router.get('/:id', asyncHandler(c.buscarPorId));

module.exports = router;
