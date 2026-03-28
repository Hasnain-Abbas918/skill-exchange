import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bids, users, auditLogs } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allBids = await db.select({
      id: bids.id, title: bids.title, skillOffered: bids.skillOffered,
      skillWanted: bids.skillWanted, description: bids.description,
      status: bids.status, createdAt: bids.createdAt,
      userId: bids.userId, userName: users.name, userAvatar: users.avatar,
    }).from(bids).leftJoin(users, eq(bids.userId, users.id)).orderBy(desc(bids.createdAt));

    return NextResponse.json({ bids: allBids });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const { title, skillOffered, skillWanted, description } = await req.json();
    if (!title || !skillOffered || !skillWanted)
      return NextResponse.json({ error: "Title, Skill Offered, and Skill Wanted are required." }, { status: 400 });

    const newBid = await db.insert(bids).values({
      userId: decoded.id, title, skillOffered, skillWanted,
      description: description || "", status: "open",
    }).returning();

    await db.insert(auditLogs).values({
      userId: decoded.id, action: "CREATE_BID", details: `New bid: "${title}"`,
    });

    return NextResponse.json({ message: "Bid posted!", bid: newBid[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}