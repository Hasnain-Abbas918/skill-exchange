import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { otpTokens } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp)
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });

    const tokenList = await db.select().from(otpTokens)
      .where(and(eq(otpTokens.email, email), eq(otpTokens.otp, otp), eq(otpTokens.used, false)))
      .limit(1);

    if (tokenList.length === 0)
      return NextResponse.json({ error: "Invalid OTP. Please check and try again." }, { status: 400 });

    const tokenRecord = tokenList[0];

    // Check expiry
    if (new Date() > new Date(tokenRecord.expiresAt))
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });

    return NextResponse.json({ message: "OTP verified successfully.", verified: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}