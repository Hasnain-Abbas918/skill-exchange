import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, bids, messages, auditLogs } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    // Fetch user profile
    const userList = await db.select({
      id: users.id, name: users.name, email: users.email,
      phone: users.phone, location: users.location, website: users.website,
      skillsOffered: users.skillsOffered, skillsWanted: users.skillsWanted,
      bio: users.bio, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, decoded.id)).limit(1);

    if (userList.length === 0)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    // Fetch user bids
    const userBids = await db.select().from(bids)
      .where(eq(bids.userId, decoded.id))
      .orderBy(desc(bids.createdAt));

    // Fetch sent messages (last 100)
    const sentMessages = await db.select({
      id: messages.id, content: messages.content,
      receiverId: messages.receiverId, createdAt: messages.createdAt,
    }).from(messages)
      .where(eq(messages.senderId, decoded.id))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    // Fetch activity logs
    const logs = await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, decoded.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: userList[0],
      stats: {
        totalBids: userBids.length,
        openBids: userBids.filter(b => b.status === "open").length,
        totalMessagesSent: sentMessages.length,
        memberSince: userList[0].createdAt,
      },
      bids: userBids,
      recentMessages: sentMessages,
      activityLog: logs,
    };

    return NextResponse.json(exportData);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}