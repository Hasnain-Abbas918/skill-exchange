import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, registrationOtps } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateOTP, sendRegistrationOTPEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email)
      return NextResponse.json({ error: "Email is required." }, { status: 400 });

    // Check if email already registered
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0)
      return NextResponse.json({ error: "This email is already registered. Please login." }, { status: 409 });

    // Generate OTP (expires in 10 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate old OTPs for this email
    await db.update(registrationOtps)
      .set({ used: true })
      .where(eq(registrationOtps.email, email));

    // Save new OTP
    await db.insert(registrationOtps).values({ email, otp, expiresAt, used: false });

    // Send email
    const sent = await sendRegistrationOTPEmail(email, otp);
    if (!sent)
      return NextResponse.json({ error: "Failed to send verification email. Check your email address." }, { status: 500 });

    return NextResponse.json({ message: "Verification OTP sent to your email. Check your inbox." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}