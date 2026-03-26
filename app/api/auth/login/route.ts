import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, auditLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userList.length === 0)
      return NextResponse.json({ error: "No account found with this email." }, { status: 401 });

    const user = userList[0];

    if (user.isBanned)
      return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });

    if (user.password === "google-oauth-user")
      return NextResponse.json({ error: "This account uses Google Sign-In. Please use 'Continue with Google'." }, { status: 400 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });

    const token = signToken({ id: user.id, email: user.email, isAdmin: user.isAdmin ?? false });

    await db.insert(auditLogs).values({
      userId: user.id, action: "LOGIN", details: `User logged in: ${email}`,
    });

    const response = NextResponse.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        avatar: user.avatar, skillsOffered: user.skillsOffered,
        skillsWanted: user.skillsWanted, bio: user.bio,
        location: user.location, phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });

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