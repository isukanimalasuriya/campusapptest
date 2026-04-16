import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Shield, LayoutDashboard, Building2, Ticket, LogOut } from "lucide-react";
import { useUser } from "../../context/UserContext";

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
    isActive
      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
      : "text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
  }`;

export default function AdminNavbar({ extraActions = null }) {
  const navigate = useNavigate();
  const { logout } = useUser();

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20 font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow">
              <Shield className="w-5 h-5" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">CampusCompanion</p>
              <p className="text-sm font-extrabold text-slate-900">Admin</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1 bg-slate-100/80 rounded-xl p-1 border border-slate-200/80">
            <NavLink to="/admin/dashboard" className={navLinkClass} end>
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              Dashboard
            </NavLink>
            <NavLink to="/admin/study-spaces" className={navLinkClass}>
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              Study spaces
            </NavLink>
            <NavLink to="/admin/tickets" className={navLinkClass}>
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              Support tickets
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          {extraActions}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-white px-3 py-1.5 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
