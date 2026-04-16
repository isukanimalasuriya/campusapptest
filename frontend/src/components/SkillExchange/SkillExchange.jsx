import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { io as socketIO } from "socket.io-client";
import Navbar from "../Navbar";
import {
  Search, Filter, Plus, BookOpen, Clock, Globe, MapPin, Star,
  User, Users, GraduationCap, LayoutDashboard, Compass, CheckCircle,
  Calendar, HelpCircle, Wifi, X, ChevronDown, ChevronUp, Bell, Loader2, RefreshCw
} from "lucide-react";
import OfferSkillModal from "./OfferSkillModal";
import RequestHelpModal from "./RequestHelpModal";
import RequestLearningModal from "./RequestLearningModal";
import VolunteerModal from "./VolunteerModal";
import { SLIIT_SUBJECTS } from "../../data/sliitSubjects";
import API, { SOCKET_ORIGIN } from "../../api";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";

/** Unified card shell for My Activity — keeps sections visually consistent */
const ACTIVITY_CARD =
  "rounded-2xl border border-slate-200/90 bg-white p-5 md:p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-300/50";

const SkillExchange = () => {
  const { user, loading: userLoading } = useUser();
  const socketRef = useRef(null);

  // Tab: "explore" | "requests" | "activity"
  const [activeTab, setActiveTab] = useState("explore");
  const [activityView, setActivityView] = useState("list");
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);

  // Data
  const [skills, setSkills] = useState([]);
  const [requests, setRequests] = useState([]);
  const [learningRequests, setLearningRequests] = useState([]);
  const [myLearningRequests, setMyLearningRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [skillsQuery, setSkillsQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [lrSearch, setLrSearch] = useState("");

  // Modals
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLearningRequestModalOpen, setIsLearningRequestModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [volunteerTarget, setVolunteerTarget] = useState(null);

  // Expanded volunteer lists in My Activity
  const [expandedLR, setExpandedLR] = useState({});

  useEffect(() => {
    const t = setTimeout(() => setSkillsQuery(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const extractList = (res) => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (d?.data && Array.isArray(d.data)) return d.data;
    return [];
  };

  // ── Fetch ──────────────────────────────────
  const fetchData = useCallback(async () => {
    if (userLoading) return;
    if (!user?.id && !user?._id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [skillsRes, requestsRes, lrRes, myLrRes] = await Promise.all([
        API.get("/skills", { params: { limit: 100, page: 1, q: skillsQuery || undefined } }),
        API.get("/skills/requests", { params: { limit: 150, page: 1 } }),
        API.get("/skills/learning-requests", { params: { limit: 150, page: 1 } }),
        API.get("/skills/my-learning-requests"),
      ]);
      setSkills(extractList(skillsRes));
      setRequests(extractList(requestsRes));
      setLearningRequests(extractList(lrRes));
      setMyLearningRequests(Array.isArray(myLrRes.data) ? myLrRes.data : extractList(myLrRes));
    } catch (error) {
      console.error("Error fetching data:", error);
      const msg = error.response?.status === 401
        ? "Session expired or not logged in. Please sign in again."
        : (error.response?.data?.message || "Failed to load skill exchange data");
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user, userLoading, skillsQuery]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id && !user?._id) return;
    try {
      const res = await API.get("/skills/notifications");
      setNotifications(res.data?.data || []);
      setNotifUnread(typeof res.data?.unread === "number" ? res.data.unread : 0);
    } catch {
      /* optional feature */
    }
  }, [user]);

  useEffect(() => {
    if (userLoading || !user) return;
    fetchData();
  }, [fetchData, user, userLoading]);

  useEffect(() => {
    if (!user || userLoading) return;
    loadNotifications();
    const id = setInterval(loadNotifications, 45000);
    return () => clearInterval(id);
  }, [user, userLoading, loadNotifications]);

  // ── Socket.io ──────────────────────────────
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    const socket = socketIO(SOCKET_ORIGIN, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_user_room", userId);
    });

    socket.on("reconnect", () => {
      socket.emit("join_user_room", userId);
      fetchData();
      loadNotifications();
    });

    socket.on("new_volunteer", ({ volunteerName, titleWhatIWantToLearn }) => {
      toast.info(`💡 ${volunteerName} wants to help you with "${titleWhatIWantToLearn}"!`, { autoClose: 6000 });
      fetchData();
      loadNotifications();
    });

    socket.on("volunteer_accepted", ({ skillName, meetingLink }) => {
      toast.success(`🎉 Your offer was accepted! Session: "${skillName}" created.`, { autoClose: 7000 });
      fetchData();
      loadNotifications();
    });

    socket.on("learning_request_matched", ({ skillName, meetingLink, mode }) => {
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-bold">You matched with a volunteer</p>
          <p className="text-xs">Session: "{skillName}"</p>
          {meetingLink && mode === "Online" && (
            <a href={meetingLink} target="_blank" rel="noopener noreferrer"
              className="bg-violet-600 text-white px-3 py-1 rounded-lg text-xs font-bold text-center mt-1">
              Open meeting
            </a>
          )}
        </div>,
        { autoClose: 9000 }
      );
      fetchData();
      loadNotifications();
    });

    socket.on("new_join_request", ({ skillName, requesterName }) => {
      toast.info(`🙋 ${requesterName} wants to join your session: "${skillName}"`, { autoClose: 6000 });
      fetchData();
      loadNotifications();
    });

    socket.on("join_request_approved", ({ skillName, meetingLink, mode }) => {
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-bold">✅ Join request approved!</p>
          <p className="text-xs">You can now attend: "{skillName}"</p>
          {meetingLink && mode === "Online" && (
            <a href={meetingLink} target="_blank" rel="noopener noreferrer"
              className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold text-center mt-1">
              Join Meeting Now
            </a>
          )}
          {mode === "Offline" && <p className="text-xs text-emerald-700">Attend in person at the agreed location.</p>}
        </div>,
        { autoClose: 12000 }
      );
      fetchData();
      loadNotifications();
    });

    socket.on("join_request_rejected", ({ skillName }) => {
      toast.error(`❌ Your join request for "${skillName}" was rejected.`, { autoClose: 6000 });
      fetchData();
      loadNotifications();
    });

    return () => { socket.disconnect(); };
  }, [user, fetchData, loadNotifications]);

  // ── Reminder logic ──────────────────────────
  useEffect(() => {
    const checkMeetings = () => {
      const now = new Date();
      requests.forEach((req) => {
        const uid = user?.id || user?._id;
        const isReq = String(req.requesterId || "") === String(uid || "") || req.requesterName === user?.name;
        const isProv = String(req.skillId?.userId || "") === String(uid || "") || req.skillId?.providerName === user?.name;
        if (!(isReq || isProv)) return;
        if (req.status === "Scheduled" || (req.skillId?.isPublic && req.status === "Pending")) {
          const meetingTime = new Date(req.preferredTime || req.skillId?.availability);
          const diffMinutes = (meetingTime - now) / 60000;
          if (diffMinutes > 0 && diffMinutes <= 10 && upcomingMeeting !== req._id) {
            setUpcomingMeeting(req._id);
            toast.info(
              <div className="flex flex-col gap-1">
                <p className="font-bold">Meeting Starting Soon!</p>
                <p className="text-xs">"{req.skillId?.skillName}" in {Math.round(diffMinutes)} mins</p>
                {req.skillId?.meetingLink && (
                  <a href={req.skillId.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold text-center mt-1">
                    Join Now
                  </a>
                )}
              </div>,
              { autoClose: 10000, icon: <Clock size={16} /> }
            );
          }
        }
      });
    };
    const interval = setInterval(checkMeetings, 60000);
    return () => clearInterval(interval);
  }, [requests, upcomingMeeting, user]);

  // ── Handlers ───────────────────────────────
  const handleRequestHelp = (skill) => { setSelectedSkill(skill); setIsRequestModalOpen(true); };
  const handleRequestSubmit = () => { setIsRequestModalOpen(false); fetchData(); setActiveTab("activity"); };

  const handleUpdateStatus = async (requestId, status) => {
    setActionBusy(`req:${requestId}`);
    try {
      await API.patch(`/skills/request/${requestId}/status`, { status });
      toast.success(`Request marked as ${status}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionBusy(null);
    }
  };

  const handleAcceptVolunteer = async (lrId, volunteerId, volunteerName) => {
    setActionBusy(`acc:${lrId}`);
    try {
      await API.patch(`/skills/learning-request/${lrId}/accept-volunteer`, { volunteerId, volunteerName });
      toast.success(`${volunteerName} accepted! A skill session was created.`);
      fetchData();
      loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept volunteer");
    } finally {
      setActionBusy(null);
    }
  };

  const handleCancelLearningRequest = async (lrId) => {
    setActionBusy(`clr:${lrId}`);
    try {
      await API.patch(`/skills/learning-request/${lrId}/cancel`);
      toast.success("Learning request cancelled");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel");
    } finally {
      setActionBusy(null);
    }
  };

  const handleWithdrawJoin = async (skillId, joinId) => {
    setActionBusy(`wj:${joinId}`);
    try {
      await API.patch(`/skills/${skillId}/join-request/${joinId}/cancel`);
      toast.success("Join request withdrawn");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not withdraw");
    } finally {
      setActionBusy(null);
    }
  };

  const handleJoinRequest = async (skillId, joinId, status) => {
    setActionBusy(`jr:${joinId}`);
    try {
      await API.patch(`/skills/${skillId}/join-request/${joinId}`, { status });
      toast.success(`Join request ${status.toLowerCase()}`);
      fetchData();
      loadNotifications();
    } catch {
      toast.error("Failed to update join request");
    } finally {
      setActionBusy(null);
    }
  };

  const handleJoinSession = async (skill) => {
    const uid = user?.id || user?._id;
    const alreadyJoined = skill.joinRequests?.some(
      (j) => String(j.userId || "") === String(uid || "") || j.userName === user?.name
    );
    if (alreadyJoined) { toast.info("You already requested to join this session."); return; }
    setActionBusy(`join:${skill._id}`);
    try {
      await API.post(`/skills/${skill._id}/join-request`, {});
      toast.success("Join request sent! Waiting for hoster approval.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send join request");
    } finally {
      setActionBusy(null);
    }
  };

  const markNotifRead = async (id) => {
    try {
      await API.patch(`/skills/notifications/${id}/read`);
      loadNotifications();
    } catch { /* ignore */ }
  };

  const markAllNotifsRead = async () => {
    try {
      await API.patch("/skills/notifications/read-all");
      loadNotifications();
    } catch { /* ignore */ }
  };

  // ── Derived data ───────────────────────────
  const uid = user?.id || user?._id;

  const filteredSkills = skills.filter((skill) => {
    const subjectInfo = SLIIT_SUBJECTS.find((s) => s.code === skill.moduleCode);
    const matchesYear = filterYear === "All" || (subjectInfo && subjectInfo.year.toString() === filterYear);
    const matchesSubject = filterSubject === "All" || skill.subject === filterSubject;
    const matchesLevel = filterLevel === "All" || skill.skillLevel === filterLevel;
    return matchesYear && matchesSubject && matchesLevel;
  });

  const filteredLR = learningRequests.filter((lr) => {
    const s = lrSearch.toLowerCase();
    return !s || lr.titleWhatIWantToLearn.toLowerCase().includes(s) || lr.moduleCode.toLowerCase().includes(s) || lr.subject.toLowerCase().includes(s);
  });

  const mySkills = skills.filter(
    (s) => String(s.userId || "") === String(uid || "") || s.providerName === user?.name
  );

  const myRequests = requests.filter((req) => {
    const isReq = String(req.requesterId || "") === String(uid || "") || req.requesterName === user?.name;
    const isProv =
      String(req.skillId?.userId || "") === String(uid || "") || req.skillId?.providerName === user?.name;
    return isReq || isProv;
  });

  const myVolunteerApps = learningRequests.filter(
    (lr) =>
      String(lr.requesterId || "") !== String(uid || "") &&
      lr.volunteers?.some(
        (v) => String(v.userId || "") === String(uid || "") || v.userName === user?.name
      )
  );

  const hasRequested = (skillId) =>
    requests.some(
      (req) =>
        req.skillId?._id === skillId &&
        (String(req.requesterId || "") === String(uid || "") || req.requesterName === user?.name)
    );

  const hasVolunteered = (lrId) =>
    learningRequests.find((lr) => lr._id === lrId)?.volunteers?.some(
      (v) => String(v.userId || "") === String(uid || "") || v.userName === user?.name
    );

  const myJoinedSessions = skills.filter((s) => {
    const explicitlyJoined = s.joinRequests?.some(
      (j) => String(j.userId || "") === String(uid || "") || j.userName === user?.name
    );
    const generatedFromMyRequest = myLearningRequests.some((lr) => lr.resultingSkillId === s._id);
    return explicitlyJoined || generatedFromMyRequest;
  });

  const myHostedSkillsWithPendingJoins = mySkills.filter(
    (s) => s.isPublic && s.joinRequests?.some((j) => j.status === "Pending")
  );

  const calendarMeetingDates = useMemo(() => {
    const out = [];
    const add = (v) => {
      const d = v ? new Date(v) : null;
      if (d && !Number.isNaN(d.getTime())) out.push(d);
    };
    myRequests.forEach((r) => add(r.preferredTime || r.skillId?.availability));
    myLearningRequests.forEach((lr) => add(lr.preferredTime));
    myJoinedSessions.forEach((s) => add(s.availability));
    return out;
  }, [myRequests, myLearningRequests, myJoinedSessions]);

  const agendaForSelectedDay = useMemo(() => {
    const dayStr = selectedDay.toDateString();
    const items = [];
    myRequests.forEach((r) => {
      const t = new Date(r.preferredTime || r.skillId?.availability);
      if (Number.isNaN(t.getTime()) || t.toDateString() !== dayStr) return;
      items.push({
        key: `r-${r._id}`,
        kind: "skill",
        title: r.skillId?.skillName || "Session",
        sub: r.skillId?.moduleCode,
        time: t,
        meetingLink: r.skillId?.meetingLink,
      });
    });
    myLearningRequests.forEach((lr) => {
      const t = new Date(lr.preferredTime);
      if (Number.isNaN(t.getTime()) || t.toDateString() !== dayStr) return;
      items.push({
        key: `lr-${lr._id}`,
        kind: "learn",
        title: lr.titleWhatIWantToLearn,
        sub: lr.moduleCode,
        time: t,
        meetingLink: null,
        status: lr.status,
      });
    });
    myJoinedSessions.forEach((s) => {
      const t = new Date(s.availability);
      if (Number.isNaN(t.getTime()) || t.toDateString() !== dayStr) return;
      items.push({
        key: `s-${s._id}`,
        kind: "join",
        title: s.skillName,
        sub: s.moduleCode,
        time: t,
        meetingLink: s.meetingLink,
      });
    });
    return items.sort((a, b) => a.time - b.time);
  }, [selectedDay, myRequests, myLearningRequests, myJoinedSessions]);

  if (userLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center font-poppins">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <p className="text-gray-600 font-medium">Sign in to use Skill Exchange.</p>
          <Link to="/" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // ── Render helpers ─────────────────────────
  const renderRequestCard = (req, isProvider) => (
    <div key={req._id} className={`${ACTIVITY_CARD} flex flex-col md:flex-row md:items-center justify-between gap-5`}>
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${req.status === "Pending" ? "bg-amber-50 text-amber-600" : req.status === "Scheduled" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
          {req.status === "Pending" ? <Clock size={28} /> : req.status === "Scheduled" ? <GraduationCap size={28} /> : <CheckCircle size={28} />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-indigo-600 uppercase border border-indigo-100 px-1.5 rounded bg-indigo-50/30">{req.skillId?.moduleCode || "N/A"}</span>
            <span className="text-sm font-bold text-gray-900">{req.skillId?.skillName}</span>
          </div>
          <p className="text-xs text-gray-500 italic line-clamp-1 max-w-sm">"{req.problemDescription}"</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] flex items-center gap-1 font-bold text-gray-400"><User size={10} /> {req.requesterName}</span>
            <span className="text-[10px] flex items-center gap-1 font-bold text-gray-400"><Clock size={10} /> {new Date(req.preferredTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
        {req.skillId?.meetingLink && (
          <a href={req.skillId.meetingLink} target="_blank" rel="noopener noreferrer"
            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
            <Globe size={14} /> Join Meeting
          </a>
        )}
        {req.status === "Pending" && isProvider ? (
          <button
            type="button"
            disabled={!!actionBusy}
            onClick={() => handleUpdateStatus(req._id, "Scheduled")}
            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
          >
            Accept Request
          </button>
        ) : req.status === "Pending" && !isProvider ? (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 whitespace-nowrap">Waiting for Approval</span>
        ) : req.status === "Scheduled" ? (
          <button
            type="button"
            disabled={!!actionBusy}
            onClick={() => handleUpdateStatus(req._id, "Completed")}
            className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
          >
            Mark Completed
          </button>
        ) : req.status === "Completed" ? (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-1"><CheckCircle size={14} /> Session Completed</span>
        ) : null}
      </div>
    </div>
  );

  // ── Tabs ──────────────────────────────────
  const tabs = [
    { id: "explore", label: "Explore", icon: <Compass size={16} /> },
    { id: "requests", label: "Requests", icon: <HelpCircle size={16} /> },
    { id: "activity", label: "My Activity", icon: <LayoutDashboard size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">SLIIT Skill Exchange</h1>
            <nav className="flex items-center bg-gray-100 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-600" />
                {notifUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {notifUnread > 9 ? "9+" : notifUnread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30 cursor-default bg-transparent"
                    aria-label="Close notifications"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-40 w-80 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                    <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 px-3 py-2 bg-gray-50 rounded-t-2xl">
                      <span className="text-xs font-bold text-gray-600">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                          onClick={markAllNotifsRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => markNotifRead(n._id)}
                          className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 ${n.read ? "opacity-65" : "bg-indigo-50/40"}`}
                        >
                          <p className="text-xs font-bold text-gray-900">{n.title}</p>
                          <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{n.body}</p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            {activeTab === "explore" && (
              <button onClick={() => setIsOfferModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-semibold text-sm">
                <Plus size={18} /> Post a Skill
              </button>
            )}
            {activeTab === "requests" && (
              <button onClick={() => setIsLearningRequestModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-100 font-semibold text-sm">
                <Plus size={18} /> Request Help
              </button>
            )}
          </div>
        </header>

        {fetchError && (
          <div className="shrink-0 mx-6 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-amber-900">{fetchError}</span>
            <button
              type="button"
              onClick={() => fetchData()}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">

          {/* ── EXPLORE TAB ─────────────────── */}
          {activeTab === "explore" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-[450px] px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                  <Search size={20} className="text-gray-400" />
                  <input className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400 font-medium"
                    placeholder="Search modules, subjects or skills..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                    <Filter size={16} className="text-gray-400" />
                    <select className="text-sm font-medium text-gray-700 outline-none bg-transparent" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                      <option value="All">All Years</option>
                      {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                    <BookOpen size={16} className="text-gray-400" />
                    <select className="text-sm font-medium text-gray-700 outline-none bg-transparent w-[140px] truncate" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                      <option value="All">All Subjects</option>
                      {SLIIT_SUBJECTS.filter((s) => filterYear === "All" || s.year.toString() === filterYear).map((s) => (
                        <option key={s.code} value={s.name}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <select className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                    <option value="All">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {loading ? (
                  [1,2,3].map((i) => <div key={i} className="h-72 bg-gray-100 rounded-3xl animate-pulse" />)
                ) : filteredSkills.length > 0 ? (
                  filteredSkills.map((skill) => {
                    const isMySkill = String(skill.userId || "") === String(uid || "") || skill.providerName === user?.name;
                    const myJoin = skill.joinRequests?.find(
                      (j) => String(j.userId || "") === String(uid || "") || j.userName === user?.name
                    );
                    const isRequesterOfGeneratedSkill = myLearningRequests.some((lr) => lr.resultingSkillId === skill._id);
                    const joinStatus = myJoin?.status || (isRequesterOfGeneratedSkill ? "Approved" : undefined);
                    const approvedJoins = skill.joinRequests?.filter((j) => j.status === "Approved").length || 0;
                    const pendingJoins = skill.joinRequests?.filter((j) => j.status === "Pending").length || 0;
                    const attendanceCount = 1 + approvedJoins;
                    return (
                      <div key={skill._id} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-200/70 hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden relative flex flex-col h-full ring-1 ring-transparent hover:ring-indigo-100/80">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-100/90 to-violet-100/40 rounded-bl-[2.5rem] z-0 opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />
                        <div className="relative z-10 flex flex-col flex-1 min-h-0">

                          {/* Header row: module + badges */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-md">{skill.moduleCode || "Gen"}</span>
                                {skill.isPublic && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase bg-indigo-600 text-white inline-flex items-center gap-0.5 shadow-sm"><Globe size={9} strokeWidth={2.5} /> Public</span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 leading-tight tracking-tight group-hover:text-indigo-700 transition-colors line-clamp-2">{skill.skillName}</h3>
                              <p className="text-xs font-medium text-slate-400 capitalize tracking-wide">{skill.subject}</p>
                            </div>
                            <div className="shrink-0">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase whitespace-nowrap shadow-sm ${
                                skill.skillLevel === "Beginner" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" :
                                skill.skillLevel === "Intermediate" ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100" :
                                "bg-rose-50 text-rose-800 ring-1 ring-rose-100"
                              }`}>{skill.skillLevel}</span>
                            </div>
                          </div>

                          {/* Description — grows to fill space */}
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 flex-1 mb-4">
                            {skill.description || "No description provided."}
                          </p>

                          {/* Metadata */}
                          <div className="rounded-2xl bg-slate-50/80 border border-slate-100 px-3 py-2.5 mb-4 space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-700">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm border border-indigo-100/80">
                                <Clock size={14} strokeWidth={2} />
                              </span>
                              <span>
                                {new Date(skill.availability).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                                <span className="text-slate-400 font-medium"> · </span>
                                {new Date(skill.availability).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
                              <span className="inline-flex items-center gap-1.5 min-w-0">
                                <User size={13} className="text-indigo-500 shrink-0" strokeWidth={2} />
                                <span className="font-medium text-slate-700 truncate max-w-[9rem] sm:max-w-[11rem]">{skill.providerName}</span>
                              </span>
                              {skill.mode && (
                                <span className="inline-flex items-center gap-1.5">
                                  {skill.mode === "Online" ? <Wifi size={13} className="text-indigo-500 shrink-0" strokeWidth={2} /> : <MapPin size={13} className="text-slate-400 shrink-0" strokeWidth={2} />}
                                  <span className="font-medium">{skill.mode}</span>
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-0.5 border border-slate-200/90 shadow-sm" title="Host plus approved joiners">
                                <Users size={13} className="text-indigo-500 shrink-0" strokeWidth={2} />
                                <span className="font-semibold tabular-nums text-slate-800">{attendanceCount}</span>
                                <span className="text-slate-500 font-medium">going</span>
                                {isMySkill && pendingJoins > 0 && (
                                  <span className="text-amber-700 font-semibold border-l border-slate-200 pl-2 ml-0.5">{pendingJoins} pending</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Action button — always at bottom */}
                          {isMySkill ? (
                            <button
                              type="button"
                              onClick={() => setActiveTab("activity")}
                              className="mt-auto w-full py-2.5 px-3 rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-white to-violet-50/60 text-indigo-800 hover:from-indigo-100/80 hover:border-indigo-300 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                            >
                              <LayoutDashboard size={16} className="text-indigo-600 shrink-0" />
                              Your session · Manage in Activity
                            </button>
                          ) : skill.isPublic ? (
                            joinStatus === "Approved" ? (
                              skill.meetingLink ? (
                                <a href={skill.meetingLink} target="_blank" rel="noopener noreferrer"
                                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 text-sm">
                                  <CheckCircle size={16} /> Join Meeting
                                </a>
                              ) : (
                                <span className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-2xl flex items-center justify-center gap-2 border border-emerald-200 text-sm">
                                  <CheckCircle size={16} /> Approved — Attend in Person
                                </span>
                              )
                            ) : joinStatus === "Pending" ? (
                              <div className="flex flex-col gap-2">
                                <span className="w-full py-3 bg-amber-50 text-amber-700 font-bold rounded-2xl flex items-center justify-center border border-amber-200 text-sm">
                                  ⏳ Awaiting Approval
                                </span>
                                {myJoin?._id && (
                                  <button
                                    type="button"
                                    disabled={actionBusy === `wj:${myJoin._id}`}
                                    onClick={() => handleWithdrawJoin(skill._id, myJoin._id)}
                                    className="w-full py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    {actionBusy === `wj:${myJoin._id}` ? "Withdrawing…" : "Withdraw request"}
                                  </button>
                                )}
                              </div>
                            ) : joinStatus === "Rejected" ? (
                              <span className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center border border-red-200 text-sm">
                                ✕ Request Rejected
                              </span>
                            ) : (
                              <button
                                onClick={() => handleJoinSession(skill)}
                                disabled={actionBusy === `join:${skill._id}`}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                              >
                                {actionBusy === `join:${skill._id}` ? <Loader2 size={18} className="animate-spin" /> : null}
                                Join Session
                              </button>
                            )
                          ) : (
                            <button onClick={() => !hasRequested(skill._id) && handleRequestHelp(skill)}
                              disabled={hasRequested(skill._id)}
                              className={`w-full py-3 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm ${
                                hasRequested(skill._id)
                                  ? "bg-emerald-600 text-white cursor-default shadow-emerald-100"
                                  : "bg-gray-900 text-white hover:bg-gray-800 active:scale-95"
                              }`}>
                              {hasRequested(skill._id) ? <><CheckCircle size={16} /> Requested</> : "Send Request"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-300">
                    <Search size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No skill sessions found.</p>
                    <button onClick={() => setIsOfferModalOpen(true)} className="text-indigo-600 font-bold text-sm hover:underline mt-2">Be the first to offer help!</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── REQUESTS TAB ─────────────────── */}
          {activeTab === "requests" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Learning Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Students who need help — volunteer to teach them</p>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 w-full md:w-[450px] px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-50 transition-all">
                <Search size={20} className="text-gray-400" />
                <input className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400 font-medium"
                  placeholder="Search by module, subject or topic..."
                  value={lrSearch} onChange={(e) => setLrSearch(e.target.value)} />
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  [1,2,3].map((i) => <div key={i} className="h-56 bg-gray-100 rounded-3xl animate-pulse" />)
                ) : filteredLR.length > 0 ? (
                  filteredLR.map((lr) => {
                    const isMyRequest = String(lr.requesterId || "") === String(uid || "") || lr.requesterName === user?.name;
                    const alreadyVolunteered = lr.volunteers?.some(
                      (v) => String(v.userId || "") === String(uid || "") || v.userName === user?.name
                    );
                    const isAcceptedVolunteer =
                      lr.acceptedVolunteer &&
                      (String(lr.acceptedVolunteer.userId || "") === String(uid || "") ||
                        lr.acceptedVolunteer.userName === user?.name);
                    const isFilled = lr.status === "Matched" || lr.status === "Closed";

                    return (
                      <div key={lr._id} className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative flex flex-col h-full">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-full -z-0 opacity-50 group-hover:opacity-10 transition-colors" />
                        <div className="relative z-10 flex flex-col flex-1">
                          <div className="flex items-start justify-between mb-4 gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2 py-0.5 rounded-md mb-1 w-fit block">{lr.moduleCode}</span>
                              <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-violet-600 transition-colors truncate">{lr.titleWhatIWantToLearn}</h3>
                              <p className="text-xs font-semibold text-gray-400 truncate">{lr.subject}</p>
                            </div>
                            <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase shrink-0 whitespace-nowrap ${lr.mode === "Online" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}>
                              {lr.mode === "Online" ? <span className="flex items-center gap-1"><Wifi size={9} /> Online</span> : <span className="flex items-center gap-1"><MapPin size={9} /> Offline</span>}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">{lr.description}</p>
                          
                          <div className="flex flex-wrap gap-3 mb-5 pt-3 border-t border-gray-50">
                            <span className="text-[10px] flex items-center gap-1 font-semibold text-gray-500 whitespace-nowrap"><User size={11} className="text-violet-400" /> {lr.requesterName}</span>
                            <span className="text-[10px] flex items-center gap-1 font-semibold text-gray-500 whitespace-nowrap"><Clock size={11} className="text-violet-400" /> {new Date(lr.preferredTime).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(lr.preferredTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <span className="text-[10px] flex items-center gap-1 font-semibold text-violet-500 whitespace-nowrap"><Star size={11} /> {lr.volunteers?.length || 0} volunteer{lr.volunteers?.length !== 1 ? "s" : ""}</span>
                          </div>

                          {/* Action button — always at bottom */}
                          {isMyRequest ? (
                            <button onClick={() => setActiveTab("activity")}
                              className="w-full py-3 bg-violet-100 text-violet-700 font-bold rounded-2xl text-sm hover:bg-violet-200 transition">
                              Your Request — View in Activity
                            </button>
                          ) : isAcceptedVolunteer ? (
                            <button onClick={() => setActiveTab("activity")}
                              className="w-full py-3 bg-emerald-600 text-white shadow-lg shadow-emerald-100 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm hover:bg-emerald-700 transition">
                              <CheckCircle size={16} /> Approved! Host Session
                            </button>
                          ) : isFilled ? (
                            <span className="w-full py-3 bg-gray-50 text-gray-400 font-bold rounded-2xl border border-gray-200 flex items-center justify-center text-sm">
                              Session Filled
                            </span>
                          ) : alreadyVolunteered ? (
                            <span className="w-full py-3 bg-amber-50 text-amber-700 font-bold rounded-2xl border border-amber-200 flex items-center justify-center gap-2 text-sm">
                              ⏳ Pending Approval
                            </span>
                          ) : (
                            <button onClick={() => setVolunteerTarget(lr)}
                              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-100 text-sm">
                              Volunteer to Help
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-300">
                    <HelpCircle size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No learning requests yet.</p>
                    <button onClick={() => setIsLearningRequestModalOpen(true)} className="text-violet-600 font-bold text-sm hover:underline mt-2">Post the first request!</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MY ACTIVITY TAB ──────────────── */}
          {activeTab === "activity" && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">My Activity</h2>
                  <p className="text-sm text-slate-500 mt-1">Everything you host, join, and request — in one place</p>
                </div>
                <div className="flex items-center bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                  <button onClick={() => setActivityView("list")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activityView === "list" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>List View</button>
                  <button onClick={() => setActivityView("calendar")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activityView === "calendar" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>Schedule View</button>
                </div>
              </div>

              {activityView === "list" ? (
                <div className="space-y-12 md:space-y-14">

                  {/* ── Your Skill Postings & Join Requests */}
                  <Section
                    title="Hosted sessions"
                    description="Skills you offer to others. Approve or reject join requests for public sessions."
                    icon={<Globe className="h-5 w-5 text-indigo-600" strokeWidth={2} />}
                    empty={mySkills.length === 0}
                    emptyText="You haven't posted any skills yet. Use Post a Skill on Explore to get started."
                  >
                    {mySkills.map((skill) => (
                      <div key={skill._id} className={`${ACTIVITY_CARD} space-y-4`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                              <Globe size={28} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-base font-bold text-gray-900">{skill.skillName}</h3>
                                {skill.isPublic && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider">Public</span>}
                              </div>
                              <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                                <span>{skill.moduleCode}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span>{new Date(skill.availability).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(skill.availability).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                            </div>
                          </div>
                          {skill.meetingLink && (
                            <a href={skill.meetingLink} target="_blank" rel="noopener noreferrer"
                              className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-2">
                              <Globe size={14} /> Meeting Link
                            </a>
                          )}
                        </div>

                        {/* Merged Join Requests View */}
                        {skill.joinRequests?.length > 0 && (
                          <div className="pt-3 border-t border-gray-50 mt-4">
                            <button onClick={() => setExpandedLR((p) => ({ ...p, [skill._id]: !p[skill._id] }))}
                              className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-600 uppercase tracking-widest w-full text-left transition mb-1">
                              {expandedLR[skill._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              Join Requests ({skill.joinRequests.length})
                            </button>
                            
                            {/* Expanded Area */}
                            <div className={`grid transition-all duration-300 overflow-hidden ${expandedLR[skill._id] ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
                              <div className="space-y-2 min-h-0">
                                {skill.joinRequests.map((jr) => (
                                  <div key={jr._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/90 p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{jr.userName?.charAt(0)}</div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-800">{jr.userName}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-0.5 inline-block ${jr.status === "Pending" ? "bg-amber-50 text-amber-600" : jr.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{jr.status}</span>
                                      </div>
                                    </div>
                                    <div className="shrink-0">
                                      {jr.status === "Pending" && (
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            disabled={!!actionBusy}
                                            onClick={() => handleJoinRequest(skill._id, jr._id, "Approved")}
                                            className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition disabled:opacity-50"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            type="button"
                                            disabled={!!actionBusy}
                                            onClick={() => handleJoinRequest(skill._id, jr._id, "Rejected")}
                                            className="px-4 py-1.5 bg-white text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </Section>

                  <Section
                    title="1:1 help requests"
                    description="Private requests tied to a specific skill posting — accept or complete from here."
                    icon={<Clock className="h-5 w-5 text-indigo-600" strokeWidth={2} />}
                    empty={myRequests.length === 0}
                    emptyText="No help requests yet. Open a skill on Explore and use Send Request."
                  >
                    {myRequests.map((req) => {
                      const isProvider = String(req.skillId?.userId || "") === String(uid || "");
                      return renderRequestCard(req, isProvider);
                    })}
                  </Section>

                  {/* ── Sessions I'm Joining */}
                  <Section
                    title="Sessions I'm attending"
                    description="Public sessions you asked to join, or sessions created when a learning match is made."
                    icon={<GraduationCap className="h-5 w-5 text-indigo-600" strokeWidth={2} />}
                    empty={myJoinedSessions.length === 0}
                    emptyText="You haven't joined any sessions yet. Join a public session from Explore."
                  >
                    {myJoinedSessions.map((skill) => {
                      const myJoin = skill.joinRequests?.find(
                        (j) => String(j.userId || "") === String(uid || "") || j.userName === user?.name
                      );
                      const isRequesterOfGeneratedSkill = myLearningRequests.some((lr) => lr.resultingSkillId === skill._id);
                      const effectiveStatus = myJoin?.status || (isRequesterOfGeneratedSkill ? "Approved" : "Pending");

                      return (
                        <div key={skill._id} className={`${ACTIVITY_CARD} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${effectiveStatus === "Approved" ? "bg-emerald-50 text-emerald-600" : effectiveStatus === "Rejected" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                              {effectiveStatus === "Approved" ? <CheckCircle size={28} /> : effectiveStatus === "Rejected" ? <X size={28} /> : <Clock size={28} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-1.5 rounded">{skill.moduleCode}</span>
                                <span className="text-sm font-bold text-gray-900">{skill.skillName}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">by {skill.providerName}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block ${effectiveStatus === "Approved" ? "bg-emerald-50 text-emerald-600" : effectiveStatus === "Rejected" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{effectiveStatus}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {effectiveStatus === "Approved" ? (
                              skill.meetingLink ? (
                                <a href={skill.meetingLink} target="_blank" rel="noopener noreferrer"
                                  className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
                                  <Globe size={14} /> Join Meeting
                                </a>
                              ) : (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">Attend in Person ✓</span>
                              )
                            ) : myJoin?.status === "Rejected" ? (
                              <span className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-200">Request Rejected</span>
                            ) : (
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">Pending Approval</span>
                                {myJoin?._id && myJoin.status === "Pending" && (
                                  <button
                                    type="button"
                                    disabled={actionBusy === `wj:${myJoin._id}`}
                                    onClick={() => handleWithdrawJoin(skill._id, myJoin._id)}
                                    className="text-[10px] font-bold text-gray-500 hover:text-gray-800 underline disabled:opacity-50"
                                  >
                                    Withdraw request
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Section>

                  {/* ── Your Learning Requests */}
                  <Section
                    title="Learning requests"
                    description="You asked the community for a tutor — review volunteers and accept one to start a session."
                    icon={<HelpCircle className="h-5 w-5 text-violet-600" strokeWidth={2} />}
                    empty={myLearningRequests.length === 0}
                    emptyText="You haven't posted a learning request yet. Use Request Help on the Requests tab."
                  >
                    {myLearningRequests.map((lr) => (
                      <div key={lr._id} className={`${ACTIVITY_CARD} space-y-4 border-violet-100/60 hover:border-violet-200/60`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                            <div className="h-14 w-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shrink-0">
                              <HelpCircle size={28} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <h3 className="text-base font-bold text-gray-900 truncate">{lr.titleWhatIWantToLearn}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${lr.status === "Open" ? "bg-emerald-50 text-emerald-600" : lr.status === "Matched" ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>{lr.status}</span>
                                {lr.status === "Open" && (
                                  <button
                                    type="button"
                                    disabled={actionBusy === `clr:${lr._id}`}
                                    onClick={() => handleCancelLearningRequest(lr._id)}
                                    className="text-[10px] font-bold text-red-600 border border-red-200 px-2 py-0.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                  >
                                    {actionBusy === `clr:${lr._id}` ? "…" : "Cancel"}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                                <span className="bg-gray-100 px-1.5 rounded">{lr.moduleCode}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0"></span>
                                <span className="truncate">{lr.description}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Volunteers (Open state) */}
                        {lr.status === "Open" && lr.volunteers?.length > 0 && (
                          <div className="pt-3 border-t border-gray-50">
                            <button onClick={() => setExpandedLR((p) => ({ ...p, [lr._id]: !p[lr._id] }))}
                              className="flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-600 uppercase tracking-widest w-full text-left transition mb-1">
                              {expandedLR[lr._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              Volunteers ({lr.volunteers.length})
                            </button>
                            
                            {/* Expanded Area */}
                            <div className={`grid transition-all duration-300 overflow-hidden ${expandedLR[lr._id] ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"}`}>
                              <div className="space-y-2 min-h-0">
                                {lr.volunteers.map((v, i) => (
                                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/90 p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">{v.userName?.charAt(0)}</div>
                                      <div>
                                        <p className="text-sm font-bold text-gray-800">{v.userName}</p>
                                        <p className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-1">"{v.message}"</p>
                                      </div>
                                    </div>
                                    <div className="shrink-0">
                                      <button
                                        type="button"
                                        disabled={actionBusy === `acc:${lr._id}`}
                                        onClick={() => handleAcceptVolunteer(lr._id, v.userId, v.userName)}
                                        className="px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 shadow-sm shadow-violet-200 transition disabled:opacity-50 flex items-center gap-1"
                                      >
                                        {actionBusy === `acc:${lr._id}` ? <Loader2 size={12} className="animate-spin" /> : null}
                                        Accept
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Matched State (Accepted Volunteer) */}
                        {lr.status === "Matched" && lr.acceptedVolunteer && (
                          <div className="pt-3 border-t border-gray-50">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <CheckCircle size={14} /> Accepted Volunteer
                            </h4>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 gap-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shrink-0">
                                  {lr.acceptedVolunteer.userName?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-emerald-900">{lr.acceptedVolunteer.userName}</p>
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Matched Partner</span>
                                </div>
                              </div>
                              {(() => {
                                const generatedSkill = skills.find((s) => s._id === lr.resultingSkillId);
                                return generatedSkill?.meetingLink ? (
                                  <a href={generatedSkill.meetingLink} target="_blank" rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 shadow-sm shadow-emerald-200">
                                    <Globe size={14} /> Join Meeting
                                  </a>
                                ) : (
                                  <span className="text-xs font-bold text-emerald-700 px-4 py-2 bg-emerald-100/50 rounded-xl">Attend in Person ✓</span>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </Section>

                  {/* ── My Volunteer Applications */}
                  <Section
                    title="Volunteer applications"
                    description="Places where you offered to teach — track whether the requester accepted you."
                    icon={<Star className="h-5 w-5 text-emerald-600" strokeWidth={2} />}
                    empty={myVolunteerApps.length === 0}
                    emptyText="You haven't volunteered yet. Browse open requests on the Requests tab."
                  >
                    {myVolunteerApps.map((lr) => {
                      const isAccepted =
                        String(lr.acceptedVolunteer?.userId || "") === String(uid || "") ||
                        lr.acceptedVolunteer?.userName === user?.name;
                      const isRejected = lr.status === "Matched" && !isAccepted;
                      
                      return (
                        <div key={lr._id} className={`${ACTIVITY_CARD} flex flex-col md:flex-row md:items-center justify-between gap-4 border-emerald-100/50 hover:border-emerald-200/50`}>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${isAccepted ? "bg-emerald-50 text-emerald-600" : isRejected ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>
                              {isAccepted ? <CheckCircle size={28} /> : isRejected ? <X size={28} /> : <Clock size={28} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-violet-600 uppercase bg-violet-50 px-1.5 rounded">{lr.moduleCode}</span>
                                <span className="text-sm font-bold text-gray-900">{lr.titleWhatIWantToLearn}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">requested by {lr.requesterName}</p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isAccepted ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">Request Approved! See Hosted Sessions</span>
                            ) : isRejected ? (
                              <span className="text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">Another Volunteer Accepted</span>
                            ) : (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">Waiting for Requester</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </Section>
                </div>
              ) : (
                /* Calendar View */
                <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="flex flex-col items-center lg:items-start">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Calendar size={20} className="text-indigo-600" /> Learning Calendar</h3>
                      <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 shadow-inner inline-block">
                        <style>{`.rdp{--rdp-accent-color:#4f46e5;--rdp-background-color:#e0e7ff;margin:0}.rdp-day_selected{background-color:var(--rdp-accent-color)!important;color:white!important;font-weight:bold;border-radius:12px}.rdp-day_has_meeting{position:relative;font-weight:bold;color:#4f46e5}.rdp-day_has_meeting::after{content:'';position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;background-color:#4f46e5;border-radius:50%}`}</style>
                        <DayPicker mode="single" selected={selectedDay}
                          onSelect={(day) => day && setSelectedDay(day)}
                          modifiers={{ hasMeeting: calendarMeetingDates }}
                          modifiersClassNames={{ hasMeeting: "rdp-day_has_meeting" }} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Agenda</h3>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {agendaForSelectedDay.length} Events
                        </span>
                      </div>
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                        {agendaForSelectedDay.map((ev) => (
                          <div key={ev.key} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${ev.kind === "learn" ? "bg-violet-50 text-violet-600" : ev.kind === "join" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>
                                  <Clock size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{ev.title}</h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] py-0.5 px-1.5 bg-gray-100 text-gray-700 rounded font-bold uppercase">{ev.sub}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{ev.kind === "skill" ? "Help request" : ev.kind === "learn" ? `Learning · ${ev.status || ""}` : "Attending"}</span>
                                    <span className="text-xs font-semibold text-gray-500">{ev.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                  </div>
                                </div>
                              </div>
                              {ev.meetingLink && (
                                <a href={ev.meetingLink} target="_blank" rel="noopener noreferrer"
                                  className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform shrink-0" title="Join Meeting">
                                  <Globe size={18} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        {agendaForSelectedDay.length === 0 && (
                          <div className="py-16 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                            <Clock size={32} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400">No events for this day</p>
                            <button onClick={() => setActiveTab("explore")} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Browse more skills</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <OfferSkillModal isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)} onSuccess={fetchData} />
      <RequestHelpModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} skill={selectedSkill} onSubmit={handleRequestSubmit} />
      <RequestLearningModal isOpen={isLearningRequestModalOpen} onClose={() => setIsLearningRequestModalOpen(false)} onSuccess={fetchData} />
      <VolunteerModal isOpen={!!volunteerTarget} onClose={() => setVolunteerTarget(null)} learningRequest={volunteerTarget} onSuccess={fetchData} />
    </div>
  );
};

// ── Section wrapper (My Activity) ───────────
const Section = ({ title, description, icon, empty, emptyText, children }) => (
  <section className="space-y-4">
    <header className="flex items-start gap-3 sm:gap-4 border-b border-slate-200/80 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p> : null}
      </div>
    </header>
    <div className="grid grid-cols-1 gap-3 md:gap-4">
      {empty ? (
        <div className={`${ACTIVITY_CARD} border-dashed py-12 text-center`}>
          <p className="text-sm text-slate-400 font-medium">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </div>
  </section>
);

export default SkillExchange;
