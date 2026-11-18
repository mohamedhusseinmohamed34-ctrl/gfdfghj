import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, post } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/auth/me")
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await post("/auth/login", { email, password });
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await post("/auth/register", payload);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await post("/auth/logout", {}); }
    finally { setUser(null); }
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}