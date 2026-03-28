import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, bids, messages, auditLogs } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq, desc, or, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const userList = await db.select({
      id: users.id, name: users.name, email: users.email,
      avatar: users.avatar, phone: users.phone, location: users.location,
      website: users.website, skillsOffered: users.skillsOffered,
      skillsWanted: users.skillsWanted, bio: users.bio,
      isAdmin: users.isAdmin, createdAt: users.createdAt,
      isEmailVerified: users.isEmailVerified,
    }).from(users).where(eq(users.id, decoded.id)).limit(1);

    if (userList.length === 0)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    const userBids = await db.select().from(bids)
      .where(eq(bids.userId, decoded.id))
      .orderBy(desc(bids.createdAt));

    return NextResponse.json({ user: userList[0], bids: userBids });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const body = await req.json();
    const { name, phone, location, website, skillsOffered, skillsWanted, bio, avatar } = body;

    const updated = await db.update(users).set({
      name: name || undefined,
      phone: phone || undefined,
      location: location || undefined,
      website: website || undefined,
      skillsOffered: skillsOffered !== undefined ? skillsOffered : undefined,
      skillsWanted: skillsWanted !== undefined ? skillsWanted : undefined,
      bio: bio !== undefined ? bio : undefined,
      avatar: avatar !== undefined ? avatar : undefined,
      updatedAt: new Date(),
    }).where(eq(users.id, decoded.id)).returning();

    await db.insert(auditLogs).values({
      userId: decoded.id, action: "UPDATE_PROFILE", details: "User updated their profile",
    });

    return NextResponse.json({ message: "Profile updated!", user: updated[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}