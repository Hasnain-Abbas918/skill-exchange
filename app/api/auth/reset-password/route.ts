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

    const tokenList = await db.select().from(otpTokens)
      .where(and(eq(otpTokens.email, email), eq(otpTokens.otp, otp), eq(otpTokens.used, false)))
      .limit(1);

    if (tokenList.length === 0)
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 400 });

    if (new Date() > new Date(tokenList[0].expiresAt))
      return NextResponse.json({ error: "OTP has expired." }, { status: 400 });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.email, email));
    await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.id, tokenList[0].id));

    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userList.length > 0) {
      await db.insert(auditLogs).values({
        userId: userList[0].id, action: "PASSWORD_RESET", details: `Password reset for: ${email}`,
      });
    }

    return NextResponse.json({ message: "Password reset successfully! Please log in with your new password." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}