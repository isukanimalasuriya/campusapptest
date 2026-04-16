import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api.jsx";
import {
  ArrowLeft, Users, MessageSquare, FolderOpen, Megaphone,
  Send, Trash2, Plus, Link, FileText, Pin, Crown,
  Shield, Copy, Check, Globe, Lock, LogOut, UserPlus,
  Loader2, Paperclip, X, Reply, Image, File, Music,
  Video, Download, Calendar, Tag, AtSign, Hash,
} from "lucide-react";
import Navbar from "../Navbar";

const API_BASE = "/api";

// File helpers
const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileIcon = ({ fileType, size = 18 }) => {
  if (fileType === "image") return <Image size={size} />;
  if (fileType === "video") return <Video size={size} />;
  if (fileType === "audio") return <Music size={size} />;
  return <File size={size} />;
};

const FilePreview = ({ file, isOwn }) => {
  if (!file || !file.url) return null;

  const url = file.url;
  const name = file.originalName;
  const type = file.fileType;

  if (type === "image") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
        <img
          src={url}
          alt={name}
          className="max-w-[260px] max-h-[200px] rounded-xl object-cover mt-1"
        />
      </a>
    );
  }

  if (type === "video") {
    return (
      <video
        src={url}
        controls
        className="max-w-[260px] rounded-xl mt-1"
      />
    );
  }

  if (type === "audio") {
    return (
      <audio src={url} controls className="mt-1 max-w-[260px]" />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-xl border text-sm cursor-pointer transition ${
        isOwn
          ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      <FileIcon fileType={type} size={16} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium">{name}</p>
        <p className="text-xs opacity-60">{formatBytes(file.size)}</p>
      </div>
      <Download size={14} className="flex-shrink-0 opacity-70" />
    </a>
  );
};

// Reply preview bar
const ReplyBar = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-t border-indigo-100">
      <Reply size={14} className="text-indigo-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-indigo-600">
          {replyTo.sender?.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {replyTo.deleted
            ? "This message was deleted"
            : replyTo.file?.url
            ? replyTo.file.originalName
            : replyTo.content}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="p-1 rounded-full hover:bg-indigo-100 transition cursor-pointer"
      >
        <X size={14} className="text-indigo-500" />
      </button>
    </div>
  );
};

// Replied message preview inside a bubble
const ReplyPreview = ({ replyTo, isOwn }) => {
  if (!replyTo) return null;
  return (
    <div
      className={`text-xs rounded-lg px-2 py-1.5 mb-1.5 border-l-2 ${
        isOwn
          ? "bg-white/15 border-white/50 text-white/80"
          : "bg-gray-100 border-indigo-400 text-gray-500"
      }`}
    >
      <p className="font-semibold mb-0.5">
        {replyTo.sender?.name || "Unknown"}
      </p>
      <p className="truncate">
        {replyTo.deleted
          ? "Message deleted"
          : replyTo.file?.url
          ? replyTo.file.originalName
          : replyTo.content}
      </p>
    </div>
  );
};

// Main component
const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let currentUserId = null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    currentUserId = payload.sub;
  } catch {
    navigate("/");
  }

  // State
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const typingPollRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMarkingRead = useRef(false);

  // Resources
  const [resources, setResources] = useState([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "", description: "", type: "link", url: "", content: "",
  });

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "", content: "", pinned: false,
  });

  const headers = { Authorization: `Bearer ${token}` };

  // Membership check
  const checkMembership = (grp) => {
    if (!grp || !currentUserId) return;
    const member = grp.members?.find(
      (m) => m.user?._id === currentUserId || m.user?.toString() === currentUserId
    );
    const creator =
      grp.creator?._id === currentUserId ||
      grp.creator?.toString() === currentUserId;
    setIsMember(!!member || creator);
    setIsAdmin(creator || member?.role === "admin");
  };

  // Fetch group
  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`${API_BASE}/groups/${id}`, { headers });
      setGroup(res.data.data);
      checkMembership(res.data.data);
    } catch (err) {
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  // Tab switching
  useEffect(() => {
    if (activeTab === "chat" && isMember) {
      fetchMessages();
      fetchMessageCount();
      startMessagePolling();
      startTypingPolling();
    } else {
      stopPolling();
    }
    if (activeTab === "resources" && isMember) fetchResources();
    if (activeTab === "announcements") {
      fetchAnnouncements();
      if (isMember) markRead();
    }
    return () => stopPolling();
  }, [activeTab, isMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeTab !== "chat") return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          markMessagesRead();
        }
      },
      { threshold: 0.5 }
    );
    
    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }
    
    return () => observer.disconnect();
  }, [activeTab, messages]);

  // Polling
  const startMessagePolling = () => {
    stopPolling();
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
  };

  const startTypingPolling = () => {
    typingPollRef.current = setInterval(async () => {
      try {
        const res = await API.get(`${API_BASE}/groups/${id}/typing`, { headers });
        setTypingUsers(
          (res.data.typingUsers || []).filter((u) => u.userId !== currentUserId)
        );
      } catch {}
    }, 1500);
  };

  const stopPolling = () => {
    clearInterval(pollIntervalRef.current);
    clearInterval(typingPollRef.current);
  };

  // Typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      axios
        .post(`${API_BASE}/groups/${id}/typing`, { typing: true }, { headers })
        .catch(() => {});
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        axios
          .post(`${API_BASE}/groups/${id}/typing`, { typing: false }, { headers })
          .catch(() => {});
      }
    }, 2000);
  };

  // Messages
  const fetchMessages = async () => {
    try {
      const res = await API.get(`${API_BASE}/groups/${id}/messages`, { headers });
      setMessages(res.data.data);
      
      // Mark messages as read when they're loaded
      if (activeTab === "chat") {
        await markMessagesRead();
      }
    } catch {}
  };

  const markMessagesRead = async () => {
  // Prevent multiple simultaneous calls
  if (isMarkingRead.current) return;
  
  try {
    isMarkingRead.current = true;
    await API.post(`${API_BASE}/groups/${id}/messages/read`, {}, { headers });
    await fetchMessageCount();
  } catch (err) {
    console.error("Failed to mark messages as read:", err);
  } finally {
    // Reset after a short delay to prevent rapid successive calls
    setTimeout(() => {
      isMarkingRead.current = false;
    }, 1000);
  }
};

  const fetchMessageCount = async () => {
    try {
      const res = await API.get(`${API_BASE}/groups/${id}/messages/count`, { headers });
      setMessageCount(res.data.count);
    } catch {}
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim() && !selectedFile) return;

  setSendingMsg(true);
  if (isTyping) {
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
    axios
      .post(`${API}/groups/${id}/typing`, { typing: false }, { headers })
      .catch(() => {});
  }

  try {
    const formData = new FormData();
    if (newMessage.trim()) formData.append("content", newMessage.trim());
    if (selectedFile) formData.append("file", selectedFile);
    if (replyTo) formData.append("replyTo", replyTo._id);

    await API.post(`${API_BASE}/groups/${id}/messages`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      },
    });

    setNewMessage("");
    setReplyTo(null);
    clearFile();
    await fetchMessages();
    await fetchMessageCount(); // This is already there, keep it
  } catch (err) {
    setError("Failed to send message");
  } finally {
    setSendingMsg(false);
    setUploadProgress(0);
  }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await API.delete(`${API_BASE}/groups/${id}/messages/${messageId}`, { headers });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deleted: true, content: "", file: null } : m
        )
      );
      setMessageCount((c) => Math.max(0, c - 1));
    } catch {
      setError("Failed to delete message");
    }
  };

  // Resources
  const fetchResources = async () => {
    try {
      const res = await API.get(`${API_BASE}/groups/${id}/resources`, { headers });
      setResources(res.data.data);
    } catch {}
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(
        `${API_BASE}/groups/${id}/resources`,
        resourceForm,
        { headers }
      );
      setResources((prev) => [res.data.data, ...prev]);
      setResourceForm({ title: "", description: "", type: "link", url: "", content: "" });
      setShowResourceForm(false);
    } catch {
      setError("Failed to add resource");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await API.delete(`${API_BASE}/groups/${id}/resources/${resourceId}`, { headers });
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch {
      setError("Failed to delete resource");
    }
  };

  // Announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await API.get(`${API_BASE}/groups/${id}/announcements`, { headers });
      setAnnouncements(res.data.data);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const markRead = async () => {
    try {
      await API.post(`${API_BASE}/groups/${id}/announcements/read`, {}, { headers });
      setUnreadCount(0);
    } catch {}
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(
        `${API_BASE}/groups/${id}/announcements`,
        announcementForm,
        { headers }
      );
      setAnnouncements((prev) => [res.data.data, ...prev]);
      setAnnouncementForm({ title: "", content: "", pinned: false });
      setShowAnnouncementForm(false);
    } catch {
      setError("Failed to create announcement");
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await API.delete(
        `${API_BASE}/groups/${id}/announcements/${announcementId}`,
        { headers }
      );
      setAnnouncements((prev) => prev.filter((a) => a._id !== announcementId));
    } catch {
      setError("Failed to delete announcement");
    }
  };

  // Join / Leave
  const handleJoin = async () => {
    if (!group?.inviteCode) return;
    setJoining(true);
    try {
      await API.post(
        `${API_BASE}/groups/join`,
        { inviteCode: group.inviteCode },
        { headers }
      );
      await fetchGroup();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    setLeaving(true);
    try {
      await API.post(`${API_BASE}/groups/${id}/leave`, {}, { headers });
      navigate("/community");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave group");
    } finally {
      setLeaving(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tabs
  const tabs = [
    { key: "overview", label: "Overview", icon: Users },
    ...(isMember
      ? [
          {
            key: "chat",
            label: "Chat",
            icon: MessageSquare,
            badge: messageCount > 0 ? messageCount : null,
          },
          { key: "resources", label: "Resources", icon: FolderOpen },
        ]
      : []),
    {
      key: "announcements",
      label: "Announcements",
      icon: Megaphone,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-gray-500 text-sm font-medium">Loading group...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-200 flex items-center justify-center">
              <Users size={48} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4 text-lg">Group not found</p>
            <button
              onClick={() => navigate("/community")}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg cursor-pointer font-medium"
            >
              Back to Community
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 pb-8">

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm flex justify-between items-center animate-slideDown">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {error}
              </span>
              <button onClick={() => setError("")} className="hover:bg-red-100 p-1 rounded-lg transition cursor-pointer">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Hero Header */}
          <section className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <button
              onClick={() => navigate("/community")}
              className="relative flex items-center gap-2 text-white/70 hover:text-white text-sm mb-5 transition cursor-pointer group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-1 transition" /> Back to Community
            </button>

            <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {group.isPublic
                    ? <Globe size={14} className="text-green-300" />
                    : <Lock size={14} className="text-white/50" />}
                  <span className="text-white/70 text-xs uppercase tracking-wider font-medium">
                    {group.category}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                  {group.name}
                </h1>
                <p className="text-white/80 mt-3 text-sm leading-relaxed max-w-xl">
                  {group.description || "No description provided"}
                </p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-white/20 font-medium backdrop-blur-sm">
                    <Hash size={12} className="inline mr-1" />
                    {group.course}
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-white/20 font-medium backdrop-blur-sm">
                    <Tag size={12} className="inline mr-1" />
                    {group.topic}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[220px]">
                {isMember && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3">
                    <p className="text-white/60 text-xs mb-1 flex items-center gap-1">
                      <AtSign size={10} /> Invite Code
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold tracking-widest">
                        {group.inviteCode}
                      </span>
                      <button
                        onClick={copyInviteCode}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {!isMember && group.isPublic && (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-white/90 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-lg"
                  >
                    {joining
                      ? <><Loader2 size={16} className="animate-spin" /> Joining...</>
                      : <><UserPlus size={16} /> Join Group</>}
                  </button>
                )}

                {isMember &&
                  group.creator?._id !== currentUserId &&
                  group.creator?.toString() !== currentUserId && (
                    <button
                      onClick={handleLeave}
                      disabled={leaving}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-red-500/30 hover:border-red-400 active:scale-95 transition-all cursor-pointer disabled:opacity-60 text-sm"
                    >
                      {leaving
                        ? <><Loader2 size={14} className="animate-spin" /> Leaving...</>
                        : <><LogOut size={14} /> Leave Group</>}
                    </button>
                  )}
              </div>
            </div>

            {/* Stats */}
            <div className="relative mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
                <span className="text-sm text-white/80 flex items-center gap-2">
                  <Users size={16} /> Members
                </span>
                <span className="font-bold text-xl">
                  {group.members?.length} <span className="text-sm">/ {group.maxMembers}</span>
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
                <span className="text-sm text-white/80 flex items-center gap-2">
                  <MessageSquare size={16} /> Messages
                </span>
                <span className="font-bold text-xl">{messageCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
                <span className="text-sm text-white/80 flex items-center gap-2">
                  <Calendar size={16} /> Created
                </span>
                <span className="font-medium text-sm">
                  {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {!isMember && (
              <div className="relative mt-4 text-center text-xs text-white/70 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
                Preview mode — join to access chat and resources
              </div>
            )}
          </section>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
              {tabs.map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 cursor-pointer ${
                    activeTab === key
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {badge && (
                    <span className="ml-1.5 min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="p-6">
                {isMember ? (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Members ({group.members?.length})
                      </h3>
                      <div className="text-xs text-gray-400">
                        {group.members?.filter(m => m.role === "admin").length} admins
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.members?.map((member) => {
                        const isCreator =
                          group.creator?._id === member.user?._id ||
                          group.creator?.toString() === member.user?._id;
                        return (
                          <div
                            key={member._id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                {member.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {member.user?.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {member.user?.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isCreator && (
                                <Crown size={14} className="text-yellow-500" />
                              )}
                              {!isCreator && member.role === "admin" && (
                                <Shield size={14} className="text-indigo-500" />
                              )}
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  isCreator
                                    ? "bg-yellow-50 text-yellow-700"
                                    : member.role === "admin"
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {isCreator ? "Creator" : member.role}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
                      <Users size={36} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-700 font-semibold text-lg">
                      {group.members?.length} member{group.members?.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Join to see who is in it and start collaborating
                    </p>
                    {group.isPublic && (
                      <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="mt-6 px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm cursor-pointer active:scale-95 flex items-center gap-2 mx-auto shadow-md"
                      >
                        <UserPlus size={16} />
                        {joining ? "Joining..." : "Join Group"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && isMember && (
              <div className="flex flex-col h-[600px] bg-gray-50">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                        <MessageSquare size={32} className="text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isOwn =
                      msg.sender?._id === currentUserId ||
                      msg.sender?.toString() === currentUserId;

                    if (msg.deleted) {
                      return (
                        <div
                          key={msg._id}
                          className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                          <div
                            className={`px-4 py-2 rounded-2xl text-xs italic text-gray-400 border border-dashed border-gray-200 ${
                              isOwn ? "rounded-tr-sm" : "rounded-tl-sm"
                            }`}
                          >
                            This message was deleted
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                          {msg.sender?.name?.[0]?.toUpperCase() || "?"}
                        </div>

                        <div
                          className={`max-w-[70%] flex flex-col ${
                            isOwn ? "items-end" : "items-start"
                          }`}
                        >
                          <span className="text-xs text-gray-500 mb-1 px-1">
                            {msg.sender?.name}
                          </span>

                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isOwn
                                ? "bg-indigo-600 text-white rounded-tr-sm"
                                : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                            }`}
                          >
                            {/* Reply preview */}
                            {msg.replyTo && (
                              <ReplyPreview replyTo={msg.replyTo} isOwn={isOwn} />
                            )}

                            {/* Text */}
                            {msg.content && (
                              <p className="break-words">{msg.content}</p>
                            )}

                            {/* File */}
                            {msg.file?.url && (
                              <FilePreview file={msg.file} isOwn={isOwn} />
                            )}
                          </div>

                          <span className="text-xs text-gray-400 mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Actions on hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 self-center transition-all">
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-300 transition cursor-pointer shadow-sm"
                          >
                            <Reply size={12} />
                          </button>
                          {(isOwn || isAdmin) && (
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-300 transition cursor-pointer shadow-sm"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex gap-2 items-end">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                        {typingUsers[0]?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">
                            {typingUsers.map((u) => u.name).join(", ")} is typing
                          </span>
                          <span className="flex gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* File selected preview bar */}
                {selectedFile && (
                  <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-3">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="preview"
                        className="w-12 h-12 rounded-lg object-cover border border-indigo-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <File size={20} className="text-indigo-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-20">
                        <div className="h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-center text-indigo-600 mt-0.5">
                          {uploadProgress}%
                        </p>
                      </div>
                    )}
                    <button
                      onClick={clearFile}
                      className="p-1.5 rounded-full hover:bg-indigo-200 transition cursor-pointer"
                    >
                      <X size={14} className="text-indigo-500" />
                    </button>
                  </div>
                )}

                {/* Reply bar */}
                <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />

                {/* Input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    {/* File attach */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer flex-shrink-0"
                    >
                      <Paperclip size={18} />
                    </button>

                    <input
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-gray-50 focus:bg-white"
                    />

                    <button
                      type="submit"
                      disabled={sendingMsg || (!newMessage.trim() && !selectedFile)}
                      className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition disabled:opacity-40 cursor-pointer active:scale-95 shadow-md flex-shrink-0"
                    >
                      {sendingMsg
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Send size={16} />}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === "resources" && isMember && (
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 text-lg">Shared Resources</h3>
                  <button
                    onClick={() => setShowResourceForm(!showResourceForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition cursor-pointer active:scale-95 shadow-md"
                  >
                    <Plus size={16} /> Add Resource
                  </button>
                </div>

                {showResourceForm && (
                  <form
                    onSubmit={handleAddResource}
                    className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3"
                  >
                    <input
                      required
                      placeholder="Title *"
                      value={resourceForm.title}
                      onChange={(e) =>
                        setResourceForm({ ...resourceForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <input
                      placeholder="Description (optional)"
                      value={resourceForm.description}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <div className="flex gap-2">
                      <select
                        value={resourceForm.type}
                        onChange={(e) =>
                          setResourceForm({ ...resourceForm, type: e.target.value })
                        }
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
                      >
                        <option value="link">Link</option>
                        <option value="note">Note</option>
                      </select>
                      {resourceForm.type === "link" ? (
                        <input
                          placeholder="https://..."
                          value={resourceForm.url}
                          onChange={(e) =>
                            setResourceForm({ ...resourceForm, url: e.target.value })
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        />
                      ) : (
                        <textarea
                          placeholder="Write your note..."
                          value={resourceForm.content}
                          onChange={(e) =>
                            setResourceForm({
                              ...resourceForm,
                              content: e.target.value,
                            })
                          }
                          rows={3}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowResourceForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {resources.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No resources yet. Be the first to share!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resources.map((r) => (
                      <div
                        key={r._id}
                        className="flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-indigo-50 flex-shrink-0">
                            {r.fileType === "image" ? (
                              <Image size={16} className="text-indigo-600" />
                            ) : r.fileType === "video" ? (
                              <Video size={16} className="text-purple-600" />
                            ) : r.fileType === "audio" ? (
                              <Music size={16} className="text-pink-600" />
                            ) : r.type === "link" ? (
                              <Link size={16} className="text-indigo-600" />
                            ) : (
                              <FileText size={16} className="text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {r.title}
                            </p>
                            {r.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {r.description}
                              </p>
                            )}
                            {r.url && (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-500 hover:underline mt-1 inline-block truncate max-w-xs"
                              >
                                {r.url}
                              </a>
                            )}
                            {r.content && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {r.content}
                              </p>
                            )}
                            {r.size && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {formatBytes(r.size)}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5">
                              by {r.uploadedBy?.name}
                              {r.sourceMessage && (
                                <span className="ml-1 text-indigo-400">
                                  via chat
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {(r.uploadedBy?._id === currentUserId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteResource(r._id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === "announcements" && (
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg">Announcements</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition cursor-pointer active:scale-95 shadow-md"
                    >
                      <Plus size={16} /> Post
                    </button>
                  )}
                </div>

                {!isMember && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-3 text-sm text-indigo-700 flex items-center gap-2">
                    <Megaphone size={14} />
                    Join the group to stay updated with the latest announcements.
                  </div>
                )}

                {showAnnouncementForm && isAdmin && (
                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3"
                  >
                    <input
                      required
                      placeholder="Announcement title *"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <textarea
                      required
                      placeholder="Write your announcement..."
                      value={announcementForm.content}
                      onChange={(e) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          content: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.pinned}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            pinned: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      Pin this announcement
                    </label>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAnnouncementForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Post
                      </button>
                    </div>
                  </form>
                )}

                {announcements.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No announcements yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a) => {
                      const isUnread = !a.readBy?.includes(currentUserId);
                      return (
                        <div
                          key={a._id}
                          className={`p-5 rounded-xl border transition-all group ${
                            a.pinned
                              ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                              : isUnread && isMember
                              ? "border-blue-200 bg-blue-50/30"
                              : "border-gray-100 bg-white hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              {a.pinned && (
                                <Pin size={14} className="text-indigo-500 flex-shrink-0" />
                              )}
                              {isUnread && isMember && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                              <h4 className="font-semibold text-gray-900 text-base">
                                {a.title}
                              </h4>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteAnnouncement(a._id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {a.content}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
                            <span>Posted by <strong className="text-gray-600">{a.author?.name}</strong></span>
                            <span>•</span>
                            <span>{new Date(a.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;