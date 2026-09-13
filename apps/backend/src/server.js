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
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// deixa o io acessível dentro dos controllers/services via req.app.get('io')
app.set('io', io);

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
