// frontend/src/components/community/GroupCard.jsx
import React, { useState } from "react";
import { Users, Globe, Lock, User, Tag, Loader2 } from "lucide-react";
import axios from "axios";

const GroupCard = ({ group, onClick, showJoinButton = false, onJoinSuccess }) => {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  const memberCount = group.members?.length || 1;
  const isFull = memberCount >= group.maxMembers;
  const token = localStorage.getItem("token");

  const handleJoin = async (e) => {
    e.stopPropagation();
    setJoining(true);
    setError("");
    try {
      await axios.post(
        "http://localhost:5000/api/groups/join",
        { inviteCode: group.inviteCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoined(true);
      if (onJoinSuccess) onJoinSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 cursor-pointer group relative overflow-hidden"
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-2xl" />

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-indigo-700 transition-colors duration-200">
          {group.name}
        </h3>
        {group.isPublic ? (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <Globe size={11} /> Public
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <Lock size={11} /> Private
          </span>
        )}
      </div>

      {/* Category Badge */}
      {group.category && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-600 font-medium">
            <Tag size={11} />
            {group.category}
          </span>
        </div>
      )}

      {/* Course & Topic Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium">
          {group.course}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium">
          {group.topic}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
        {group.description || "No description provided"}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1">
          <Users size={13} />
          <span>{memberCount} / {group.maxMembers}</span>
          {isFull && <span className="ml-1 text-red-400 font-medium">· Full</span>}
        </div>
        <div className="flex items-center gap-1">
          <User size={13} />
          <span className="truncate max-w-[90px]">{group.creator?.name || "User"}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {/* Join Button */}
      {showJoinButton && (
        <button
          onClick={handleJoin}
          disabled={isFull || joining || joined}
          className={`mt-4 w-full py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer
            ${joined
              ? "bg-green-50 text-green-600 border border-green-200"
              : isFull
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm hover:shadow-md"
            }`}
        >
          {joining ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Joining...
            </span>
          ) : joined ? "✓ Joined!" : isFull ? "Group Full" : "Join Group"}
        </button>
      )}
    </div>
  );
};

export default GroupCard;