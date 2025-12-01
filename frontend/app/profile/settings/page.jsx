import React, { useState, useEffect } from "react";
import {
  Lock,
  Bell,
  Binary as Privacy,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import Navigation from "../../../components/navigation";
import userService from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bidNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
    privateProfile: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Check if user is Google login (no password)
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Password visibility toggles
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Check if user logged in with Google
  useEffect(() => {
    const checkAuthMethod = async () => {
      try {
        // First try from currentUser context
        if (currentUser?.socialIds?.googleId || currentUser?.googleId) {
          console.log(
            "[Settings] User is Google user from context:",
            currentUser
          );
          setIsGoogleUser(true);
          setCheckingAuth(false);
          return;
        }

        // Fallback to API call
        const res = await userService.getUserProfile();
        const user = res.data?.data?.user;
        console.log("[Settings] User from API:", user);
        // Check both socialIds.googleId and googleId for compatibility
        const hasGoogleId = !!(user?.socialIds?.googleId || user?.googleId);
        console.log("[Settings] Has Google ID:", hasGoogleId);
        setIsGoogleUser(hasGoogleId);
      } catch (err) {
        console.error("Error checking auth method:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuthMethod();
  }, [currentUser]);

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // For Google users setting password for first time
    if (isGoogleUser && isSettingPassword) {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        setError("Please enter and confirm your new password");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      try {
        setLoading(true);
        // Call API to set password for Google user (need to create this endpoint)
        const res = await userService.changePassword({
          oldPassword: "", // Empty for Google users
          newPassword: passwordForm.newPassword,
        });

        if (res.data?.status === "success") {
          setMessage(
            "Password set successfully! You can now login with email and password."
          );
          setIsGoogleUser(false);
          setIsSettingPassword(false);
          setPasswordForm({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setTimeout(() => setMessage(""), 5000);
        }
      } catch (err) {
        console.error("Error setting password:", err);
        setError(err.response?.data?.message || "Failed to set password");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal password change
    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await userService.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.status === "success") {
        setMessage("Password updated successfully!");
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Auto-hide success message after 5 seconds
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground mb-8">
            Manage your security and preferences
          </p>

          {/* Success/Error Messages */}
          {message && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500 text-green-600 rounded-lg flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-5 h-5" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 text-red-600 rounded-lg flex items-center gap-2 animate-in fade-in">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Password Section - Hidden for Google users */}
          {!isGoogleUser && (
            <div className="bg-background border border-border rounded-lg p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">
                  {isGoogleUser && !isSettingPassword
                    ? "Set Password"
                    : "Change Password"}
                </h2>
              </div>

              {/* Google User Notice */}
              {isGoogleUser && !isSettingPassword ? (
                <div className="mb-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 mb-2">
                      🔐 You're logged in with Google. You don't have a password
                      yet.
                    </p>
                    <p className="text-xs text-blue-600">
                      Set a password to enable email/password login as an
                      alternative to Google Sign-In.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingPassword(true)}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                  >
                    Set Password
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-6">
                    {isGoogleUser
                      ? "Create a password for your account"
                      : "Update your password to keep your account secure"}
                  </p>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {!isGoogleUser && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Current Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.old ? "text" : "password"}
                            name="oldPassword"
                            value={passwordForm.oldPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter your current password"
                            className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                old: !showPasswords.old,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                          >
                            {showPasswords.old ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password (min. 6 characters)"
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {passwordForm.newPassword &&
                        passwordForm.newPassword.length < 6 && (
                          <p className="text-xs text-red-500 mt-1">
                            Password must be at least 6 characters
                          </p>
                        )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm your new password"
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {passwordForm.confirmPassword &&
                        passwordForm.newPassword !==
                          passwordForm.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            Passwords do not match
                          </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {isGoogleUser
                              ? "Setting Password..."
                              : "Updating Password..."}
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            {isGoogleUser ? "Set Password" : "Update Password"}
                          </>
                        )}
                      </button>
                      {isGoogleUser && isSettingPassword && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingPassword(false);
                            setPasswordForm({
                              oldPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                          }}
                          disabled={loading}
                          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Google User Info */}
          {isGoogleUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-blue-900">
                  Account Security
                </h2>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                🔐 Your account is secured with Google Sign-In
              </p>
              <p className="text-xs text-blue-600">
                Password management is not available for Google accounts. Your
                account security is managed by Google.
              </p>
            </div>
          )}

          {/* Notifications Section */}
          <div className="bg-background border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  key: "emailNotifications",
                  label: "Email Notifications",
                  desc: "Receive updates about your auctions",
                },
                {
                  key: "bidNotifications",
                  label: "Bid Notifications",
                  desc: "Get notified when you're outbid",
                },
                {
                  key: "marketingEmails",
                  label: "Marketing Emails",
                  desc: "Receive special offers and promotions",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key)}
                    className={`relative w-12 h-6 rounded-full transition ${
                      settings[item.key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${
                        settings[item.key] ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Privacy className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Privacy</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Private Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Hide your profile from public view
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("privateProfile")}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.privateProfile ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${
                      settings.privateProfile ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add extra security to your account
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("twoFactorAuth")}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.twoFactorAuth ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${
                      settings.twoFactorAuth ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
