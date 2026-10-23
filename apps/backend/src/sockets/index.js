const { verificarToken } = require('../utils/jwt');

let ioGlobal = null;

const sala = (tipo, id) => `${tipo}:${id}`;

/**
 * Configura os eventos de socket. O cliente se autentica enviando o JWT
 * (handshake.auth.token) e entra automaticamente na sala do próprio usuário,
 * permitindo notificar um nutricionista ou paciente específico em tempo real
 * (ex: paciente alterou o perfil, novo plano alimentar publicado).
 */
function registrarSocket(io) {
  ioGlobal = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      socket.usuario = verificarToken(token);
      next();
    } catch (err) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const { id, tipo } = socket.usuario;
    socket.join(sala(tipo, id));
  });
}

/** Envia um evento para um usuário (tipo: 'nutricionista' | 'paciente'). */
function notificar(tipo, usuarioId, evento, dados = {}) {
  if (ioGlobal) ioGlobal.to(sala(tipo, usuarioId)).emit(evento, dados);
}

module.exports = { registrarSocket, notificar };
