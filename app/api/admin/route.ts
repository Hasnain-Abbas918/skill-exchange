import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, reports, auditLogs } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded?.isAdmin) return NextResponse.json({ error: "Admin access only." }, { status: 403 });

    const type = new URL(req.url).searchParams.get("type");

    if (type === "users") {
      const allUsers = await db.select({
        id: users.id, name: users.name, email: users.email,
        isAdmin: users.isAdmin, isBanned: users.isBanned, createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));
      return NextResponse.json({ users: allUsers });
    }
    if (type === "reports") {
      return NextResponse.json({ reports: await db.select().from(reports).orderBy(desc(reports.createdAt)) });
    }
    if (type === "logs") {
      return NextResponse.json({ logs: await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100) });
    }
    return NextResponse.json({ error: "Specify a type." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded?.isAdmin) return NextResponse.json({ error: "Admin access only." }, { status: 403 });

    const { userId } = await req.json();
    await db.update(users).set({ isBanned: true }).where(eq(users.id, userId));
    await db.insert(auditLogs).values({
      userId: decoded.id, action: "BAN_USER", details: `Banned user ID: ${userId}`,
    });
    return NextResponse.json({ message: "User banned." });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}