/**
 * Configura os eventos de socket. Cada usuário entra em uma "sala" com seu
 * próprio id, permitindo notificar um nutricionista ou paciente específico
 * (ex: notificação de próxima consulta, lembrete de refeição).
 */
function registrarSocket(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('join', (usuarioId) => {
      socket.join(usuarioId);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

/** Envia uma notificação para a sala (usuarioId) informada. */
function notificar(io, usuarioId, evento, dados) {
  io.to(usuarioId).emit(evento, dados);
}

module.exports = { registrarSocket, notificar };
