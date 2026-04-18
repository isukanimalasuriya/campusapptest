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
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Removed local API_BASE
const socket = io(SOCKET_ORIGIN);

/* ─── helpers ─────────────────────────────────────────── */
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
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
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

  const h = Math.floor(elapsed / 60);
  const m = elapsed % 60;
  return <span>{h > 0 ? `${h}h ${m}m` : `${m}m`}</span>;
}

/* ─── Styles ───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .sa-root * { box-sizing: border-box; }
  .sa-root {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f5;
    min-height: 100vh;
  }

  /* ── status badges ── */
  .badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:600; }
  .badge-dot { width:8px; height:8px; border-radius:50%; }
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
  .active-banner-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #16a34a;
    margin-bottom: 4px;
  }
  .active-banner-title { font-size: 17px; font-weight: 700; color: #111827; }
  .active-banner-meta { display:flex; align-items:center; gap:16px; margin-top:6px; font-size:13px; color:#6b7280; }
  .active-banner-meta span { display:flex; align-items:center; gap:5px; }

  /* ── search ── */
  .search-wrap {
    position: relative;
    max-width: 360px;
    margin-bottom: 24px;
  }
  .search-wrap svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#9ca3af; }
  .search-input {
    width: 100%;
    padding: 10px 14px 10px 40px;
    border-radius: 12px;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #111;
    outline: none;
    transition: border-color .2s;
  }
  .search-input:focus { border-color: #6366f1; }
  .search-input::placeholder { color: #9ca3af; }

  /* ── space cards ── */
  .spaces-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
  .space-card {
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 20px;
    padding: 20px;
    cursor: pointer;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s;
  }
  .space-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.1); border-color:#c7d2fe; }
  .space-card-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
  .space-card-name { font-size:16px; font-weight:700; color:#111827; }
  .space-card-location { display:flex; align-items:center; gap:5px; font-size:13px; color:#6b7280; margin-bottom:14px; }
  .space-card-seats { display:flex; align-items:center; gap:12px; }
  .space-seats-num { font-size:32px; font-weight:700; color:#111827; line-height:1; }
  .space-seats-label { font-size:12px; color:#6b7280; margin-top:2px; }
  .space-table-info { display:flex; gap:10px; margin-top:10px; font-size:12px; color:#6b7280; }
  .space-table-info span { background:#f3f4f6; padding:3px 9px; border-radius:999px; }

  /* ── tables view ── */
  .tables-header { display:flex; align-items:center; gap:14px; margin-bottom:6px; }
  .back-btn {
    display:inline-flex; align-items:center; gap:6px;
    font-size:13px; color:#6b7280; font-weight:500;
    background:none; border:none; cursor:pointer; padding:4px 0;
    transition: color .15s;
  }
  .back-btn:hover { color:#111; }
  .tables-space-title { font-size:26px; font-weight:800; color:#111827; }
  .tables-space-location { display:flex; align-items:center; gap:5px; font-size:13px; color:#6b7280; margin-bottom:16px; }
  .tables-seats-row { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
  .tables-seats-num { font-size:36px; font-weight:800; color:#111827; }
  .tables-seats-label { font-size:13px; color:#6b7280; }
  .tables-section-title { font-size:15px; font-weight:700; color:#374151; margin-bottom:14px; }
  .tables-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }

  /* ── table card ── */
  .table-card {
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    padding: 16px;
    cursor: pointer;
    text-align: center;
    transition: border-color .15s, background .15s, box-shadow .15s;
    position: relative;
  }
  .table-card:hover:not(.table-card--disabled) { border-color: #a5b4fc; box-shadow:0 4px 12px rgba(99,102,241,.1); }
  .table-card--selected { border-color: #6366f1 !important; background: #eef2ff; box-shadow:0 0 0 3px rgba(99,102,241,.15); }
  .table-card--disabled { opacity:.6; cursor:default; }
  .table-card--full { background:#fafafa; }
  .table-icon { color:#9ca3af; margin-bottom:8px; }
  .table-card--selected .table-icon { color:#6366f1; }
  .table-code { font-size:14px; font-weight:700; color:#111827; }
  .table-seats {
    font-size:13px; font-weight:600; margin-top:4px;
    font-family: 'DM Mono', monospace;
  }
  .table-seats--ok { color:#22c55e; }
  .table-seats--low { color:#eab308; }
  .table-seats--empty { color:#ef4444; }

  /* ── booking footer ── */
  .booking-footer {
    position:sticky; bottom:0;
    background:#fff;
    border:1.5px solid #e5e7eb;
    border-radius:16px;
    padding:16px 20px;
    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
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
    outline:none; background:#fff; cursor:pointer;
    transition:border-color .15s;
  }
  .seats-select:focus { border-color:#6366f1; }

  /* ── buttons ── */
  .btn-checkin {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 22px; border-radius:12px; border:none;
    background: #111827; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; transition:opacity .15s, transform .1s;
  }
  .btn-checkin:hover { opacity:.88; transform:translateY(-1px); }
  .btn-checkin:active { transform:scale(.97); }
  .btn-checkin:disabled { background:#d1d5db; color:#9ca3af; cursor:not-allowed; transform:none; }

  .btn-checkout {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:12px; border:none;
    background:#ef4444; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600;
    cursor:pointer; transition:opacity .15s;
  }
  .btn-checkout:hover { opacity:.88; }

  /* ── page layout ── */
  .sa-page { flex:1; padding:32px; overflow-y:auto; max-width:1200px; }
  .sa-page-title { font-size:28px; font-weight:800; color:#111827; margin-bottom:4px; }
  .sa-page-subtitle { font-size:14px; color:#6b7280; margin-bottom:28px; }

  /* ── total campus stat ── */
  .campus-stat { font-weight:600; color:#111827; }
`;

export default function StudyAreas() {
  const location = useLocation();
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null); // null = list view
  const [activeBooking, setActiveBooking] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [seats, setSeats] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrTarget, setQrTarget] = useState({ spaceId: "", tableId: "" });

  const token = localStorage.getItem("token");
  // headers removed as they are handled by API interceptor

  /* Load spaces */
  const loadSpaces = () =>
    API.get(`/spaces`)
      .then((res) => setAreas(res.data.spaces || []));

  /* Load active booking */
  const loadActiveBooking = () =>
    API.get(`/bookings/active`)
      .then((res) => setActiveBooking(res.data.active || null));

  useEffect(() => {
    loadSpaces();
    loadActiveBooking();
  }, []);

  /* Load tables for a space */
  const fetchTables = async (spaceId) => {
    const res = await API.get(`/spaces/${spaceId}/tables`);
    const data = res.data;
    setSelectedArea({ ...data.space, tables: data.tables });
    setSelectedTable(null);
    setSeats(1);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const spaceId = params.get("spaceId") || "";
    const tableId = params.get("tableId") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQrTarget({ spaceId, tableId });
  }, [location.search]);

  useEffect(() => {
    if (!qrTarget.spaceId || selectedArea?._id === qrTarget.spaceId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTables(qrTarget.spaceId);
  }, [qrTarget.spaceId, selectedArea?._id]);

  useEffect(() => {
    if (
      !selectedArea ||
      !qrTarget.tableId ||
      selectedArea._id !== qrTarget.spaceId
    ) {
      return;
    }

    const targetTable = selectedArea.tables?.find(
      (t) => t._id === qrTarget.tableId,
    );
    if (!targetTable) {
      toast.error("Scanned table could not be found.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

    if (targetTable.availableSeats === 0) {
      toast.warning(`Table ${targetTable.code} is fully booked right now.`);
    }

    setSelectedTable(targetTable);
    setSeats(1);
    toast.success(`Loaded ${targetTable.code}.`);
    setQrTarget({ spaceId: "", tableId: "" });
  }, [selectedArea, qrTarget, activeBooking]);

  /* Check-in */
  const handleCheckIn = async () => {
    if (!selectedTable) return;
    setLoading(true);
    const res = await API.post(`/bookings`, { tableId: selectedTable._id, seats });
    const data = res.data;
    setLoading(false);
    if (!res.ok) return alert(data.message);
    setActiveBooking(data.booking);
    setSelectedTable(null);
    // refresh space data
    loadSpaces();
    fetchTables(selectedArea._id);
  };

  /* Check-out */
  const handleCheckout = async () => {
    setLoading(true);
    const res = await API.post(`/bookings/checkout`);
    const data = res.data;
    setLoading(false);
    if (!res.ok) return alert(data.message);
    setActiveBooking(null);
    loadSpaces();
    if (selectedArea) fetchTables(selectedArea._id);
  };

  /* Real-time seat updates */
  useEffect(() => {
    socket.on("seatUpdated", ({ tableId, spaceId, availableSeats }) => {
      // update table in selectedArea
      setSelectedArea((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.map((t) =>
            t._id === tableId ? { ...t, availableSeats } : t,
          ),
        };
      });
      // update space in areas list
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

  /* Filtered spaces */
  const filtered = areas.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase()),
  );

  /* Campus totals */
  const totalAvail = areas.reduce((s, a) => s + (a.availableSeats || 0), 0);
  const totalSeats = areas.reduce((s, a) => s + (a.totalSeats || 0), 0);

  /* Table selection logic */
  const canBook = (table) => {
    if (table.availableSeats === 0) return false;
    if (activeBooking) return false; // already has booking
    return true;
  };

  const seatOptions = selectedTable
    ? Array.from(
        { length: Math.min(selectedTable.availableSeats, 4) },
        (_, i) => i + 1,
      )
    : [];

  return (
    <>
      <style>{css}</style>
      <div className="sa-root font-poppins flex h-screen">
        <Navbar />
        <div className="sa-page">
          <ToastContainer position="top-right" autoClose={2000} />
          {/* ── Header ── */}
          {!selectedArea && (
            <>
              <h1 className="sa-page-title">Study Areas</h1>
              <p className="sa-page-subtitle">
                <span className="campus-stat">
                  {totalAvail} of {totalSeats}
                </span>{" "}
                seats available across campus
              </p>
            </>
          )}

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

          {/* ════════════ SPACES LIST ════════════ */}
          {!selectedArea && (
            <>
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
                  const groupTables = area.groupTables ?? 12;
                  const singleTables = area.singleTables ?? 8;
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
                        <MapPin size={13} /> {area.location}
                      </div>
                      <div className="space-card-seats">
                        <RingProgress
                          value={area.availableSeats}
                          max={area.totalSeats}
                          size={52}
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
                        <span>{groupTables} group tables</span>
                        <span>{singleTables} single tables</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ════════════ TABLES VIEW ════════════ */}
          {selectedArea && (
            <>
              <div>
                <button
                  className="back-btn"
                  onClick={() => {
                    setSelectedArea(null);
                    setSelectedTable(null);
                  }}
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginTop: 8,
                }}
              >
                <div>
                  <h2 className="tables-space-title">{selectedArea.name}</h2>
                  <div className="tables-space-location">
                    <MapPin size={13} /> {selectedArea.location}
                  </div>
                </div>
                {(() => {
                  const { label, color } = getStatusLabel(selectedArea.status);
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
                  size={52}
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
                          toast.error(
                            "You already have a booking. Cannot book another table.",
                          );
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
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            fontSize: 10,
                            fontWeight: 700,
                            background: "#dcfce7",
                            color: "#15803d",
                            padding: "2px 8px",
                            borderRadius: 999,
                          }}
                        >
                          Your Seat
                        </div>
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

              {/* booking footer */}
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
                        ({selectedTable.type === "GROUP" ? "Group" : "Single"})
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
    </>
  );
}
