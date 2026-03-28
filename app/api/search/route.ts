import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bids, users } from "@/lib/schema";
import { like, or, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";

    if (q.length < 2) {
      return NextResponse.json({ bids: [], users: [], skills: [] });
    }

    const searchTerm = `%${q}%`;

    // Search bids by title, skillOffered, skillWanted
    const matchingBids = await db.select({
      id: bids.id,
      title: bids.title,
      skillOffered: bids.skillOffered,
      skillWanted: bids.skillWanted,
      status: bids.status,
    }).from(bids)
      .where(or(
        like(bids.title, searchTerm),
        like(bids.skillOffered, searchTerm),
        like(bids.skillWanted, searchTerm),
      ))
      .limit(6);

    // Search users by name or skills
    const matchingUsers = await db.select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      skillsOffered: users.skillsOffered,
    }).from(users)
      .where(or(
        like(users.name, searchTerm),
        like(users.skillsOffered, searchTerm),
        like(users.skillsWanted, searchTerm),
      ))
      .limit(4);

    // Generate skill keyword suggestions
    const allSkills = new Set<string>();
    matchingBids.forEach(b => {
      b.skillOffered?.split(",").forEach(s => s.trim() && allSkills.add(s.trim()));
      b.skillWanted?.split(",").forEach(s => s.trim() && allSkills.add(s.trim()));
    });

    return NextResponse.json({
      bids: matchingBids,
      users: matchingUsers,
      skills: Array.from(allSkills).slice(0, 8),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}