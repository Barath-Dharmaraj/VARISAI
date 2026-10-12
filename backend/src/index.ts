import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { setupSocketIO } from "./socket";
import { authRouter } from "./routes/auth";
import { officesRouter } from "./routes/offices";
import { servicesRouter } from "./routes/services";
import { bookingsRouter } from "./routes/bookings";
import { adminRouter } from "./routes/admin";
import { prisma } from "./db";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Setup WebSocket server
setupSocketIO(server);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/offices", officesRouter);
app.use("/api/services", servicesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);

import os from "os";

export function getPreferredLocalIp(): string {
  const interfaces = os.networkInterfaces();
  let candidate = "127.0.0.1";
  for (const name of Object.keys(interfaces)) {
    const isVirtual = /vmware|virtual|vbox|hyper-v|loopback/i.test(name);
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        if (!isVirtual) {
          return net.address;
        }
        if (candidate === "127.0.0.1") candidate = net.address;
      }
    }
  }
  return candidate;
}

app.get("/api/system/network-info", (_req, res) => {
  const localIp = getPreferredLocalIp();
  const frontendPort = 8060;
  res.status(200).json({
    success: true,
    localIp,
    frontendPort,
    mobileBaseUrl: `http://${localIp}:${frontendPort}`
  });
});

app.get("/api/system/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        district: true,
        priorityCategory: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json({
      success: true,
      totalUsers: users.length,
      users
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "VARISAI Backend API",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8050;

server.listen(PORT, () => {
  console.log(`VARISAI Backend & WebSocket Server listening on http://localhost:${PORT}`);
});
