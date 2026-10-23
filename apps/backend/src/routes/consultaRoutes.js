const express = require('express');
const c = require('../controllers/consultaController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// RF09 / RN14
router.get('/', asyncHandler(c.listar));
router.get('/horarios-ocupados', asyncHandler(c.horariosOcupados));
// RF22 / RN16 / RN17
router.post('/', asyncHandler(c.criar));
router.put('/:id', asyncHandler(c.atualizar));
router.delete('/:id', asyncHandler(c.remover));

module.exports = router;
