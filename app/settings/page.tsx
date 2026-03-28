"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

interface Settings {
  theme: string;
  emailNotifications: boolean;
  messageNotifications: boolean;
  showOnlineStatus: boolean;
  profileVisibility: string;
  language: string;
  soundEnabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>({
    theme: "dark",
    emailNotifications: true,
    messageNotifications: true,
    showOnlineStatus: true,
    profileVisibility: "public",
    language: "en",
    soundEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    // Load user profile from API
    axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCurrentUser(res.data.user))
      .catch(() => router.push("/login"));

    // Load settings from DB
    axios.get("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setSettings(res.data.settings);
        // Apply theme immediately
        applyTheme(res.data.settings.theme);
      })
      .catch(() => toast.error("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const applyTheme = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("skillswap_theme", theme);
  };

  const updateSetting = async (key: keyof Settings, value: any) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Update local state immediately (optimistic)
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Apply theme instantly if changed
    if (key === "theme") applyTheme(value as string);

    setSaving(key);
    try {
      await axios.put("/api/settings", { [key]: value }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Setting saved!");
    } catch {
      // Revert on error
      setSettings(settings);
      toast.error("Failed to save setting.");
    } finally { setSaving(null); }
  };

  const Toggle = ({ checked, onChange, loading: isLoading }: { checked: boolean; onChange: () => void; loading?: boolean }) => (
    <button
      onClick={onChange}
      disabled={isLoading}
      className="relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none disabled:opacity-60"
      style={{ width: "48px", height: "26px", background: checked ? "linear-gradient(90deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.15)" }}
    >
      <span className="inline-block rounded-full bg-white transition-all duration-300" style={{ width: "18px", height: "18px", transform: checked ? "translateX(26px)" : "translateX(4px)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );

  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-5">
      <h2 className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h2>
      {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );

  const SettingRow = ({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-main)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
      <Sidebar user={currentUser} />
      <main className="flex-1 overflow-y-auto px-8 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Settings</h1>
          <p className="text-white/40 text-sm mt-1">All settings are saved to your account automatically.</p>
        </div>

        {/* APPEARANCE */}
        <div className="rounded-2xl p-6 mb-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <SectionHeader title="🎨 Appearance" subtitle="Customize how SkillSwap looks" />

          <SettingRow label="Theme" subtitle="Switch between dark and light mode">
            <div className="flex gap-2">
              {["dark", "light"].map(t => (
                <button key={t}
                  onClick={() => updateSetting("theme", t)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition"
                  style={{
                    background: settings.theme === t ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.07)",
                    color: settings.theme === t ? "white" : "rgba(255,255,255,0.5)",
                    border: settings.theme === t ? "none" : "1px solid rgba(255,255,255,0.1)",
                  }}>
                  {t === "dark" ? "🌙 Dark" : "☀️ Light"}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Language" subtitle="App display language">
            <select
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
              <option value="en">🇺🇸 English</option>
              <option value="ur">🇵🇰 Urdu</option>
              <option value="hi">🇮🇳 Hindi</option>
              <option value="ar">🇸🇦 Arabic</option>
              <option value="es">🇪🇸 Spanish</option>
            </select>
          </SettingRow>
        </div>

        {/* NOTIFICATIONS */}
        <div className="rounded-2xl p-6 mb-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <SectionHeader title="🔔 Notifications" subtitle="Control what alerts you receive" />

          <SettingRow label="Email Notifications" subtitle="Receive updates via email">
            <Toggle checked={settings.emailNotifications} loading={saving === "emailNotifications"}
              onChange={() => updateSetting("emailNotifications", !settings.emailNotifications)} />
          </SettingRow>

          <SettingRow label="Message Notifications" subtitle="Get notified when someone messages you">
            <Toggle checked={settings.messageNotifications} loading={saving === "messageNotifications"}
              onChange={() => updateSetting("messageNotifications", !settings.messageNotifications)} />
          </SettingRow>

          <SettingRow label="Sound Effects" subtitle="Play sounds for notifications">
            <Toggle checked={settings.soundEnabled} loading={saving === "soundEnabled"}
              onChange={() => updateSetting("soundEnabled", !settings.soundEnabled)} />
          </SettingRow>
        </div>

        {/* PRIVACY */}
        <div className="rounded-2xl p-6 mb-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <SectionHeader title="🔒 Privacy" subtitle="Control your visibility and data" />

          <SettingRow label="Profile Visibility" subtitle="Who can see your profile">
            <div className="flex gap-2">
              {["public", "private"].map(v => (
                <button key={v}
                  onClick={() => updateSetting("profileVisibility", v)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition"
                  style={{
                    background: settings.profileVisibility === v ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.07)",
                    color: settings.profileVisibility === v ? "white" : "rgba(255,255,255,0.5)",
                    border: settings.profileVisibility === v ? "none" : "1px solid rgba(255,255,255,0.1)",
                  }}>
                  {v === "public" ? "🌍 Public" : "🔒 Private"}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Online Status" subtitle="Show others when you're active">
            <Toggle checked={settings.showOnlineStatus} loading={saving === "showOnlineStatus"}
              onChange={() => updateSetting("showOnlineStatus", !settings.showOnlineStatus)} />
          </SettingRow>
        </div>

        {/* ACCOUNT */}
        <div className="rounded-2xl p-6 mb-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <SectionHeader title="⚙️ Account" />
          <SettingRow label="Email Address" subtitle={currentUser?.email || "Loading..."}>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
              ✓ Verified
            </span>
          </SettingRow>
          <SettingRow label="Change Password" subtitle="Update via forgot password flow">
            <a href="/forgot-password" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Reset →</a>
          </SettingRow>
        </div>

        <p className="text-white/20 text-xs text-center">All changes are saved instantly to your account database.</p>
      </main>
    </div>
  );
}