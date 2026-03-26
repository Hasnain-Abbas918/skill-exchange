import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const existing = await db.select().from(users).where(eq(users.email, user.email!)).limit(1);
        if (existing.length === 0) {
          await db.insert(users).values({
            name: user.name || "Google User",
            email: user.email!,
            password: "google-oauth-user",
            avatar: user.image || null,
            skillsOffered: "",
            skillsWanted: "",
            bio: "",
            isAdmin: false,
            isBanned: false,
          });
        }
        return true;
      } catch { return false; }
    },
    async session({ session }) {
      try {
        const dbUser = await db.select().from(users).where(eq(users.email, session.user.email!)).limit(1);
        if (dbUser.length > 0) {
          (session.user as any).id = dbUser[0].id;
          (session.user as any).isAdmin = dbUser[0].isAdmin;
          (session.user as any).avatar = dbUser[0].avatar;
          (session.user as any).skillsOffered = dbUser[0].skillsOffered;
          (session.user as any).skillsWanted = dbUser[0].skillsWanted;
        }
      } catch {}
      return session;
    },
    async redirect() { return "/dashboard"; },
  },
  pages: { signIn: "/login" },
});