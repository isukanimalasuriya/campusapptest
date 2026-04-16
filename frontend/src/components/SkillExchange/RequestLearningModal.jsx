import React, { useState, useRef } from "react";
import { X, Calendar, Clock, Globe } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { SLIIT_SUBJECTS } from "../../data/sliitSubjects";
import API from "../../api";
import { toast } from "react-toastify";

const RequestLearningModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    subject: "",
    moduleCode: "",
    titleWhatIWantToLearn: "",
    description: "",
    skillLevel: "Beginner",
    mode: "Online"
  });
  const { user } = useUser();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const subjectRef = useRef(null);
  const titleRef = useRef(null);
  const dateRef = useRef(null);
  const timeRef = useRef(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.subject) newErrors.subject = true;
    if (!formData.titleWhatIWantToLearn.trim()) newErrors.titleWhatIWantToLearn = true;
    if (!date) newErrors.date = true;
    if (!time) newErrors.time = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in the highlighted required fields");
      
      // Auto-focus the first empty field
      if (newErrors.subject) subjectRef.current?.focus();
      else if (newErrors.titleWhatIWantToLearn) titleRef.current?.focus();
      else if (newErrors.date) dateRef.current?.focus();
      else if (newErrors.time) timeRef.current?.focus();
      
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const combinedTime = new Date(`${date}T${time}`);
      await API.post("/skills/learning-request", {
        ...formData,
        requesterName: user.name,
        requesterId: user.id || user._id,
        preferredTime: combinedTime.toISOString()
      });
      toast.success("Learning request posted!");
      onSuccess?.();
      onClose();
      setFormData({
        subject: "",
        moduleCode: "",
        titleWhatIWantToLearn: "",
        description: "",
        skillLevel: "Beginner",
        mode: "Online"
      });
      setDate("");
      setTime("");
    } catch (error) {
      console.error("Error posting request:", error);
      toast.error(error.response?.data?.message || "Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-6 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Request to Learn</h2>
              <p className="text-violet-200 text-sm mt-0.5">Post what you need help with</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject *</label>
                <select
                  ref={subjectRef}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition text-sm cursor-pointer ${
                    errors.subject ? "border-red-500" : "border-gray-200 focus:border-violet-500"
                  } bg-white`}
                  value={formData.subject}
                  onChange={(e) => {
                    const sub = SLIIT_SUBJECTS.find(s => s.name === e.target.value);
                    setFormData(prev => ({ ...prev, subject: e.target.value, moduleCode: sub ? sub.code : "" }));
                    if (errors.subject) setErrors(prev => ({ ...prev, subject: false }));
                  }}
                >
                  <option value="">Select Subject</option>
                  {SLIIT_SUBJECTS.map(s => (
                    <option key={s.code} value={s.name}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Module Code</label>
                <input
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 outline-none transition text-sm"
                  placeholder="e.g. IT2010"
                  value={formData.moduleCode}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Specific Skill (What to Learn) *</label>
              <input
                ref={titleRef}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition bg-white ${
                  errors.titleWhatIWantToLearn ? "border-red-500" : "border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                }`}
                placeholder="e.g. React Hooks, Binary Trees"
                value={formData.titleWhatIWantToLearn}
                onChange={(e) => handleChange("titleWhatIWantToLearn", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 outline-none transition resize-none text-sm"
                placeholder="Briefly describe what you're struggling with..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">My Current Level</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-violet-500 transition cursor-pointer"
                value={formData.skillLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, skillLevel: e.target.value }))}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mode</label>
              <div className="flex gap-2">
                {["Online", "Offline"].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mode: m }))}
                    className={`flex-1 py-2 rounded-xl border font-medium transition ${formData.mode === m
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Section */}
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock size={16} className="text-violet-500" />
                Preferred Time *
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.date ? "text-red-400" : "text-violet-400 group-focus-within:text-violet-600"}`} size={16} />
                  <input
                    ref={dateRef}
                    type="date"
                    className={`w-full pl-10 pr-3 py-3 rounded-2xl border outline-none transition-all text-xs font-semibold appearance-none shadow-sm ${
                      errors.date ? "border-red-500" : "border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                    } bg-gray-50/50 focus:bg-white text-gray-700`}
                    style={{ colorScheme: 'light' }}
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => { setDate(e.target.value); if(errors.date) setErrors(prev => ({ ...prev, date: false })); }}
                  />
                </div>
                <div className="relative group">
                  <Clock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.time ? "text-red-400" : "text-violet-400 group-focus-within:text-violet-600"}`} size={16} />
                  <input
                    ref={timeRef}
                    type="time"
                    className={`w-full pl-10 pr-3 py-3 rounded-2xl border outline-none transition-all text-xs font-semibold appearance-none shadow-sm ${
                      errors.time ? "border-red-500" : "border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                    } bg-gray-50/50 focus:bg-white text-gray-700`}
                    style={{ colorScheme: 'light' }}
                    value={time}
                    onChange={(e) => { setTime(e.target.value); if(errors.time) setErrors(prev => ({ ...prev, time: false })); }}
                  />
                </div>
              </div>

              {/* Summary Preview */}
              {(date || time) && (
                <div className="p-3 rounded-2xl bg-violet-50/50 border border-violet-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md">
                      <Calendar size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Selected Slot</span>
                      <span className="text-xs font-bold text-violet-900">
                        {date ? new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : "---"} at {time || "---"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pr-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Ready</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-lg">
                  {user.avatar}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Requesting As</label>
                  <div className="text-gray-900 font-bold text-sm">{user.name}</div>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <div className="flex-1 text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ID</span>
                <span className="text-xs font-mono text-gray-500">{(user.id || user._id || "").slice(-5)}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition shadow-lg shadow-violet-200 disabled:opacity-50"
              >
                {loading ? "Posting..." : "Post Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestLearningModal;
