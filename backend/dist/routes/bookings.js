"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const mlClient_1 = require("../mlClient");
const socket_1 = require("../socket");
exports.bookingsRouter = (0, express_1.Router)();
const estimateSchema = zod_1.z.object({
    officeId: zod_1.z.string().min(1),
    serviceId: zod_1.z.string().min(1),
    priorityCategory: zod_1.z.enum(["none", "senior_citizen", "pregnant_woman", "differently_abled"]).default("none")
});
const createBookingSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Valid email address is required" }),
    citizenName: zod_1.z.string().optional(),
    officeId: zod_1.z.string().min(1),
    serviceId: zod_1.z.string().min(1),
    priorityCategory: zod_1.z.enum(["none", "senior_citizen", "pregnant_woman", "differently_abled"]).default("none")
});
// POST /api/bookings/estimate
exports.bookingsRouter.post("/estimate", async (req, res) => {
    try {
        const parse = estimateSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { officeId, serviceId, priorityCategory } = parse.data;
        const [service, counters, waitingCount, currentlyServing] = await Promise.all([
            db_1.prisma.service.findUnique({ where: { id: serviceId } }),
            db_1.prisma.counter.findMany({ where: { officeId, isOpen: true } }),
            db_1.prisma.booking.count({ where: { officeId, status: "WAITING" } }),
            db_1.prisma.booking.findFirst({
                where: { officeId, status: "SERVING" },
                orderBy: { calledAt: "desc" }
            })
        ]);
        if (!service) {
            return res.status(404).json({ success: false, error: "Service not found" });
        }
        const activeCounters = Math.max(1, counters.length);
        const avgDuration = service.avgServiceMinutes;
        const mlResult = await (0, mlClient_1.predictWaitTimeWithML)({
            queue_depth: waitingCount,
            priority_category: priorityCategory,
            avg_service_duration: avgDuration,
            active_counters: activeCounters
        });
        return res.status(200).json({
            success: true,
            currentServingToken: currentlyServing ? currentlyServing.tokenNumber : "None (Counters Ready)",
            tokensAhead: waitingCount,
            avgServiceTimeMinutes: avgDuration,
            activeCountersCount: activeCounters,
            predictedWaitMinutes: mlResult.predicted_wait_time_minutes,
            confidenceIntervalLow: mlResult.confidence_interval_low,
            confidenceIntervalHigh: mlResult.confidence_interval_high,
            modelName: mlResult.model_name,
            benchmarkMae: mlResult.benchmark_mae,
            benchmarkRmse: mlResult.benchmark_rmse,
            adaptiveWeightBonus: mlResult.adaptive_priority_weight
        });
    }
    catch (error) {
        console.error("Error in wait time estimate:", error);
        return res.status(500).json({ success: false, error: "Failed to compute queue estimate" });
    }
});
// POST /api/bookings
exports.bookingsRouter.post("/", async (req, res) => {
    try {
        const parse = createBookingSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { email, citizenName, officeId, serviceId, priorityCategory } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        const [office, service, counters, waitingCount] = await Promise.all([
            db_1.prisma.office.findUnique({ where: { id: officeId } }),
            db_1.prisma.service.findUnique({ where: { id: serviceId } }),
            db_1.prisma.counter.findMany({ where: { officeId, isOpen: true } }),
            db_1.prisma.booking.count({ where: { officeId, status: "WAITING" } })
        ]);
        if (!office || !service) {
            return res.status(404).json({ success: false, error: "Selected office or service not found" });
        }
        // Determine token number
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayBookingCount = await db_1.prisma.booking.count({
            where: {
                serviceId,
                createdAt: { gte: todayStart }
            }
        });
        const nextTokenNum = 101 + todayBookingCount;
        const tokenNumber = `${service.prefix}-${nextTokenNum}`;
        // Generate unique verifiable booking reference
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const bookingRef = `VAR-2026-${randomSuffix}`;
        // Predict wait time with ML
        const activeCounters = Math.max(1, counters.length);
        const mlResult = await (0, mlClient_1.predictWaitTimeWithML)({
            queue_depth: waitingCount,
            priority_category: priorityCategory,
            avg_service_duration: service.avgServiceMinutes,
            active_counters: activeCounters
        });
        // Compute initial priority score:
        // score = (time already waited = 0) + (priority weight) + (base FIFO position)
        const priorityWeights = {
            differently_abled: 15.0,
            pregnant_woman: 12.0,
            senior_citizen: 10.0,
            none: 0.0
        };
        const pWeight = priorityWeights[priorityCategory] ?? 0.0;
        const fifoPos = waitingCount + 1;
        const fifoComp = Math.max(0.0, 10.0 - fifoPos * 0.5);
        const initialScore = pWeight + fifoComp;
        // Create booking record in DB
        const booking = await db_1.prisma.booking.create({
            data: {
                bookingRef,
                tokenNumber,
                email: normalizedEmail,
                citizenName: citizenName?.trim() || normalizedEmail.split("@")[0],
                officeId,
                serviceId,
                priorityCategory,
                status: "WAITING",
                fifoPosition: fifoPos,
                priorityScore: initialScore,
                predictedWaitMinutes: mlResult.predicted_wait_time_minutes
            },
            include: {
                office: true,
                service: true
            }
        });
        // Broadcast live queue update via WebSocket
        await (0, socket_1.broadcastQueueUpdate)(officeId);
        // Arrive 10 minutes before recommended window
        const arriveMinutesBefore = Math.max(5, Math.round(mlResult.predicted_wait_time_minutes - 10));
        return res.status(201).json({
            success: true,
            booking: {
                id: booking.id,
                bookingRef: booking.bookingRef,
                tokenNumber: booking.tokenNumber,
                email: booking.email,
                citizenName: booking.citizenName,
                officeId: booking.officeId,
                officeName: booking.office.name,
                officeCategory: booking.office.category,
                officeAddress: booking.office.address,
                officeDistrict: booking.office.district,
                officeState: booking.office.state,
                serviceId: booking.serviceId,
                serviceName: booking.service.name,
                avgServiceMinutes: booking.service.avgServiceMinutes,
                priorityCategory: booking.priorityCategory,
                status: booking.status,
                tokensAhead: waitingCount,
                predictedWaitMinutes: booking.predictedWaitMinutes,
                arriveMinutesBefore,
                confidenceInterval: [mlResult.confidence_interval_low, mlResult.confidence_interval_high],
                modelName: mlResult.model_name,
                benchmarkMae: mlResult.benchmark_mae,
                createdAt: booking.createdAt.toISOString()
            }
        });
    }
    catch (error) {
        console.error("Error creating booking:", error);
        return res.status(500).json({ success: false, error: "Failed to issue digital token" });
    }
});
// GET /api/bookings/:bookingRef
exports.bookingsRouter.get("/:bookingRef", async (req, res) => {
    try {
        const { bookingRef } = req.params;
        const booking = await db_1.prisma.booking.findUnique({
            where: { bookingRef },
            include: {
                office: true,
                service: true
            }
        });
        if (!booking) {
            return res.status(404).json({ success: false, error: "Token not found" });
        }
        // Recalculate tokens ahead based on current queue order
        let tokensAhead = 0;
        if (booking.status === "WAITING") {
            tokensAhead = await db_1.prisma.booking.count({
                where: {
                    officeId: booking.officeId,
                    status: "WAITING",
                    OR: [
                        { priorityScore: { gt: booking.priorityScore } },
                        {
                            priorityScore: booking.priorityScore,
                            fifoPosition: { lt: booking.fifoPosition }
                        }
                    ]
                }
            });
        }
        const currentServing = await db_1.prisma.booking.findFirst({
            where: {
                officeId: booking.officeId,
                status: "SERVING"
            },
            orderBy: { calledAt: "desc" }
        });
        return res.status(200).json({
            success: true,
            booking: {
                id: booking.id,
                bookingRef: booking.bookingRef,
                tokenNumber: booking.tokenNumber,
                email: booking.email,
                citizenName: booking.citizenName || booking.email.split("@")[0],
                officeId: booking.officeId,
                officeName: booking.office.name,
                officeCategory: booking.office.category,
                officeAddress: booking.office.address,
                officeDistrict: booking.office.district,
                officeState: booking.office.state,
                openingTime: booking.office.openingTime,
                closingTime: booking.office.closingTime,
                serviceId: booking.serviceId,
                serviceName: booking.service.name,
                serviceDescription: booking.service.description,
                avgServiceMinutes: booking.service.avgServiceMinutes,
                priorityCategory: booking.priorityCategory,
                status: booking.status,
                counterNumber: booking.counterNumber,
                tokensAhead,
                predictedWaitMinutes: booking.predictedWaitMinutes,
                nowServing: currentServing ? currentServing.tokenNumber : "None (Available)",
                createdAt: booking.createdAt.toISOString(),
                calledAt: booking.calledAt?.toISOString() || null,
                completedAt: booking.completedAt?.toISOString() || null
            }
        });
    }
    catch (error) {
        console.error("Error fetching booking:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch token record" });
    }
});
// GET /api/bookings/live-queue/:officeId
exports.bookingsRouter.get("/live-queue/:officeId", async (req, res) => {
    try {
        const { officeId } = req.params;
        const [office, counters, servingBookings, waitingBookings] = await Promise.all([
            db_1.prisma.office.findUnique({ where: { id: officeId } }),
            db_1.prisma.counter.findMany({ where: { officeId }, orderBy: { counterNumber: "asc" } }),
            db_1.prisma.booking.findMany({
                where: { officeId, status: "SERVING" },
                include: { service: true }
            }),
            db_1.prisma.booking.findMany({
                where: { officeId, status: "WAITING" },
                orderBy: [{ priorityScore: "desc" }, { fifoPosition: "asc" }],
                include: { service: true }
            })
        ]);
        if (!office) {
            return res.status(404).json({ success: false, error: "Office not found" });
        }
        const nowServingList = servingBookings.map((b) => {
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
        return res.status(200).json({
            success: true,
            office: {
                id: office.id,
                name: office.name,
                category: office.category,
                address: office.address
            },
            nowServingList,
            primaryNowServing: nowServingList.length > 0 ? nowServingList[0] : null,
            waitingTokens,
            totalWaiting: waitingTokens.length,
            openCountersCount: counters.filter((c) => c.isOpen).length,
            counters
        });
    }
    catch (error) {
        console.error("Error fetching live queue:", error);
        return res.status(500).json({ success: false, error: "Failed to fetch live queue" });
    }
});
