import React, { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react";
import { Building2, MapPin, RefreshCw, Trash2 } from "lucide-react";
import API from "../api";
import AdminNavbar from "./admin/AdminNavbar";
import "react-toastify/dist/ReactToastify.css";

export default function AdminStudySpaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [newSpace, setNewSpace] = useState({
    name: "",
    location: "",
    totalSeats: "",
  });
  const [savingSpace, setSavingSpace] = useState(false);

  const [newTable, setNewTable] = useState({
    code: "",
    type: "SINGLE",
    capacity: "",
  });
  const [savingTable, setSavingTable] = useState(false);

  // ── NEW: delete state ──────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  // ──────────────────────────────────────────────────────────────────────

  const getTableQrUrl = (spaceId, tableId) =>
    `${window.location.origin}/studyareas?spaceId=${spaceId}&tableId=${tableId}`;

  const printTableQr = (space, table) => {
    const canvas = document.getElementById(`table-qr-${table._id}`);
    if (!canvas || typeof canvas.toDataURL !== "function") {
      toast.error("QR code is not ready yet. Try again.");
      return;
    }

    const qrImageUrl = canvas.toDataURL("image/png");
    const scanUrl = getTableQrUrl(space._id, table._id);
    const popup = window.open("", "_blank", "width=620,height=820");

    if (!popup) {
      toast.error("Pop-up blocked. Please allow pop-ups to print QR.");
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Table ${table.code} QR</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 32px; }
            h1 { margin-bottom: 6px; }
            p { margin: 6px 0; color: #444; }
            img { margin: 20px auto; display: block; width: 240px; height: 240px; }
            .url { margin-top: 12px; font-size: 12px; word-break: break-all; color: #666; }
          </style>
        </head>
        <body>
          <h1>${space.name} - ${table.code}</h1>
          <p>${table.type === "GROUP" ? "Group" : "Single"} table</p>
          <p>Capacity: ${table.capacity} seats</p>
          <img src="${qrImageUrl}" alt="QR for table ${table.code}" />
          <p class="url">${scanUrl}</p>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/spaces");
      setSpaces(data.spaces || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load study spaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const loadDetail = async (spaceId) => {
    setDetailLoading(true);
    setSelectedId(spaceId);
    try {
      const { data } = await API.get(`/admin/spaces/${spaceId}/tables`);
      setDetail(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load space");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitSpace = async (e) => {
    e.preventDefault();
    const total = Number(newSpace.totalSeats);
    if (total !== 0) {
      toast.error(
        "Total seats must be exactly 0. Tables will add seats automatically.",
      );
      return;
    }
    if (
      !newSpace.name.trim() ||
      !newSpace.location.trim() ||
      !Number.isFinite(total) ||
      total < 0
    ) {
      toast.error("Enter name, location, and total seats (0 only).");
      return;
    }
    setSavingSpace(true);
    try {
      await API.post("/admin/spaces", {
        name: newSpace.name.trim(),
        location: newSpace.location.trim(),
        totalSeats: total,
      });
      toast.success("Study space created.");
      setNewSpace({ name: "", location: "", totalSeats: "" });
      await fetchSpaces();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create space");
    } finally {
      setSavingSpace(false);
    }
  };

  const submitTable = async (e) => {
    e.preventDefault();
    if (!selectedId || !detail?.space) return;
    const cap = Number(newTable.capacity);
    if (!newTable.code.trim() || !Number.isFinite(cap) || cap < 1) {
      toast.error("Enter table code and seat count (at least 1).");
      return;
    }
    setSavingTable(true);
    try {
      await API.post(`/admin/spaces/${selectedId}/tables`, {
        code: newTable.code.trim(),
        type: newTable.type,
        capacity: cap,
      });
      toast.success("Table added.");
      setNewTable({ code: "", type: "SINGLE", capacity: "" });
      await loadDetail(selectedId);
      await fetchSpaces();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add table");
    } finally {
      setSavingTable(false);
    }
  };

  // ── NEW: delete handler ────────────────────────────────────────────────
  const deleteSpace = async (spaceId) => {
    setDeletingId(spaceId);
    try {
      await API.delete(`/admin/spaces/${spaceId}`);
      toast.success("Study space deleted.");
      // If the deleted space was selected, clear the detail panel
      if (selectedId === spaceId) {
        setSelectedId(null);
        setDetail(null);
      }
      setConfirmDeleteId(null);
      await fetchSpaces();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete space");
    } finally {
      setDeletingId(null);
    }
  };
  // ──────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex flex-col">
      <AdminNavbar
        extraActions={
          <button
            type="button"
            onClick={() => fetchSpaces()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 bg-white px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      <div className="flex-1 flex flex-col min-h-0 max-w-7xl mx-auto w-full px-6 pt-4 pb-6">
        <div className="mb-4 shrink-0">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">
            Study spaces
          </p>
          <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
            Manage spaces & tables
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Add spaces, tables, and seat counts for student bookings.
          </p>
        </div>

        <div className="flex-1 flex gap-5 min-h-0">
          <div className="w-[380px] shrink-0 flex flex-col gap-4 min-h-0">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-800 mb-3">
                New study space
              </h2>
              <form onSubmit={submitSpace} className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newSpace.name}
                  onChange={(e) =>
                    setNewSpace((s) => ({ ...s, name: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newSpace.location}
                  onChange={(e) =>
                    setNewSpace((s) => ({ ...s, location: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="number"
                  min={0}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  placeholder="Initial total seats (0 if only adding tables)"
                  value={newSpace.totalSeats}
                  onChange={(e) =>
                    setNewSpace((s) => ({ ...s, totalSeats: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-3 py-2 rounded-xl outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="text-[10px] text-slate-400 leading-snug">
                  Each table you add increases the space total seats
                  automatically.
                </p>
                <button
                  type="submit"
                  disabled={savingSpace}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-50 transition-all"
                >
                  {savingSpace ? "Saving…" : "Create space"}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Spaces
              </p>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Loading…</p>
                </div>
              ) : spaces.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                  No spaces yet. Create one above.
                </div>
              ) : (
                spaces.map((s) => {
                  const active = selectedId === s._id;
                  const isConfirming = confirmDeleteId === s._id;
                  const isDeleting = deletingId === s._id;

                  return (
                    <div
                      key={s._id}
                      className={`w-full text-left rounded-xl border transition-all ${
                        active
                          ? "bg-indigo-50 border-indigo-200 shadow-md"
                          : "bg-white border-slate-100 hover:shadow-md hover:border-indigo-200"
                      }`}
                    >
                      {/* ── Clickable main area ── */}
                      <button
                        type="button"
                        onClick={() => loadDetail(s._id)}
                        className="w-full text-left p-4 pb-2"
                      >
                        <p className="font-bold text-slate-800 text-sm">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                          {s.location}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-semibold text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                            {s.availableSeats}/{s.totalSeats} seats free
                          </span>
                          <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md">
                            {s.groupTables ?? 0} group · {s.singleTables ?? 0}{" "}
                            single
                          </span>
                        </div>
                      </button>

                      {/* ── Delete controls ── */}
                      <div className="px-4 pb-3 pt-1 flex items-center justify-end gap-2">
                        {isConfirming ? (
                          <>
                            <span className="text-[10px] text-rose-600 font-semibold mr-auto">
                              Delete this space and all its tables?
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSpace(s._id)}
                              disabled={isDeleting}
                              className="text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                              {isDeleting ? (
                                <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Confirm delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(s._id);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right panel (unchanged) ── */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden min-h-0">
            {!selectedId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                  <Building2 className="w-8 h-8" strokeWidth={1.75} />
                </div>
                <p className="font-bold text-slate-700 text-lg">
                  Select a study space
                </p>
                <p className="text-sm text-slate-400 max-w-sm">
                  Choose a space on the left to view tables and add seats by
                  table.
                </p>
              </div>
            ) : detailLoading ? (
              <div className="flex-1 flex items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading…</p>
              </div>
            ) : detail?.space ? (
              <>
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 shrink-0">
                    <MapPin className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {detail.space.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {detail.space.location}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-2">
                      Status: <strong>{detail.space.status}</strong>
                      {" · "}
                      Available <strong>
                        {detail.space.availableSeats}
                      </strong>{" "}
                      of <strong>{detail.space.totalSeats}</strong> seats
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-3">
                      Add table
                    </h3>
                    <form
                      onSubmit={submitTable}
                      className="flex flex-wrap gap-2 items-end"
                    >
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Code
                        </label>
                        <input
                          type="text"
                          value={newTable.code}
                          onChange={(e) =>
                            setNewTable((t) => ({ ...t, code: e.target.value }))
                          }
                          placeholder="e.g. T1"
                          className="w-full bg-white border border-slate-200 text-sm px-3 py-2 rounded-lg outline-none focus:border-indigo-300"
                        />
                      </div>
                      <div className="w-[140px]">
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Type
                        </label>
                        <select
                          value={newTable.type}
                          onChange={(e) =>
                            setNewTable((t) => ({ ...t, type: e.target.value }))
                          }
                          className="w-full bg-white border border-slate-200 text-sm px-3 py-2 rounded-lg outline-none focus:border-indigo-300"
                        >
                          <option value="SINGLE">Single</option>
                          <option value="GROUP">Group</option>
                        </select>
                      </div>
                      <div className="w-[100px]">
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Seats
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newTable.capacity}
                          onChange={(e) =>
                            setNewTable((t) => ({
                              ...t,
                              capacity: e.target.value,
                            }))
                          }
                          placeholder="4"
                          className="w-full bg-white border border-slate-200 text-sm px-3 py-2 rounded-lg outline-none focus:border-indigo-300"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingTable}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 h-[38px] self-end"
                      >
                        {savingTable ? "…" : "Add table"}
                      </button>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                      Tables
                    </h3>
                    {!detail.tables?.length ? (
                      <p className="text-sm text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                        No tables yet. Add one above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {detail.tables.map((tbl) => (
                          <div
                            key={tbl._id}
                            className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <span className="font-bold text-slate-800">
                                  {tbl.code}
                                </span>
                                <span className="text-slate-400 mx-2">·</span>
                                <span className="text-slate-600">
                                  {tbl.type === "GROUP" ? "Group" : "Single"}
                                </span>
                                <div className="text-xs font-semibold text-slate-600 mt-1">
                                  {tbl.availableSeats}/{tbl.capacity} seats
                                  available
                                </div>
                              </div>
                              <div className="rounded-lg border border-slate-200 p-2 bg-slate-50">
                                <QRCodeCanvas
                                  id={`table-qr-${tbl._id}`}
                                  value={getTableQrUrl(detail.space._id, tbl._id)}
                                  size={80}
                                  includeMargin={true}
                                />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => printTableQr(detail.space, tbl)}
                                className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-all"
                              >
                                Print QR
                              </button>
                              <a
                                href={getTableQrUrl(detail.space._id, tbl._id)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 underline underline-offset-2"
                              >
                                Open scan link
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Could not load space.
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3500}
        toastClassName="rounded-xl shadow-lg text-sm font-medium"
      />
    </div>
  );
}
