"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

interface SettingsState {
  emailNotifications: boolean;
  messageNotifications: boolean;
  bidAlerts: boolean;
  weeklyDigest: boolean;
  profileVisibility: "public" | "members" | "private";
  showEmail: boolean;
  showPhone: boolean;
  twoFactor: boolean;
  darkMode: boolean;
  compactView: boolean;
  language: string;
}

const INITIAL_SETTINGS: SettingsState = {
  emailNotifications: true,
  messageNotifications: true,
  bidAlerts: true,
  weeklyDigest: false,
  profileVisibility: "public",
  showEmail: false,
  showPhone: false,
  twoFactor: false,
  darkMode: true,
  compactView: false,
  language: "English",
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 transition-all"
      style={{
        width: "46px", height: "26px",
        background: value ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.12)",
        borderRadius: "100px",
        border: "none",
        cursor: "pointer",
      }}
    >
      <div
        className="absolute top-1 transition-all"
        style={{
          width: "18px", height: "18px",
          background: "white",
          borderRadius: "50%",
          left: value ? "calc(100% - 22px)" : "4px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));

    // Load saved settings
    const saved = localStorage.getItem("settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem("settings", JSON.stringify(updated));
    toast.success("Setting saved");
  };

  const SECTIONS = [
    {
      title: "Notifications",
      icon: "🔔",
      color: "#4f46e5",
      items: [
        {
          label: "Email Notifications",
          desc: "Receive updates and alerts via email",
          control: <Toggle value={settings.emailNotifications} onChange={(v) => updateSetting("emailNotifications", v)} />,
        },
        {
          label: "Message Alerts",
          desc: "Get notified when you receive a new message",
          control: <Toggle value={settings.messageNotifications} onChange={(v) => updateSetting("messageNotifications", v)} />,
        },
        {
          label: "New Bid Alerts",
          desc: "Notifications for new skill exchange bids",
          control: <Toggle value={settings.bidAlerts} onChange={(v) => updateSetting("bidAlerts", v)} />,
        },
        {
          label: "Weekly Digest",
          desc: "A weekly summary of top skill exchanges",
          control: <Toggle value={settings.weeklyDigest} onChange={(v) => updateSetting("weeklyDigest", v)} />,
        },
      ],
    },
    {
      title: "Privacy",
      icon: "🔒",
      color: "#8b5cf6",
      items: [
        {
          label: "Profile Visibility",
          desc: "Who can see your profile",
          control: (
            <select
              value={settings.profileVisibility}
              onChange={(e) => updateSetting("profileVisibility", e.target.value as any)}
              className="text-sm rounded-xl px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#f1f5f9",
                outline: "none",
              }}
            >
              <option value="public" style={{ background: "#1e293b" }}>Public</option>
              <option value="members" style={{ background: "#1e293b" }}>Members Only</option>
              <option value="private" style={{ background: "#1e293b" }}>Private</option>
            </select>
          ),
        },
        {
          label: "Show Email Address",
          desc: "Let others see your email on your profile",
          control: <Toggle value={settings.showEmail} onChange={(v) => updateSetting("showEmail", v)} />,
        },
        {
          label: "Show Phone Number",
          desc: "Let others see your phone number",
          control: <Toggle value={settings.showPhone} onChange={(v) => updateSetting("showPhone", v)} />,
        },
        {
          label: "Two-Factor Authentication",
          desc: "Add an extra layer of security",
          control: <Toggle value={settings.twoFactor} onChange={(v) => updateSetting("twoFactor", v)} />,
        },
      ],
    },
    {
      title: "Appearance",
      icon: "🎨",
      color: "#06b6d4",
      items: [
        {
          label: "Dark Mode",
          desc: "Use dark theme throughout the app",
          control: <Toggle value={settings.darkMode} onChange={(v) => updateSetting("darkMode", v)} />,
        },
        {
          label: "Compact View",
          desc: "Show more content with reduced spacing",
          control: <Toggle value={settings.compactView} onChange={(v) => updateSetting("compactView", v)} />,
        },
        {
          label: "Language",
          desc: "Choose your preferred language",
          control: (
            <select
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
              className="text-sm rounded-xl px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#f1f5f9",
                outline: "none",
              }}
            >
              {["English", "Urdu", "Arabic", "Spanish", "French"].map((lang) => (
                <option key={lang} value={lang} style={{ background: "#1e293b" }}>{lang}</option>
              ))}
            </select>
          ),
        },
      ],
    },
    {
      title: "Account",
      icon: "⚙",
      color: "#f59e0b",
      items: [
        {
          label: "Change Password",
          desc: "Update your password using OTP verification",
          control: (
            <a
              href="/forgot-password"
              className="text-xs px-4 py-2 rounded-xl font-semibold transition"
              style={{
                background: "rgba(79,70,229,0.2)",
                border: "1px solid rgba(79,70,229,0.3)",
                color: "#a5b4fc",
              }}
            >
              Change →
            </a>
          ),
        },
        {
          label: "Edit Profile",
          desc: "Update your name, skills, and bio",
          control: (
            <a
              href="/profile"
              className="text-xs px-4 py-2 rounded-xl font-semibold"
              style={{
                background: "rgba(6,182,212,0.15)",
                border: "1px solid rgba(6,182,212,0.25)",
                color: "#67e8f9",
              }}
            >
              Edit →
            </a>
          ),
        },
        {
          label: "Export My Data",
          desc: "Download all your SkillSwap data",
          control: (
            <button
              onClick={() => toast("Feature coming soon!")}
              className="text-xs px-4 py-2 rounded-xl font-semibold"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
              }}
            >
              Export
            </button>
          ),
        },
      ],
    },
  ];

  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #162b3a 100%)" }}>
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Settings
            </h1>
            <p className="text-white/40 text-sm mt-1">Manage your account preferences</p>
          </div>

          {/* User Summary Card */}
          <div
            className="flex items-center gap-4 rounded-2xl p-5 border mb-8"
            style={{
              background: "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(6,182,212,0.1))",
              borderColor: "rgba(79,70,229,0.2)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-white font-bold">{user.name}</p>
              <p className="text-white/40 text-sm">{user.email}</p>
            </div>
            <div className="ml-auto">
              <span
                className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: "rgba(16,185,129,0.2)", color: "#34d399" }}
              >
                ● Active
              </span>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                {/* Section Header */}
                <div
                  className="flex items-center gap-3 px-6 py-4 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{ background: `${section.color}20` }}
                  >
                    {section.icon}
                  </div>
                  <span className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {section.title}
                  </span>
                </div>

                {/* Section Items */}
                <div>
                  {section.items.map((item, index) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-6 py-4 transition"
                      style={{
                        borderBottom: index < section.items.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                      }}
                    >
                      <div className="flex-1 mr-4">
                        <p className="text-white text-sm font-medium">{item.label}</p>
                        <p className="text-white/30 text-xs mt-0.5">{item.desc}</p>
                      </div>
                      {item.control}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Version info */}
          <p className="text-center text-white/15 text-xs mt-8">
            SkillSwap v2.0 · © 2025 · Built with Next.js
          </p>
        </div>
      </main>
    </div>
  );
}