import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer((req, res) => {
  // Simple POST endpoint for backend broadcasting
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { room, event, payload } = JSON.parse(body);
        if (room && event) {
          io.to(room).emit(event, payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          console.log(`Broadcast: room=${room} event=${event}`);
        } else {
          res.writeHead(400);
          res.end('Missing room or event');
        }
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Adjust this for production
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.SOCKET_PORT || 3001;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // User joins their own room based on their userID for private notifications
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user room: user:${userId}`);
    }
  });

  // Join a specific chat room
  socket.on('join-chat-room', (roomId) => {
    if (roomId) {
      socket.join(`room:${roomId}`);
      console.log(`Socket ${socket.id} joined chat room: room:${roomId}`);
    }
  });

  // Broadcast a new message to everyone in the room
  socket.on('send-message', (data) => {
    const { roomId, message } = data;
    if (roomId && message) {
      // Emit to everyone in the room EXCEPT the sender
      socket.to(`room:${roomId}`).emit('message:new', message);
      console.log(`Message broadcasted to room:${roomId}`);
    }
  });

  // Proxy for internal API emitters (optional but useful)
  socket.on('internal:emit', (data) => {
    const { room, event, payload } = data;
    if (room && event) {
      io.to(room).emit(event, payload);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
