import { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  IdCard,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const [form, setForm] = useState({
    studentId: "",
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // Clear error while typing
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    // Full Name
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z\s]+$/.test(form.name)) {
      newErrors.name = "Name can only contain letters and spaces";
    }

    // Student ID: e.g., IT1234567
    if (!form.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    } else if (!/^[A-Z]{2}\d{7}$/.test(form.studentId)) {
      newErrors.studentId = "Student ID must be like IT1234567";
    }

    // Replace the email validation regex in Register.jsx
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)
    ) {
      newErrors.email = "Enter a valid email address";
    }

    // Password: min 8 chars, 1 number, 1 special char
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (!/^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(form.password)) {
      newErrors.password =
        "Password must be at least 8 characters, include a number and a special character";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return; // Stop if validation fails

    try {
      await API.post("/auth/register", form);
      toast.success("🎉 Registered successfully!");

      // Clear form
      setForm({ studentId: "", name: "", email: "", password: "" });

      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed!");
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
            Elevate your academic journey.
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            Access your courses, grades, and campus resources in one unified,
            sleek dashboard.
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
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Create Account
            </h2>
            <p className="text-slate-500">
              Enter your credentials to access the student hub.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${
                    errors.name ? "border-red-500" : "border-slate-200"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Student ID
              </label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="studentId"
                  type="text"
                  placeholder="e.g. IT1234567"
                  value={form.studentId}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${
                    errors.studentId ? "border-red-500" : "border-slate-200"
                  }`}
                />
              </div>
              {errors.studentId && (
                <p className="text-red-500 text-sm mt-1">{errors.studentId}</p>
              )}
            </div>

            {/* University Email */}
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
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${
                    errors.email ? "border-red-500" : "border-slate-200"
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
                  className={`w-full pl-11 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${
                    errors.password ? "border-red-500" : "border-slate-200"
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
              Sign Up
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 text-sm">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-indigo-600 font-bold hover:text-indigo-700"
            >
              Log in
            </Link>
          </p>

          {/* ToastContainer inside this page */}
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
