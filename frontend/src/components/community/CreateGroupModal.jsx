// frontend/src/components/community/CreateGroupModal.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  BookOpen,
  Tag,
  AlignLeft,
  Hash,
  Globe,
  Lock,
  ChevronDown,
  Check,
  Plus,
} from "lucide-react";
import axios from "axios";
import API from "../../api.jsx";

const CATEGORIES = [
  "General Discussion",
  "Exams",
  "Mid Exam",
  "Final Exam",
  "Lab Test",
  "Viva",
  "Research",
  "Assignment Help",
  "Project Collaboration",
];

const CreateGroupModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    topic: "",
    description: "",
    category: "General Discussion",
    isPublic: true,
    maxMembers: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const token = localStorage.getItem("token");

  // Handle escape key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post(
        "/api/groups",
        formData,
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        handleClose();
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = (category) => {
    setFormData((p) => ({ ...p, category }));
    setShowCategoryDropdown(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-200 ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="font-poppins bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                  <Plus size={20} />
                </div>
                <h2 className="text-xl font-bold">Create Study Group</h2>
                <p className="text-white/70 text-sm mt-1">
                  Set up your group and invite members to collaborate
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form - Scrollable area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="JavaScript Masters"
                  />
                </div>
              </div>

              {/* Course and Topic */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="ITPM"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="React Hooks"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowCategoryDropdown(!showCategoryDropdown)
                    }
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-left bg-gray-50 hover:bg-white focus:bg-white transition-all duration-200 cursor-pointer flex items-center justify-between"
                  >
                    <span
                      className={
                        formData.category ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {formData.category || "Select category"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-200 ${showCategoryDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => selectCategory(category)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between group"
                        >
                          <span className="text-gray-700">{category}</span>
                          {formData.category === category && (
                            <Check size={14} className="text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <AlignLeft
                    size={16}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    placeholder="What will you study? Who should join?"
                  />
                </div>
              </div>

              {/* Max Members and Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Members
                  </label>
                  <div className="relative">
                    <Users
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="number"
                      name="maxMembers"
                      value={formData.maxMembers}
                      onChange={handleChange}
                      min="2"
                      max="200"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">2 – 200 members</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, isPublic: !p.isPublic }))
                    }
                    className="w-full py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:shadow-sm"
                  >
                    {formData.isPublic ? (
                      <>
                        <Globe size={16} className="text-green-600" />
                        <span className="text-green-700">Public Group</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} className="text-gray-600" />
                        <span className="text-gray-700">Private Group</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    {formData.isPublic
                      ? "Anyone can discover and join"
                      : "Invite only via code"}
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Group"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateGroupModal;
