import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq, or, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const otherUserId = parseInt(new URL(req.url).searchParams.get("userId") || "0");

    const allMessages = await db.select({
      id: messages.id, content: messages.content,
      createdAt: messages.createdAt, senderId: messages.senderId,
      receiverId: messages.receiverId, senderName: users.name,
      senderAvatar: users.avatar,
    }).from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, decoded.id), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, decoded.id))
        )
      ).orderBy(desc(messages.createdAt));

    return NextResponse.json({ messages: allMessages });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { receiverId, content } = await req.json();
    if (!receiverId || !content)
      return NextResponse.json({ error: "Receiver and message content are required." }, { status: 400 });

    const newMessage = await db.insert(messages)
      .values({ senderId: decoded.id, receiverId, content })
      .returning();

    return NextResponse.json({ message: "Sent!", data: newMessage[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}