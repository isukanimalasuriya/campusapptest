import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, User, Settings, LogOut, Users, BookOpen } from "lucide-react";
import API from "../api";

const Navbar = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);

  const linkClass =
    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium";

  const activeClass =
    "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg";

  const inactiveClass =
    "text-gray-600 hover:bg-gray-100 hover:text-indigo-600";

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await API.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data.user || res.data);
      } catch (err) {
        console.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Get initials
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <aside className="h-screen w-64 bg-white shadow-xl p-6 font-poppins flex flex-col">
      
      {/* Logo */}
      <div className="text-xl font-bold text-indigo-600 mb-10 whitespace-nowrap tracking-tight">
        CampusCompanion
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Home size={20} />
          Home
        </NavLink>

        <NavLink
          to="/studyareas"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <BookOpen size={20} />
          Study Areas
        </NavLink>

        <NavLink
          to="/community"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Users size={20} />
          Community
        </NavLink>

        <NavLink
          to="/skill-exchange"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <BookOpen size={20} />
          Skill Exchange
        </NavLink>

        <NavLink
          to="/profile"
          
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <User size={20} />
          Profile
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
      >
        <LogOut size={20} />
        Logout
      </button>

      {/* Profile Section (NEW 🔥) */}
      <div
        onClick={() => navigate("/profile")}
        className="mt-auto flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold">
            {student ? getInitials(student.name) : "SC"}
          </div>

          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
        </div>

        {/* User Info */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {student?.name || "Student"}
          </p>
          <p className="text-xs text-gray-500">
            {student?.studentId || "Campus User"}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;