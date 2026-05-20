const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// простой тест маршрута (чтобы проверять сервер в браузере)
app.get("/", (req, res) => {
  res.send("Bicochat server is running 🚀");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// online users: userId -> socketId
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // регистрация пользователя
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;

    io.emit("online-users", Object.keys(onlineUsers));
  });

  // отправка сообщения
  socket.on("send-message", (data) => {
    // data = { from, to, message, type, timestamp }

    const targetSocket = onlineUsers[data.to];

    if (targetSocket) {
      io.to(targetSocket).emit("receive-message", data);
    } else {
      // если пользователь оффлайн
      socket.emit("user-offline", {
        to: data.to,
        message: "User is offline"
      });
    }
  });

  // отключение
  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }

    io.emit("online-users", Object.keys(onlineUsers));
  });
});

// ВАЖНО: для Render/Railway
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Bicochat server running on port", PORT);
});