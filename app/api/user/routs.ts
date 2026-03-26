import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { ne, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const allUsers = await db.select({
      id: users.id, name: users.name, email: users.email,
      avatar: users.avatar, skillsOffered: users.skillsOffered,
    }).from(users).where(ne(users.id, decoded.id));

    return NextResponse.json({ users: allUsers });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}