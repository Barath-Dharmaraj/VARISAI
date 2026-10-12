import nodemailer from "nodemailer";

export interface SendOtpResult {
  delivered: boolean;
  messageId?: string;
  previewUrl?: string | false;
  isRealInbox?: boolean;
  error?: string;
}

export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<SendOtpResult> {
  const normalizedEmail = toEmail.trim().toLowerCase();
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE === "false" ? false : true;
  const smtpFrom = process.env.SMTP_FROM || `"VARISAI Queue Portal" <${smtpUser || "noreply@varisai.gov.in"}>`;

  const greeting = recipientName ? `Dear ${recipientName},` : "Dear Citizen,";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VARISAI Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F6F3; margin: 0; padding: 24px; color: #0A0A0A; }
    .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1.5px solid #D9CBA3; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { background: #0A0A0A; padding: 24px 28px; text-align: center; border-bottom: 3px solid #B8923F; }
    .header h1 { margin: 0; color: #FFFFFF; font-size: 22px; letter-spacing: 0.04em; font-family: Georgia, serif; }
    .header p { margin: 4px 0 0; color: #D9CBA3; font-size: 13px; font-weight: 500; }
    .body { padding: 32px 28px; }
    .otp-card { background: #FDFBF7; border: 2px dashed #B8923F; border-radius: 8px; text-align: center; padding: 24px 16px; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; color: #8C6D2E; letter-spacing: 12px; margin: 8px 0; }
    .footer { background: #F7F6F3; border-top: 1px solid #EBE9E4; padding: 18px 28px; text-align: center; font-size: 12px; color: #5C5A56; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VARISAI • வரிசை</h1>
      <p>Official Public Service Queue Management Portal</p>
    </div>
    <div class="body">
      <p style="font-size: 15px; margin-top: 0;">${greeting}</p>
      <p style="font-size: 14px; line-height: 1.6; color: #2B2A27;">
        You have requested a secure verification code to access the VARISAI Public Queue System. Use the official 4-digit code below to authenticate your session:
      </p>

      <div class="otp-card">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #8C6D2E;">
          YOUR 4-DIGIT VERIFICATION CODE
        </div>
        <div class="otp-code">${otpCode}</div>
        <div style="font-size: 12px; color: #5C5A56;">
          ⏱ This code will expire in <strong>5 minutes</strong>.
        </div>
      </div>

      <p style="font-size: 13px; color: #5C5A56; line-height: 1.5;">
        🔒 <strong>Security Warning:</strong> Government officials will never ask you for this OTP code. Do not share it with anyone.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Government of Tamil Nadu • Smart Priority Queue Management</p>
      <p style="margin: 4px 0 0; color: #8A8883;">Adaptive Queueing for Senior Citizens & Persons with Disabilities</p>
    </div>
  </div>
</body>
</html>
`;

  // Case 1: Real Server SMTP Configured (Delivers directly to user's real email)
  if (smtpUser && smtpPass) {
    try {
      const cleanPass = smtpPass.replace(/\s+/g, "");
      const cleanFrom = process.env.SMTP_FROM || `"VARISAI Public Queue Portal" <${smtpUser}>`;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: cleanPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: cleanFrom,
        to: normalizedEmail,
        subject: `[VARISAI] ${otpCode} is your Queue Portal Verification Code`,
        text: `${greeting}\n\nYour VARISAI verification code is: ${otpCode}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.\n\n— Government of Tamil Nadu Public Service Portal`,
        html: htmlContent
      });

      console.log(`[EMAIL DELIVERED TO REAL INBOX] Sent to ${normalizedEmail} (Message ID: ${info.messageId})`);
      return {
        delivered: true,
        isRealInbox: true,
        messageId: info.messageId
      };
    } catch (err: any) {
      console.error(`[REAL SMTP ERROR] Failed to send email to ${normalizedEmail}:`, err.message);
      // Fall through to Ethereal fallback
    }
  }

  // Case 2: Zero-config Test Account (Generates instant live web inbox preview)
  try {
    console.log(`[EMAIL DISPATCH] Generating test delivery for ${normalizedEmail}...`);
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await testTransporter.sendMail({
      from: `"VARISAI Queue Portal" <noreply@varisai.gov.in>`,
      to: normalizedEmail,
      subject: `[VARISAI] ${otpCode} is your Queue Portal Verification Code`,
      text: `${greeting}\n\nYour VARISAI verification code is: ${otpCode}\n\nThis code is valid for 5 minutes.\n\n— Government of Tamil Nadu`,
      html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL PREVIEW INBOX READY] To: ${normalizedEmail} | Preview: ${previewUrl}`);

    return {
      delivered: true,
      isRealInbox: false,
      previewUrl: previewUrl || false,
      messageId: info.messageId
    };
  } catch (fallbackErr: any) {
    console.warn(`[EMAIL NOTICE] Code generated for ${normalizedEmail}: ${otpCode}`);
    return {
      delivered: false,
      isRealInbox: false,
      error: fallbackErr.message
    };
  }
}
