"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

interface User {
  id: number;
  name: string;
  avatar?: string;
  email?: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string;
}

interface Conversation {
  user: User;
  lastMessage: { content: string; createdAt: string; senderId: number };
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load current user from API (not localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    axios.get("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCurrentUser(res.data.user))
      .catch(() => router.push("/login"));

    loadConversations();
    fetchAllUsers();
  }, []);

  // Auto-select user from URL param (e.g. /messages?userId=5)
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && allUsers.length > 0) {
      const user = allUsers.find(u => u.id === parseInt(userId));
      if (user) setSelectedUser(user);
    }
  }, [searchParams, allUsers]);

  const loadConversations = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingConvs(true);
    try {
      const res = await axios.get("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data.conversations || []);
    } catch {
      // silently fail
    } finally { setLoadingConvs(false); }
  };

  const fetchAllUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      setAllUsers(res.data.users || []);
    } catch {}
  };

  const loadMessages = useCallback(async (userId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`/api/messages?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch {}
  }, []);

  // Poll messages every 3 seconds when a conversation is selected
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!selectedUser) return;

    setLoadingMessages(true);
    loadMessages(selectedUser.id).finally(() => setLoadingMessages(false));
    loadConversations();

    pollingRef.current = setInterval(() => {
      loadMessages(selectedUser.id);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedUser, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setSending(true);
    const msgContent = newMessage.trim();
    setNewMessage(""); // Clear immediately for better UX

    try {
      await axios.post("/api/messages", {
        receiverId: selectedUser.id,
        content: msgContent,
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Reload messages and conversations
      await loadMessages(selectedUser.id);
      loadConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send.");
      setNewMessage(msgContent); // Restore on error
    } finally { setSending(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-main)" }}>
      <Sidebar user={currentUser} />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL — Conversation List */}
        <div className="flex flex-col border-r" style={{ width: "300px", flexShrink: 0, borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <h2 className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>Messages</h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold"
              title="Start new conversation"
            >
              + New
            </button>
          </div>

          {/* New Chat — User Search */}
          {showNewChat && (
            <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-white/40 text-xs mb-2">Select a user to message:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {allUsers.map(u => (
                  <button key={u.id} onClick={() => { setSelectedUser(u); setShowNewChat(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white/70 text-sm truncate">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-3xl mb-3">💬</div>
                <p className="text-white/30 text-sm">No conversations yet.</p>
                <p className="text-white/20 text-xs mt-1">Click "+ New" to start one.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.user.id}
                  onClick={() => setSelectedUser(conv.user)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition text-left"
                  style={{
                    background: selectedUser?.id === conv.user.id ? "rgba(79,70,229,0.15)" : "transparent",
                    borderLeft: selectedUser?.id === conv.user.id ? "3px solid #4f46e5" : "3px solid transparent",
                  }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                    {conv.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-white text-sm font-semibold truncate">{conv.user.name}</p>
                      <span className="text-white/30 text-xs flex-shrink-0 ml-1">{formatTime(conv.lastMessage.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-white/40 text-xs truncate flex-1">{conv.lastMessage.content}</p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#4f46e5" }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Chat Window */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-white font-bold text-lg mb-2">Select a Conversation</h3>
              <p className="text-white/30 text-sm">Choose from your conversations on the left, or start a new one.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selectedUser.name}</p>
                  <p className="text-white/30 text-xs">● Polling every 3s</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-white/30 text-xs">Live</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/30 text-sm">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const showDate = idx === 0 ||
                      formatDate(msg.createdAt) !== formatDate(messages[idx - 1].createdAt);

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-white/25 text-xs px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[70%]">
                            <div
                              className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
                              style={{
                                background: isMe
                                  ? "linear-gradient(135deg, #4f46e5, #06b6d4)"
                                  : "rgba(255,255,255,0.08)",
                                color: isMe ? "white" : "rgba(255,255,255,0.85)",
                                borderBottomRightRadius: isMe ? "4px" : "18px",
                                borderBottomLeftRadius: isMe ? "18px" : "4px",
                              }}
                            >
                              {msg.content}
                            </div>
                            <p className={`text-white/25 text-xs mt-1 ${isMe ? "text-right" : "text-left"}`}>
                              {formatTime(msg.createdAt)}
                              {isMe && msg.isRead && <span className="ml-1 text-indigo-400">✓✓</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type a message... (Enter to send)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#f1f5f9",
                    }}
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()}
                    className="px-5 py-3 rounded-xl text-white font-semibold text-sm transition disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}>
                    {sending ? "..." : "Send →"}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}