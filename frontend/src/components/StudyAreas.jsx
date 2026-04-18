import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import API, { SOCKET_ORIGIN } from "../api.jsx";
import {
  MapPin,
  Users,
  Table2,
  ArrowLeft,
  Clock,
  LogOut,
  Search,
  ChevronDown,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const socket = io(SOCKET_ORIGIN);

function getStatusLabel(status) {
  if (status === "AVAILABLE") return { label: "Available", color: "available" };
  if (status === "NEARLY_FULL")
    return { label: "Nearly Full", color: "nearly-full" };
  return { label: "Full", color: "full" };
}

function RingProgress({ value, max, size = 48, stroke = 4 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? value / max : 0;
  const dash = circ * pct;
  const color = pct > 0.5 ? "#22c55e" : pct > 0.2 ? "#eab308" : "#ef4444";
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

function ElapsedTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const calc = () =>
      setElapsed(
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000),
      );
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [startedAt]);
  const h = Math.floor(elapsed / 60),
    m = elapsed % 60;
  return <span>{h > 0 ? `${h}h ${m}m` : `${m}m`}</span>;
}

/* ─── Styles ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .sa-root *, .sa-root *::before, .sa-root *::after { box-sizing: border-box; }
  .sa-root {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f5;
    min-height: 100vh;
    display: flex;
  }

  /* ── Layout shell ── */
  .sa-shell {
    /* Desktop: offset by sidebar width */
    margin-left: 256px;
    flex: 1;
    min-width: 0;
    transition: margin-left .3s;
  }
  .sa-page {
    padding: 40px 36px;
    max-width: 1160px;
    margin: 0 auto;
  }

  /* ── status badges ── */
  .badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; flex-shrink:0; }
  .badge-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .badge.available { background:#dcfce7; color:#15803d; }
  .badge.available .badge-dot { background:#22c55e; box-shadow:0 0 0 3px #86efac; animation:pulse-green 2s infinite; }
  .badge.nearly-full { background:#fef9c3; color:#a16207; }
  .badge.nearly-full .badge-dot { background:#eab308; }
  .badge.full { background:#fee2e2; color:#b91c1c; }
  .badge.full .badge-dot { background:#ef4444; }
  @keyframes pulse-green {
    0%,100% { box-shadow: 0 0 0 0 #86efac; }
    50% { box-shadow: 0 0 0 4px transparent; }
  }

  /* ── active session banner ── */
  .active-banner {
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .active-banner-label { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#16a34a; margin-bottom:4px; }
  .active-banner-title { font-size:17px; font-weight:700; color:#111827; }
  .active-banner-meta { display:flex; align-items:center; gap:16px; margin-top:6px; font-size:13px; color:#6b7280; flex-wrap:wrap; }
  .active-banner-meta span { display:flex; align-items:center; gap:5px; }

  /* ── page header ── */
  .sa-page-title { font-size:26px; font-weight:800; color:#111827; margin-bottom:4px; }
  .sa-page-subtitle { font-size:14px; color:#6b7280; margin-bottom:24px; }
  .campus-stat { font-weight:600; color:#111827; }

  /* ── search ── */
  .search-wrap { position:relative; max-width:360px; margin-bottom:24px; }
  .search-wrap svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#9ca3af; pointer-events:none; }
  .search-input {
    width:100%; padding:10px 14px 10px 40px;
    border-radius:12px; border:1.5px solid #e5e7eb;
    background:#fff; font-family:'DM Sans',sans-serif;
    font-size:14px; color:#111; outline:none; transition:border-color .2s;
  }
  .search-input:focus { border-color:#6366f1; }
  .search-input::placeholder { color:#9ca3af; }

  /* ── spaces grid ── */
  .spaces-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
  .space-card {
    background:#fff; border:1.5px solid #e5e7eb; border-radius:20px;
    padding:20px; cursor:pointer;
    transition:transform .18s ease, box-shadow .18s ease, border-color .18s;
  }
  .space-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.1); border-color:#c7d2fe; }
  .space-card-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:8px; }
  .space-card-name { font-size:16px; font-weight:700; color:#111827; }
  .space-card-location { display:flex; align-items:center; gap:5px; font-size:13px; color:#6b7280; margin-bottom:14px; }
  .space-card-seats { display:flex; align-items:center; gap:12px; }
  .space-seats-num { font-size:30px; font-weight:700; color:#111827; line-height:1; }
  .space-seats-label { font-size:12px; color:#6b7280; margin-top:2px; }
  .space-table-info { display:flex; gap:8px; margin-top:10px; font-size:12px; color:#6b7280; flex-wrap:wrap; }
  .space-table-info span { background:#f3f4f6; padding:3px 9px; border-radius:999px; }

  /* ── tables view ── */
  .back-btn {
    display:inline-flex; align-items:center; gap:6px;
    font-size:13px; color:#6b7280; font-weight:500;
    background:none; border:none; cursor:pointer; padding:4px 0;
    transition:color .15s; font-family:'DM Sans',sans-serif;
  }
  .back-btn:hover { color:#111; }
  .tables-header-row {
    display:flex; justify-content:space-between; align-items:flex-start;
    margin-top:8px; gap:12px; flex-wrap:wrap;
  }
  .tables-space-title { font-size:24px; font-weight:800; color:#111827; }
  .tables-space-location { display:flex; align-items:center; gap:5px; font-size:13px; color:#6b7280; margin-bottom:16px; }
  .tables-seats-row { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .tables-seats-num { font-size:34px; font-weight:800; color:#111827; }
  .tables-seats-label { font-size:13px; color:#6b7280; }
  .tables-section-title { font-size:15px; font-weight:700; color:#374151; margin-bottom:14px; }
  .tables-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px; }

  /* ── table card ── */
  .table-card {
    background:#fff; border:1.5px solid #e5e7eb; border-radius:14px;
    padding:16px; cursor:pointer; text-align:center;
    transition:border-color .15s, background .15s, box-shadow .15s;
    position:relative;
  }
  .table-card:hover:not(.table-card--disabled) { border-color:#a5b4fc; box-shadow:0 4px 12px rgba(99,102,241,.1); }
  .table-card--selected { border-color:#6366f1 !important; background:#eef2ff; box-shadow:0 0 0 3px rgba(99,102,241,.15); }
  .table-card--disabled { opacity:.6; cursor:default; }
  .table-icon { color:#9ca3af; margin-bottom:8px; }
  .table-card--selected .table-icon { color:#6366f1; }
  .table-code { font-size:14px; font-weight:700; color:#111827; }
  .table-seats { font-size:13px; font-weight:600; margin-top:4px; font-family:'DM Mono',monospace; }
  .table-seats--ok { color:#22c55e; }
  .table-seats--low { color:#eab308; }
  .table-seats--empty { color:#ef4444; }
  .your-seat-badge {
    position:absolute; top:8px; right:8px; font-size:10px; font-weight:700;
    background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:999px;
  }

  /* ── booking footer (desktop sticky, mobile bottom sheet) ── */
  .booking-footer {
    position:sticky; bottom:0;
    background:#fff; border:1.5px solid #e5e7eb; border-radius:16px;
    padding:16px 20px;
    display:flex; align-items:center; justify-content:space-between;
    flex-wrap:wrap; gap:12px;
    margin-top:24px;
    box-shadow:0 -4px 20px rgba(0,0,0,.07);
  }
  .booking-footer-info .table-name { font-size:16px; font-weight:700; color:#111827; }
  .booking-footer-info .table-sub { font-size:13px; color:#6b7280; margin-top:3px; }
  .booking-footer-right { display:flex; align-items:center; gap:12px; }
  .seats-select-label { font-size:13px; color:#6b7280; font-weight:500; }
  .seats-select {
    padding:8px 12px; border-radius:10px; border:1.5px solid #e5e7eb;
    font-family:'DM Sans',sans-serif; font-size:14px; color:#111827;
    outline:none; background:#fff; cursor:pointer; transition:border-color .15s;
  }
  .seats-select:focus { border-color:#6366f1; }

  /* ── buttons ── */
  .btn-checkin {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 22px; border-radius:12px; border:none;
    background:#111827; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; transition:opacity .15s, transform .1s;
    white-space:nowrap;
  }
  .btn-checkin:hover { opacity:.88; transform:translateY(-1px); }
  .btn-checkin:active { transform:scale(.97); }
  .btn-checkin:disabled { background:#d1d5db; color:#9ca3af; cursor:not-allowed; transform:none; }
  .btn-checkout {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:12px; border:none;
    background:#ef4444; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; transition:opacity .15s; white-space:nowrap;
  }
  .btn-checkout:hover { opacity:.88; }

  /* ═══════════════════════════════════════════
     RESPONSIVE
  ═══════════════════════════════════════════ */

  /* Tablet: narrower sidebar rail */
  @media (max-width: 1024px) {
    .sa-shell { margin-left: 72px; }
    .sa-page { padding: 32px 24px; }
  }

  /* Mobile */
  @media (max-width: 640px) {
    .sa-shell {
      margin-left: 0;
      /* account for bottom tabbar */
      padding-bottom: 80px;
    }
    .sa-page { padding: 72px 16px 16px; }

    .sa-page-title { font-size: 22px; }
    .sa-page-subtitle { font-size: 13px; margin-bottom: 16px; }

    /* search full width on mobile */
    .search-wrap { max-width: 100%; }

    /* 2 col grid on mobile */
    .spaces-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .space-card { padding: 14px; border-radius: 16px; }
    .space-card-name { font-size: 14px; }
    .space-seats-num { font-size: 24px; }

    /* tables: 3 per row on mobile */
    .tables-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .table-card { padding: 12px 8px; border-radius: 12px; }
    .table-code { font-size: 12px; }
    .table-seats { font-size: 11px; }
    .table-icon svg { width: 18px; height: 18px; }

    /* Stack tables header */
    .tables-header-row { flex-direction: column; }
    .tables-space-title { font-size: 20px; }

    /* Active banner compact */
    .active-banner { padding: 12px 14px; }
    .active-banner-title { font-size: 15px; }
    .active-banner-meta { gap: 10px; font-size: 12px; }

    /* Bottom sheet booking footer on mobile */
    .booking-footer {
      position: fixed;
      bottom: 64px; /* above tabbar */
      left: 0; right: 0;
      border-radius: 20px 20px 0 0;
      border: none;
      border-top: 1.5px solid #e5e7eb;
      z-index: 150;
      margin-top: 0;
      padding: 16px 20px;
      padding-bottom: max(16px, env(safe-area-inset-bottom));
      animation: slideUp .25s ease;
    }
    .booking-footer-right { flex: 1; justify-content: flex-end; }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  }

  @media (max-width: 380px) {
    .spaces-grid { grid-template-columns: 1fr; }
    .tables-grid { grid-template-columns: repeat(2, 1fr); }
    .booking-footer { flex-direction: column; align-items: stretch; }
    .booking-footer-right { justify-content: space-between; }
  }
`;

export default function StudyAreas() {
  const location = useLocation();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [seats, setSeats] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrTarget, setQrTarget] = useState({ spaceId: "", tableId: "" });

  const loadSpaces = () =>
    API.get(`/spaces`).then((res) => setAreas(res.data.spaces || []));

  const loadActiveBooking = () =>
    API.get(`/bookings/active`).then((res) =>
      setActiveBooking(res.data.active || null),
    );

  useEffect(() => {
    loadSpaces();
    loadActiveBooking();
  }, []);

  const fetchTables = async (spaceId) => {
    const res = await API.get(`/spaces/${spaceId}/tables`);
    setSelectedArea({ ...res.data.space, tables: res.data.tables });
    setSelectedTable(null);
    setSeats(1);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQrTarget({
      spaceId: params.get("spaceId") || "",
      tableId: params.get("tableId") || "",
    });
  }, [location.search]);

  useEffect(() => {
    if (!qrTarget.spaceId || selectedArea?._id === qrTarget.spaceId) return;
    fetchTables(qrTarget.spaceId);
  }, [qrTarget.spaceId, selectedArea?._id]);

  useEffect(() => {
    if (
      !selectedArea ||
      !qrTarget.tableId ||
      selectedArea._id !== qrTarget.spaceId
    )
      return;
    const targetTable = selectedArea.tables?.find(
      (t) => t._id === qrTarget.tableId,
    );
    if (!targetTable) {
      toast.error("Scanned table could not be found.");
      setQrTarget({ spaceId: "", tableId: "" });
      return;
    }
    if (
      activeBooking &&
      activeBooking.table?._id !== targetTable._id &&
      activeBooking.table !== targetTable._id
    ) {
      toast.info("You already have an active booking.");
      setQrTarget({ spaceId: "", tableId: "" });
      return;
    }
    if (targetTable.availableSeats === 0)
      toast.warning(`Table ${targetTable.code} is fully booked.`);
    setSelectedTable(targetTable);
    setSeats(1);
    toast.success(`Loaded ${targetTable.code}.`);
    setQrTarget({ spaceId: "", tableId: "" });
  }, [selectedArea, qrTarget, activeBooking]);

  const handleCheckIn = async () => {
    if (!selectedTable) return;
    setLoading(true);
    const res = await API.post(`/bookings`, {
      tableId: selectedTable._id,
      seats,
    });
    setLoading(false);
    if (!res.ok) return alert(res.data.message);
    setActiveBooking(res.data.booking);
    setSelectedTable(null);
    loadSpaces();
    fetchTables(selectedArea._id);
  };

  const handleCheckout = async () => {
    setLoading(true);
    const res = await API.post(`/bookings/checkout`);
    setLoading(false);
    if (!res.ok) return alert(res.data.message);
    setActiveBooking(null);
    loadSpaces();
    if (selectedArea) fetchTables(selectedArea._id);
  };

  useEffect(() => {
    socket.on("seatUpdated", ({ tableId, spaceId, availableSeats }) => {
      setSelectedArea((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.map((t) =>
            t._id === tableId ? { ...t, availableSeats } : t,
          ),
        };
      });
      setAreas((prev) =>
        prev.map((a) => {
          if (a._id !== spaceId) return a;
          const diff =
            availableSeats -
            (selectedArea?.tables?.find((t) => t._id === tableId)
              ?.availableSeats ?? availableSeats);
          return { ...a, availableSeats: a.availableSeats + diff };
        }),
      );
    });
    return () => socket.off("seatUpdated");
  }, [selectedArea]);

  const filtered = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalAvail = areas.reduce((s, a) => s + (a.availableSeats || 0), 0);
  const totalSeats = areas.reduce((s, a) => s + (a.totalSeats || 0), 0);

  const canBook = (table) => table.availableSeats > 0 && !activeBooking;

  const seatOptions = selectedTable
    ? Array.from(
        { length: Math.min(selectedTable.availableSeats, 4) },
        (_, i) => i + 1,
      )
    : [];

  return (
    <>
      <style>{css}</style>
      <div className="sa-root">
        <Navbar />

        <div className="sa-shell">
          <div className="sa-page">
            <ToastContainer position="top-right" autoClose={2000} />

            {/* ── Active session banner ── */}
            {activeBooking && (
              <div className="active-banner">
                <div>
                  <div className="active-banner-label">Active Session</div>
                  <div className="active-banner-title">
                    {activeBooking.space?.name || "Study Space"}
                  </div>
                  <div className="active-banner-meta">
                    <span>
                      <MapPin size={13} />
                      {activeBooking.table?.code || "—"} · {activeBooking.seats}{" "}
                      seat(s)
                    </span>
                    <span>
                      <Clock size={13} />
                      <ElapsedTimer startedAt={activeBooking.startedAt} />
                    </span>
                  </div>
                </div>
                <button
                  className="btn-checkout"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  <LogOut size={15} /> Check Out
                </button>
              </div>
            )}

            {/* ════ SPACES LIST ════ */}
            {!selectedArea && (
              <>
                <h1 className="sa-page-title">Study Areas</h1>
                <p className="sa-page-subtitle">
                  <span className="campus-stat">
                    {totalAvail} of {totalSeats}
                  </span>{" "}
                  seats available across campus
                </p>

                <div className="search-wrap">
                  <Search size={16} />
                  <input
                    className="search-input"
                    placeholder="Search study areas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="spaces-grid">
                  {filtered.map((area) => {
                    const { label, color } = getStatusLabel(area.status);
                    return (
                      <div
                        key={area._id}
                        className="space-card"
                        onClick={() => fetchTables(area._id)}
                      >
                        <div className="space-card-header">
                          <div className="space-card-name">{area.name}</div>
                          <div className={`badge ${color}`}>
                            <span className="badge-dot" />
                            {label}
                          </div>
                        </div>
                        <div className="space-card-location">
                          <MapPin size={13} />
                          {area.location}
                        </div>
                        <div className="space-card-seats">
                          <RingProgress
                            value={area.availableSeats}
                            max={area.totalSeats}
                            size={48}
                            stroke={5}
                          />
                          <div>
                            <div className="space-seats-num">
                              {area.availableSeats}
                            </div>
                            <div className="space-seats-label">
                              of {area.totalSeats} seats free
                            </div>
                          </div>
                        </div>
                        <div className="space-table-info">
                          <span>{area.groupTables ?? 12} group</span>
                          <span>{area.singleTables ?? 8} single</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ════ TABLES VIEW ════ */}
            {selectedArea && (
              <>
                <button
                  className="back-btn"
                  onClick={() => {
                    setSelectedArea(null);
                    setSelectedTable(null);
                  }}
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>

                <div className="tables-header-row">
                  <div>
                    <h2 className="tables-space-title">{selectedArea.name}</h2>
                    <div className="tables-space-location">
                      <MapPin size={13} />
                      {selectedArea.location}
                    </div>
                  </div>
                  {(() => {
                    const { label, color } = getStatusLabel(
                      selectedArea.status,
                    );
                    return (
                      <div className={`badge ${color}`}>
                        <span className="badge-dot" />
                        {label}
                      </div>
                    );
                  })()}
                </div>

                <div className="tables-seats-row">
                  <RingProgress
                    value={selectedArea.availableSeats}
                    max={selectedArea.totalSeats}
                    size={48}
                    stroke={5}
                  />
                  <div>
                    <div className="tables-seats-num">
                      {selectedArea.availableSeats}
                    </div>
                    <div className="tables-seats-label">
                      of {selectedArea.totalSeats} seats free
                    </div>
                  </div>
                </div>

                <div className="tables-section-title">Select a Table</div>

                <div className="tables-grid">
                  {(selectedArea.tables || []).map((table) => {
                    const pct = table.availableSeats / table.capacity;
                    const seatClass =
                      pct === 0
                        ? "table-seats--empty"
                        : pct < 0.4
                          ? "table-seats--low"
                          : "table-seats--ok";
                    const isSelected = selectedTable?._id === table._id;
                    const isDisabled = !canBook(table) && !isSelected;
                    const isMyBooking =
                      activeBooking?.table?._id === table._id ||
                      activeBooking?.table === table._id;

                    return (
                      <div
                        key={table._id}
                        className={[
                          "table-card",
                          isSelected ? "table-card--selected" : "",
                          table.availableSeats === 0 ? "table-card--full" : "",
                          isDisabled ? "table-card--disabled" : "",
                        ].join(" ")}
                        onClick={() => {
                          if (activeBooking && !isMyBooking) {
                            toast.error("You already have a booking.");
                            return;
                          }
                          if (table.availableSeats === 0) {
                            toast.warning("This table is fully booked.");
                            return;
                          }
                          if (isSelected) {
                            setSelectedTable(null);
                            return;
                          }
                          setSelectedTable(table);
                          setSeats(1);
                        }}
                      >
                        {isMyBooking && (
                          <div className="your-seat-badge">Your Seat</div>
                        )}
                        <div className="table-icon">
                          <Users size={22} />
                        </div>
                        <div className="table-code">{table.code}</div>
                        <div className={`table-seats ${seatClass}`}>
                          {table.availableSeats}/{table.capacity}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Booking footer / bottom sheet */}
                {selectedTable && !activeBooking && (
                  <div className="booking-footer">
                    <div className="booking-footer-info">
                      <div className="table-name">
                        Table {selectedTable.code.replace("T", "")}{" "}
                        <span
                          style={{
                            fontWeight: 400,
                            color: "#6b7280",
                            fontSize: 14,
                          }}
                        >
                          ({selectedTable.type === "GROUP" ? "Group" : "Single"}
                          )
                        </span>
                      </div>
                      <div className="table-sub">
                        {selectedTable.availableSeats} seats available
                      </div>
                    </div>
                    <div className="booking-footer-right">
                      <span className="seats-select-label">Seats:</span>
                      <select
                        className="seats-select"
                        value={seats}
                        onChange={(e) => setSeats(Number(e.target.value))}
                      >
                        {seatOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn-checkin"
                        onClick={handleCheckIn}
                        disabled={loading}
                      >
                        <Table2 size={15} /> Check In
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
