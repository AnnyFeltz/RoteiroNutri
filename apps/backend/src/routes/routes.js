const express = require('express');
const { autenticar, autorizar } = require('../middlewares/authMiddleware');
const authRoutes = require('./authRoutes');
const nutricionistaRoutes = require('./nutricionistaRoutes');
const pacienteRoutes = require('./pacienteRoutes');
const planoRoutes = require('./planoRoutes');
const consultaRoutes = require('./consultaRoutes');
const alimentoRoutes = require('./alimentoRoutes');
const notificacaoRoutes = require('./notificacaoRoutes');
const appPacienteRoutes = require('./appPacienteRoutes');

const router = express.Router();

const somenteNutricionista = [autenticar, autorizar('nutricionista')];
const somentePaciente = [autenticar, autorizar('paciente')];

router.get('/', (req, res) => res.json({ status: 'ok', servico: 'RoteiroNutri API' }));

router.use('/auth', authRoutes);

// Web — exclusivo do nutricionista
router.use('/nutricionista', somenteNutricionista, nutricionistaRoutes);
router.use('/pacientes', somenteNutricionista, pacienteRoutes);
router.use('/planos', somenteNutricionista, planoRoutes);
router.use('/consultas', somenteNutricionista, consultaRoutes);
router.use('/notificacoes', somenteNutricionista, notificacaoRoutes);

// TACO — consulta liberada para qualquer usuário logado
router.use('/alimentos', autenticar, alimentoRoutes);

// Mobile — exclusivo do paciente
router.use('/app', somentePaciente, appPacienteRoutes);

module.exports = router;
