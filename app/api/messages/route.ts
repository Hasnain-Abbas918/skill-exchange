import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq, or, and, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const url = new URL(req.url);
    const otherUserId = parseInt(url.searchParams.get("userId") || "0");
    if (!otherUserId) return NextResponse.json({ error: "userId parameter is required." }, { status: 400 });

    // Fetch messages between the two users (oldest first for chat display)
    const chatMessages = await db.select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      isRead: messages.isRead,
      senderName: users.name,
      senderAvatar: users.avatar,
    }).from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, decoded.id), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, decoded.id))
        )
      ).orderBy(asc(messages.createdAt));

    // Mark messages from otherUser as read
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, otherUserId), eq(messages.receiverId, decoded.id)));

    return NextResponse.json({ messages: chatMessages });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    const { receiverId, content } = await req.json();
    if (!receiverId || !content?.trim())
      return NextResponse.json({ error: "Receiver and message content are required." }, { status: 400 });

    if (receiverId === decoded.id)
      return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });

    const newMessage = await db.insert(messages)
      .values({
        senderId: decoded.id,
        receiverId: parseInt(receiverId),
        content: content.trim(),
        isRead: false,
      })
      .returning();

    return NextResponse.json({ message: "Sent!", data: newMessage[0] }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}