require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const router = require('./routes/routes');
const errorHandler = require('./middlewares/errorHandler');
const { sequelize } = require('./models');
const { registrarSocket } = require('./sockets');

const app = express();
const httpServer = createServer(app);
// CORS_ORIGIN aceita várias origens separadas por vírgula (web, expo web...)
const origens = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : '*';
const io = new Server(httpServer, {
  cors: { origin: origens },
});

app.use(cors({ origin: origens }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', router);

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));
app.use(errorHandler);

registrarSocket(io);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida.');
  } catch (err) {
    console.error('Não foi possível conectar ao banco de dados:', err.message);
  }

  httpServer.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
  });
}

start();
