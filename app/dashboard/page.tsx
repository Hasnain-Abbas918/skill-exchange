"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const QUICK_ACTIONS = [
  { href: "/browse", icon: "⌕", label: "Browse Skills", desc: "Find skill experts around you.", color: "#4f46e5" },
  { href: "/create-bid", icon: "＋", label: "Post a Bid", desc: "Offer your skill & request one.", color: "#06b6d4" },
  { href: "/messages", icon: "✉", label: "Messages", desc: "Chat with your skill partners.", color: "#8b5cf6" },
  { href: "/profile", icon: "◉", label: "Your Profile", desc: "Manage skills and bio.", color: "#10b981" },
  { href: "/settings", icon: "⚙", label: "Settings", desc: "Notifications, privacy & more.", color: "#f59e0b" },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));
  }, []);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1923" }}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #162b3a 100%)" }}>
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Dashboard
            </h1>
            <p className="text-white/40 text-sm mt-0.5">{greeting}, {user.name?.split(" ")[0]} 👋</p>
          </div>
          {/* Profile Avatar Top Right */}
          <Link href="/profile" className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full ring-2 ring-indigo-500/30 overflow-hidden flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{user.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-white/70 text-sm font-medium hidden md:block">{user.name}</span>
          </Link>
        </div>

        <div className="px-8 py-8">
          {/* Welcome Banner */}
          <div
            className="rounded-2xl p-6 mb-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)" }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
              style={{ background: "white", transform: "translate(30%, -30%)" }} />
            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Welcome to SkillSwap! 🚀
            </h2>
            <p className="text-white/70 text-sm mb-4">
              You have {user.skillsOffered ? "skills to offer" : "no skills listed yet"}. Start connecting!
            </p>
            <div className="flex gap-3">
              <Link
                href="/browse"
                className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
              >
                Browse Skills
              </Link>
              <Link
                href="/create-bid"
                className="bg-white text-indigo-600 text-sm font-semibold px-4 py-2 rounded-xl transition hover:bg-white/90"
              >
                + Post a Bid
              </Link>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-2xl p-5 border transition hover:border-white/20 hover:scale-105 transform group"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 transition"
                  style={{ background: `${action.color}20` }}
                >
                  {action.icon}
                </div>
                <p className="text-white font-semibold text-sm mb-1">{action.label}</p>
                <p className="text-white/35 text-xs leading-relaxed">{action.desc}</p>
              </Link>
            ))}
          </div>

          {/* Skills Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Skills I Can Teach",
                value: user.skillsOffered,
                icon: "🎯",
                color: "#06b6d4",
                empty: "No skills added yet",
              },
              {
                title: "Skills I Want to Learn",
                value: user.skillsWanted,
                icon: "📚",
                color: "#8b5cf6",
                empty: "No skills requested yet",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl p-5 border"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{card.icon}</span>
                  <span className="text-white/60 text-sm font-semibold">{card.title}</span>
                </div>
                {card.value ? (
                  <div className="flex flex-wrap gap-2">
                    {card.value.split(",").map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: `${card.color}20`, color: card.color, border: `1px solid ${card.color}30` }}
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white/20 text-sm">{card.empty}</span>
                    <Link href="/profile" className="text-indigo-400 text-xs hover:underline">
                      Add now →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}