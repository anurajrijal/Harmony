require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
console.log(
  "DEBUG: MONGODB_URI is",
  process.env.MONGODB_URI ? "Defined" : "UNDEFINED",
);
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const { apiLimiter } = require("./middleware/rateLimiter");

const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Route imports
const authRoutes = require("./routes/auth");
const guildRoutes = require("./routes/guilds");
const keywordRoutes = require("./routes/keywords");
const roleRoutes = require("./routes/roles");
const musicRoutes = require("./routes/music");
const logRoutes = require("./routes/logs");
const settingsRoutes = require("./routes/settings");
const playlistRoutes = require("./routes/playlists");
const greetingRoutes = require("./routes/greetings");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://harmony-three-delta.vercel.app"
];
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/", apiLimiter);

// Routes
app.use("/auth", authRoutes);
app.use("/api/guilds", guildRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/greetings", greetingRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const Guild = require("./models/Guild");

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Handle guild sync from bot (Joins all rooms for real-time updates)
  socket.on("sync-guilds", (guildIds) => {
    if (Array.isArray(guildIds)) {
      guildIds.forEach((id) => socket.join(`guild:${id}`));
      console.log(
        `[Socket] Bot synced ${guildIds.length} guilds for real-time intelligence`,
      );
    }
  });

  socket.on("guild-update", async (guildData) => {
    try {
      await Guild.findOneAndUpdate({ guildId: guildData.guildId }, guildData, {
        upsert: true,
        new: true,
      });
      console.log(`[Sync] Guild updated: ${guildData.name}`);
    } catch (err) {
      console.error("[Sync Error]", err.message);
    }
  });

  socket.on("join-guild", (guildId) => {
    socket.join(`guild:${guildId}`);
    console.log(`[Socket] ${socket.id} joined guild:${guildId}`);
  });

  socket.on("leave-guild", (guildId) => {
    socket.leave(`guild:${guildId}`);
  });

  socket.on("queue-update", async (data) => {
    // Broadcast to frontend dashboard clients
    io.to(`guild:${data.guildId}`).emit("queue-update", data);

    // Save state so API fetching works
    try {
      const MusicQueue = require("./models/MusicQueue");
      await MusicQueue.findOneAndUpdate({ guildId: data.guildId }, data, {
        upsert: true,
        new: true,
      });
    } catch (err) {
      console.error("[Music Sync Error]", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[Error]", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server
const PORT = process.env.BACKEND_PORT || 3001;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚀 Backend API server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
  });
};

start().catch(console.error);

module.exports = { app, server, io };
