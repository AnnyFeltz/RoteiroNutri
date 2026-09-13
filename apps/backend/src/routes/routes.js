const express = require('express');
const authRoutes = require('./authRoutes');
// próximos módulos entram aqui conforme forem implementados:
// const pacienteRoutes = require('./pacienteRoutes');
// const planoAlimentarRoutes = require('./planoAlimentarRoutes');

const router = express.Router();

router.get('/', (req, res) => res.json({ status: 'ok', servico: 'RoteiroNutri API' }));

router.use('/auth', authRoutes);
// router.use('/pacientes', pacienteRoutes);
// router.use('/planos-alimentares', planoAlimentarRoutes);

module.exports = router;
