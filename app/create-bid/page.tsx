"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

export default function CreateBidPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ title: "", skillOffered: "", skillWanted: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUser(res.data.user))
      .catch(() => router.push("/login"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      await axios.post("/api/bids", form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Bid posted successfully!");
      router.push("/browse");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to post bid.");
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%", marginTop: "6px", padding: "12px 16px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px", color: "#f1f5f9", outline: "none", fontSize: "14px",
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto px-8 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Post a Skill Bid</h1>
          <p className="text-white/40 text-sm mt-1">Tell the community what you offer and what you want in return.</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Bid Title *</label>
              <input type="text" placeholder="e.g. React lessons in exchange for Photography" required
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Skill I Offer *</label>
                <input type="text" placeholder="e.g. React Development" required
                  value={form.skillOffered} onChange={(e) => setForm({ ...form, skillOffered: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Skill I Want *</label>
                <input type="text" placeholder="e.g. Photography Basics" required
                  value={form.skillWanted} onChange={(e) => setForm({ ...form, skillWanted: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>Description</label>
              <textarea rows={4} placeholder="Describe what you'll teach, how often, what level, etc."
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ ...inputStyle, resize: "none" }} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
              {loading ? "Posting..." : "Post Bid →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}