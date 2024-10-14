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
  console.log("A user connected:", socket.id);

  socket.on("offer", (data) => {
    console.log("Received offer", data);
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", (data) => {
    console.log("Received answer", data);
    socket.broadcast.emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    console.log("Received ICE candidate:", data);
    socket.broadcast.emit("ice-candidate", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    socket.broadcast.emit("leave");
  });

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
});
