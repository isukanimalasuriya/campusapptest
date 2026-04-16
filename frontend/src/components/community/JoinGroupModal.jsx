// frontend/src/components/community/JoinGroupModal.jsx
import React, { useState } from "react";
import { X, LogIn, KeyRound } from "lucide-react";
import API from "../../api.jsx";

const JoinGroupModal = ({ onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post(
        "/api/groups/join",
        { inviteCode: inviteCode.toUpperCase() }
      );
      if (res.data.success) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid invite code or group not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                <KeyRound size={20} />
              </div>
              <h2 className="text-xl font-bold">Join a Group</h2>
              <p className="text-white/70 text-sm mt-1">Enter the invite code from your group admin</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invite Code</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              required maxLength={8} autoFocus
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl outline-none text-center text-2xl font-mono tracking-[0.4em] font-bold text-indigo-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all bg-indigo-50/30 placeholder:text-gray-300 placeholder:text-lg placeholder:tracking-widest placeholder:font-normal"
              placeholder="XXXXXXXX"
            />
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    i < inviteCode.length ? "bg-indigo-500 scale-110" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">{inviteCode.length}/8 characters</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || inviteCode.length !== 8}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <LogIn size={15} />
              {loading ? "Joining..." : "Join Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal;