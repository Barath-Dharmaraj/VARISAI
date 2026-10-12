"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const otp_1 = require("../otp");
const emailService_1 = require("../emailService");
const password_1 = require("../password");
exports.authRouter = (0, express_1.Router)();
const citizenPasswordLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Please enter a valid email address"),
    password: zod_1.z.string().min(1, "Password is required")
});
const citizenPasswordRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Full name must be at least 2 characters"),
    email: zod_1.z.string().email("Please enter a valid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    phone: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
    priorityCategory: zod_1.z.enum(["none", "senior_citizen", "pregnant_woman", "differently_abled"]).default("none")
});
const staffPasswordLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Enter a valid official government email address"),
    password: zod_1.z.string().min(1, "Password is required"),
    staffId: zod_1.z.string().optional()
});
const staffPasswordRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Official full name required"),
    email: zod_1.z.string().email("Valid official government email required"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    staffId: zod_1.z.string().min(2, "Staff Identification ID required"),
    department: zod_1.z.string().min(2, "Government Department required"),
    officeId: zod_1.z.string().min(2, "Assigned office required")
});
const citizenRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Full name must be at least 2 characters"),
    email: zod_1.z.string().email("Please enter a valid email address"),
    phone: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
    priorityCategory: zod_1.z.enum(["none", "senior_citizen", "pregnant_woman", "differently_abled"]).default("none")
});
const staffRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Official full name required"),
    email: zod_1.z.string().email("Valid official government email required"),
    staffId: zod_1.z.string().min(2, "Staff Identification ID required"),
    department: zod_1.z.string().min(2, "Government Department required"),
    officeId: zod_1.z.string().min(2, "Assigned office required")
});
const sendOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Please enter a valid email address (e.g. citizen@example.com)" }),
    name: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    priorityCategory: zod_1.z.string().optional(),
    district: zod_1.z.string().optional(),
    userType: zod_1.z.enum(["CITIZEN", "STAFF"]).default("CITIZEN")
});
const verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Invalid email address format" }),
    otp: zod_1.z.string().length(4, { message: "OTP must be exactly 4 digits" }),
    name: zod_1.z.string().optional()
});
const staffLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: "Enter a valid official government email address" }),
    staffId: zod_1.z.string().optional()
});
// ==========================================
// 1. CITIZEN PASSWORD AUTHENTICATION (NO OTP)
// ==========================================
// POST /api/auth/citizen-password-login
exports.authRouter.post("/citizen-password-login", async (req, res) => {
    try {
        const parse = citizenPasswordLoginSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { email, password } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        const user = await db_1.prisma.user.findFirst({
            where: { email: normalizedEmail, role: "CITIZEN" }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Citizen record not found with this email. Please switch to 'Create an Account' to register."
            });
        }
        const isMatch = (0, password_1.verifyPassword)(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Incorrect password. Please verify your credentials or reset your password."
            });
        }
        const pastBookings = await db_1.prisma.booking.findMany({
            where: { email: normalizedEmail },
            orderBy: { createdAt: "desc" },
            take: 5
        });
        return res.status(200).json({
            success: true,
            message: "Citizen authentication authorized",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                district: user.district || "Chennai",
                priorityCategory: user.priorityCategory || "none",
                role: user.role,
                pastBookings
            }
        });
    }
    catch (error) {
        console.error("Citizen password login error:", error);
        return res.status(500).json({ success: false, error: "Server error during authentication" });
    }
});
// POST /api/auth/citizen-password-register
exports.authRouter.post("/citizen-password-register", async (req, res) => {
    try {
        const parse = citizenPasswordRegisterSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { name, email, password, phone, district, priorityCategory } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await db_1.prisma.user.findUnique({
            where: { email: normalizedEmail }
        });
        if (existing && existing.password) {
            return res.status(400).json({
                success: false,
                error: "An account with this email already exists. Please use 'Sign In to your account'."
            });
        }
        const hashedPassword = (0, password_1.hashPassword)(password);
        const user = await db_1.prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                name: name.trim(),
                password: hashedPassword,
                phone: phone?.trim() || null,
                district: district?.trim() || "Chennai",
                priorityCategory,
                role: "CITIZEN"
            },
            create: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                phone: phone?.trim() || null,
                district: district?.trim() || "Chennai",
                priorityCategory,
                role: "CITIZEN"
            }
        });
        return res.status(201).json({
            success: true,
            message: "Citizen profile created successfully in database",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                district: user.district || "Chennai",
                priorityCategory: user.priorityCategory || "none",
                role: user.role,
                pastBookings: []
            }
        });
    }
    catch (error) {
        console.error("Citizen registration error:", error);
        return res.status(500).json({ success: false, error: "Failed to store citizen profile in database" });
    }
});
// POST /api/auth/staff-password-login
exports.authRouter.post("/staff-password-login", async (req, res) => {
    try {
        const parse = staffPasswordLoginSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { email, password, staffId } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        const staffUser = await db_1.prisma.user.findFirst({
            where: { email: normalizedEmail, role: "STAFF" },
            include: { office: true }
        });
        if (!staffUser) {
            return res.status(403).json({
                success: false,
                error: "Access Denied: Email address is not registered in the authorized government staff directory."
            });
        }
        if (staffId && staffUser.staffId && staffUser.staffId.toLowerCase() !== staffId.toLowerCase().trim()) {
            return res.status(401).json({
                success: false,
                error: "Invalid Staff Identification ID."
            });
        }
        const isMatch = (0, password_1.verifyPassword)(password, staffUser.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Incorrect staff authorization password."
            });
        }
        return res.status(200).json({
            success: true,
            message: "Official clearance granted",
            staff: {
                id: staffUser.id,
                name: staffUser.name,
                email: staffUser.email,
                role: staffUser.role,
                staffId: staffUser.staffId,
                department: staffUser.department,
                officeId: staffUser.officeId,
                officeName: staffUser.office?.name || "General Administration"
            }
        });
    }
    catch (error) {
        console.error("Staff password login error:", error);
        return res.status(500).json({ success: false, error: "Staff authorization server error" });
    }
});
// POST /api/auth/staff-password-register
exports.authRouter.post("/staff-password-register", async (req, res) => {
    try {
        const parse = staffPasswordRegisterSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { name, email, password, staffId, department, officeId } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        const office = await db_1.prisma.office.findUnique({ where: { id: officeId } });
        if (!office) {
            return res.status(400).json({ success: false, error: "Selected government office not found" });
        }
        const hashedPassword = (0, password_1.hashPassword)(password);
        const staff = await db_1.prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                name: name.trim(),
                password: hashedPassword,
                staffId: staffId.trim(),
                department: department.trim(),
                officeId,
                role: "STAFF"
            },
            create: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                staffId: staffId.trim(),
                department: department.trim(),
                officeId,
                role: "STAFF"
            },
            include: { office: true }
        });
        return res.status(201).json({
            success: true,
            message: "Official staff account registered successfully",
            staff: {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
                staffId: staff.staffId,
                department: staff.department,
                officeId: staff.officeId,
                officeName: staff.office?.name || office.name
            }
        });
    }
    catch (error) {
        console.error("Staff password register error:", error);
        return res.status(500).json({ success: false, error: "Failed to onboard staff record" });
    }
});
// ==========================================
// 1. CITIZEN AUTHENTICATION & REGISTRATION
// ==========================================
// POST /api/auth/citizen-lookup (Checks if citizen is already registered in DB)
exports.authRouter.post("/citizen-lookup", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            return res.status(400).json({ success: false, error: "Email is required" });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await db_1.prisma.user.findFirst({
            where: { email: normalizedEmail, role: "CITIZEN" }
        });
        if (!user) {
            return res.status(200).json({ success: true, exists: false });
        }
        const pastBookingsCount = await db_1.prisma.booking.count({
            where: { email: normalizedEmail }
        });
        return res.status(200).json({
            success: true,
            exists: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                district: user.district || "Chennai",
                priorityCategory: user.priorityCategory || "none",
                pastBookingsCount
            }
        });
    }
    catch (error) {
        console.error("Error looking up citizen:", error);
        return res.status(500).json({ success: false, error: "Failed to query citizen records" });
    }
});
// POST /api/auth/citizen-register (Registers NEW Citizen in DB and Sends OTP)
exports.authRouter.post("/citizen-register", async (req, res) => {
    try {
        const parse = citizenRegisterSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { name, email, phone, district, priorityCategory } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        // Upsert or create citizen profile in database
        const user = await db_1.prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                name: name.trim(),
                phone: phone?.trim() || null,
                district: district?.trim() || "Chennai",
                priorityCategory,
                role: "CITIZEN"
            },
            create: {
                name: name.trim(),
                email: normalizedEmail,
                phone: phone?.trim() || null,
                district: district?.trim() || "Chennai",
                priorityCategory,
                role: "CITIZEN"
            }
        });
        // Generate real OTP
        const otpResult = await (0, otp_1.createOrUpdateOtp)(normalizedEmail, "CITIZEN");
        const emailResult = await (0, emailService_1.sendOtpEmail)(normalizedEmail, otpResult.otp, user.name);
        return res.status(200).json({
            success: true,
            message: "Citizen successfully registered in database",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                district: user.district || "Chennai",
                priorityCategory: user.priorityCategory || "none"
            },
            otp: otpResult.otp,
            emailDelivered: emailResult.delivered,
            isRealInbox: emailResult.isRealInbox || false,
            previewUrl: emailResult.previewUrl || null,
            demoMessage: emailResult.isRealInbox
                ? `Official verification code delivered directly to your inbox ${otpResult.email}.`
                : `Verification code: ${otpResult.otp}`
        });
    }
    catch (error) {
        console.error("Error registering citizen:", error);
        return res.status(500).json({ success: false, error: "Error saving citizen profile to database" });
    }
});
// POST /api/auth/send-otp (Send OTP to Existing or New Citizen)
exports.authRouter.post("/send-otp", async (req, res) => {
    try {
        const parseResult = sendOtpSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: parseResult.error.errors[0].message
            });
        }
        const { email, name, phone, priorityCategory, district, userType } = parseResult.data;
        const normalizedEmail = email.toLowerCase().trim();
        // Check or create citizen in User table
        let user = await db_1.prisma.user.findUnique({
            where: { email: normalizedEmail }
        });
        if (!user && userType === "CITIZEN") {
            user = await db_1.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: name?.trim() || normalizedEmail.split("@")[0],
                    phone: phone?.trim() || null,
                    district: district?.trim() || "Chennai",
                    priorityCategory: priorityCategory || "none",
                    role: "CITIZEN"
                }
            });
        }
        const otpResult = await (0, otp_1.createOrUpdateOtp)(normalizedEmail, userType);
        const emailResult = await (0, emailService_1.sendOtpEmail)(normalizedEmail, otpResult.otp, user?.name);
        return res.status(200).json({
            success: true,
            email: otpResult.email,
            otp: otpResult.otp,
            expiresAt: otpResult.expiresAt,
            emailDelivered: emailResult.delivered,
            isRealInbox: emailResult.isRealInbox || false,
            previewUrl: emailResult.previewUrl || null,
            demoMessage: emailResult.isRealInbox
                ? `Official verification code delivered directly to your inbox ${otpResult.email}. Check your inbox/spam folder.`
                : (emailResult.previewUrl
                    ? `Code delivered! Click 'Open Email Inbox' to view: ${emailResult.previewUrl}`
                    : `Code generated: ${otpResult.otp}`),
            userType: otpResult.userType,
            userName: user?.name || "Citizen",
            user: user ? {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                district: user.district || "Chennai",
                priorityCategory: user.priorityCategory || "none"
            } : null
        });
    }
    catch (error) {
        console.error("Error sending OTP to email:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error while generating email verification code"
        });
    }
});
// POST /api/auth/verify-otp (Verify Citizen Code & Return DB Profile)
exports.authRouter.post("/verify-otp", async (req, res) => {
    try {
        const parseResult = verifyOtpSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: parseResult.error.errors[0].message
            });
        }
        const { email, otp, name } = parseResult.data;
        const normalizedEmail = email.toLowerCase().trim();
        const result = await (0, otp_1.verifyOtp)(normalizedEmail, otp);
        if (!result.success) {
            return res.status(401).json({
                success: false,
                error: result.message
            });
        }
        // Upsert or retrieve user profile
        const user = await db_1.prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                name: name ? name.trim() : undefined
            },
            create: {
                email: normalizedEmail,
                name: name ? name.trim() : normalizedEmail.split("@")[0],
                role: result.userType || "CITIZEN"
            }
        });
        const pastBookings = await db_1.prisma.booking.findMany({
            where: { email: normalizedEmail },
            orderBy: { createdAt: "desc" },
            take: 5
        });
        return res.status(200).json({
            success: true,
            message: "Email successfully verified",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                district: user.district || "Chennai",
                priorityCategory: user.priorityCategory || "none",
                role: user.role,
                pastBookings
            }
        });
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error while verifying email code"
        });
    }
});
// ==========================================
// 2. STAFF AUTHENTICATION & ONBOARDING
// ==========================================
// POST /api/auth/staff-lookup (Checks if staff is in DB)
exports.authRouter.post("/staff-lookup", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            return res.status(400).json({ success: false, error: "Official email required" });
        }
        const staffUser = await db_1.prisma.user.findFirst({
            where: { email: email.toLowerCase().trim(), role: "STAFF" },
            include: { office: true }
        });
        if (!staffUser) {
            return res.status(200).json({ success: true, exists: false });
        }
        return res.status(200).json({
            success: true,
            exists: true,
            staff: {
                id: staffUser.id,
                name: staffUser.name,
                email: staffUser.email,
                staffId: staffUser.staffId,
                department: staffUser.department,
                officeId: staffUser.officeId,
                officeName: staffUser.office?.name || "General Administration"
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Error checking staff records" });
    }
});
// POST /api/auth/staff-register (Registers NEW Official in DB)
exports.authRouter.post("/staff-register", async (req, res) => {
    try {
        const parse = staffRegisterSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { name, email, staffId, department, officeId } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        // Verify office exists
        const office = await db_1.prisma.office.findUnique({ where: { id: officeId } });
        if (!office) {
            return res.status(400).json({ success: false, error: "Selected office not found in registry" });
        }
        // Save staff in User table
        const staff = await db_1.prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                name: name.trim(),
                staffId: staffId.trim(),
                department: department.trim(),
                officeId,
                role: "STAFF"
            },
            create: {
                name: name.trim(),
                email: normalizedEmail,
                staffId: staffId.trim(),
                department: department.trim(),
                officeId,
                role: "STAFF"
            },
            include: { office: true }
        });
        // Send official authorization code
        const otpResult = await (0, otp_1.createOrUpdateOtp)(normalizedEmail, "STAFF");
        const emailResult = await (0, emailService_1.sendOtpEmail)(normalizedEmail, otpResult.otp, staff.name);
        console.log(`[STAFF SECURITY DISPATCH]: Code for ${staff.email} (${staff.name}) is ${otpResult.otp}`);
        return res.status(200).json({
            success: true,
            message: "Staff official successfully registered and verified in database",
            staff: {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
                staffId: staff.staffId,
                department: staff.department,
                officeId: staff.officeId,
                officeName: staff.office?.name || office.name
            },
            emailDelivered: emailResult.delivered,
            demoMessage: `Official staff authorization code has been dispatched to ${staff.email}. Check your inbox and enter the 4-digit code.`
        });
    }
    catch (error) {
        console.error("Error registering staff:", error);
        return res.status(500).json({ success: false, error: "Error saving staff record to database" });
    }
});
// POST /api/auth/staff-login (Dedicated Staff Login)
exports.authRouter.post("/staff-login", async (req, res) => {
    try {
        const parseResult = staffLoginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: parseResult.error.errors[0].message
            });
        }
        const { email, staffId } = parseResult.data;
        const normalizedEmail = email.toLowerCase().trim();
        // Verify that this email is an authorized staff member in the database
        const staffUser = await db_1.prisma.user.findFirst({
            where: {
                email: normalizedEmail,
                role: "STAFF"
            },
            include: {
                office: true
            }
        });
        if (!staffUser) {
            return res.status(403).json({
                success: false,
                error: "Access Denied: This email is not registered as an authorized government official. Please register as new staff or contact your district nodal officer."
            });
        }
        if (staffId && staffUser.staffId && staffUser.staffId.toLowerCase() !== staffId.toLowerCase().trim()) {
            return res.status(401).json({
                success: false,
                error: "Invalid Staff Identification ID for this official."
            });
        }
        // Generate staff verification code
        const otpResult = await (0, otp_1.createOrUpdateOtp)(normalizedEmail, "STAFF");
        const emailResult = await (0, emailService_1.sendOtpEmail)(normalizedEmail, otpResult.otp, staffUser.name);
        console.log(`[STAFF SECURITY LOGIN]: Code for ${staffUser.email} (${staffUser.name}) is ${otpResult.otp}`);
        return res.status(200).json({
            success: true,
            email: staffUser.email,
            name: staffUser.name,
            role: staffUser.role,
            staffId: staffUser.staffId,
            department: staffUser.department,
            office: staffUser.office,
            emailDelivered: emailResult.delivered,
            demoMessage: `Official staff authorization code dispatched directly to ${staffUser.email}. Please inspect your inbox and enter the 4-digit code.`,
            expiresAt: otpResult.expiresAt
        });
    }
    catch (error) {
        console.error("Error in staff login:", error);
        return res.status(500).json({
            success: false,
            error: "Server error during staff authorization"
        });
    }
});
// POST /api/auth/staff-verify (Verify Staff Code & Grant Access)
exports.authRouter.post("/staff-verify", async (req, res) => {
    try {
        const schema = zod_1.z.object({
            email: zod_1.z.string().email(),
            otp: zod_1.z.string().length(4)
        });
        const parse = schema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ success: false, error: parse.error.errors[0].message });
        }
        const { email, otp } = parse.data;
        const normalizedEmail = email.toLowerCase().trim();
        const result = await (0, otp_1.verifyOtp)(normalizedEmail, otp);
        if (!result.success) {
            return res.status(401).json({ success: false, error: result.message });
        }
        const staffUser = await db_1.prisma.user.findFirst({
            where: { email: normalizedEmail, role: "STAFF" },
            include: { office: true }
        });
        if (!staffUser) {
            return res.status(403).json({ success: false, error: "Unauthorized staff role" });
        }
        return res.status(200).json({
            success: true,
            message: "Staff authentication authorized",
            staff: {
                id: staffUser.id,
                name: staffUser.name,
                email: staffUser.email,
                role: staffUser.role,
                staffId: staffUser.staffId,
                department: staffUser.department,
                officeId: staffUser.officeId,
                officeName: staffUser.office?.name || "General Administration"
            }
        });
    }
    catch (error) {
        console.error("Error verifying staff code:", error);
        return res.status(500).json({ success: false, error: "Error during staff verification" });
    }
});
// GET /api/auth/me?email=...
exports.authRouter.get("/me", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== "string") {
            return res.status(400).json({ success: false, error: "Email query param required" });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: { office: true }
        });
        if (!user) {
            return res.status(404).json({ success: false, error: "User profile not found" });
        }
        const pastBookings = await db_1.prisma.booking.findMany({
            where: { email: user.email },
            orderBy: { createdAt: "desc" },
            take: 10
        });
        return res.status(200).json({ success: true, user, pastBookings });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "Error fetching user profile" });
    }
});
