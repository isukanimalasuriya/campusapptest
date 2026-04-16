import { useState } from "react";
import API, { setAuthToken } from "../api";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, GraduationCap } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../context/UserContext";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { setUser } = useUser();

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // Clear field error
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)
    ) {
      newErrors.email = "Enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await API.post("/auth/login", form);
      toast.success("Login successful!");

      // Store token
      localStorage.setItem("token", res.data.token);
      setAuthToken(res.data.token);

      // Immediately update the user context so Dashboard doesn't see null
      const userData = res.data.user || res.data;
      const mappedUser = { ...userData, id: userData.id || userData._id };
      const initials = (mappedUser.name || "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      setUser({ ...mappedUser, avatar: initials });

      // Store role in localStorage
      if (userData.role) {
        localStorage.setItem("role", userData.role);
      }

      // Redirect based on role
      const dashboardPath = userData.role === "admin" ? "/admin/dashboard" : "/dashboard";
      setTimeout(() => navigate(dashboardPath), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Left Side Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white p-2 rounded-lg shadow-xl">
              <GraduationCap className="text-indigo-700 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Campus Portal</h1>
          </div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            Welcome Back!
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            Access your courses, grades, and campus resources in one unified
            dashboard.
          </p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden flex items-center gap-2">
            <GraduationCap className="text-indigo-600 w-6 h-6" />
            <span className="font-bold text-xl text-slate-900 tracking-tight">
              Campus Portal
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Login</h2>
            <p className="text-slate-500">
              Enter your credentials to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${errors.email ? "border-red-500" : "border-slate-200"
                    }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${errors.password ? "border-red-500" : "border-slate-200"
                    }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center group"
            >
              Log In
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 font-bold hover:text-indigo-700"
            >
              Register
            </Link>
          </p>

          {/* ✅ ToastContainer inside this page */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            theme="colored"
          />
        </div>
      </div>
    </div>
  );
}
