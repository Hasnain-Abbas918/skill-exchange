"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

export default function CreateBidPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", skillOffered: "", skillWanted: "", description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    try {
      await axios.post("/api/bids", form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Bid posted successfully! 🎉");
      router.push("/browse");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to post bid.");
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%", marginTop: "6px", padding: "13px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", color: "#f1f5f9", outline: "none", fontSize: "14px",
  };

  const labelStyle = { fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.6)" };

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #162b3a 100%)" }}>
      <Sidebar user={user} />

      <main className="flex-1 flex items-start justify-center py-10 px-6 overflow-auto">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            Create New Bid +
          </h1>
          <p className="text-white/40 text-sm mb-8">Offer your skill and learn something new in return.</p>

          <div
            className="rounded-2xl p-7"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label style={labelStyle}>Bid Title</label>
                <input
                  type="text"
                  placeholder="e.g. Python in exchange for Guitar"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(79,70,229,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div>
                <label style={labelStyle}>What I Offer</label>
                <input
                  type="text"
                  placeholder="e.g. Python Programming, Figma Design"
                  required
                  value={form.skillOffered}
                  onChange={(e) => setForm({ ...form, skillOffered: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(79,70,229,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div>
                <label style={labelStyle}>What I Want</label>
                <input
                  type="text"
                  placeholder="e.g. Guitar Lessons, Spanish Tutoring"
                  required
                  value={form.skillWanted}
                  onChange={(e) => setForm({ ...form, skillWanted: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(79,70,229,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div>
                <label style={labelStyle}>Description <span style={{ color: "rgba(255,255,255,0.25)" }}>(Optional)</span></label>
                <textarea
                  placeholder="Add more details about your offer, schedule, experience level, etc."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-white font-bold text-sm transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
              >
                {loading ? "Posting..." : "Post Bid"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}