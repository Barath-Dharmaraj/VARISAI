import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { createOrUpdateOtp, verifyOtp } from "../otp";
import { sendOtpEmail } from "../emailService";
import { hashPassword, verifyPassword } from "../password";

export const authRouter = Router();

const citizenPasswordLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

const citizenPasswordRegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  district: z.string().optional(),
  priorityCategory: z.enum(["none", "senior_citizen", "pregnant_woman", "differently_abled"]).default("none")
});

const staffPasswordLoginSchema = z.object({
  email: z.string().email("Enter a valid official government email address"),
  password: z.string().min(1, "Password is required"),
  staffId: z.string().optional()
});

const staffPasswordRegisterSchema = z.object({
  name: z.string().min(2, "Official full name required"),
  email: z.string().email("Valid official government email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staffId: z.string().min(2, "Staff Identification ID required"),
  department: z.string().min(2, "Government Department required"),
  officeId: z.string().min(2, "Assigned office required")
});

const citizenRegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  district: z.string().optional(),
  priorityCategory: z.enum(["none", "senior_citizen", "pregnant_woman", "differently_abled"]).default("none")
});

const staffRegisterSchema = z.object({
  name: z.string().min(2, "Official full name required"),
  email: z.string().email("Valid official government email required"),
  staffId: z.string().min(2, "Staff Identification ID required"),
  department: z.string().min(2, "Government Department required"),
  officeId: z.string().min(2, "Assigned office required")
});

const sendOtpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address (e.g. citizen@example.com)" }),
  name: z.string().optional(),
  phone: z.string().optional(),
  priorityCategory: z.string().optional(),
  district: z.string().optional(),
  userType: z.enum(["CITIZEN", "STAFF"]).default("CITIZEN")
});

const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  otp: z.string().length(4, { message: "OTP must be exactly 4 digits" }),
  name: z.string().optional()
});

const staffLoginSchema = z.object({
  email: z.string().email({ message: "Enter a valid official government email address" }),
  staffId: z.string().optional()
});

// ==========================================
// 1. CITIZEN PASSWORD AUTHENTICATION (NO OTP)
// ==========================================

// POST /api/auth/citizen-password-login
authRouter.post("/citizen-password-login", async (req: Request, res: Response) => {
  try {
    const parse = citizenPasswordLoginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { email, password } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, role: "CITIZEN" }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Citizen record not found with this email. Please switch to 'Create an Account' to register."
      });
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Please verify your credentials or reset your password."
      });
    }

    const pastBookings = await prisma.booking.findMany({
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
  } catch (error: any) {
    console.error("Citizen password login error:", error);
    return res.status(500).json({ success: false, error: "Server error during authentication" });
  }
});

// POST /api/auth/citizen-password-register
authRouter.post("/citizen-password-register", async (req: Request, res: Response) => {
  try {
    const parse = citizenPasswordRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { name, email, password, phone, district, priorityCategory } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing && existing.password) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists. Please use 'Sign In to your account'."
      });
    }

    const hashedPassword = hashPassword(password);

    const user = await prisma.user.upsert({
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
  } catch (error: any) {
    console.error("Citizen registration error:", error);
    return res.status(500).json({ success: false, error: "Failed to store citizen profile in database" });
  }
});

// POST /api/auth/staff-password-login
authRouter.post("/staff-password-login", async (req: Request, res: Response) => {
  try {
    const parse = staffPasswordLoginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { email, password, staffId } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const staffUser = await prisma.user.findFirst({
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

    const isMatch = verifyPassword(password, staffUser.password);
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
  } catch (error: any) {
    console.error("Staff password login error:", error);
    return res.status(500).json({ success: false, error: "Staff authorization server error" });
  }
});

// POST /api/auth/staff-password-register
authRouter.post("/staff-password-register", async (req: Request, res: Response) => {
  try {
    const parse = staffPasswordRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { name, email, password, staffId, department, officeId } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const office = await prisma.office.findUnique({ where: { id: officeId } });
    if (!office) {
      return res.status(400).json({ success: false, error: "Selected government office not found" });
    }

    const hashedPassword = hashPassword(password);

    const staff = await prisma.user.upsert({
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
  } catch (error: any) {
    console.error("Staff password register error:", error);
    return res.status(500).json({ success: false, error: "Failed to onboard staff record" });
  }
});


// ==========================================
// 1. CITIZEN AUTHENTICATION & REGISTRATION
// ==========================================

// POST /api/auth/citizen-lookup (Checks if citizen is already registered in DB)
authRouter.post("/citizen-lookup", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, role: "CITIZEN" }
    });

    if (!user) {
      return res.status(200).json({ success: true, exists: false });
    }

    const pastBookingsCount = await prisma.booking.count({
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
  } catch (error: any) {
    console.error("Error looking up citizen:", error);
    return res.status(500).json({ success: false, error: "Failed to query citizen records" });
  }
});

// POST /api/auth/citizen-register (Registers NEW Citizen in DB and Sends OTP)
authRouter.post("/citizen-register", async (req: Request, res: Response) => {
  try {
    const parse = citizenRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { name, email, phone, district, priorityCategory } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Upsert or create citizen profile in database
    const user = await prisma.user.upsert({
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
    const otpResult = await createOrUpdateOtp(normalizedEmail, "CITIZEN");
    const emailResult = await sendOtpEmail(normalizedEmail, otpResult.otp, user.name);

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
  } catch (error: any) {
    console.error("Error registering citizen:", error);
    return res.status(500).json({ success: false, error: "Error saving citizen profile to database" });
  }
});

// POST /api/auth/send-otp (Send OTP to Existing or New Citizen)
authRouter.post("/send-otp", async (req: Request, res: Response) => {
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
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user && userType === "CITIZEN") {
      user = await prisma.user.create({
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

    const otpResult = await createOrUpdateOtp(normalizedEmail, userType);
    const emailResult = await sendOtpEmail(normalizedEmail, otpResult.otp, user?.name);

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
  } catch (error: any) {
    console.error("Error sending OTP to email:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while generating email verification code"
    });
  }
});

// POST /api/auth/verify-otp (Verify Citizen Code & Return DB Profile)
authRouter.post("/verify-otp", async (req: Request, res: Response) => {
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

    const result = await verifyOtp(normalizedEmail, otp);
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.message
      });
    }

    // Upsert or retrieve user profile
    const user = await prisma.user.upsert({
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

    const pastBookings = await prisma.booking.findMany({
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
  } catch (error: any) {
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
authRouter.post("/staff-lookup", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "Official email required" });
    }

    const staffUser = await prisma.user.findFirst({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Error checking staff records" });
  }
});

// POST /api/auth/staff-register (Registers NEW Official in DB)
authRouter.post("/staff-register", async (req: Request, res: Response) => {
  try {
    const parse = staffRegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { name, email, staffId, department, officeId } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify office exists
    const office = await prisma.office.findUnique({ where: { id: officeId } });
    if (!office) {
      return res.status(400).json({ success: false, error: "Selected office not found in registry" });
    }

    // Save staff in User table
    const staff = await prisma.user.upsert({
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
    const otpResult = await createOrUpdateOtp(normalizedEmail, "STAFF");
    const emailResult = await sendOtpEmail(normalizedEmail, otpResult.otp, staff.name);

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
      otp: otpResult.otp,
      demoMessage: emailResult.isRealInbox
        ? `Official staff authorization code has been dispatched to ${staff.email}. Check your inbox and enter the 4-digit code.`
        : `Official verification code: ${otpResult.otp}`
    });
  } catch (error: any) {
    console.error("Error registering staff:", error);
    return res.status(500).json({ success: false, error: "Error saving staff record to database" });
  }
});

// POST /api/auth/staff-login (Dedicated Staff Login)
authRouter.post("/staff-login", async (req: Request, res: Response) => {
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
    const staffUser = await prisma.user.findFirst({
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
    const otpResult = await createOrUpdateOtp(normalizedEmail, "STAFF");
    const emailResult = await sendOtpEmail(normalizedEmail, otpResult.otp, staffUser.name);

    console.log(`[STAFF SECURITY LOGIN]: Code for ${staffUser.email} (${staffUser.name}) is ${otpResult.otp}`);

    return res.status(200).json({
      success: true,
      email: staffUser.email,
      otp: otpResult.otp,
      name: staffUser.name,
      role: staffUser.role,
      staffId: staffUser.staffId,
      department: staffUser.department,
      office: staffUser.office,
      emailDelivered: emailResult.delivered,
      demoMessage: emailResult.isRealInbox
        ? `Official staff authorization code dispatched directly to ${staffUser.email}. Please inspect your inbox and enter the 4-digit code.`
        : `Official verification code: ${otpResult.otp}`,
      expiresAt: otpResult.expiresAt
    });
  } catch (error: any) {
    console.error("Error in staff login:", error);
    return res.status(500).json({
      success: false,
      error: "Server error during staff authorization"
    });
  }
});

// POST /api/auth/staff-verify (Verify Staff Code & Grant Access)
authRouter.post("/staff-verify", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      otp: z.string().length(4)
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: parse.error.errors[0].message });
    }

    const { email, otp } = parse.data;
    const normalizedEmail = email.toLowerCase().trim();

    const result = await verifyOtp(normalizedEmail, otp);
    if (!result.success) {
      return res.status(401).json({ success: false, error: result.message });
    }

    const staffUser = await prisma.user.findFirst({
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
  } catch (error: any) {
    console.error("Error verifying staff code:", error);
    return res.status(500).json({ success: false, error: "Error during staff verification" });
  }
});

// GET /api/auth/me?email=...
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "Email query param required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { office: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User profile not found" });
    }

    const pastBookings = await prisma.booking.findMany({
      where: { email: user.email },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return res.status(200).json({ success: true, user, pastBookings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Error fetching user profile" });
  }
});
