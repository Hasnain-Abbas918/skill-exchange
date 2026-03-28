"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    Promise.all([
      axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("/api/bids"),
      axios.get("/api/messages/conversations", { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([profileRes, bidsRes, convsRes]) => {
      setUser(profileRes.data.user);
      setBids(bidsRes.data.bids?.slice(0, 5) || []);
      setConversations(convsRes.data.conversations?.slice(0, 3) || []);
    }).catch(() => {
      router.push("/login");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-main)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">Here's what's happening in your skill network.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Bids", value: bids.length, icon: "📋", color: "#4f46e5" },
            { label: "Conversations", value: conversations.length, icon: "💬", color: "#06b6d4" },
            { label: "Skills Offered", value: user?.skillsOffered?.split(",").filter(Boolean).length || 0, icon: "🎓", color: "#8b5cf6" },
            { label: "Skills Wanted", value: user?.skillsWanted?.split(",").filter(Boolean).length || 0, icon: "📚", color: "#10b981" },
          ].map(card => (
            <div key={card.label} className="rounded-2xl p-5 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-white/40 text-xs mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { href: "/create-bid", icon: "＋", label: "Post a Skill Bid", desc: "Share what you offer and want", color: "#4f46e5" },
            { href: "/browse", icon: "⌕", label: "Browse Skills", desc: "Find skill exchange partners", color: "#06b6d4" },
            { href: "/messages", icon: "✉", label: "Messages", desc: `${conversations.filter((c: any) => c.unreadCount > 0).length} unread conversations`, color: "#8b5cf6" },
          ].map(action => (
            <Link key={action.href} href={action.href}
              className="rounded-2xl p-5 border transition hover:scale-[1.02]"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl mb-3"
                style={{ background: `${action.color}25` }}>
                {action.icon}
              </div>
              <p className="text-white font-bold text-sm">{action.label}</p>
              <p className="text-white/40 text-xs mt-1">{action.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Bids */}
        <div className="rounded-2xl p-6 border mb-6" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-white font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Recent Bids</h2>
            <Link href="/browse" className="text-indigo-400 hover:text-indigo-300 text-sm">View all →</Link>
          </div>
          {bids.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No bids yet. <Link href="/create-bid" className="text-indigo-400">Create one →</Link></p>
          ) : (
            <div className="space-y-3">
              {bids.map(bid => (
                <div key={bid.id} className="flex items-center justify-between rounded-xl px-4 py-3 border"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-white text-sm font-medium">{bid.title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{bid.skillOffered} ↔ {bid.skillWanted}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>
                    {bid.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-white font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Recent Messages</h2>
              <Link href="/messages" className="text-indigo-400 hover:text-indigo-300 text-sm">View all →</Link>
            </div>
            <div className="space-y-3">
              {conversations.map((conv: any) => (
                <Link key={conv.user.id} href={`/messages?userId=${conv.user.id}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 border transition hover:border-white/15"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                    {conv.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{conv.user.name}</p>
                    <p className="text-white/40 text-xs truncate">{conv.lastMessage.content}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#4f46e5" }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}