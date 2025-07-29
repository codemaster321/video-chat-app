const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("Signaling server is up!");
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // Keep track of users per room

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    console.log(`${socket.id} is joining room ${roomId}`);
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push(socket.id);

    // When two people are in the room, signal that both are ready
    if (rooms[roomId].length === 2) {
      console.log(`Room ${roomId} is full. Emitting 'ready'`);
      io.to(roomId).emit("ready");
    }

    // Relay offer to others in the room
    socket.on("offer", (data) => {
      console.log("Offer received from", socket.id);
      socket.to(roomId).emit("offer", data);
    });

    // Relay answer
    socket.on("answer", (data) => {
      console.log("Answer received from", socket.id);
      socket.to(roomId).emit("answer", data);
    });

    // Relay ICE candidates
    socket.on("ice-candidate", (data) => {
      console.log("ICE candidate received from", socket.id);
      socket.to(roomId).emit("ice-candidate", data);
    });

    // Relay chat messages
    socket.on("chat message", (msg) => {
      console.log("Chat message:", msg);
      socket.to(roomId).emit("chat message", msg);
    });

    // Handle disconnects
    socket.on("disconnect", () => {
      console.log(`${socket.id} disconnected from room ${roomId}`);
      rooms[roomId] = rooms[roomId]?.filter((id) => id !== socket.id);
      socket.to(roomId).emit("leave");

      // Clean up empty rooms
      if (rooms[roomId]?.length === 0) {
        delete rooms[roomId];
      }
    });
  });
});

server.listen(3000, () => {
  console.log("Signaling server listening on port 3000");
});
