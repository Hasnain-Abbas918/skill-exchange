import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, auditLogs } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? await verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Login required." }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Both passwords required." }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "New password must be 6+ characters." }, { status: 400 });

    const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    if (user.length === 0) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user[0].password);
    if (!valid) return NextResponse.json({ error: "Current password is wrong." }, { status: 401 });

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, decoded.id));
    await db.insert(auditLogs).values({ userId: decoded.id, action: "PASSWORD_CHANGE", details: "Changed from settings" });

    return NextResponse.json({ message: "Password changed!" });
  } catch { return NextResponse.json({ error: "Something went wrong." }, { status: 500 }); }
}