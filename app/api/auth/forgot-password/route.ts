import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, otpTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateOTP, sendOTPEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userList.length === 0)
      return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });

    if (userList[0].password === "google-oauth-user")
      return NextResponse.json({ error: "This account uses Google Sign-In." }, { status: 400 });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.email, email));
    await db.insert(otpTokens).values({ email, otp, expiresAt, used: false });

    const sent = await sendOTPEmail(email, otp);
    if (!sent)
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });

    return NextResponse.json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}