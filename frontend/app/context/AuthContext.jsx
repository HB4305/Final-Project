// AUTH CONTEXT - Global Authentication State Management
import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem("token");

      if (token) {
        // Verify token and get user info
        const response = await authService.getCurrentUser();
        console.log("=== CHECK AUTH STATUS DEBUG ===");
        console.log("getCurrentUser response:", response);
        console.log("response.data:", response.data);
        console.log("response.data.data:", response.data.data);
        
        // FIXED: Access correct path
        setCurrentUser(response.data.data?.user);
        setIsLoggedIn(true);
        console.log("User loaded from token:", response.data.data?.user);
        console.log("=== END CHECK AUTH DEBUG ===");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Token invalid or expired
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authService.signin({ email, password });

    console.log("=== AUTH CONTEXT LOGIN DEBUG ===");
    console.log("Login response:", response);
    console.log("response.data:", response.data);
    console.log("response.data.data:", response.data.data);
    console.log("response.data.data.user:", response.data.data?.user);

    // Save token - FIXED PATH
    if (response.data.data?.accessToken) {
      localStorage.setItem("token", response.data.data.accessToken);
    }

    // Set user info - FIXED PATH
    const user = response.data.data?.user;
    console.log("Setting currentUser to:", user);
    console.log("User roles:", user?.roles);
    setCurrentUser(user);
    setIsLoggedIn(true);
    console.log("=== END AUTH CONTEXT DEBUG ===");

    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  const loginWithToken = async (token) => {
    try {
      // Save token
      localStorage.setItem("token", token);

      // Get user profile
      const response = await authService.getCurrentUser();
      
      // FIXED: Access correct path
      setCurrentUser(response.data.data?.user);
      setIsLoggedIn(true);

      return response;
    } catch (error) {
      console.error("Login with token failed:", error);
      localStorage.removeItem("token");
      throw error;
    }
  };

  const updateUser = (userData) => {
    setCurrentUser(userData);
  };

  const value = {
    isLoggedIn,
    currentUser,
    loading,
    login,
    loginWithToken,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
