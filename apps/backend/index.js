import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import { loginSchema } from '@meu-projeto/shared';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Exemplo de rota
app.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    // aqui você consulta o banco...
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ error: err.errors });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Função para enviar notificação de qualquer lugar
export function sendNotification(room, data) {
  io.to(room).emit('notification', data);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});