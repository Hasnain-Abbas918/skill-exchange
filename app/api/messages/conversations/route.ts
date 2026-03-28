import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq, or, and, desc, ne } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const decoded = token ? verifyToken(token) : null;
    if (!decoded) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    // Get all messages involving this user
    const allMessages = await db.select({
      id: messages.id,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
    }).from(messages)
      .where(or(eq(messages.senderId, decoded.id), eq(messages.receiverId, decoded.id)))
      .orderBy(desc(messages.createdAt));

    // Get unique conversation partner IDs
    const partnerIds = new Set<number>();
    const latestMessages: Record<number, any> = {};

    for (const msg of allMessages) {
      const partnerId = msg.senderId === decoded.id ? msg.receiverId! : msg.senderId!;
      if (!partnerIds.has(partnerId)) {
        partnerIds.add(partnerId);
        latestMessages[partnerId] = msg;
      }
    }

    if (partnerIds.size === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Fetch partner user details
    const partnerDetails = await Promise.all(
      Array.from(partnerIds).map(async (partnerId) => {
        const userInfo = await db.select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          email: users.email,
        }).from(users).where(eq(users.id, partnerId)).limit(1);

        if (userInfo.length === 0) return null;

        // Count unread messages from this partner
        const unreadCount = allMessages.filter(
          m => m.senderId === partnerId && m.receiverId === decoded.id && !m.isRead
        ).length;

        return {
          user: userInfo[0],
          lastMessage: latestMessages[partnerId],
          unreadCount,
        };
      })
    );

    const conversations = partnerDetails
      .filter(Boolean)
      .sort((a, b) => new Date(b!.lastMessage.createdAt).getTime() - new Date(a!.lastMessage.createdAt).getTime());

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}