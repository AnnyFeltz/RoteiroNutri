const express = require('express');
const c = require('../controllers/planoController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// RF14 - painel global
router.get('/', asyncHandler(c.painel));
router.get('/:id', asyncHandler(c.detalhar));

module.exports = router;
