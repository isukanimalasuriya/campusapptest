import React, { useEffect, useState } from "react";
import API from "../api.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const categoryMeta = {
  "Account Access":  { icon: "🔒", iconBg: "bg-violet-100",  grad: "from-violet-500 to-purple-600"  },
  "Course Materials":{ icon: "📚", iconBg: "bg-blue-100",    grad: "from-blue-500 to-indigo-600"    },
  "Technical Issue": { icon: "⚙️", iconBg: "bg-amber-100",   grad: "from-amber-400 to-orange-500"   },
  "Billing":         { icon: "💳", iconBg: "bg-emerald-100", grad: "from-emerald-500 to-teal-600"   },
  "General Inquiry": { icon: "💬", iconBg: "bg-pink-100",    grad: "from-pink-500 to-rose-500"      },
};

const statusConfig = {
  active:    { label: "Active",    icon: "●", badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",     dot: "bg-amber-400",   statBg: "bg-gradient-to-br from-amber-50 to-orange-50",   statColor: "text-amber-600",   statBorder: "border-amber-200"  },
  resolved:  { label: "Resolved",  icon: "✓", badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300", dot: "bg-emerald-400", statBg: "bg-gradient-to-br from-emerald-50 to-teal-50",   statColor: "text-emerald-600", statBorder: "border-emerald-200"},
  escalated: { label: "Escalated", icon: "↑", badge: "bg-rose-100 text-rose-800 ring-1 ring-rose-300",         dot: "bg-rose-400",    statBg: "bg-gradient-to-br from-rose-50 to-pink-50",      statColor: "text-rose-600",    statBorder: "border-rose-200"  },
};

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem("token");
      if (!token) { toast.error("You must be logged in!"); setLoading(false); return; }
      try {
        const { data } = await API.get("/api/tickets/me");
        setTickets(data.tickets || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const firstUserText = (messages) => {
    const u = messages?.find((m) => m.role === "user");
    if (!u) return "No user message recorded.";
    return u.content.length > 110 ? `${u.content.slice(0, 110)}…` : u.content;
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm("Delete this conversation? This action cannot be undone.")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/api/tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      toast.success("Conversation deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete conversation");
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    all:       tickets.length,
    active:    tickets.filter(t => t.status === "active").length,
    resolved:  tickets.filter(t => t.status === "resolved").length,
    escalated: tickets.filter(t => t.status === "escalated").length,
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading sessions…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">CC</div>
            <div>
              <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">CampusCompanion · Support</p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">Support History</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm">All your previous AI support sessions in one place.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {/* Total */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4">
            <p className="text-2xl font-extrabold text-indigo-700">{counts.all}</p>
            <p className="text-xs font-semibold text-indigo-400 mt-0.5 uppercase tracking-wide">Total</p>
          </div>
          {/* Active / Resolved / Escalated */}
          {["active", "resolved", "escalated"].map((key) => {
            const cfg = statusConfig[key];
            return (
              <div key={key} className={`${cfg.statBg} border ${cfg.statBorder} rounded-2xl p-4`}>
                <p className={`text-2xl font-extrabold ${cfg.statColor}`}>{counts[key]}</p>
                <p className={`text-xs font-semibold mt-0.5 uppercase tracking-wide ${cfg.statColor} opacity-70`}>{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-1.5 mb-6 bg-white rounded-xl border border-slate-100 shadow-sm p-1 w-fit">
          {["all", "active", "resolved", "escalated"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              {f}
              {counts[f] > 0 && (
                <span className={`ml-1.5 ${filter === f ? "opacity-60" : "opacity-50"}`}>({counts[f]})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Ticket List ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-bold text-slate-700">{filter === "all" ? "No sessions yet" : `No ${filter} sessions`}</p>
            <p className="text-sm text-slate-400 mt-1">{filter === "all" ? "Start a support chat to see sessions here." : `You have no ${filter} tickets.`}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((ticket, i) => {
              const cfg = statusConfig[ticket.status] || statusConfig.active;
              const meta = categoryMeta[ticket.category] || { icon: "💬", iconBg: "bg-slate-100", grad: "from-slate-300 to-slate-400" };
              const date = new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const msgCount = ticket.messages?.length || 0;

              return (
                <div
                  key={ticket._id}
                  className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl ${meta.iconBg} flex items-center justify-center text-2xl shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{ticket.category}</p>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${cfg.badge}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mt-1 mb-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className="text-xs text-slate-400">{date}</span>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-slate-400">{msgCount} message{msgCount !== 1 ? "s" : ""}</span>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{firstUserText(ticket.messages)}</p>
                    </div>
                  </div>

                  {/* Bottom: gradient bar + delete */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className={`flex-1 h-0.5 rounded-full bg-gradient-to-r ${meta.grad} opacity-20 group-hover:opacity-60 transition-opacity`} />
                    <button
                      onClick={() => deleteTicket(ticket._id)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-700 border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all shrink-0"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={4000} toastClassName="rounded-xl shadow-lg text-sm font-medium" />
    </div>
  );
};

export default MyTickets;