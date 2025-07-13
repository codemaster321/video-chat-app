const express = require("express");
const socketIO = require("socket.io");
const app = express();
const cors = require("cors");

app.use(cors({ origin: "*" }));

app.get("/", (req, res, next) => {
  res.send("Hello World");
});

app.use((req, res, next) => {
  //To allow cross origin resource sharing
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const server = app.listen(3000, () => console.log("listening at port 3000"));

const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size === 2) {
      io.to(roomId).emit("ready");
    }
  });

  socket.on("offer", ({ offer, room }) => {
    socket.to(room).emit("offer", { offer });
  });

  socket.on("answer", ({ answer, room }) => {
    socket.to(room).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate, room }) => {
    socket.to(room).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("leave");
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});
