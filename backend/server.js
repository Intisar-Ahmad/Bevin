import http from "http";
import "dotenv/config";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "./models/project.model.js";
import { generateResult } from "./services/gemini.service.js";
import Message from "./models/message.model.js";

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});

// middleware

io.use(async (socket, next) => {
  // Auth user
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];
    const projectId = socket.handshake.query?.projectId;

    if (!projectId) {
      return next(new Error("projectId is required"));
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid projectId"));
    }

    const project = await Project.findById(projectId).select("_id").lean();
    if (!project) {
      return next(new Error("Project not found"));
    }

    socket.project = project;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error("Authentication error"));
    }

    socket.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  socket.roomId = socket.project._id.toString();
  socket.join(socket.roomId);

  socket.on("project-message", async (data) => {
    try {
     
     await Message.create({
        senderId: socket.user._id,
        projectId: socket.project._id,
        content: data.text,
        type: "user",
      });


      socket.broadcast.to(socket.roomId).emit("project-message", data);

      if (data.text.includes("@ai") && data.sender !== "Bevin") {
        const prompt = data.text.replace("@ai", "").trim();
        const result = JSON.parse(await generateResult(prompt));


         await Message.create({
          senderId: null, // or a "system" user
          projectId: socket.project._id,
          content: result?.text || "Error: AI response could not be parsed correctly.",
          type: "ai",
        });

        io.to(socket.roomId).emit("project-message", {
          text: result,
          sender: "Bevin",
        });
      }
    } catch (e) {
      console.error("Message save error:", e);
       io.to(socket.roomId).emit("project-message", {
          text: "Error: AI response could not be parsed correctly.",
          sender: "Bevin",
        });
    }
  });
});


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
