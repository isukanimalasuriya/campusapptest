import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
  Lock,
  BookOpen,
  Wrench,
  CreditCard,
  MessageCircle,
  Inbox,
  Ticket,
  Trash2,
  RefreshCw,
} from "lucide-react";
import AdminNavbar from "./admin/AdminNavbar";
import "react-toastify/dist/ReactToastify.css";

// ─── helpers ────────────────────────────────────────────────────────────────
const API = "http://localhost:5000/api/admin";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const categoryMeta = {
  "Account Access":  { Icon: Lock,        iconBg: "bg-violet-100",  iconClass: "text-violet-600" },
  "Course Materials":{ Icon: BookOpen,    iconBg: "bg-blue-100",    iconClass: "text-blue-600" },
  "Technical Issue": { Icon: Wrench,      iconBg: "bg-amber-100",   iconClass: "text-amber-600" },
  "Billing":         { Icon: CreditCard,  iconBg: "bg-emerald-100", iconClass: "text-emerald-600" },
  "General Inquiry": { Icon: MessageCircle, iconBg: "bg-pink-100",    iconClass: "text-pink-600" },
};

const defaultCategoryMeta = { Icon: MessageCircle, iconBg: "bg-slate-100", iconClass: "text-slate-500" };

const statusCfg = {
  active:    { label: "Active",    dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",       row: "border-l-amber-400",   hdr: "from-amber-50"   },
  resolved:  { label: "Resolved",  dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300", row: "border-l-emerald-400", hdr: "from-emerald-50" },
  escalated: { label: "Escalated", dot: "bg-rose-400",    badge: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",         row: "border-l-rose-400",    hdr: "from-rose-50"    },
};

const FILTERS = ["all", "active", "escalated", "resolved"];

// ─── component ──────────────────────────────────────────────────────────────
const Adminticketdashboard = () => {
  const [tickets, setTickets]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("active"); // default: show unresolved
  const [selected, setSelected]           = useState(null);     // full ticket object
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply]                 = useState("");
  const [sending, setSending]             = useState(false);
  const bottomRef                         = useRef(null);

  // ── fetch list ──
  const fetchTickets = async (status = filter) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/tickets`, {
        params: { status },
        headers: authHeaders(),
      });
      setTickets(data.tickets || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(filter); }, [filter]);           // eslint-disable-line
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected?.messages]);

  // ── open detail ──
  const openTicket = async (id) => {
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`${API}/tickets/${id}`, { headers: authHeaders() });
      setSelected(data.ticket);
    } catch (err) {
      toast.error("Could not load ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── send admin reply ──
  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const { data } = await axios.post(
        `${API}/tickets/${selected._id}/reply`,
        { message: reply.trim() },
        { headers: authHeaders() }
      );
      setSelected(data.ticket);
      setReply("");
      // patch list preview
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticket._id ? { ...t, updatedAt: data.ticket.updatedAt } : t))
      );
      toast.success("Reply sent.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // ── change status (from detail panel) ──
  const changeStatus = async (newStatus) => {
    try {
      const { data } = await axios.patch(
        `${API}/tickets/${selected._id}/status`,
        { status: newStatus },
        { headers: authHeaders() }
      );
      setSelected(data.ticket);
      setTickets((prev) =>
        prev.map((t) => (t._id === data.ticket._id ? { ...t, status: data.ticket.status } : t))
      );
      toast.success(`Status → ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // ── delete ticket ──
  const deleteTicket = async (id) => {
    if (!window.confirm("Permanently delete this ticket?")) return;
    try {
      await axios.delete(`${API}/tickets/${id}`, { headers: authHeaders() });
      setTickets((prev) => prev.filter((t) => t._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success("Ticket deleted.");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // ── counts ──
  const counts = {
    all:       tickets.length, // counts only what's loaded for current filter
    active:    tickets.filter(t => t.status === "active").length,
    escalated: tickets.filter(t => t.status === "escalated").length,
    resolved:  tickets.filter(t => t.status === "resolved").length,
  };

  // ─── render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex flex-col">
      <AdminNavbar
        extraActions={
          <button
            type="button"
            onClick={() => fetchTickets(filter)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 bg-white px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      <div className="flex-1 flex flex-col min-h-0 max-w-7xl mx-auto w-full px-6 pt-4 pb-6">
        <div className="mb-4 shrink-0">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Support</p>
          <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Support Ticket Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Open a ticket on the left to view and reply.</p>
        </div>

        <div className="flex-1 flex gap-5 min-h-0">

        {/* ══ LEFT PANEL: ticket list ═════════════════════════════════════════ */}
        <div className="w-[380px] shrink-0 flex flex-col gap-4">

          {/* Filter tabs */}
          <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelected(null); }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                {f}
                {f !== "all" && (
                  <span className={`ml-1 opacity-60`}>
                    {filter === f ? "" : ""}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "active",    color: "text-amber-600",   bg: "bg-amber-50   border-amber-200"   },
              { key: "escalated", color: "text-rose-600",    bg: "bg-rose-50    border-rose-200"    },
              { key: "resolved",  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
            ].map(({ key, color, bg }) => (
              <div key={key} className={`${bg} border rounded-xl px-3 py-2.5 text-center`}>
                <p className={`text-xl font-extrabold ${color}`}>{counts[key]}</p>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${color} opacity-70`}>{key}</p>
              </div>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading tickets…</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                <div className="flex justify-center mb-3 text-slate-400">
                  <Inbox className="w-10 h-10" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold text-slate-600">No {filter !== "all" ? filter : ""} tickets</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const cfg  = statusCfg[ticket.status] || statusCfg.active;
                const meta = categoryMeta[ticket.category] || defaultCategoryMeta;
                const CatIcon = meta.Icon;
                const firstUser = ticket.messages?.find(m => m.role === "user")?.content;
                const isActive  = selected?._id === ticket._id;

                return (
                  <button
                    key={ticket._id}
                    onClick={() => openTicket(ticket._id)}
                    className={`w-full text-left rounded-xl border-l-4 p-4 transition-all ${cfg.row} ${
                      isActive
                        ? "bg-indigo-50 border-t border-r border-b border-t-indigo-200 border-r-indigo-200 border-b-indigo-200 shadow-md"
                        : "bg-white border-t border-r border-b border-t-slate-100 border-r-slate-100 border-b-slate-100 hover:shadow-md hover:border-t-indigo-200 hover:border-r-indigo-200 hover:border-b-indigo-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${meta.iconBg} flex items-center justify-center shrink-0`}>
                        <CatIcon className={`w-5 h-5 ${meta.iconClass}`} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-800 text-sm truncate">{ticket.category}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {ticket.user?.name || "Unknown"} · {new Date(ticket.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                        {firstUser && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{firstUser.slice(0, 80)}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══ RIGHT PANEL: ticket detail + reply ═════════════════════════════ */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">

          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading…</p>
            </div>
          ) : !selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-1">
                <Ticket className="w-8 h-8" strokeWidth={1.75} />
              </div>
              <p className="font-bold text-slate-700 text-lg">Select a ticket</p>
              <p className="text-sm text-slate-400 max-w-xs">Click any ticket on the left to view the conversation and reply as admin.</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              {(() => {
                const cfg  = statusCfg[selected.status] || statusCfg.active;
                const meta = categoryMeta[selected.category] || defaultCategoryMeta;
                const CatIcon = meta.Icon;
                return (
                  <div className={`px-6 py-4 border-b border-slate-100 bg-gradient-to-r ${cfg.hdr} to-white flex items-center gap-4`}>
                    <div className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                      <CatIcon className={`w-5 h-5 ${meta.iconClass}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{selected.category}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selected.user?.name} ({selected.user?.studentId || selected.user?.email}) · {new Date(selected.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {/* Status switcher */}
                    <div className="flex items-center gap-1.5">
                      {["active", "resolved", "escalated"].map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(s)}
                          disabled={selected.status === s}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all disabled:cursor-default ${
                            selected.status === s
                              ? statusCfg[s].badge + " scale-105 shadow-sm"
                              : "border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 bg-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => deleteTicket(selected._id)}
                        className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
                {selected.messages?.map((msg, idx) => {
                  const isAdmin = msg.role === "ai" && msg.content.startsWith("[Admin");
                  const isUser  = msg.role === "user";
                  return (
                    <div key={idx} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-sm ${
                          isAdmin ? "bg-gradient-to-br from-rose-400 to-pink-500" : "bg-gradient-to-br from-indigo-400 to-violet-500"
                        }`}>
                          {isAdmin ? "ADM" : "AI"}
                        </div>
                      )}
                      <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-md"
                          : isAdmin
                          ? "bg-gradient-to-br from-rose-50 to-pink-50 text-slate-700 border border-rose-100 rounded-bl-md"
                          : "bg-white text-slate-700 border border-slate-100 rounded-bl-md"
                      }`}>
                        {msg.content}
                      </div>
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                          {selected.user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Reply input */}
              <div className="px-6 py-4 border-t border-slate-100 bg-white">
                {selected.status !== "active" ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-slate-400">
                      This ticket is <strong>{selected.status}</strong>. Set status to <em>active</em> to reply.
                    </p>
                    <button
                      onClick={() => changeStatus("active")}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all ml-3 shrink-0"
                    >
                      Reopen
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <textarea
                      rows={2}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type your admin reply… (Enter to send)"
                      className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm px-4 py-3 rounded-xl outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none transition-all"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim() || sending}
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white text-sm font-bold px-5 rounded-xl disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 transition-all shadow-sm self-stretch"
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3500} toastClassName="rounded-xl shadow-lg text-sm font-medium" />
    </div>
  );
};

export default Adminticketdashboard;