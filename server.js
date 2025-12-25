require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const OpenAI = require("openai");
const rateLimit = require("express-rate-limit");
const { RateLimiterMemory } = require("rate-limiter-flexible");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============ EXPRESS RATE LIMITING (express-rate-limit) ============

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const summarizeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many summary requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ============ SOCKET.IO RATE LIMITING (rate-limiter-flexible) ============

// Create rate limiters for different socket events
const socketRateLimiters = {
  'join-room': new RateLimiterMemory({
    points: 5,           // 5 joins
    duration: 60,        // per 60 seconds
    blockDuration: 60,   // block for 60 seconds if exceeded
  }),
  'chat-message': new RateLimiterMemory({
    points: 30,          // 30 messages
    duration: 60,        // per 60 seconds
    blockDuration: 30,   // block for 30 seconds if exceeded
  }),
  'whiteboard-draw': new RateLimiterMemory({
    points: 200,         // 200 strokes
    duration: 1,         // per 1 second (for smooth drawing)
    blockDuration: 2,    // block for 2 seconds if exceeded
  }),
  'offer': new RateLimiterMemory({
    points: 10,          // 10 offers
    duration: 10,        // per 10 seconds
    blockDuration: 10,
  }),
  'answer': new RateLimiterMemory({
    points: 10,          // 10 answers
    duration: 10,        // per 10 seconds
    blockDuration: 10,
  }),
  'ice-candidate': new RateLimiterMemory({
    points: 500,         // 500 candidates (increased for multi-user calls)
    duration: 10,        // per 10 seconds
    blockDuration: 5,
  }),
  'caption': new RateLimiterMemory({
    points: 30,          // 30 captions
    duration: 10,        // per 10 seconds
    blockDuration: 5,
  }),
};

// Rate limit check function
async function checkSocketRateLimit(socket, eventName) {
  const limiter = socketRateLimiters[eventName];
  if (!limiter) return true;

  try {
    await limiter.consume(socket.id);
    return true;
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    socket.emit('error', {
      message: `Rate limit exceeded. Please wait ${secs} seconds.`,
      retryAfter: secs
    });
    console.warn(`Rate limit exceeded: ${socket.id} on ${eventName} (retry in ${secs}s)`);
    return false;
  }
}

// ============ ROUTES ============

app.get("/", (req, res) => {
  res.send("Signaling server is up!");
});

app.post("/api/summarize", summarizeLimiter, async (req, res) => {
  try {
    const { transcript, participants } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "No transcript provided" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a meeting assistant. Summarize the following meeting transcript. Include:
1. **Key Discussion Points** - Main topics discussed
2. **Decisions Made** - Any decisions or agreements
3. **Action Items** - Tasks or follow-ups mentioned
4. **Brief Summary** - 2-3 sentence overview

Keep it concise and well-formatted in markdown.`
        },
        {
          role: "user",
          content: `Meeting participants: ${participants?.join(", ") || "Unknown"}\n\nTranscript:\n${transcript}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    res.json({
      summary: completion.choices[0].message.content,
      tokens_used: completion.usage?.total_tokens || 0
    });
  } catch (error) {
    console.error("Summarize error:", error);
    res.status(500).json({ error: error.message || "Failed to generate summary" });
  }
});

// ============ SOCKET.IO ============

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};
const whiteboardStates = {};

const MAX_ROOM_ID_LENGTH = 20;
const MAX_USERNAME_LENGTH = 50;
const MAX_WHITEBOARD_STROKES = 5000;
const MAX_USERS_PER_ROOM = 4;

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", async ({ roomId, username }) => {
    if (!await checkSocketRateLimit(socket, 'join-room')) return;

    if (!roomId || typeof roomId !== 'string' || roomId.length > MAX_ROOM_ID_LENGTH) {
      socket.emit('error', { message: 'Invalid room ID' });
      return;
    }

    // Check room capacity
    if (rooms[roomId] && rooms[roomId].length >= MAX_USERS_PER_ROOM) {
      socket.emit('error', { message: `Room is full (max ${MAX_USERS_PER_ROOM} users)` });
      console.log(`Room ${roomId} is full, rejecting ${socket.id}`);
      return;
    }

    const sanitizedUsername = typeof username === 'string'
      ? username.slice(0, MAX_USERNAME_LENGTH)
      : `User-${socket.id.slice(0, 4)}`;

    console.log(`${socket.id} (${sanitizedUsername}) is joining room ${roomId}`);
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    const user = { id: socket.id, username: sanitizedUsername };
    rooms[roomId].push(user);

    socket.roomId = roomId;
    socket.username = user.username;

    const existingUsers = rooms[roomId].filter(u => u.id !== socket.id);
    socket.emit("room-users", existingUsers);

    if (whiteboardStates[roomId] && whiteboardStates[roomId].length > 0) {
      socket.emit("whiteboard-state", whiteboardStates[roomId]);
    }

    socket.to(roomId).emit("user-joined", user);
    console.log(`Room ${roomId} now has ${rooms[roomId].length} users`);

    if (rooms[roomId].length >= 2) {
      io.to(roomId).emit("ready");
    }
  });

  socket.on("offer", async ({ offer, targetId }) => {
    if (!await checkSocketRateLimit(socket, 'offer')) return;
    io.to(targetId).emit("offer", {
      offer,
      senderId: socket.id,
      senderName: socket.username
    });
  });

  socket.on("answer", async ({ answer, targetId }) => {
    if (!await checkSocketRateLimit(socket, 'answer')) return;
    io.to(targetId).emit("answer", {
      answer,
      senderId: socket.id
    });
  });

  socket.on("ice-candidate", async ({ candidate, targetId }) => {
    if (!await checkSocketRateLimit(socket, 'ice-candidate')) return;
    io.to(targetId).emit("ice-candidate", {
      candidate,
      senderId: socket.id
    });
  });

  socket.on("chat message", async ({ message, room }) => {
    if (!await checkSocketRateLimit(socket, 'chat-message')) return;
    socket.to(room).emit("chat message", {
      message,
      sender: socket.username,
      senderId: socket.id,
      timestamp: Date.now()
    });
  });

  socket.on("whiteboard-draw", async ({ room, drawData }) => {
    if (!await checkSocketRateLimit(socket, 'whiteboard-draw')) return;
    if (!room || !drawData) return;

    if (!whiteboardStates[room]) {
      whiteboardStates[room] = [];
    }
    whiteboardStates[room].push(drawData);

    if (whiteboardStates[room].length > MAX_WHITEBOARD_STROKES) {
      whiteboardStates[room] = whiteboardStates[room].slice(-MAX_WHITEBOARD_STROKES);
    }

    socket.to(room).emit("whiteboard-draw", drawData);
  });

  socket.on("whiteboard-clear", ({ room }) => {
    if (!room) return;
    whiteboardStates[room] = [];
    socket.to(room).emit("whiteboard-clear");
  });

  socket.on("caption", async ({ room, caption, sender, senderId }) => {
    if (!await checkSocketRateLimit(socket, 'caption')) return;
    socket.to(room).emit("caption", { caption, sender, senderId });
  });

  // Handle explicit room leave (hangup button)
  socket.on("leave-room", ({ roomId }) => {
    if (!roomId) return;

    const currentRoom = socket.roomId;
    if (currentRoom && rooms[currentRoom]) {
      // Remove user from room
      rooms[currentRoom] = rooms[currentRoom].filter((u) => u.id !== socket.id);

      // Notify other participants
      socket.to(currentRoom).emit("user-left", {
        id: socket.id,
        username: socket.username
      });

      // Leave the socket.io room
      socket.leave(currentRoom);

      // Clean up empty rooms
      if (rooms[currentRoom].length === 0) {
        delete rooms[currentRoom];
        delete whiteboardStates[currentRoom];
      }

      // Clear socket's room reference
      socket.roomId = null;
      socket.username = null;

      console.log(`${socket.id} left room ${currentRoom}`);
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id);
      socket.to(roomId).emit("user-left", {
        id: socket.id,
        username: socket.username
      });

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
        delete whiteboardStates[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Rate limiting enabled:');
  console.log('  - HTTP: express-rate-limit');
  console.log('  - Socket.IO: rate-limiter-flexible (RateLimiterMemory)');
});
