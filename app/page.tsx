import Link from "next/link";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #0f1923 0%, #1a2744 50%, #0f2330 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
            style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
          >
            S
          </div>
          <span className="text-xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            SkillSwap
          </span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-white/60 hover:text-white font-medium px-4 py-2 rounded-lg transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-white font-semibold px-5 py-2 rounded-xl transition"
            style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col md:flex-row items-center justify-between px-10 md:px-24 py-20 gap-12">
        <div className="max-w-xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
            style={{
              background: "rgba(79,70,229,0.15)",
              borderColor: "rgba(79,70,229,0.3)",
              color: "#a5b4fc",
            }}
          >
            ⚡ 1,200+ Active Skill Exchanges
          </div>
          <h1
            className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Exchange
            <span
              style={{
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {" "}Your Skills,{" "}
            </span>
            Learn Together.
          </h1>
          <p className="text-white/60 text-lg mb-10 leading-relaxed">
            Teach what you know, learn what you want. No money, no subscriptions — just pure skill exchange. Join thousands building real skills together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="text-white font-bold px-8 py-4 rounded-xl text-center transition transform hover:scale-105 shadow-lg"
              style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
            >
              Start For Free
            </Link>
            <Link
              href="/browse"
              className="font-semibold px-8 py-4 rounded-xl text-center transition border"
              style={{
                background: "rgba(255,255,255,0.07)",
                borderColor: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              Browse Skills →
            </Link>
          </div>
          <p className="text-white/30 text-sm mt-5">Free forever · No credit card needed</p>
        </div>

        {/* Right Side - Stats Cards */}
        <div className="flex-1 grid grid-cols-2 gap-4 max-w-md">
          {[
            { icon: "🤝", title: "Skill Exchange", desc: "Trade skills directly — no money involved.", color: "#4f46e5" },
            { icon: "💬", title: "Real-Time Chat", desc: "Message your skill partners instantly.", color: "#06b6d4" },
            { icon: "🛡️", title: "Verified Profiles", desc: "Trusted community with ratings & reviews.", color: "#8b5cf6" },
            { icon: "🌍", title: "100% Free", desc: "No fees, no premium tiers — ever.", color: "#10b981" },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl p-5 border transition hover:border-white/20"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: `${card.color}20` }}
              >
                {card.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-white/20 text-sm border-t border-white/5">
        © 2025 SkillSwap · Built with Next.js · Free to use
      </footer>
    </main>
  );
}