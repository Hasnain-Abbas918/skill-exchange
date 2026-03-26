import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reports } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { reportedUserId, reason } = await req.json();
    if (!reportedUserId || !reason)
      return NextResponse.json({ error: "Reported user and reason are required." }, { status: 400 });

    const newReport = await db.insert(reports)
      .values({ reporterId: decoded.id, reportedUserId, reason, status: "pending" })
      .returning();

    return NextResponse.json({ message: "Report submitted.", report: newReport[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}