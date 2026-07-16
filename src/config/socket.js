let io;

module.exports = {
    init: (server) => {
        const { Server } = require("socket.io");
        io = new Server(server, {
            cors: {
                origin: "*", // En producción puedes restringirlo al dominio de tu app
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log(`🔌 Cliente conectado al socket: ${socket.id}`);

            // El celular avisa a qué canal de reporte quiere unirse
            socket.on('join_canal', (reporteId) => {
                const roomName = `canal_${reporteId}`;
                socket.join(roomName);
                console.log(`👤 Socket ${socket.id} se unió a ${roomName}`);
            });

            socket.on('disconnect', () => {
                console.log(`❌ Cliente desconectado: ${socket.id}`);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io no ha sido inicializado!");
        }
        return io;
    }
};