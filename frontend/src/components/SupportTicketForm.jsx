import React, { useState, useEffect, useRef } from "react";
import API from "../api.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";

const categories = [
  { label: "Account Access",  icon: "🔒", desc: "Login issues, password reset, permissions",  grad: "from-violet-500 to-purple-600",   soft: "bg-violet-50  border-violet-200  hover:border-violet-400  hover:shadow-violet-100",  iconBg: "bg-violet-100",  arrow: "text-violet-300 group-hover:text-violet-500" },
  { label: "Course Materials", icon: "📚", desc: "Missing content, downloads, resources",       grad: "from-blue-500 to-indigo-600",     soft: "bg-blue-50    border-blue-200    hover:border-blue-400    hover:shadow-blue-100",    iconBg: "bg-blue-100",    arrow: "text-blue-300   group-hover:text-blue-500"   },
  { label: "Technical Issue",  icon: "⚙️", desc: "Bugs, errors, platform problems",             grad: "from-amber-400 to-orange-500",    soft: "bg-amber-50   border-amber-200   hover:border-amber-400   hover:shadow-amber-100",   iconBg: "bg-amber-100",   arrow: "text-amber-300  group-hover:text-amber-500"  },
  { label: "Billing",          icon: "💳", desc: "Payments, invoices, refunds",                 grad: "from-emerald-500 to-teal-600",    soft: "bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100", iconBg: "bg-emerald-100", arrow: "text-emerald-300 group-hover:text-emerald-500"},
  { label: "General Inquiry",  icon: "💬", desc: "Anything else on your mind",                  grad: "from-pink-500 to-rose-500",       soft: "bg-pink-50    border-pink-200    hover:border-pink-400    hover:shadow-pink-100",    iconBg: "bg-pink-100",    arrow: "text-pink-300   group-hover:text-pink-500"   },
];

const statusConfig = {
  active:    { label: "Active",    dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",     headerGrad: "from-amber-50 to-white",   headerBorder: "border-amber-100", icon: "●" },
  resolved:  { label: "Resolved",  dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300", headerGrad: "from-emerald-50 to-white", headerBorder: "border-emerald-100", icon: "✓" },
  escalated: { label: "Escalated", dot: "bg-rose-400",    badge: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",         headerGrad: "from-rose-50 to-white",    headerBorder: "border-rose-100", icon: "↑" },
};

const SupportTicketForm = () => {
  const { user, loading: userLoading } = useUser();
  const [view, setView] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("active");
  const [history, setHistory] = useState([]);
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const startChat = async (category) => {
    if (!user) { toast.error("Please sign in first."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/api/tickets/chat/start", { category });
      const ticket = res.data.ticket;
      setTicketId(ticket._id); setSelectedCategory(category); setMessages(ticket.messages || []); setStatus(ticket.status); setView("chat");
    } catch (err) { toast.error(err.response?.data?.message || "Unable to start session."); }
    finally { setLoading(false); }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const msg = inputMessage.trim();
    if (!msg || !ticketId || status !== "active") return;
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: msg, timestamp: new Date() }]);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/api/tickets/chat/message", { ticketId, message: msg });
      setMessages(res.data.ticket.messages); setStatus(res.data.ticket.status);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send."); }
    finally { setLoading(false); }
  };

  const updateStatus = async (newStatus) => {
    if (!ticketId || status !== "active") return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/api/tickets/chat/status", { ticketId, status: newStatus });
      setStatus(res.data.ticket.status);
      toast.success(newStatus === "resolved" ? "Issue marked as resolved." : "Ticket escalated to our team.");
      if (newStatus !== "active") setTimeout(() => setView("categories"), 1300);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update status."); }
    finally { setLoading(false); }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/tickets/me");
      setHistory(res.data.tickets || []); setView("history");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to load history."); }
    finally { setLoading(false); }
  };

  const deleteHistoryTicket = async (id) => {
    if (!window.confirm("Delete this conversation? This cannot be undone.")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/api/tickets/${id}`);
      setHistory((prev) => prev.filter((t) => t._id !== id));
      if (selectedHistoryTicket?._id === id) setSelectedHistoryTicket(null);
      toast.success("Conversation deleted.");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete."); }
    finally { setLoading(false); }
  };

  const resetChat = () => { setView("categories"); setSelectedCategory(""); setTicketId(null); setMessages([]); setInputMessage(""); setStatus("active"); };

  const selectedCat = categories.find(c => c.label === selectedCategory);

  if (userLoading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading your profile…</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Navbar />
      <div className="flex-1 overflow-y-auto">

        {/* ── Sticky Top Bar ── */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">CC</div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">Support Center</h1>
              <p className="text-[10px] text-slate-400 mt-0.5 tracking-wide">AI-Powered · CampusCompanion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view !== "history" && (
              <button onClick={loadHistory} className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-lg transition-colors">
                📋 History
              </button>
            )}
            {view !== "categories" && (
              <button onClick={resetChat} className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm">
                + New Issue
              </button>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10">

          {/* ══════════ CATEGORIES VIEW ══════════ */}
          {view === "categories" && (
            <div>
              <div className="mb-10">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 px-3 py-1.5 rounded-full mb-5 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> AI-Powered Support
                </span>
                <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
                  <span className="text-slate-900">How can we </span>
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">help you</span>
                  <span className="text-slate-900"> today?</span>
                </h2>
                <p className="text-slate-500 mt-3 text-base leading-relaxed">Pick a category and our AI assistant will jump right in.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {categories.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => startChat(cat.label)}
                    disabled={loading}
                    className={`group relative text-left border rounded-2xl p-5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg focus:outline-none ${cat.soft}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${cat.iconBg} flex items-center justify-center text-2xl shrink-0 shadow-sm`}>{cat.icon}</div>
                      <div>
                        <p className="font-bold text-slate-800">{cat.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{cat.desc}</p>
                      </div>
                    </div>
                    <span className={`absolute top-4 right-4 text-lg font-bold transition-all ${cat.arrow}`}>→</span>
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r ${cat.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </button>
                ))}
              </div>

              <button onClick={loadHistory} disabled={loading} className="w-full mt-2 py-3.5 border border-dashed border-slate-300 rounded-2xl text-sm font-medium text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all">
                View all past sessions →
              </button>
            </div>
          )}

          {/* ══════════ CHAT VIEW ══════════ */}
          {view === "chat" && (
            <div className="flex flex-col bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>

              {/* Chat Header */}
              <div className={`px-6 py-4 border-b ${statusConfig[status]?.headerBorder} bg-gradient-to-r ${statusConfig[status]?.headerGrad} flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm ${selectedCat?.iconBg || "bg-indigo-100"}`}>
                  {selectedCat?.icon || "🤖"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{selectedCategory}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${statusConfig[status]?.dot}`} />
                    <span className="text-xs text-slate-500">{statusConfig[status]?.label} · {user?.name}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusConfig[status]?.badge}`}>
                  {statusConfig[status]?.icon} {statusConfig[status]?.label}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gradient-to-b from-slate-50/60 to-white">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">AI</div>
                    )}
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-md"
                        : "bg-white text-slate-700 rounded-bl-md border border-slate-100"
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">AI</div>
                    <div className="bg-white border border-slate-100 px-5 py-3.5 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-violet-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 bg-white border-t border-slate-100">
                <form onSubmit={sendMessage} className="flex gap-2.5 mb-3">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={status !== "active" || loading}
                    placeholder={status === "active" ? "Describe your issue…" : "This session is closed."}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm px-4 py-3 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || status !== "active" || loading}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white text-sm font-bold px-5 py-3 rounded-xl disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 transition-all shadow-sm"
                  >
                    Send
                  </button>
                </form>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus("resolved")} disabled={status !== "active" || loading} className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 disabled:opacity-40 transition-all">
                    ✓ Mark Resolved
                  </button>
                  <button onClick={() => updateStatus("escalated")} disabled={status !== "active" || loading} className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 hover:from-rose-100 hover:to-pink-100 disabled:opacity-40 transition-all">
                    ↑ Escalate to Team
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ HISTORY VIEW ══════════ */}
          {view === "history" && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Past Sessions</h2>
                <p className="text-slate-400 text-sm mt-1">Review your previous support conversations.</p>
              </div>

              {selectedHistoryTicket ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
                    <button onClick={() => setSelectedHistoryTicket(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm shadow-sm transition-colors">←</button>
                    <div>
                      <p className="font-bold text-slate-900">{selectedHistoryTicket.category}</p>
                      <p className="text-xs text-slate-400">{new Date(selectedHistoryTicket.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                    <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${statusConfig[selectedHistoryTicket.status]?.badge}`}>
                      {statusConfig[selectedHistoryTicket.status]?.icon} {statusConfig[selectedHistoryTicket.status]?.label}
                    </span>
                    <button onClick={() => deleteHistoryTicket(selectedHistoryTicket._id)} className="ml-2 text-xs font-bold text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white">
                    {selectedHistoryTicket.messages?.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role !== "user" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">AI</div>
                        )}
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-md" : "bg-white text-slate-700 border border-slate-100 rounded-bl-md"}`}>
                          {msg.content}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="font-bold text-slate-700">No sessions yet</p>
                  <p className="text-sm text-slate-400 mt-1">Start a support chat to see history here.</p>
                  <button onClick={resetChat} className="mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
                    Get Help Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {history.map((ticket) => {
                    const cfg = statusConfig[ticket.status] || statusConfig.active;
                    const cat = categories.find(c => c.label === ticket.category);
                    return (
                      <button
                        key={ticket._id}
                        onClick={() => setSelectedHistoryTicket(ticket)}
                        className={`w-full text-left group rounded-2xl p-5 transition-all duration-200 border ${
                          selectedHistoryTicket?._id === ticket._id
                            ? "border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100"
                            : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className={`w-10 h-10 rounded-xl ${cat?.iconBg || "bg-slate-100"} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                              {cat?.icon || "💬"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{ticket.category}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                              <p className="text-sm text-slate-500 mt-1.5 truncate">{ticket.messages?.find(m => m.role === "user")?.content?.slice(0, 100) || "No user message"}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.icon} {cfg.label}</span>
                            <button onClick={(e) => { e.stopPropagation(); deleteHistoryTicket(ticket._id); }} className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors">
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                        <div className={`mt-4 h-0.5 rounded-full bg-gradient-to-r ${cat?.grad || "from-slate-200 to-slate-300"} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      <ToastContainer position="top-right" autoClose={4000} toastClassName="rounded-xl shadow-lg text-sm font-medium" />
    </div>
  );
};

export default SupportTicketForm;