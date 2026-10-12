"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
exports.getIO = getIO;
exports.broadcastQueueUpdate = broadcastQueueUpdate;
const socket_io_1 = require("socket.io");
const db_1 = require("./db");
let ioInstance = null;
function setupSocketIO(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on("connection", (socket) => {
        socket.on("join:office", (officeId) => {
            socket.join(`office:${officeId}`);
        });
        socket.on("leave:office", (officeId) => {
            socket.leave(`office:${officeId}`);
        });
        socket.on("join:booking", (bookingRef) => {
            socket.join(`booking:${bookingRef}`);
        });
    });
    ioInstance = io;
    return io;
}
function getIO() {
    return ioInstance;
}
async function broadcastQueueUpdate(officeId) {
    if (!ioInstance)
        return;
    try {
        // 1. Fetch currently open counters and active serving tokens
        const counters = await db_1.prisma.counter.findMany({
            where: { officeId },
            orderBy: { counterNumber: "asc" }
        });
        const nowServingBookings = await db_1.prisma.booking.findMany({
            where: {
                officeId,
                status: "SERVING"
            },
            include: { service: true }
        });
        const nowServingList = nowServingBookings.map((b) => {
            const counter = counters.find((c) => c.counterNumber === b.counterNumber);
            return {
                bookingRef: b.bookingRef,
                tokenNumber: b.tokenNumber,
                counterNumber: b.counterNumber || 1,
                staffName: counter?.staffName || `Desk ${b.counterNumber || 1}`,
                priorityCategory: b.priorityCategory,
                serviceName: b.service.name
            };
        });
        // 2. Fetch waiting tokens ordered by adaptive priority score descending
        const waitingBookings = await db_1.prisma.booking.findMany({
            where: {
                officeId,
                status: "WAITING"
            },
            orderBy: [
                { priorityScore: "desc" },
                { fifoPosition: "asc" }
            ],
            include: { service: true }
        });
        const waitingTokens = waitingBookings.map((b, idx) => ({
            id: b.id,
            bookingRef: b.bookingRef,
            tokenNumber: b.tokenNumber,
            priorityCategory: b.priorityCategory,
            priorityScore: b.priorityScore,
            fifoPosition: b.fifoPosition,
            currentRank: idx + 1,
            predictedWaitMinutes: b.predictedWaitMinutes,
            serviceName: b.service.name,
            createdAt: b.createdAt.toISOString()
        }));
        const openCountersCount = counters.filter((c) => c.isOpen).length;
        const payload = {
            officeId,
            nowServingList,
            primaryNowServing: nowServingList.length > 0 ? nowServingList[0] : null,
            waitingTokens,
            totalWaiting: waitingTokens.length,
            openCountersCount,
            counters: counters.map((c) => ({
                id: c.id,
                counterNumber: c.counterNumber,
                staffName: c.staffName,
                isOpen: c.isOpen,
                currentToken: c.currentToken
            })),
            timestamp: new Date().toISOString()
        };
        // Broadcast to office room
        ioInstance.to(`office:${officeId}`).emit("queue:update", payload);
        // Also send targeted update to each waiting booking room
        for (let i = 0; i < waitingBookings.length; i++) {
            const b = waitingBookings[i];
            ioInstance.to(`booking:${b.bookingRef}`).emit("booking:update", {
                bookingRef: b.bookingRef,
                status: b.status,
                tokensAhead: i,
                predictedWaitMinutes: b.predictedWaitMinutes,
                nowServing: nowServingList.length > 0 ? nowServingList[0].tokenNumber : "--",
                timestamp: new Date().toISOString()
            });
        }
        // Also notify serving bookings
        for (const b of nowServingBookings) {
            ioInstance.to(`booking:${b.bookingRef}`).emit("booking:update", {
                bookingRef: b.bookingRef,
                status: "SERVING",
                tokensAhead: 0,
                predictedWaitMinutes: 0,
                counterNumber: b.counterNumber,
                nowServing: b.tokenNumber,
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (err) {
        console.error("Error in broadcastQueueUpdate:", err);
    }
}
