// src/context/UserContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import API, { setAuthToken } from "../api";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      API.get("/auth/me")
        .then((res) => {
          const u = res.data.user || res.data;

          // Generate initials for avatar
          const initials = (u.name || "")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          setUser({ ...u, avatar: initials });
          // Store role in localStorage
          if (u.role) {
            localStorage.setItem("role", u.role);
          }
        })
        .catch(() => {
          // Remove invalid token & role
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setUser(null);
        });
    }
  }, []);

  // Optional: logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setAuthToken(null);
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the User context
export function useUser() {
  return useContext(UserContext);
}