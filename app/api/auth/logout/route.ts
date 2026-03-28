import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        await db.insert(auditLogs).values({
          userId: decoded.id,
          action: "LOGOUT",
          details: `User logged out: ${decoded.email}`,
        });
      }
    }
  } catch {}

  const response = NextResponse.json({ message: "Logged out successfully." });
  // Clear the auth cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
  });
  return response;
}