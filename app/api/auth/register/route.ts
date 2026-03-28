import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, auditLogs, registrationOtps, userSettings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, otp, skillsOffered, skillsWanted, bio } = await req.json();

    if (!name || !email || !password || !otp)
      return NextResponse.json({ error: "Name, email, password, and OTP are required." }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    // Verify registration OTP
    const otpRecord = await db.select().from(registrationOtps)
      .where(and(
        eq(registrationOtps.email, email),
        eq(registrationOtps.otp, otp),
        eq(registrationOtps.used, false)
      )).limit(1);

    if (otpRecord.length === 0)
      return NextResponse.json({ error: "Invalid OTP. Please request a new one." }, { status: 400 });

    if (new Date() > new Date(otpRecord[0].expiresAt))
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });

    // Check duplicate email
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0)
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.insert(users).values({
      name, email,
      password: hashedPassword,
      skillsOffered: skillsOffered || "",
      skillsWanted: skillsWanted || "",
      bio: bio || "",
      isAdmin: false,
      isBanned: false,
      isEmailVerified: true,
    }).returning();

    // Mark OTP as used
    await db.update(registrationOtps)
      .set({ used: true })
      .where(eq(registrationOtps.id, otpRecord[0].id));

    // Create default settings for new user
    await db.insert(userSettings).values({
      userId: newUser[0].id,
      theme: "dark",
      emailNotifications: true,
      messageNotifications: true,
      showOnlineStatus: true,
      profileVisibility: "public",
      language: "en",
      soundEnabled: true,
    });

    const token = signToken({ id: newUser[0].id, email: newUser[0].email, isAdmin: false });

    await db.insert(auditLogs).values({
      userId: newUser[0].id,
      action: "REGISTER",
      details: `New user registered with email verification: ${email}`,
    });

    const response = NextResponse.json({
      message: "Account created successfully! Welcome to SkillSwap 🎉",
      token,
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        avatar: newUser[0].avatar,
        skillsOffered: newUser[0].skillsOffered,
        skillsWanted: newUser[0].skillsWanted,
        bio: newUser[0].bio,
        isAdmin: false,
      },
    }, { status: 201 });

    response.cookies.set("token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}