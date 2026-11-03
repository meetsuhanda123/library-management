import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "./api.js";

const LibraryContext = createContext();

export function LibraryProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("libraryToken") || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("libraryUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("libraryUser");
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate session against server on boot
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem("libraryToken");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/api/auth/me");
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("libraryUser", JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn("Session verification failed, logging out:", err.message);
        localStorage.removeItem("libraryToken");
        localStorage.removeItem("libraryUser");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.token && data.user) {
      localStorage.setItem("libraryToken", data.token);
      localStorage.setItem("libraryUser", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (data.token && data.user) {
      localStorage.setItem("libraryToken", data.token);
      localStorage.setItem("libraryUser", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("libraryToken");
    localStorage.removeItem("libraryUser");
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <LibraryContext.Provider
      value={{
        user,
        token,
        isAdmin,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
