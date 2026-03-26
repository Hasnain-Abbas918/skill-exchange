import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, otpTokens, auditLogs } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword)
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });

    if (newPassword.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    // Re-verify OTP
    const tokenList = await db.select().from(otpTokens)
      .where(and(eq(otpTokens.email, email), eq(otpTokens.otp, otp), eq(otpTokens.used, false)))
      .limit(1);

    if (tokenList.length === 0)
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 400 });

    if (new Date() > new Date(tokenList[0].expiresAt))
      return NextResponse.json({ error: "OTP has expired." }, { status: 400 });

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updatedUser = await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();

    // Mark OTP as used
    await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.email, email));

    // Audit log
    await db.insert(auditLogs).values({
      userId: updatedUser[0].id,
      action: "PASSWORD_RESET",
      details: `Password reset via OTP: ${email}`,
    });

    return NextResponse.json({ message: "Password reset successfully! You can now log in." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}