"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreferredLocalIp = getPreferredLocalIp;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("./socket");
const auth_1 = require("./routes/auth");
const offices_1 = require("./routes/offices");
const services_1 = require("./routes/services");
const bookings_1 = require("./routes/bookings");
const admin_1 = require("./routes/admin");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Enable CORS for frontend
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express_1.default.json());
// Setup WebSocket server
(0, socket_1.setupSocketIO)(server);
// Routes
app.use("/api/auth", auth_1.authRouter);
app.use("/api/offices", offices_1.officesRouter);
app.use("/api/services", services_1.servicesRouter);
app.use("/api/bookings", bookings_1.bookingsRouter);
app.use("/api/admin", admin_1.adminRouter);
const os_1 = __importDefault(require("os"));
function getPreferredLocalIp() {
    const interfaces = os_1.default.networkInterfaces();
    let candidate = "127.0.0.1";
    for (const name of Object.keys(interfaces)) {
        const isVirtual = /vmware|virtual|vbox|hyper-v|loopback/i.test(name);
        for (const net of interfaces[name] || []) {
            if (net.family === "IPv4" && !net.internal) {
                if (!isVirtual) {
                    return net.address;
                }
                if (candidate === "127.0.0.1")
                    candidate = net.address;
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
