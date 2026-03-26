"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

// Skill categories with colors
const SKILL_SHAPES = [
  { label: "All", color: "#6366f1", icon: "∞" },
  { label: "Programming", color: "#06b6d4", icon: "{ }" },
  { label: "Design", color: "#8b5cf6", icon: "◈" },
  { label: "Music", color: "#f59e0b", icon: "♪" },
  { label: "Language", color: "#10b981", icon: "Aa" },
  { label: "Photography", color: "#ef4444", icon: "⊙" },
  { label: "Writing", color: "#ec4899", icon: "✍" },
  { label: "Marketing", color: "#f97316", icon: "↗" },
  { label: "Finance", color: "#84cc16", icon: "$" },
  { label: "Sports", color: "#14b8a6", icon: "⊕" },
  { label: "Cooking", color: "#fb923c", icon: "♨" },
  { label: "Other", color: "#94a3b8", icon: "◦" },
];

const matchCategory = (skill: string): string => {
  const s = skill.toLowerCase();
  if (/python|java|react|node|code|program|dev|web|app|sql|rust|go|swift/.test(s)) return "Programming";
  if (/design|ui|ux|figma|photoshop|illustrat|graphic/.test(s)) return "Design";
  if (/guitar|piano|sing|drum|music|violin|bass/.test(s)) return "Music";
  if (/english|spanish|french|urdu|arabic|mandarin|language/.test(s)) return "Language";
  if (/photo|camera|video|film/.test(s)) return "Photography";
  if (/writ|blog|content|copy|essay/.test(s)) return "Writing";
  if (/market|seo|social media|ads|brand/.test(s)) return "Marketing";
  if (/finance|invest|account|tax|trade/.test(s)) return "Finance";
  if (/sport|gym|yoga|fitness|football|basketball/.test(s)) return "Sports";
  if (/cook|bake|chef|recipe/.test(s)) return "Cooking";
  return "Other";
};

export default function BrowsePage() {
  const router = useRouter();
  const [bids, setBids] = useState<any[]>([]);
  const [filteredBids, setFilteredBids] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const res = await axios.get("/api/bids");
      setBids(res.data.bids);
      setFilteredBids(res.data.bids);
    } catch {
      toast.error("Failed to load bids.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let result = bids;
    if (activeCategory !== "All") {
      result = result.filter((bid) =>
        matchCategory(bid.skillOffered) === activeCategory ||
        matchCategory(bid.skillWanted) === activeCategory
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((bid) =>
        bid.title?.toLowerCase().includes(q) ||
        bid.skillOffered?.toLowerCase().includes(q) ||
        bid.skillWanted?.toLowerCase().includes(q)
      );
    }
    setFilteredBids(result);
  }, [search, activeCategory, bids]);

  const handleMessage = (userId: number) => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    router.push(`/messages?userId=${userId}`);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #162b3a 100%)" }}>
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                Browse Skills
              </h1>
              <p className="text-white/40 text-sm mt-0.5">{filteredBids.length} active skill exchanges</p>
            </div>
            {/* Search */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">⌕</span>
              <input
                type="text"
                placeholder="Search skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f1f5f9",
                  outline: "none",
                  width: "260px",
                }}
              />
            </div>
          </div>

          {/* Skill Shape Filter */}
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {SKILL_SHAPES.map((shape) => (
              <button
                key={shape.label}
                onClick={() => setActiveCategory(shape.label)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition"
                style={{
                  background: activeCategory === shape.label
                    ? shape.color
                    : "rgba(255,255,255,0.06)",
                  border: activeCategory === shape.label
                    ? "none"
                    : "1px solid rgba(255,255,255,0.1)",
                  color: activeCategory === shape.label ? "white" : "rgba(255,255,255,0.5)",
                  transform: activeCategory === shape.label ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: activeCategory === shape.label
                      ? "rgba(255,255,255,0.2)"
                      : `${shape.color}30`,
                    color: activeCategory === shape.label ? "white" : shape.color,
                  }}
                >
                  {shape.icon}
                </span>
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bid Grid */}
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : filteredBids.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-white/50 text-lg">No bids found</p>
              <p className="text-white/25 text-sm mt-2">Try a different category or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBids.map((bid) => {
                const catColor = SKILL_SHAPES.find(
                  (s) => s.label === matchCategory(bid.skillOffered)
                )?.color || "#6366f1";

                return (
                  <div
                    key={bid.id}
                    className="rounded-2xl p-5 border transition hover:border-white/15 group"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.07)",
                    }}
                  >
                    {/* Category badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: `${catColor}20`,
                          color: catColor,
                          border: `1px solid ${catColor}30`,
                        }}
                      >
                        {matchCategory(bid.skillOffered)}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                      >
                        ● Open
                      </span>
                    </div>

                    <h3 className="text-white font-bold text-base mb-3 line-clamp-2">{bid.title}</h3>

                    {/* Skill Exchange */}
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: "rgba(79,70,229,0.2)", color: "#a5b4fc" }}
                      >
                        🎯 {bid.skillOffered}
                      </span>
                      <span className="text-white/20 text-sm">⇄</span>
                      <span
                        className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}
                      >
                        📚 {bid.skillWanted}
                      </span>
                    </div>

                    {bid.description && (
                      <p className="text-white/35 text-xs mb-4 line-clamp-2 leading-relaxed">{bid.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      {/* User avatar */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: catColor + "70" }}
                        >
                          {bid.userName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-white/40 text-xs">{bid.userName || "Unknown"}</span>
                      </div>
                      <button
                        onClick={() => handleMessage(bid.userId)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                        style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)", color: "white" }}
                      >
                        Message
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}