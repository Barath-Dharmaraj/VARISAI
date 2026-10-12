"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const socket_1 = require("../socket");
const mlClient_1 = require("../mlClient");
exports.adminRouter = (0, express_1.Router)();
// POST /api/admin/call-next
exports.adminRouter.post("/call-next", async (req, res) => {
    try {
        const schema = zod_1.z.object({
            officeId: zod_1.z.string().min(1),
            counterNumber: zod_1.z.number().int().min(1).default(1)
        });
        const parse = schema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { officeId, counterNumber } = parse.data;
        // First complete any ticket currently serving at this counter
        const currentServing = await db_1.prisma.booking.findFirst({
            where: {
                officeId,
                counterNumber,
                status: "SERVING"
            }
        });
        if (currentServing) {
            await db_1.prisma.booking.update({
                where: { id: currentServing.id },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date()
                }
            });
        }
        // Pick top token by adaptive priority score descending, then FIFO
        const nextToken = await db_1.prisma.booking.findFirst({
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
        if (!nextToken) {
            // Clear counter
            await db_1.prisma.counter.updateMany({
                where: { officeId, counterNumber },
                data: { currentToken: null }
            });
            await (0, socket_1.broadcastQueueUpdate)(officeId);
            return res.status(200).json({
                success: true,
                message: "No more waiting tokens in queue",
                calledToken: null
            });
        }
        // Update next token to SERVING
        const updatedToken = await db_1.prisma.booking.update({
            where: { id: nextToken.id },
            data: {
                status: "SERVING",
                counterNumber,
                calledAt: new Date()
            },
            include: { service: true }
        });
        // Update counter currentToken
        await db_1.prisma.counter.updateMany({
            where: { officeId, counterNumber },
            data: { currentToken: updatedToken.tokenNumber }
        });
        // Broadcast live WebSocket update
        await (0, socket_1.broadcastQueueUpdate)(officeId);
        return res.status(200).json({
            success: true,
            message: `Token ${updatedToken.tokenNumber} called to Counter ${counterNumber}`,
            calledToken: {
                bookingRef: updatedToken.bookingRef,
                tokenNumber: updatedToken.tokenNumber,
                serviceName: updatedToken.service.name,
                priorityCategory: updatedToken.priorityCategory,
                counterNumber
            }
        });
    }
    catch (error) {
        console.error("Error calling next token:", error);
        return res.status(500).json({ success: false, error: "Failed to advance queue" });
    }
});
// POST /api/admin/complete
exports.adminRouter.post("/complete", async (req, res) => {
    try {
        const { bookingRef, officeId } = req.body;
        const booking = await db_1.prisma.booking.findFirst({
            where: bookingRef ? { bookingRef } : { officeId, status: "SERVING" }
        });
        if (!booking) {
            return res.status(404).json({ success: false, error: "No active serving token found" });
        }
        await db_1.prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: "COMPLETED",
                completedAt: new Date()
            }
        });
        if (booking.counterNumber) {
            await db_1.prisma.counter.updateMany({
                where: { officeId: booking.officeId, counterNumber: booking.counterNumber },
                data: { currentToken: null }
            });
        }
        await (0, socket_1.broadcastQueueUpdate)(booking.officeId);
        return res.status(200).json({
            success: true,
            message: `Token ${booking.tokenNumber} marked as COMPLETED`
        });
    }
    catch (error) {
        console.error("Error completing token:", error);
        return res.status(500).json({ success: false, error: "Failed to complete token" });
    }
});
// POST /api/admin/skip
exports.adminRouter.post("/skip", async (req, res) => {
    try {
        const { bookingRef } = req.body;
        if (!bookingRef) {
            return res.status(400).json({ success: false, error: "bookingRef is required" });
        }
        const booking = await db_1.prisma.booking.findUnique({ where: { bookingRef } });
        if (!booking) {
            return res.status(404).json({ success: false, error: "Token not found" });
        }
        await db_1.prisma.booking.update({
            where: { id: booking.id },
            data: { status: "SKIPPED" }
        });
        if (booking.counterNumber && booking.status === "SERVING") {
            await db_1.prisma.counter.updateMany({
                where: { officeId: booking.officeId, counterNumber: booking.counterNumber },
                data: { currentToken: null }
            });
        }
        await (0, socket_1.broadcastQueueUpdate)(booking.officeId);
        return res.status(200).json({
            success: true,
            message: `Token ${booking.tokenNumber} skipped`
        });
    }
    catch (error) {
        console.error("Error skipping token:", error);
        return res.status(500).json({ success: false, error: "Failed to skip token" });
    }
});
// POST /api/admin/cancel
exports.adminRouter.post("/cancel", async (req, res) => {
    try {
        const { bookingRef } = req.body;
        if (!bookingRef) {
            return res.status(400).json({ success: false, error: "bookingRef is required" });
        }
        const booking = await db_1.prisma.booking.findUnique({ where: { bookingRef } });
        if (!booking) {
            return res.status(404).json({ success: false, error: "Token not found" });
        }
        await db_1.prisma.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED" }
        });
        if (booking.counterNumber && booking.status === "SERVING") {
            await db_1.prisma.counter.updateMany({
                where: { officeId: booking.officeId, counterNumber: booking.counterNumber },
                data: { currentToken: null }
            });
        }
        await (0, socket_1.broadcastQueueUpdate)(booking.officeId);
        return res.status(200).json({
            success: true,
            message: `Token ${booking.tokenNumber} cancelled`
        });
    }
    catch (error) {
        console.error("Error cancelling token:", error);
        return res.status(500).json({ success: false, error: "Failed to cancel token" });
    }
});
// POST /api/admin/toggle-counter
exports.adminRouter.post("/toggle-counter", async (req, res) => {
    try {
        const { counterId, officeId, counterNumber } = req.body;
        const counter = counterId
            ? await db_1.prisma.counter.findUnique({ where: { id: counterId } })
            : await db_1.prisma.counter.findFirst({ where: { officeId, counterNumber } });
        if (!counter) {
            return res.status(404).json({ success: false, error: "Counter not found" });
        }
        const updated = await db_1.prisma.counter.update({
            where: { id: counter.id },
            data: { isOpen: !counter.isOpen }
        });
        await (0, socket_1.broadcastQueueUpdate)(counter.officeId);
        return res.status(200).json({
            success: true,
            counter: updated
        });
    }
    catch (error) {
        console.error("Error toggling counter:", error);
        return res.status(500).json({ success: false, error: "Failed to toggle counter" });
    }
});
// POST /api/admin/reschedule
exports.adminRouter.post("/reschedule", async (req, res) => {
    try {
        const { officeId } = req.body;
        if (!officeId) {
            return res.status(400).json({ success: false, error: "officeId is required" });
        }
        const waitingBookings = await db_1.prisma.booking.findMany({
            where: { officeId, status: "WAITING" },
            orderBy: { createdAt: "asc" }
        });
        if (waitingBookings.length === 0) {
            return res.status(200).json({ success: true, message: "Queue is empty", updatedCount: 0 });
        }
        const now = Date.now();
        const queuePayload = waitingBookings.map((b) => {
            const minutesWaited = Math.max(0, (now - new Date(b.createdAt).getTime()) / (60 * 1000));
            return {
                token_id: b.id,
                token_number: b.tokenNumber,
                priority_category: b.priorityCategory,
                minutes_waited: Math.round(minutesWaited * 10) / 10,
                fifo_position: b.fifoPosition
            };
        });
        // Call ML service /schedule
        const rescheduleResult = await (0, mlClient_1.rescheduleQueueWithML)(queuePayload);
        // Update in DB
        for (const item of rescheduleResult.reordered_queue) {
            await db_1.prisma.booking.update({
                where: { id: item.token_id },
                data: {
                    priorityScore: item.priority_score
                }
            });
        }
        await (0, socket_1.broadcastQueueUpdate)(officeId);
        return res.status(200).json({
            success: true,
            message: `Rescheduled ${waitingBookings.length} tokens using Adaptive Priority Scheduling`,
            reorderedQueue: rescheduleResult.reordered_queue
        });
    }
    catch (error) {
        console.error("Error rescheduling queue:", error);
        return res.status(500).json({ success: false, error: "Failed to reschedule queue" });
    }
});
// GET /api/admin/analytics
exports.adminRouter.get("/analytics", async (_req, res) => {
    try {
        const allBookings = await db_1.prisma.booking.findMany({
            include: { service: true, office: true }
        });
        // 1. Priority Distribution
        const priorityCounts = {
            none: 0,
            senior_citizen: 0,
            pregnant_woman: 0,
            differently_abled: 0
        };
        allBookings.forEach((b) => {
            const cat = b.priorityCategory;
            if (priorityCounts[cat] !== undefined) {
                priorityCounts[cat]++;
            }
            else {
                priorityCounts[cat] = 1;
            }
        });
        const priorityDistribution = [
            { name: "General (No Priority)", category: "none", count: priorityCounts["none"] || 0 },
            { name: "Senior Citizen", category: "senior_citizen", count: priorityCounts["senior_citizen"] || 0 },
            { name: "Pregnant Woman", category: "pregnant_woman", count: priorityCounts["pregnant_woman"] || 0 },
            { name: "Differently Abled", category: "differently_abled", count: priorityCounts["differently_abled"] || 0 }
        ];
        // 2. Daily Volume (last 7 days)
        const dailyMap = new Map();
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            dailyMap.set(key, { total: 0, completed: 0, priorityCount: 0 });
        }
        allBookings.forEach((b) => {
            const d = new Date(b.createdAt);
            const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            if (dailyMap.has(key)) {
                const entry = dailyMap.get(key);
                entry.total++;
                if (b.status === "COMPLETED")
                    entry.completed++;
                if (b.priorityCategory !== "none")
                    entry.priorityCount++;
            }
        });
        const dailyVolume = Array.from(dailyMap.entries()).map(([date, data]) => ({
            date,
            total: data.total,
            completed: data.completed,
            priority: data.priorityCount
        }));
        // 3. Wait Time Trend by Category
        const waitTimeCategories = {
            none: { totalWait: 0, count: 0 },
            senior_citizen: { totalWait: 0, count: 0 },
            pregnant_woman: { totalWait: 0, count: 0 },
            differently_abled: { totalWait: 0, count: 0 }
        };
        allBookings.forEach((b) => {
            if (b.status === "COMPLETED" || b.status === "SERVING") {
                const cat = b.priorityCategory;
                if (waitTimeCategories[cat]) {
                    waitTimeCategories[cat].totalWait += b.predictedWaitMinutes;
                    waitTimeCategories[cat].count++;
                }
            }
        });
        const waitTimeTrend = [
            {
                category: "Differently Abled",
                avgWaitMinutes: waitTimeCategories.differently_abled.count > 0
                    ? Math.round((waitTimeCategories.differently_abled.totalWait / waitTimeCategories.differently_abled.count) * 10) / 10
                    : 9.5
            },
            {
                category: "Pregnant Woman",
                avgWaitMinutes: waitTimeCategories.pregnant_woman.count > 0
                    ? Math.round((waitTimeCategories.pregnant_woman.totalWait / waitTimeCategories.pregnant_woman.count) * 10) / 10
                    : 12.0
            },
            {
                category: "Senior Citizen",
                avgWaitMinutes: waitTimeCategories.senior_citizen.count > 0
                    ? Math.round((waitTimeCategories.senior_citizen.totalWait / waitTimeCategories.senior_citizen.count) * 10) / 10
                    : 14.8
            },
            {
                category: "General Users",
                avgWaitMinutes: waitTimeCategories.none.count > 0
                    ? Math.round((waitTimeCategories.none.totalWait / waitTimeCategories.none.count) * 10) / 10
                    : 26.2
            }
        ];
        // Total metrics
        const totalBookings = allBookings.length;
        const completedBookings = allBookings.filter((b) => b.status === "COMPLETED").length;
        const waitingBookings = allBookings.filter((b) => b.status === "WAITING").length;
        const servingBookings = allBookings.filter((b) => b.status === "SERVING").length;
        return res.status(200).json({
            success: true,
            summary: {
                totalBookings,
                completedBookings,
                waitingBookings,
                servingBookings,
                priorityRatio: totalBookings > 0
                    ? Math.round(((totalBookings - (priorityCounts["none"] || 0)) / totalBookings) * 100)
                    : 0
            },
            priorityDistribution,
            dailyVolume,
            waitTimeTrend
        });
    }
    catch (error) {
        console.error("Error fetching analytics:", error);
        return res.status(500).json({ success: false, error: "Failed to generate analytics" });
    }
});
