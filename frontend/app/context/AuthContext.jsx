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
        setCurrentUser(response.data.user);
        setIsLoggedIn(true);
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

    // Save token
    if (response.data.accessToken) {
      localStorage.setItem("token", response.data.accessToken);
    }

    // Set user info
    setCurrentUser(response.data.user);
    setIsLoggedIn(true);

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
      setCurrentUser(response.data.user);
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
