import React from "react";
import { Link } from "react-router-dom";
import { Building2, Ticket, ChevronRight } from "lucide-react";
import AdminNavbar from "./admin/AdminNavbar";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 font-poppins flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Admin dashboard</h1>
        <p className="text-sm text-slate-500 mb-8">Choose an area to manage.</p>

        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
          <Link
            to="/admin/study-spaces"
            className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 mb-4 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Study spaces</h2>
            <p className="text-sm text-slate-500">
              Add study spaces, tables, and seat counts for student bookings.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-indigo-600 group-hover:underline">
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/admin/tickets"
            className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-105 transition-transform">
              <Ticket className="w-6 h-6" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Support tickets</h2>
            <p className="text-sm text-slate-500">
              View and reply to student support requests.
            </p>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-indigo-600 group-hover:underline">
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
