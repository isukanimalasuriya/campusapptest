import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Settings,
  LogOut,
  Users,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import API from "../api";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/studyareas", icon: BookOpen, label: "Study Areas" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/skill-exchange", icon: BookOpen, label: "Skill Exchange" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

  /* ── Desktop sidebar ── */
  .nav-sidebar {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: 256px;
    background: #fff;
    box-shadow: 4px 0 24px rgba(0,0,0,.06);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    z-index: 200;
    font-family: 'DM Sans', sans-serif;
    transition: transform .3s cubic-bezier(.4,0,.2,1);
  }

  .nav-logo {
    font-size: 18px;
    font-weight: 800;
    color: #6366f1;
    margin-bottom: 36px;
    padding: 0 8px;
    letter-spacing: -.3px;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    text-decoration: none;
    transition: background .15s, color .15s;
    margin-bottom: 4px;
  }
  .nav-link:hover { background: #f3f4f6; color: #6366f1; }
  .nav-link.active {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    box-shadow: 0 4px 12px rgba(99,102,241,.35);
  }

  .nav-logout {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 12px;
    font-size: 14px; font-weight: 500;
    color: #ef4444; background: none; border: none;
    cursor: pointer; width: 100%;
    transition: background .15s;
    font-family: 'DM Sans', sans-serif;
    margin-top: 4px;
  }
  .nav-logout:hover { background: #fef2f2; }

  .nav-profile {
    margin-top: auto;
    display: flex; align-items: center; gap: 12px;
    padding: 12px; border-radius: 14px;
    cursor: pointer; transition: background .15s;
  }
  .nav-profile:hover { background: #f9fafb; }

  .nav-avatar {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-weight: 700; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative;
  }
  .nav-avatar-dot {
    position: absolute; bottom: -2px; right: -2px;
    width: 11px; height: 11px; background: #22c55e;
    border: 2px solid #fff; border-radius: 50%;
  }
  .nav-profile-name { font-size: 13px; font-weight: 700; color: #111827; }
  .nav-profile-id { font-size: 11px; color: #9ca3af; margin-top: 1px; }

  /* ── Mobile hamburger toggle (shows on small screens) ── */
  .nav-hamburger {
    display: none;
    position: fixed;
    top: 14px; left: 14px;
    z-index: 300;
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 12px;
    padding: 8px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,.1);
    color: #374151;
  }

  /* ── Overlay ── */
  .nav-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.4);
    z-index: 199;
    backdrop-filter: blur(2px);
  }
  .nav-overlay.open { display: block; }

  /* ── Bottom tab bar (mobile) ── */
  .nav-tabbar {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #fff;
    border-top: 1.5px solid #f3f4f6;
    box-shadow: 0 -4px 20px rgba(0,0,0,.08);
    z-index: 200;
    padding: 8px 4px;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }
  .nav-tabbar-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  .nav-tab {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 10px; border-radius: 12px;
    text-decoration: none; color: #9ca3af;
    font-size: 10px; font-weight: 600;
    transition: color .15s, background .15s;
    min-width: 52px;
  }
  .nav-tab:hover { color: #6366f1; }
  .nav-tab.active { color: #6366f1; background: #eef2ff; }

  /* ── Responsive breakpoints ── */
  @media (max-width: 1024px) {
    /* Tablet: icon-only rail */
    .nav-sidebar {
      width: 72px;
      padding: 20px 10px;
      align-items: center;
    }
    .nav-logo { font-size: 20px; margin-bottom: 28px; text-align: center; }
    .nav-logo-text { display: none; }
    .nav-link { padding: 12px; justify-content: center; gap: 0; border-radius: 14px; }
    .nav-link span { display: none; }
    .nav-logout { padding: 12px; justify-content: center; gap: 0; }
    .nav-logout span { display: none; }
    .nav-profile { flex-direction: column; gap: 4px; padding: 8px 4px; }
    .nav-profile-info { display: none; }
  }

  @media (max-width: 640px) {
    .nav-sidebar {
      transform: translateX(-100%);
      width: 260px;
      padding: 24px 16px;
      align-items: stretch;
    }
    .nav-sidebar.open { transform: translateX(0); }
    .nav-link { padding: 11px 14px; justify-content: flex-start; gap: 12px; }
    .nav-link span { display: inline; }
    .nav-logout { padding: 11px 14px; justify-content: flex-start; gap: 12px; }
    .nav-logout span { display: inline; }
    .nav-profile { flex-direction: row; padding: 12px; }
    .nav-profile-info { display: block; }
    .nav-logo { font-size: 18px; }
    .nav-logo-text { display: inline; }
    /* Show hamburger & tabbar on mobile */
    .nav-hamburger { display: flex; }
    .nav-tabbar { display: block; }
    /* Hide desktop sidebar nav links on mobile (use tabbar instead) */
    .nav-sidebar .nav-items { display: none; }
    .nav-sidebar .nav-logout { display: none; }
    .nav-sidebar .nav-profile { display: none; }
  }
`;

export default function Navbar() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await API.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data.user || res.data);
      } catch {}
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // Primary 5 nav items for the bottom tab bar
  const tabItems = navItems.slice(0, 5);

  return (
    <>
      <style>{css}</style>

      {/* Mobile hamburger button */}
      <button className="nav-hamburger" onClick={() => setOpen(true)}>
        <Menu size={20} />
      </button>

      {/* Overlay */}
      <div
        className={`nav-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`nav-sidebar ${open ? "open" : ""}`}>
        <div className="nav-logo">
          CC
          <span className="nav-logo-text" style={{ marginLeft: 4 }}>
            ampusCompanion
          </span>
        </div>

        {/* Close btn — mobile only */}
        {open && (
          <button
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            <X size={20} />
          </button>
        )}

        <nav
          className="nav-items"
          style={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="nav-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <div
          className="nav-profile"
          onClick={() => {
            navigate("/profile");
            setOpen(false);
          }}
        >
          <div className="nav-avatar">
            {student ? getInitials(student.name) : "SC"}
            <span className="nav-avatar-dot" />
          </div>
          <div className="nav-profile-info">
            <div className="nav-profile-name">{student?.name || "Student"}</div>
            <div className="nav-profile-id">
              {student?.studentId || "Campus User"}
            </div>
          </div>
        </div>
      </aside>

      {/* Bottom Tab Bar — mobile */}
      <nav className="nav-tabbar">
        <div className="nav-tabbar-inner">
          {tabItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-tab ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
