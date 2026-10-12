"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.servicesRouter = (0, express_1.Router)();
// GET /api/services?officeId=...
exports.servicesRouter.get("/", async (req, res) => {
    try {
        const { officeId } = req.query;
        const whereClause = { isActive: true };
        if (officeId && typeof officeId === "string") {
            whereClause.officeId = officeId;
        }
        const services = await db_1.prisma.service.findMany({
            where: whereClause,
            include: {
                office: {
                    select: {
                        id: true,
                        name: true,
                        category: true
                    }
                },
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
        const enriched = services.map((s) => ({
            id: s.id,
            officeId: s.officeId,
            officeName: s.office.name,
            officeCategory: s.office.category,
            name: s.name,
            description: s.description,
            avgServiceMinutes: s.avgServiceMinutes,
            prefix: s.prefix,
            currentWaitingCount: s._count.bookings
        }));
        return res.status(200).json({
            success: true,
            services: enriched
        });
    }
    catch (error) {
        console.error("Error fetching services:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch services"
        });
    }
});
// GET /api/services/:id
exports.servicesRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const service = await db_1.prisma.service.findUnique({
            where: { id },
            include: {
                office: true,
                _count: {
                    select: {
                        bookings: { where: { status: "WAITING" } }
                    }
                }
            }
        });
        if (!service) {
            return res.status(404).json({
                success: false,
                error: "Service not found"
            });
        }
        return res.status(200).json({
            success: true,
            service: {
                id: service.id,
                officeId: service.officeId,
                officeName: service.office.name,
                name: service.name,
                description: service.description,
                avgServiceMinutes: service.avgServiceMinutes,
                prefix: service.prefix,
                currentWaitingCount: service._count.bookings
            }
        });
    }
    catch (error) {
        console.error("Error fetching service details:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch service details"
        });
    }
});
