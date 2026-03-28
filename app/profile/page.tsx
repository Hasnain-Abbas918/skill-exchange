"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    loadProfile(token);
  }, []);

  const loadProfile = async (token: string) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user);
      setBids(res.data.bids || []);
      setForm(res.data.user);
    } catch {
      router.push("/login");
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    try {
      const res = await axios.put("/api/profile", form, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data.user);
      setForm(res.data.user);
      // Update localStorage user data too
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setEditing(false);
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save.");
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB."); return; }

    setUploading(true);
    const token = localStorage.getItem("token");

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await axios.put("/api/profile", { avatar: base64 }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data.user);
          setForm((f: any) => ({ ...f, avatar: base64 }));
          toast.success("Profile picture updated!");
        } catch {
          toast.error("Failed to upload avatar.");
        } finally { setUploading(false); }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Upload failed.");
    }
  };

  // PDF Export using jsPDF
  const handleExportPDF = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setExporting(true);

    try {
      const res = await axios.get("/api/export", { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;

      // Dynamically import jsPDF to keep bundle small
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SkillSwap — My Profile Export", 20, 25);

      // Export date
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Exported: ${new Date(data.exportedAt).toLocaleString()}`, 20, 35);

      // Profile Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Profile Information", 20, 58);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const profile = data.profile;
      const profileLines = [
        ["Name", profile.name || "—"],
        ["Email", profile.email || "—"],
        ["Phone", profile.phone || "—"],
        ["Location", profile.location || "—"],
        ["Website", profile.website || "—"],
        ["Skills Offered", profile.skillsOffered || "—"],
        ["Skills Wanted", profile.skillsWanted || "—"],
        ["Bio", profile.bio || "—"],
        ["Member Since", new Date(profile.createdAt).toLocaleDateString()],
      ];

      autoTable(doc, {
        startY: 65,
        head: [["Field", "Value"]],
        body: profileLines,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
      });

      // Stats
      const statsY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistics", 20, statsY);

      const stats = data.stats;
      autoTable(doc, {
        startY: statsY + 7,
        head: [["Metric", "Value"]],
        body: [
          ["Total Bids Posted", stats.totalBids.toString()],
          ["Open Bids", stats.openBids.toString()],
          ["Messages Sent", stats.totalMessagesSent.toString()],
        ],
        theme: "striped",
        headStyles: { fillColor: [6, 182, 212] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
      });

      // Bids
      if (data.bids.length > 0) {
        const bidsY = (doc as any).lastAutoTable.finalY + 12;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("My Bids", 20, bidsY);

        autoTable(doc, {
          startY: bidsY + 7,
          head: [["Title", "Offering", "Wanting", "Status", "Date"]],
          body: data.bids.slice(0, 20).map((b: any) => [
            b.title, b.skillOffered, b.skillWanted, b.status,
            new Date(b.createdAt).toLocaleDateString(),
          ]),
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
        });
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`SkillSwap Data Export — Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      }

      doc.save(`SkillSwap_Profile_${profile.name?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF.");
    } finally { setExporting(false); }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-main)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const inputStyle = {
    width: "100%", marginTop: "4px", padding: "10px 14px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", color: "#f1f5f9", outline: "none", fontSize: "14px",
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto px-8 py-8">

        {/* Profile Header */}
        <div className="rounded-2xl p-6 mb-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/30" />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold" style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center transition" style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                {uploading ? <span className="text-white text-xs animate-spin">↻</span> : <span className="text-white text-xs">📷</span>}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            {/* Name and Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{user?.name}</h1>
                {user?.isAdmin && <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>Admin</span>}
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>✓ Verified</span>
              </div>
              <p className="text-white/50 text-sm mt-1">{user?.email}</p>
              <div className="flex gap-4 mt-2 flex-wrap text-white/40 text-xs">
                {user?.location && <span>📍 {user.location}</span>}
                {user?.phone && <span>📞 {user.phone}</span>}
                {user?.website && <a href={user.website} target="_blank" className="text-indigo-400">🌐 Website</a>}
                <span>📅 Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleExportPDF} disabled={exporting}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>
                {exporting ? "Generating..." : "📄 Export PDF"}
              </button>
              <button onClick={() => { setEditing(!editing); setForm(user); }}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition"
                style={{ background: editing ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #4f46e5, #06b6d4)", color: "white", border: editing ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                {editing ? "Cancel" : "✏️ Edit Profile"}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {[
              { label: "Total Bids", value: bids.length },
              { label: "Open Bids", value: bids.filter(b => b.status === "open").length },
              { label: "Skills Offered", value: user?.skillsOffered?.split(",").filter(Boolean).length || 0 },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/40 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="rounded-2xl p-6 mb-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
            <h2 className="text-white font-bold mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "Your name" },
                { label: "Phone", key: "phone", type: "tel", placeholder: "+92 300 1234567" },
                { label: "Location", key: "location", type: "text", placeholder: "City, Country" },
                { label: "Website", key: "website", type: "url", placeholder: "https://yoursite.com" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: "12px", fontWeight: "500", color: "rgba(255,255,255,0.5)" }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={form[field.key] || ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div className="md:col-span-2">
                <label style={{ fontSize: "12px", fontWeight: "500", color: "rgba(255,255,255,0.5)" }}>Skills Offered (comma separated)</label>
                <input type="text" placeholder="React, Python, Design..." value={form.skillsOffered || ""}
                  onChange={(e) => setForm({ ...form, skillsOffered: e.target.value })} style={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <label style={{ fontSize: "12px", fontWeight: "500", color: "rgba(255,255,255,0.5)" }}>Skills Wanted</label>
                <input type="text" placeholder="Marketing, Music, Cooking..." value={form.skillsWanted || ""}
                  onChange={(e) => setForm({ ...form, skillsWanted: e.target.value })} style={inputStyle} />
              </div>
              <div className="md:col-span-2">
                <label style={{ fontSize: "12px", fontWeight: "500", color: "rgba(255,255,255,0.5)" }}>Bio</label>
                <textarea rows={3} placeholder="Tell others about yourself..." value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ ...inputStyle, resize: "none" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bids Section */}
        <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <h2 className="text-white font-bold mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>My Bids ({bids.length})</h2>
          {bids.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-white/30 text-sm">No bids posted yet.</p>
              <a href="/create-bid" className="inline-block mt-3 text-indigo-400 hover:text-indigo-300 text-sm">Post your first bid →</a>
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map(bid => (
                <div key={bid.id} className="rounded-xl px-4 py-3 border flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-white text-sm font-semibold">{bid.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">Offering: {bid.skillOffered} → Wants: {bid.skillWanted}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: bid.status === "open" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.07)", color: bid.status === "open" ? "#34d399" : "rgba(255,255,255,0.4)" }}>
                    {bid.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}