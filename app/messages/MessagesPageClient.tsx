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

export default function MessagesPageClient() {
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

  // ✅ Auth + initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    axios
      .get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCurrentUser(res.data.user))
      .catch(() => router.push("/login"));

    loadConversations();
    fetchAllUsers();
  }, []);

  // ✅ Handle query param (safe now because of Suspense)
  useEffect(() => {
    const userId = searchParams.get("userId");

    if (userId && allUsers.length > 0) {
      const user = allUsers.find((u) => u.id === parseInt(userId));
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
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchAllUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  // ✅ Polling
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!selectedUser) return;

    setLoadingMessages(true);
    loadMessages(selectedUser.id).finally(() =>
      setLoadingMessages(false)
    );

    loadConversations();

    pollingRef.current = setInterval(() => {
      loadMessages(selectedUser.id);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedUser, loadMessages]);

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
    setNewMessage("");

    try {
      await axios.post(
        "/api/messages",
        {
          receiverId: selectedUser.id,
          content: msgContent,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadMessages(selectedUser.id);
      loadConversations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send.");
      setNewMessage(msgContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={currentUser} />

      <div className="flex flex-1">
        <div className="p-6 text-white">Messages UI Loaded ✅</div>
      </div>
    </div>
  );
}