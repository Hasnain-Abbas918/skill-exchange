"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

const CATEGORIES = [
  { key: "all", label: "All Skills", icon: "⚡" },
  { key: "tech", label: "Technology", icon: "💻" },
  { key: "design", label: "Design", icon: "🎨" },
  { key: "language", label: "Languages", icon: "🌍" },
  { key: "music", label: "Music", icon: "🎵" },
  { key: "cooking", label: "Cooking", icon: "🍳" },
  { key: "business", label: "Business", icon: "📊" },
  { key: "fitness", label: "Fitness", icon: "💪" },
];

const TECH_KEYWORDS = ["react", "python", "javascript", "node", "code", "dev", "design", "figma", "ui", "ux"];
const MUSIC_KEYWORDS = ["guitar", "piano", "music", "singing", "drum"];
const COOKING_KEYWORDS = ["cook", "bake", "food", "recipe", "chef"];
const BUSINESS_KEYWORDS = ["market", "seo", "sales", "finance", "business", "manage"];
const FITNESS_KEYWORDS = ["fitness", "yoga", "gym", "sport", "exercise"];
const LANGUAGE_KEYWORDS = ["english", "spanish", "french", "arabic", "urdu", "german", "chinese"];

function matchCategory(bid: any): string {
  const text = `${bid.skillOffered} ${bid.skillWanted} ${bid.title}`.toLowerCase();
  if (TECH_KEYWORDS.some(k => text.includes(k))) return "tech";
  if (MUSIC_KEYWORDS.some(k => text.includes(k))) return "music";
  if (COOKING_KEYWORDS.some(k => text.includes(k))) return "cooking";
  if (BUSINESS_KEYWORDS.some(k => text.includes(k))) return "business";
  if (FITNESS_KEYWORDS.some(k => text.includes(k))) return "fitness";
  if (LANGUAGE_KEYWORDS.some(k => text.includes(k))) return "language";
  return "all";
}

export default function BrowsePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ bids: any[]; users: any[]; skills: string[] }>({ bids: [], users: [], skills: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCurrentUser(res.data.user))
      .catch(() => router.push("/login"));

    axios.get("/api/bids")
      .then(res => setBids(res.data.bids || []))
      .catch(() => toast.error("Failed to load bids."))
      .finally(() => setLoading(false));
  }, []);

  // Debounced search suggestions
  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setSuggestions({ bids: [], users: [], skills: [] }); return; }
      setSearchLoading(true);
      try {
        const res = await axios.get(`/api/search?q=${encodeURIComponent(q)}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch {} finally { setSearchLoading(false); }
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchQuery(v);
    if (v.length >= 2) fetchSuggestions(v);
    else { setSuggestions({ bids: [], users: [], skills: [] }); setShowSuggestions(false); }
  };

  const handleSuggestionClick = (skill: string) => {
    setSearchQuery(skill);
    setShowSuggestions(false);
  };

  // Filter bids based on category + search
  const filteredBids = bids.filter(bid => {
    const matchesCat = category === "all" || matchCategory(bid) === category;
    const matchesSearch = !searchQuery ||
      bid.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.skillOffered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.skillWanted?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
      <Sidebar user={currentUser} />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Browse Skills</h1>
          <p className="text-white/40 text-sm">Find skill exchange partners from our community.</p>
        </div>

        {/* Search with Live Suggestions */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="🔍 Search skills, people, or topics..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full px-5 py-3.5 rounded-2xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#f1f5f9",
            }}
          />
          {searchLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.skills.length > 0 || suggestions.bids.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 shadow-2xl" style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}>
              {/* Skill tags */}
              {suggestions.skills.length > 0 && (
                <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.skills.map(skill => (
                      <button key={skill} onClick={() => handleSuggestionClick(skill)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition"
                        style={{ background: "rgba(79,70,229,0.2)", color: "#a5b4fc", border: "1px solid rgba(79,70,229,0.3)" }}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Bid suggestions */}
              {suggestions.bids.length > 0 && (
                <div className="p-4">
                  <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Matching Bids</p>
                  {suggestions.bids.slice(0, 3).map(bid => (
                    <button key={bid.id} onClick={() => handleSuggestionClick(bid.skillOffered)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition mb-1">
                      <p className="text-white/80 text-sm">{bid.title}</p>
                      <p className="text-white/40 text-xs">{bid.skillOffered} ↔ {bid.skillWanted}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat.key}
              onClick={() => setCategory(cat.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition"
              style={{
                background: category === cat.key ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.06)",
                color: category === cat.key ? "white" : "rgba(255,255,255,0.5)",
                border: category === cat.key ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}>
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-white/30 text-sm mb-4">{filteredBids.length} results{searchQuery ? ` for "${searchQuery}"` : ""}</p>

        {/* Bid Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-white font-bold text-lg mb-2">No Results Found</h3>
            <p className="text-white/40 text-sm">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBids.map(bid => (
              <div key={bid.id}
                className="rounded-2xl p-5 border transition hover:scale-[1.01] cursor-default"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                      {bid.userName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="text-white/60 text-xs">{bid.userName}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>
                    {bid.status}
                  </span>
                </div>
                <h3 className="text-white font-bold text-sm mb-3">{bid.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(79,70,229,0.15)", color: "#a5b4fc" }}>
                    🎓 {bid.skillOffered}
                  </span>
                  <span className="text-white/30 text-xs">↔</span>
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(6,182,212,0.1)", color: "#67e8f9" }}>
                    📚 {bid.skillWanted}
                  </span>
                </div>
                {bid.description && (
                  <p className="text-white/40 text-xs leading-relaxed mb-3 line-clamp-2">{bid.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-white/25 text-xs">{new Date(bid.createdAt).toLocaleDateString()}</span>
                  <a href={`/messages?userId=${bid.userId}`}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)", color: "white" }}>
                    Message →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}