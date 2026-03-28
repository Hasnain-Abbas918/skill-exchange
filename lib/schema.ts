import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  phone: text("phone"),
  location: text("location"),
  website: text("website"),
  skillsOffered: text("skills_offered"),
  skillsWanted: text("skills_wanted"),
  bio: text("bio"),
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// For forgot-password OTP
export const otpTokens = pgTable("otp_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW — For registration email verification OTP
export const registrationOtps = pgTable("registration_otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW — User settings stored in DB (not localStorage)
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  theme: text("theme").default("dark"),                         // "dark" | "light"
  emailNotifications: boolean("email_notifications").default(true),
  messageNotifications: boolean("message_notifications").default(true),
  showOnlineStatus: boolean("show_online_status").default(true),
  profileVisibility: text("profile_visibility").default("public"), // "public" | "private"
  language: text("language").default("en"),
  soundEnabled: boolean("sound_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  skillOffered: text("skill_offered").notNull(),
  skillWanted: text("skill_wanted").notNull(),
  description: text("description"),
  status: text("status").default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => users.id),
  reportedUserId: integer("reported_user_id").references(() => users.id),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});