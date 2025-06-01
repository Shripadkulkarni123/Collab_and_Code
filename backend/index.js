// index.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on('join', ({ roomId, userName }) => {
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).users.delete(currentUser);
      socket.leave(currentRoom);
      const usersList = Array.from(rooms.get(currentRoom).users);
      io.to(currentRoom).emit('userJoined', usersList);
    }

    currentRoom = roomId;
    currentUser = userName;
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        code: '',
        language: 'javascript',
      });
    }

    const room = rooms.get(roomId);
    room.users.add(userName);

    socket.emit('codeUpdate', room.code);
    socket.emit('languageUpdate', room.language);

    const usersList = Array.from(room.users);
    io.to(roomId).emit('userJoined', usersList);
  });

  socket.on('codeChange', ({ roomId, code }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      io.to(roomId).emit('codeUpdate', code);
    }
  });

  socket.on('languageChange', ({ roomId, language }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      io.to(roomId).emit('languageUpdate', language);
    }
  });

  socket.on('typing', ({ roomId, userName }) => {
    io.to(roomId).emit('userTyping', { userName });
  });

  socket.on('compileCode', async ({ code, roomId, language, input }) => {
    try {
      const languageMap = {
        javascript: { language: 'javascript', version: '18.15.0' },
        python: { language: 'python', version: '3.10.0' },
        java: { language: 'java', version: '15.0.2' },
        cpp: { language: 'cpp', version: '10.2.0' },
      };

      const langConfig = languageMap[language];
      if (!langConfig) throw new Error(`Unsupported language: ${language}`);

      const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: langConfig.language,
        version: langConfig.version,
        files: [{ content: code }],
        stdin: input,
      });

      io.to(roomId).emit('codeResponse', response.data);
    } catch (error) {
      io.to(roomId).emit('codeResponse', {
        run: {
          output: '',
          stderr: error.message,
        },
      });
    }
  });

  socket.on('leaveRoom', ({ roomId, userName }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.users.delete(userName);
      if (room.users.size === 0) {
        rooms.delete(roomId);
      } else {
        const usersList = Array.from(room.users);
        io.to(roomId).emit('userJoined', usersList);
      }
      socket.leave(roomId);
    }
    currentRoom = null;
    currentUser = null;
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.users.delete(currentUser);
      if (room.users.size === 0) {
        rooms.delete(currentRoom);
      } else {
        const usersList = Array.from(room.users);
        io.to(currentRoom).emit('userJoined', usersList);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the root directory (one level up from backend)
const rootDir = path.join(__dirname, '..');

// Serve static files
app.use('/', express.static(path.join(rootDir, "frontend", "dist")));

// Handle all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, "frontend", "dist", "index.html"));
});

app.get('/:path', (req, res) => {
  res.sendFile(path.join(rootDir, "frontend", "dist", "index.html"));
});

const PORT = process.env.PORT || 1111;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
