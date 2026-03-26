import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"SkillSwap" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your SkillSwap Password Reset OTP",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">SkillSwap</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Password Reset Request</p>
          </div>
          <div style="background: #f8fafc; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 24px;">Use this OTP to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: white; border: 2px solid #4f46e5; border-radius: 12px; padding: 20px 40px; display: inline-block; margin: 0 0 24px;">
              <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #4f46e5; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">If you didn't request this, ignore this email.</p>
          </div>
          <p style="text-align: center; color: #cbd5e1; font-size: 12px; margin-top: 20px;">© 2025 SkillSwap · Secure Platform</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}