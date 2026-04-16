// pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API, { setAuthToken } from "../api";
import { useUser } from "../context/UserContext";
import { ToastContainer, toast } from "react-toastify";
import {
  LogOut,
  ShieldCheck,
  User,
  IdCard,
  Mail,
  GraduationCap,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export default function Profile() {
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first");
        navigate("/");
        return;
      }
      try {
        const res = await API.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data.user || res.data);
      } catch (err) {
        toast.error("Failed to fetch profile");
        navigate("/");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
    toast.success("Logged out successfully");
    setTimeout(() => navigate("/"), 1000);
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-poppins overflow-hidden">
      {/* Sidebar */}
      <Navbar />

      {/* Main content — takes all remaining space */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {/* Card fills full width up to a comfortable max */}
        <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-36 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="px-8 pb-10">
            {/* Avatar row */}
            <div className="flex items-end justify-between -mt-14 mb-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white">
                  {getInitials(student.name)}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>

            {/* Name + badge */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                {student.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-indigo-600 font-medium">
                  Verified Student
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 mb-6" />

            {/* Info grid — 2 cols, stretches full card width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard
                icon={<User className="w-4 h-4" />}
                label="Full Name"
                value={student.name}
                color="indigo"
              />
              <InfoCard
                icon={<IdCard className="w-4 h-4" />}
                label="Student ID"
                value={student.studentId}
                color="violet"
              />
              <InfoCard
                icon={<Mail className="w-4 h-4" />}
                label="Email Address"
                value={student.email}
                color="sky"
              />
              <InfoCard
                icon={<GraduationCap className="w-4 h-4" />}
                label="Role"
                value="Undergraduate"
                color="purple"
              />
            </div>
          </div>
        </div>
      </main>

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
}

/* ── helpers ── */

const colorMap = {
  indigo: { wrap: "bg-indigo-50 text-indigo-600", label: "text-indigo-400" },
  violet: { wrap: "bg-violet-50 text-violet-600", label: "text-violet-400" },
  sky: { wrap: "bg-sky-50    text-sky-600", label: "text-sky-400" },
  purple: { wrap: "bg-purple-50 text-purple-600", label: "text-purple-400" },
};

function InfoCard({ icon, label, value, color }) {
  const c = colorMap[color];
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-200">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.wrap}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${c.label}`}
        >
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
