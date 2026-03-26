"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";
import { Suspense } from "react";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    fetchUsers(parsed);
  }, []);

  const fetchUsers = async (currentUser: any) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users);

      if (initialUserId) {
        const target = res.data.users.find(
          (u: any) => u.id === Number(initialUserId)
        );
        if (target) {
          setSelectedUser(target);
          await fetchMessages(target.id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`/api/messages?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsgs([...res.data.messages].reverse());
      setTimeout(
        () =>
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (err) {
      console.error(err);
    }
  };

  const selectUser = (u: any) => {
    setSelectedUser(u);
    fetchMessages(u.id);
  };

  const sendMessage = async () => {
    if (!content.trim() || !selectedUser) return;
    const token = localStorage.getItem("token");
    const msgContent = content.trim();
    setContent("");
    try {
      await axios.post(
        "/api/messages",
        { receiverId: selectedUser.id, content: msgContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages(selectedUser.id);
    } catch {
      toast.error("Failed to send message.");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#111827" }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#111827", color: "white" }}
      >
        Checking authentication...
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #111827 0%, #1e3a5f 60%, #162b3a 100%)",
      }}
    >
      <Sidebar user={user} />

      <main className="flex-1 flex overflow-hidden" style={{ height: "100vh" }}>
        <div
          className="w-72 flex flex-col border-r flex-shrink-0"
          style={{
            background: "rgba(0,0,0,0.2)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-white font-bold text-lg mb-3">Messages</h2>
            <input
              type="text"
              placeholder="Search people..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full px-4 py-2 rounded-xl text-sm"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f1f5f9",
                outline: "none",
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">
                No users found
              </p>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition"
                  style={{
                    background:
                      selectedUser?.id === u.id
                        ? "rgba(79,70,229,0.15)"
                        : "transparent",
                    borderLeft:
                      selectedUser?.id === u.id
                        ? "3px solid #4f46e5"
                        : "3px solid transparent",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #4f46e5, #06b6d4)",
                    }}
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      u.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {u.name}
                    </p>
                    <p className="text-white/30 text-xs truncate">
                      {u.skillsOffered || "No skills listed"}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-6xl mb-5">💬</div>
              <h3 className="text-white text-xl font-bold mb-2">
                Select a conversation
              </h3>
              <p className="text-white/30 text-sm">
                Choose a person to start chatting
              </p>
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-4 px-6 py-4 border-b flex-shrink-0"
                style={{
                  background: "rgba(0,0,0,0.15)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #4f46e5, #06b6d4)",
                  }}
                >
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      className="w-full h-full rounded-full object-cover"
                      alt=""
                    />
                  ) : (
                    selectedUser.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {selectedUser.name}
                  </p>
                  <p className="text-green-400 text-xs">● Online</p>
                </div>
                <button
                  onClick={() => fetchMessages(selectedUser.id)}
                  className="ml-auto text-white/30 hover:text-white/60 text-sm transition"
                >
                  ↺
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                {msgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-4xl mb-3">👋</div>
                    <p className="text-white/30 text-sm">
                      Start the conversation!
                    </p>
                  </div>
                ) : (
                  msgs.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        } gap-2`}
                      >
                        <div>
                          <div
                            className="px-4 py-2.5 rounded-2xl text-sm max-w-xs break-words"
                            style={
                              isMe
                                ? {
                                    background:
                                      "linear-gradient(135deg, #4f46e5, #4338ca)",
                                    color: "white",
                                    borderBottomRightRadius: "4px",
                                  }
                                : {
                                    background: "rgba(255,255,255,0.08)",
                                    color: "#e2e8f0",
                                    borderBottomLeftRadius: "4px",
                                  }
                            }
                          >
                            {msg.content}
                          </div>
                          <p
                            className="text-xs mt-1"
                            style={{
                              color: "rgba(255,255,255,0.2)",
                              textAlign: isMe ? "right" : "left",
                            }}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div
                className="flex items-center gap-3 px-6 py-4 border-t flex-shrink-0"
                style={{
                  background: "rgba(0,0,0,0.15)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.name}...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f1f5f9",
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!content.trim()}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base transition disabled:opacity-30"
                  style={{
                    background:
                      "linear-gradient(135deg, #4f46e5, #06b6d4)",
                  }}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}