"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "⊞", label: "Dashboard" },
  { href: "/browse", icon: "⌕", label: "Browse Skills" },
  { href: "/create-bid", icon: "＋", label: "Post a Bid" },
  { href: "/messages", icon: "✉", label: "Messages" },
  { href: "/profile", icon: "◉", label: "Profile" },
  { href: "/settings", icon: "⚙", label: "Settings" },
];

interface SidebarProps {
  user: { name: string; email: string; avatar?: string; isAdmin?: boolean } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      router.push("/");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
    }
  };

  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-300 z-50"
      style={{
        width: collapsed ? "72px" : "240px",
        background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
        >
          S
        </div>
        {!collapsed && (
          <span
            className="font-bold text-lg text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            SkillSwap
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-white/40 hover:text-white/80 transition text-xs"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : ""}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
              style={{
                background: isActive
                  ? "linear-gradient(90deg, rgba(79,70,229,0.3), rgba(6,182,212,0.15))"
                  : "transparent",
                borderLeft: isActive ? "3px solid #4f46e5" : "3px solid transparent",
                color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }
              }}
            >
              <span className="text-lg flex-shrink-0 w-5 text-center">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {/* Badge for Post a Bid */}
              {item.href === "/create-bid" && !collapsed && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ background: "rgba(79,70,229,0.3)", color: "#a5b4fc" }}
                >
                  New
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Link — only for admins */}
        {user?.isAdmin && (
          <Link
            href="/admin"
            title={collapsed ? "Admin Panel" : ""}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: pathname.startsWith("/admin")
                ? "rgba(239,68,68,0.15)"
                : "transparent",
              color: pathname.startsWith("/admin") ? "#fca5a5" : "rgba(255,255,255,0.5)",
            }}
          >
            <span className="text-lg flex-shrink-0 w-5 text-center">👑</span>
            {!collapsed && <span className="text-sm font-medium">Admin Panel</span>}
          </Link>
        )}
      </nav>

      {/* User Profile at Bottom */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
              >
                {initial}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "User"}</p>
              <p className="text-xs text-white/40 truncate">{user?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-red-400 transition text-sm flex-shrink-0"
              title="Logout"
            >
              ⏻
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}