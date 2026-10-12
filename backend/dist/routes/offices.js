"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.officesRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.officesRouter = (0, express_1.Router)();
// GET /api/offices
exports.officesRouter.get("/", async (_req, res) => {
    try {
        const offices = await db_1.prisma.office.findMany({
            where: { isActive: true },
            include: {
                services: {
                    where: { isActive: true }
                },
                counters: true,
                _count: {
                    select: {
                        bookings: {
                            where: { status: "WAITING" }
                        }
                    }
                }
            },
            orderBy: { name: "asc" }
        });
        const enriched = offices.map((office) => {
            const openCounters = office.counters.filter((c) => c.isOpen).length;
            return {
                id: office.id,
                name: office.name,
                category: office.category,
                address: office.address,
                district: office.district,
                state: office.state,
                openingTime: office.openingTime,
                closingTime: office.closingTime,
                serviceCount: office.services.length,
                openCountersCount: openCounters,
                totalCountersCount: office.counters.length,
                currentWaitingQueue: office._count.bookings
            };
        });
        return res.status(200).json({
            success: true,
            offices: enriched
        });
    }
    catch (error) {
        console.error("Error fetching offices:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch government offices"
        });
    }
});
// GET /api/offices/:id
exports.officesRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const office = await db_1.prisma.office.findUnique({
            where: { id },
            include: {
                services: { where: { isActive: true } },
                counters: true,
                bookings: {
                    where: { status: "WAITING" },
                    orderBy: [{ priorityScore: "desc" }, { fifoPosition: "asc" }]
                }
            }
        });
        if (!office) {
            return res.status(404).json({
                success: false,
                error: "Government office not found"
            });
        }
        return res.status(200).json({
            success: true,
            office
        });
    }
    catch (error) {
        console.error("Error fetching office details:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch office details"
        });
    }
});
