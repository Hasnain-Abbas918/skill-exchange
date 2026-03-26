"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!userData || !token) { router.push("/login"); return; }
    const parsed = JSON.parse(userData);
    if (!parsed.isAdmin) { router.push("/dashboard"); return; }
    setUser(parsed);
    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    setLoading(true);
    try {
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [u, r, l] = await Promise.all([
        axios.get("/api/admin?type=users", h),
        axios.get("/api/admin?type=reports", h),
        axios.get("/api/admin?type=logs", h),
      ]);
      setUsers(u.data.users);
      setReports(r.data.reports);
      setLogs(l.data.logs);
    } catch { toast.error("Failed to load admin data."); }
    finally { setLoading(false); }
  };

  const banUser = async (userId: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete("/api/admin", { headers: { Authorization: `Bearer ${token}` }, data: { userId } });
      toast.success("User banned.");
      fetchData(token!);
    } catch { toast.error("Ban failed."); }
  };

  const TABS = [
    { key: "users", label: "Users", count: users.length },
    { key: "reports", label: "Reports", count: reports.length },
    { key: "logs", label: "Audit Logs", count: logs.length },
  ];

  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #162b3a 100%)" }}>
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            👑 Admin Panel
          </h1>
          <p className="text-white/40 text-sm mb-8">Manage users, reports, and audit logs</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  background: activeTab === tab.key
                    ? "linear-gradient(135deg, #4f46e5, #06b6d4)"
                    : "rgba(255,255,255,0.06)",
                  color: activeTab === tab.key ? "white" : "rgba(255,255,255,0.5)",
                  border: activeTab === tab.key ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {tab.label}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{
                    background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            className="rounded-2xl p-6 border"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
          >
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
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-xl px-5 py-4 border"
                          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                              style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
                            >
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
                            <button
                              onClick={() => banUser(u.id)}
                              className="text-xs px-4 py-2 rounded-xl font-semibold transition"
                              style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
                            >
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
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">✅</div>
                        <p className="text-white/30 text-sm">No reports</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-xl px-5 py-4 border"
                            style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.12)" }}
                          >
                            <p className="text-white font-medium text-sm">{r.reason}</p>
                            <p className="text-white/30 text-xs mt-2">
                              Reporter ID: {r.reporterId} → Reported ID: {r.reportedUserId}
                            </p>
                            <span className="mt-2 inline-block text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                              {r.status}
                            </span>
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
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-4 rounded-xl px-5 py-3 border"
                          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
                        >
                          <span
                            className="text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap"
                            style={{ background: "rgba(79,70,229,0.2)", color: "#a5b4fc" }}
                          >
                            {log.action}
                          </span>
                          <p className="text-white/50 text-sm flex-1">{log.details}</p>
                          <p className="text-white/20 text-xs whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}