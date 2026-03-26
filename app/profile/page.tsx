"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    setForm(parsed);
    // Fetch fresh data from server
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user);
      setForm(res.data.user);
    } catch {}
  };

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put("/api/profile", form, { headers: { Authorization: `Bearer ${token}` } });
      const updated = res.data.user;
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Update failed.");
    } finally { setLoading(false); }
  };

  // Upload avatar to Supabase Storage
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 2MB)
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB."); return; }

    setUploadingAvatar(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        toast.error("Supabase not configured. Using placeholder.");
        // Fallback: use a placeholder
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          const token = localStorage.getItem("token");
          const res = await axios.put("/api/profile", { avatar: dataUrl }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const updated = res.data.user;
          setUser(updated);
          setForm({ ...form, avatar: dataUrl });
          localStorage.setItem("user", JSON.stringify(updated));
          toast.success("Avatar updated!");
        };
        reader.readAsDataURL(file);
        return;
      }

      const fileName = `avatar-${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${fileName}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`;

      const token = localStorage.getItem("token");
      const res = await axios.put("/api/profile", { avatar: avatarUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = res.data.user;
      setUser(updated);
      setForm({ ...form, avatar: avatarUrl });
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Avatar upload failed.");
    } finally { setUploadingAvatar(false); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#111827" }}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "#f1f5f9",
    outline: "none", fontSize: "14px",
  };

  const readOnlyStyle = {
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    color: "#f1f5f9",
    fontSize: "14px",
  };

  const skillTags = (skillStr: string | null, color: string) => {
    if (!skillStr) return <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>None added</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {skillStr.split(",").map((s) => (
          <span
            key={s}
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
          >
            {s.trim()}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #162b3a 100%)" }}>
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto px-8 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                My Profile
              </h1>
              <p className="text-white/40 text-sm mt-1">Manage your public information and skills</p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  background: "rgba(79,70,229,0.2)",
                  border: "1px solid rgba(79,70,229,0.3)",
                  color: "#a5b4fc",
                }}
              >
                ✎ Edit Profile
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { setEditing(false); setForm(user); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT — Avatar + Basic Info */}
            <div className="lg:col-span-1">
              {/* Profile Card */}
              <div
                className="rounded-2xl p-6 text-center border mb-5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <div
                    className="w-24 h-24 rounded-full mx-auto overflow-hidden"
                    style={{ border: "3px solid rgba(79,70,229,0.4)" }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs transition"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                      border: "2px solid #111827",
                    }}
                  >
                    {uploadingAvatar ? "..." : "📷"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <h2 className="text-white font-bold text-lg mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {user.name}
                </h2>
                <p className="text-white/40 text-sm mb-3">{user.email}</p>

                {user.isAdmin && (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold mb-3"
                    style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}
                  >
                    👑 Admin
                  </span>
                )}

                {user.location && (
                  <p className="text-white/30 text-xs">📍 {user.location}</p>
                )}
                {user.website && (
                  <a href={user.website} target="_blank" rel="noreferrer"
                    className="text-indigo-400 text-xs hover:underline block mt-1">
                    🔗 {user.website}
                  </a>
                )}

                <div
                  className="mt-4 pt-4 border-t grid grid-cols-2 gap-3"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {[
                    { label: "Member Since", value: user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—" },
                    { label: "Account Status", value: user.isBanned ? "Suspended" : "Active" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <p className="text-white font-bold text-sm">{stat.value}</p>
                      <p className="text-white/25 text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio card */}
              <div
                className="rounded-2xl p-5 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">About Me</p>
                {editing ? (
                  <textarea
                    value={form.bio || ""}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    style={{ ...inputStyle, resize: "none" }}
                  />
                ) : (
                  <p className="text-white/60 text-sm leading-relaxed">
                    {user.bio || "No bio added yet."}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT — Detailed Info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Personal Details */}
              <div
                className="rounded-2xl p-6 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-5">Personal Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", key: "name", type: "text", placeholder: "Your full name" },
                    { label: "Email Address", key: "email", type: "email", placeholder: "your@email.com", readOnly: true },
                    { label: "Phone Number", key: "phone", type: "tel", placeholder: "+92 300 0000000" },
                    { label: "Location", key: "location", type: "text", placeholder: "City, Country" },
                    { label: "Website / Portfolio", key: "website", type: "url", placeholder: "https://yoursite.com", fullWidth: true },
                  ].map((field) => (
                    <div key={field.key} className={field.fullWidth ? "md:col-span-2" : ""}>
                      <label className="block mb-1.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {field.label}
                      </label>
                      {editing && !field.readOnly ? (
                        <input
                          type={field.type}
                          value={form[field.key] || ""}
                          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          style={inputStyle}
                        />
                      ) : (
                        <div style={readOnlyStyle}>
                          {user[field.key] || <span style={{ color: "rgba(255,255,255,0.2)" }}>Not provided</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div
                className="rounded-2xl p-6 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-5">Skills</p>
                <div className="space-y-5">
                  <div>
                    <label className="block mb-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                      🎯 Skills I Can Teach{editing && <span className="ml-1 text-white/20">(comma-separated)</span>}
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.skillsOffered || ""}
                        onChange={(e) => setForm({ ...form, skillsOffered: e.target.value })}
                        placeholder="Python, UI Design, Guitar, etc."
                        style={inputStyle}
                      />
                    ) : (
                      skillTags(user.skillsOffered, "#06b6d4")
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                      📚 Skills I Want to Learn{editing && <span className="ml-1 text-white/20">(comma-separated)</span>}
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.skillsWanted || ""}
                        onChange={(e) => setForm({ ...form, skillsWanted: e.target.value })}
                        placeholder="Photography, Spanish, React, etc."
                        style={inputStyle}
                      />
                    ) : (
                      skillTags(user.skillsWanted, "#8b5cf6")
                    )}
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div
                className="rounded-2xl p-5 border"
                style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.1)" }}
              >
                <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wider mb-4">Danger Zone</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm font-medium">Change Password</p>
                    <p className="text-white/25 text-xs">Use the forgot password flow to reset your password</p>
                  </div>
                  <a
                    href="/forgot-password"
                    className="text-xs px-4 py-2 rounded-xl font-semibold transition"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#fca5a5",
                    }}
                  >
                    Change Password
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
