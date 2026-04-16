import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://campus-app-backend-yd8t.onrender.com";

/** Socket.IO server origin (no `/api` suffix). */
export const SOCKET_ORIGIN =
  import.meta.env.VITE_SOCKET_URL ||
  API_BASE.replace(/\/?api\/?$/i, "").replace(/\/$/, "") ||
  "https://campus-app-backend-yd8t.onrender.com";

const API = axios.create({
  baseURL: API_BASE,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
};

export default API;
