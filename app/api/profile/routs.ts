import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const userList = await db.select({
      id: users.id, name: users.name, email: users.email, avatar: users.avatar,
      phone: users.phone, location: users.location, website: users.website,
      skillsOffered: users.skillsOffered, skillsWanted: users.skillsWanted,
      bio: users.bio, isAdmin: users.isAdmin, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, decoded.id)).limit(1);

    if (userList.length === 0)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ user: userList[0] });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { name, bio, skillsOffered, skillsWanted, phone, location, website, avatar } = await req.json();

    const updated = await db.update(users).set({
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(skillsOffered !== undefined && { skillsOffered }),
      ...(skillsWanted !== undefined && { skillsWanted }),
      ...(phone !== undefined && { phone }),
      ...(location !== undefined && { location }),
      ...(website !== undefined && { website }),
      ...(avatar !== undefined && { avatar }),
      updatedAt: new Date(),
    }).where(eq(users.id, decoded.id)).returning();

    // Update localStorage data
    return NextResponse.json({ message: "Profile updated!", user: updated[0] });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}