import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/schema";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    let settings = await db.select().from(userSettings)
      .where(eq(userSettings.userId, decoded.id)).limit(1);

    // If no settings exist yet, create defaults
    if (settings.length === 0) {
      const created = await db.insert(userSettings).values({
        userId: decoded.id,
        theme: "dark",
        emailNotifications: true,
        messageNotifications: true,
        showOnlineStatus: true,
        profileVisibility: "public",
        language: "en",
        soundEnabled: true,
      }).returning();
      settings = created;
    }

    return NextResponse.json({ settings: settings[0] });
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
    const allowedFields = ["theme", "emailNotifications", "messageNotifications",
      "showOnlineStatus", "profileVisibility", "language", "soundEnabled"];

    const updateData: Record<string, any> = { updatedAt: new Date() };
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    // Upsert — update if exists, insert if not
    const existing = await db.select().from(userSettings)
      .where(eq(userSettings.userId, decoded.id)).limit(1);

    if (existing.length > 0) {
      await db.update(userSettings).set(updateData).where(eq(userSettings.userId, decoded.id));
    } else {
      await db.insert(userSettings).values({ userId: decoded.id, ...updateData });
    }

    const updated = await db.select().from(userSettings)
      .where(eq(userSettings.userId, decoded.id)).limit(1);

    return NextResponse.json({ message: "Settings saved!", settings: updated[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}