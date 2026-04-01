import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate on page load
  useEffect(() => {
    try {
      const t = localStorage.getItem("stc_token");
      const u = localStorage.getItem("stc_user");
      if (t && u) {
        const parsed = JSON.parse(u);
        setToken(t);
        setUser(parsed);
        API.defaults.headers.common["Authorization"] = `Bearer ${t}`;
      }
    } catch {
      localStorage.removeItem("stc_token");
      localStorage.removeItem("stc_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post("/api/auth/login", { email, password });
      const { token: newToken, user: newUser } = res.data;

      // Save to state AND localStorage AND axios headers all at once
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("stc_token", newToken);
      localStorage.setItem("stc_user", JSON.stringify(newUser));
      API.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      return { success: true, role: "user" }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.msg || "Invalid email or password.",
      };
    }
  };

  const register = async ({ name, email, phone, password }) => {
    try {
      await API.post("/api/auth/register", { name, email, phone, password });
      return await login(email, password);
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.msg || "Registration failed.",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("stc_token");
    localStorage.removeItem("stc_user");
    delete API.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}