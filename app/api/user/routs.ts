import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { ne } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      skillsOffered: users.skillsOffered,
      email: users.email,
    }).from(users).where(ne(users.id, decoded.id));

    return NextResponse.json({ users: allUsers });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}