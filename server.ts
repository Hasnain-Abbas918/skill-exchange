import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: "localhost", port: 3000 });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url!, true));
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Auth required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
      socket.data.userId = decoded.id;
      next();
    } catch { next(new Error("Invalid token")); }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    socket.on("send_message", (data: { receiverId: number; content: string; senderId: number }) => {
      io.to(`user:${data.receiverId}`).emit("new_message", {
        ...data, id: Date.now(), createdAt: new Date().toISOString(), isRead: false,
      });
    });

    socket.on("disconnect", () => socket.leave(`user:${userId}`));
  });

  httpServer.listen(3000, () => console.log("> SkillSwap on http://localhost:3000"));
});