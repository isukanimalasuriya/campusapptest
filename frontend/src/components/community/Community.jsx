// frontend/src/components/community/Community.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, LogIn, Search, Globe, Lock } from "lucide-react";
import API from "../../api.jsx";

import GroupCard from "./GroupCard";
import CreateGroupModal from "./CreateGroupModal";
import JoinGroupModal from "./JoinGroupModal";
import Navbar from "../Navbar";

const Community = () => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const [myRes, pubRes] = await Promise.all([
        API.get("/api/groups/my-groups"),
        API.get("/api/groups/public"),
      ]);
      setMyGroups(myRes.data.data);
      setGroups(pubRes.data.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupId) => navigate(`/community/${groupId}`);

  // Calculate stats
  const totalMyGroups = myGroups.length;
  const totalPublicGroups = groups.length;
  const totalPrivateGroupsUserIsIn = myGroups.filter((g) => !g.isPublic).length;

  const filteredMyGroups = myGroups.filter((g) =>
    [g.name, g.course, g.topic].some((f) =>
      f?.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  const filteredPublicGroups = groups.filter(
    (g) =>
      !myGroups.some((mg) => mg._id === g._id) &&
      [g.name, g.course, g.topic].some((f) =>
        f?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="font-poppins flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-white/70 text-sm font-medium tracking-wide uppercase">
                  Connect & Collaborate
                </p>
                <h2 className="text-2xl md:text-3xl font-bold mt-1">
                  Study Groups
                </h2>
                <p className="text-white/70 mt-2 text-sm max-w-xl">
                  Create or join study groups, share resources, and learn
                  together.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all duration-150 flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus size={17} /> Create Group
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-white/15 border border-white/30 text-white font-semibold text-sm hover:bg-white/25 active:scale-95 transition-all duration-150 flex items-center gap-2 cursor-pointer"
                >
                  <LogIn size={17} /> Join with Code
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                <span className="text-sm text-white/75 flex items-center gap-2">
                  <Users size={15} /> Your Groups
                </span>
                <span className="font-bold text-lg">{totalMyGroups}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                <span className="text-sm text-white/75 flex items-center gap-2">
                  <Globe size={15} /> Public Groups
                </span>
                <span className="font-bold text-lg">{totalPublicGroups}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                <span className="text-sm text-white/75 flex items-center gap-2">
                  <Lock size={15} /> Private Groups
                </span>
                <span className="font-bold text-lg">
                  {totalPrivateGroupsUserIsIn}
                </span>
              </div>
            </div>
          </section>

          {/* Search + Tabs + Grid */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1 max-w-md px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                  placeholder="Search by name, course, or topic..."
                />
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {[
                  {
                    key: "my",
                    label: `My Groups (${filteredMyGroups.length})`,
                  },
                  {
                    key: "discover",
                    label: `Discover (${filteredPublicGroups.length})`,
                  },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                      activeTab === key
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeTab === "my" &&
                filteredMyGroups.map((g) => (
                  <GroupCard
                    key={g._id}
                    group={g}
                    onClick={() => handleGroupClick(g._id)}
                    showJoinButton={false}
                  />
                ))}
              {activeTab === "discover" &&
                filteredPublicGroups.map((g) => (
                  <GroupCard
                    key={g._id}
                    group={g}
                    onClick={() => handleGroupClick(g._id)}
                    showJoinButton={true}
                    onJoinSuccess={fetchGroups}
                  />
                ))}
            </div>

            {/* Empty States */}
            {activeTab === "my" && filteredMyGroups.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-indigo-400" />
                </div>
                <p className="text-gray-700 font-semibold">No groups yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Create your first group or join with an invite code
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            )}
            {activeTab === "discover" && filteredPublicGroups.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                  <Search size={28} className="text-purple-400" />
                </div>
                <p className="text-gray-700 font-semibold">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No public groups available"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm
                    ? "Try a different search term"
                    : "Check back later for new groups!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchGroups();
            setShowCreateModal(false);
          }}
        />
      )}
      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            fetchGroups();
            setShowJoinModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Community;
