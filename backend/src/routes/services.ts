import { Router, Request, Response } from "express";
import { prisma } from "../db";

export const servicesRouter = Router();

// GET /api/services?officeId=...
servicesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { officeId } = req.query;

    const whereClause: any = { isActive: true };
    if (officeId && typeof officeId === "string") {
      whereClause.officeId = officeId;
    }

    const services = await prisma.service.findMany({
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
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch services"
    });
  }
});

// GET /api/services/:id
servicesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
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
  } catch (error: any) {
    console.error("Error fetching service details:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch service details"
    });
  }
});
