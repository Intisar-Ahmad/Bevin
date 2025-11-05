import http from "http";
import "dotenv/config";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Project from "./models/project.model.js";
import { generateResult } from "./services/gemini.service.js";

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

  console.log("a user connected");

  socket.join(socket.roomId);

  console.log(socket.roomId);

  socket.on("project-message", (data) => {
    console.log(data)
    const message = data.text;
    console.log("Message:", message);
    socket.broadcast.to(socket.roomId).emit("project-message", data);

    if (message.includes("@ai") && data.sender !== "Bevin") {
      const prompt = message.replace("@ai", "").trim();
      generateResult(prompt).then((result) => {
        const aiMessage = {
          text: result,
          sender: "Bevin",
          projectId:data.projectId
        };
        io.to(socket.roomId).emit("project-message", aiMessage);
      }).catch((error) => {
        console.error("Error generating AI response:", error);
        const aiMessage = {
          text: "Error responding",
          sender: "Bevin",
          projectId:data.projectId
        };
        io.to(socket.roomId).emit("project-message", aiMessage);
      });
    }
  });

  socket.on("event", (data) => {
    /* … */
  });
  socket.on("disconnect", () => {
    /* … */
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
