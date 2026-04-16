import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Wifi,
  Bus,
  BookOpen,
  ThermometerSun,
  GraduationCap,
  ArrowRight,
  Globe,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import API from "../api";

const extractList = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (d?.data && Array.isArray(d.data)) return d.data;
  return [];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [skillSnap, setSkillSnap] = useState({
    loading: true,
    hosted: 0,
    attending: 0,
    openLearning: 0,
    volunteerOpen: 0,
    unreadNotifs: 0,
  });

  const loadSkillExchangeSnapshot = useCallback(async () => {
    if (!user?.id && !user?._id) return;
    const uid = String(user.id || user._id);
    setSkillSnap((s) => ({ ...s, loading: true }));
    try {
      const [skillsRes, myLrRes, openLrRes, notifRes] = await Promise.all([
        API.get("/skills", { params: { limit: 120, page: 1 } }),
        API.get("/skills/my-learning-requests"),
        API.get("/skills/learning-requests", { params: { limit: 80, page: 1 } }),
        API.get("/skills/notifications"),
      ]);
      const skills = extractList(skillsRes);
      const myLR = Array.isArray(myLrRes.data) ? myLrRes.data : extractList(myLrRes);
      const openLRBoard = extractList(openLrRes);

      const hosted = skills.filter((s) => String(s.userId || "") === uid).length;
      const attending = skills.filter((s) => {
        const jr = s.joinRequests?.some(
          (j) => String(j.userId || "") === uid && j.status === "Approved"
        );
        const matched = myLR.some(
          (lr) => lr.resultingSkillId && String(lr.resultingSkillId) === String(s._id)
        );
        return jr || matched;
      }).length;
      const openLearning = myLR.filter((lr) => lr.status === "Open").length;
      const volunteerOpen = openLRBoard.filter(
        (lr) =>
          String(lr.requesterId || "") !== uid &&
          lr.volunteers?.some(
            (v) => String(v.userId || "") === uid || v.userName === user.name
          )
      ).length;
      const unreadNotifs =
        typeof notifRes.data?.unread === "number" ? notifRes.data.unread : 0;

      setSkillSnap({
        loading: false,
        hosted,
        attending,
        openLearning,
        volunteerOpen,
        unreadNotifs,
      });
    } catch {
      setSkillSnap({
        loading: false,
        hosted: 0,
        attending: 0,
        openLearning: 0,
        volunteerOpen: 0,
        unreadNotifs: 0,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user) loadSkillExchangeSnapshot();
  }, [loading, user, loadSkillExchangeSnapshot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading user info…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>User not found. Please login.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Navbar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-[180px]">
              <h1 className="text-xl font-semibold text-gray-900">
                Smart Campus Companion
              </h1>
              <p className="text-sm text-gray-500">
                Live campus info • Alerts • Navigation
              </p>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 w-[420px] px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
                placeholder="Search rooms, buses, events, services..."
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* Profile button */}
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 pl-3 border-l border-gray-200"
              >
                <div className="hidden sm:block text-right leading-tight">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">Campus Mode</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold shadow">
                  {user.avatar}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Hero / quick status */}
          <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-white/80 text-sm">Good morning !</p>
                <h2 className="text-2xl md:text-3xl font-semibold mt-1">
                  Everything you need, right on campus.
                </h2>
                <p className="text-white/80 mt-2 text-sm md:text-base max-w-2xl">
                  Find empty study rooms, see today's timetable, and get
                  real-time updates.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/support-ticket")}
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/15 transition"
                >
                  Report Issue
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => navigate("/skill-exchange")}
                className="text-left rounded-2xl bg-white/10 border border-white/25 px-4 py-3 hover:bg-white/15 transition flex flex-col gap-1 group"
              >
                <span className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <GraduationCap size={18} className="shrink-0" />
                  Skill Exchange
                </span>
                <span className="text-xs text-white/70 group-hover:text-white/90">
                  Tutoring & sessions →
                </span>
              </button>
              <MiniPill
                icon={<Wifi size={18} />}
                label="Wi-Fi"
                value="Online"
              />
              <MiniPill
                icon={<Bus size={18} />}
                label="Next Shuttle"
                value="7 min"
              />
              <MiniPill
                icon={<ThermometerSun size={18} />}
                label="Weather"
                value="33°C"
              />
            </div>
          </section>

          {/* Main content */}
          <section className="space-y-6">
            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FeatureCard
                icon={<BookOpen size={20} />}
                title="Study Spaces"
                desc="Find free labs & rooms"
              />
              <FeatureCard
                icon={<GraduationCap size={20} />}
                title="Skill Exchange"
                desc="Offer help, request a tutor, join public sessions"
                badge="Live"
                onClick={() => navigate("/skill-exchange")}
              />
            </div>

            {/* Skill Exchange snapshot */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-indigo-100/80 flex flex-wrap items-center justify-between gap-3 bg-white/60 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                    <Sparkles size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Your Skill Exchange</h3>
                    <p className="text-sm text-gray-500">Quick snapshot — tap through to manage everything</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/skill-exchange")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
                >
                  Open Skill Exchange
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {skillSnap.loading ? (
                  <div className="col-span-full flex items-center justify-center gap-2 py-8 text-gray-500 text-sm">
                    <Loader2 size={18} className="animate-spin text-indigo-600" />
                    Loading your activity…
                  </div>
                ) : (
                  <>
                    <SkillStat
                      icon={<Globe size={16} />}
                      label="Hosting"
                      value={skillSnap.hosted}
                      hint="skills you posted"
                    />
                    <SkillStat
                      icon={<GraduationCap size={16} />}
                      label="Attending"
                      value={skillSnap.attending}
                      hint="sessions you’re in"
                    />
                    <SkillStat
                      icon={<BookOpen size={16} />}
                      label="Learning posts"
                      value={skillSnap.openLearning}
                      hint="open requests"
                    />
                    <SkillStat
                      icon={<Sparkles size={16} />}
                      label="Volunteering"
                      value={skillSnap.volunteerOpen}
                      hint="pending on you"
                    />
                  </>
                )}
              </div>
              {!skillSnap.loading && skillSnap.unreadNotifs > 0 && (
                <div className="px-5 pb-4">
                  <button
                    type="button"
                    onClick={() => navigate("/skill-exchange")}
                    className="w-full text-left text-sm font-medium text-indigo-700 bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-2.5 hover:bg-indigo-100/80 transition"
                  >
                    You have {skillSnap.unreadNotifs} new Skill Exchange notification
                    {skillSnap.unreadNotifs === 1 ? "" : "s"} — view in Skill Exchange
                  </button>
                </div>
              )}
            </div>

            {/* Available Study Rooms panel */}
            <Panel title="Available Study Rooms" subtitle="Updated just now">
              <RoomRow
                room="Library - Room 204"
                status="Available"
                meta="Seats: 8"
              />
              <RoomRow
                room="Engineering - Lab 1"
                status="Busy"
                meta="Seats: 24"
              />
              <RoomRow
                room="Business - Room 12"
                status="Available"
                meta="Seats: 16"
              />
            </Panel>

            {/* Outlet */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <Outlet />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

/* ---------- Small UI components ---------- */

const MiniPill = ({ icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
    <div className="flex items-center gap-2">
      <span className="text-white/90">{icon}</span>
      <span className="text-sm text-white/80">{label}</span>
    </div>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);

const FeatureCard = ({ icon, title, desc, badge, onClick }) => {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          {icon}
        </div>
        {badge ? (
          <span className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{desc}</p>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition text-left w-full"
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 hover:shadow-md transition">
      {inner}
    </div>
  );
};

const SkillStat = ({ icon, label, value, hint }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm">
    <div className="flex items-center gap-2 text-indigo-600 mb-1">
      <span className="opacity-90">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
    </div>
    <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
  </div>
);

const Panel = ({ title, subtitle, right, children }) => (
  <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const RoomRow = ({ room, status, meta }) => {
  const ok = status === "Available";
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition">
      <div>
        <p className="text-sm font-medium text-gray-900">{room}</p>
        <p className="text-xs text-gray-500">{meta}</p>
      </div>
      <span
        className={`text-xs px-2 py-1 rounded-lg font-medium ${
          ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
};

export default Dashboard;
