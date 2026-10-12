"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCryptoOtp = generateCryptoOtp;
exports.createOrUpdateOtp = createOrUpdateOtp;
exports.verifyOtp = verifyOtp;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("./db");
function generateCryptoOtp() {
    // Generate cryptographically real 4-digit numeric code between 1000 and 9999
    const code = crypto_1.default.randomInt(1000, 10000);
    return code.toString();
}
async function createOrUpdateOtp(email, userType = "CITIZEN") {
    const normalizedEmail = email.trim().toLowerCase();
    const otpCode = generateCryptoOtp();
    // 5 minutes expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    // Invalidate any old unverified OTPs for this email
    await db_1.prisma.otpVerification.deleteMany({
        where: { email: normalizedEmail }
    });
    const record = await db_1.prisma.otpVerification.create({
        data: {
            email: normalizedEmail,
            otp: otpCode,
            userType,
            expiresAt,
            isVerified: false
        }
    });
    return {
        email: record.email,
        otp: record.otp,
        expiresAt: record.expiresAt,
        userType: record.userType,
        demoMessage: `Demo email verification — code sent to ${record.email}. Use code ${record.otp} to verify.`
    };
}
async function verifyOtp(email, inputOtp) {
    const normalizedEmail = email.trim().toLowerCase();
    const record = await db_1.prisma.otpVerification.findFirst({
        where: {
            email: normalizedEmail,
            isVerified: false,
            expiresAt: {
                gte: new Date()
            }
        },
        orderBy: { createdAt: "desc" }
    });
    if (!record) {
        return { success: false, message: "Invalid or expired OTP code. Please request a new code." };
    }
    if (record.otp !== inputOtp.trim()) {
        return { success: false, message: "Incorrect OTP code. Please enter the 4-digit code sent to your email." };
    }
    await db_1.prisma.otpVerification.update({
        where: { id: record.id },
        data: { isVerified: true }
    });
    return { success: true, userType: record.userType, email: normalizedEmail };
}
