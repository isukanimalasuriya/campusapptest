import React, { useState, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import API from "../../api";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";

const VolunteerModal = ({ isOpen, onClose, learningRequest, onSuccess }) => {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (learningRequest) setMessage("");
  }, [learningRequest?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id && !user?._id) {
      toast.error("Please log in to volunteer");
      return;
    }
    if (!message.trim()) {
      toast.error("Please explain why you can help");
      return;
    }
    setSubmitting(true);
    try {
      await API.post(`/skills/learning-request/${learningRequest._id}/volunteer`, {
        userId: user?.id || user?._id,
        userName: user?.name || "Anonymous",
        message,
      });
      toast.success("You've volunteered to help!");
      setMessage("");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to volunteer");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !learningRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Volunteer to Help</h2>
              <p className="text-emerald-100 text-sm mt-0.5 line-clamp-1">
                "{learningRequest.titleWhatIWantToLearn}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Context */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              {learningRequest.moduleCode} · {learningRequest.subject}
            </p>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              {learningRequest.description}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Requested by <span className="font-bold text-gray-500">{learningRequest.requesterName}</span>
            </p>
          </div>

          {/* How can you help */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              How can you help? *
            </label>
            <div className="flex gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 transition">
              <MessageSquare size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="e.g. I took this module last semester and scored 90%, happy to walk through the concepts..."
                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400 resize-none"
                required
              />
            </div>
          </div>

          <p className="text-[10px] text-gray-400">
            Session mode follows the request: <span className="font-bold text-gray-600">{learningRequest.mode}</span>
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-emerald-100 disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Volunteer to Help"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VolunteerModal;
