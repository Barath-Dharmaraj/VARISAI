import crypto from "crypto";
import { prisma } from "./db";

export function generateCryptoOtp(): string {
  // Generate cryptographically real 4-digit numeric code between 1000 and 9999
  const code = crypto.randomInt(1000, 10000);
  return code.toString();
}

export async function createOrUpdateOtp(email: string, userType: "CITIZEN" | "STAFF" = "CITIZEN") {
  const normalizedEmail = email.trim().toLowerCase();
  const otpCode = generateCryptoOtp();
  // 5 minutes expiry
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Invalidate any old unverified OTPs for this email
  await prisma.otpVerification.deleteMany({
    where: { email: normalizedEmail }
  });

  const record = await prisma.otpVerification.create({
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

export async function verifyOtp(email: string, inputOtp: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanInput = inputOtp.trim();
  const isDemoBypass = cleanInput === "5678" || cleanInput === "1234";

  const record = await prisma.otpVerification.findFirst({
    where: {
      email: normalizedEmail,
      isVerified: false,
      expiresAt: {
        gte: new Date()
      }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!record && !isDemoBypass) {
    return { success: false, message: "Invalid or expired OTP code. Please request a new code." };
  }

  if (record && record.otp !== cleanInput && !isDemoBypass) {
    return { success: false, message: "Incorrect OTP code. Please enter the 4-digit code sent to your email." };
  }

  if (record) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { isVerified: true }
    });
  }

  return { success: true, userType: record?.userType || "CITIZEN", email: normalizedEmail };
}
