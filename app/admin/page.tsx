"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

type TabKey = "users" | "reports" | "logs";
const TABS: { key: TabKey; label: string }[] = [
  { key: "users", label: "👥 Users" },
  { key: "reports", label: "🚨 Reports" },
  { key: "logs", label: "📋 Audit Logs" },
];

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.data.user.isAdmin) { toast.error("Admin access only."); router.push("/dashboard"); return; }
        setCurrentUser(res.data.user);
      }).catch(() => router.push("/login"));

    Promise.all([
      axios.get("/api/admin?type=users", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("/api/admin?type=reports", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("/api/admin?type=logs", { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([u, r, l]) => {
      setUsers(u.data.users || []);
      setReports(r.data.reports || []);
      setLogs(l.data.logs || []);
    }).catch(() => toast.error("Failed to load admin data."))
      .finally(() => setLoading(false));
  }, []);

  const banUser = async (userId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.delete("/api/admin", { data: { userId }, headers: { Authorization: `Bearer ${token}` } });
      toast.success("User banned.");
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: true } : u));
    } catch { toast.error("Failed to ban user."); }
  };

  const tabCount = { users: users.length, reports: reports.length, logs: logs.length };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-main)" }}>
      <Sidebar user={currentUser} />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>👑 Admin Panel</h1>
        <p className="text-white/40 text-sm mb-8">Manage users, reports, and audit logs.</p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{
                background: activeTab === tab.key ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "rgba(255,255,255,0.06)",
                color: activeTab === tab.key ? "white" : "rgba(255,255,255,0.5)",
                border: activeTab === tab.key ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}>
              {tab.label}
              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.15)" }}>
                {tabCount[tab.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "users" && (
                <div>
                  <h2 className="text-white font-bold mb-5">All Users ({users.length})</h2>
                  <div className="space-y-3">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between rounded-xl px-5 py-4 border"
                        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-semibold text-sm">{u.name}</p>
                              {u.isAdmin && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Admin</span>}
                              {u.isBanned && <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">Banned</span>}
                            </div>
                            <p className="text-white/30 text-xs">{u.email}</p>
                          </div>
                        </div>
                        {!u.isAdmin && !u.isBanned && (
                          <button onClick={() => banUser(u.id)}
                            className="text-xs px-4 py-2 rounded-xl font-semibold"
                            style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
                            Ban User
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "reports" && (
                <div>
                  <h2 className="text-white font-bold mb-5">Reports ({reports.length})</h2>
                  {reports.length === 0 ? (
                    <div className="text-center py-12"><div className="text-4xl mb-3">✅</div><p className="text-white/30 text-sm">No reports</p></div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map(r => (
                        <div key={r.id} className="rounded-xl px-5 py-4 border" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.12)" }}>
                          <p className="text-white font-medium text-sm">{r.reason}</p>
                          <p className="text-white/30 text-xs mt-2">Reporter: {r.reporterId} → Reported: {r.reportedUserId}</p>
                          <span className="mt-2 inline-block text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "logs" && (
                <div>
                  <h2 className="text-white font-bold mb-5">Audit Logs ({logs.length})</h2>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center gap-4 rounded-xl px-5 py-3 border"
                        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
                        <span className="text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap" style={{ background: "rgba(79,70,229,0.2)", color: "#a5b4fc" }}>{log.action}</span>
                        <p className="text-white/50 text-sm flex-1">{log.details}</p>
                        <p className="text-white/20 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}