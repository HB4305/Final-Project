import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Star,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import Navigation from "../../components/navigation";
import UpgradeRequest from "../../components/upgrade-request";
import userService from "../services/userService";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Email update states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailUpdating, setEmailUpdating] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [editForm, setEditForm] = useState({
    fullName: "",
    dateOfBirth: "",
    contactPhone: "",
    address: {
      street: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
    },
  });

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, ratingsRes] = await Promise.all([
        userService.getUserProfile(),
        userService.getUserRatings(null, { page: 1, limit: 5 }),
      ]);

      if (profileRes.data?.status === "success") {
        const userData = profileRes.data.data.user;
        setProfile(userData);
        setEditForm({
          fullName: userData.fullName || "",
          dateOfBirth: userData.dateOfBirth
            ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
            : "",
          contactPhone: userData.contactPhone || "",
          address: userData.address || {
            street: "",
            city: "",
            region: "",
            postalCode: "",
            country: "",
          },
        });
      }

      if (ratingsRes.data?.status === "success") {
        setRatings(ratingsRes.data.data.ratings);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const updateData = {
        fullName: editForm.fullName,
        dateOfBirth: editForm.dateOfBirth || null,
        contactPhone: editForm.contactPhone || null,
        address: editForm.address,
      };

      const res = await userService.updateMe(updateData);

      if (res.data?.status === "success") {
        setProfile(res.data.data.user);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || "",
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        contactPhone: profile.contactPhone || "",
        address: profile.address || {
          street: "",
          city: "",
          region: "",
          postalCode: "",
          country: "",
        },
      });
    }
    setIsEditing(false);
    setError("");
  };

  const handleUpdateEmail = async () => {
    try {
      setEmailUpdating(true);
      setError("");
      setSuccess("");

      if (!newEmail || !newEmail.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      const res = await userService.updateEmail({ newEmail });

      if (res.data?.status === "success") {
        setSuccess(
          "OTP has been sent to your new email. Please check and verify."
        );
        setShowOtpInput(true);
        setIsEditingEmail(false);
      }
    } catch (err) {
      console.error("Error updating email:", err);
      setError(err.response?.data?.message || "Failed to update email");
    } finally {
      setEmailUpdating(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      setOtpVerifying(true);
      setError("");
      setSuccess("");

      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        return;
      }

      const res = await userService.verifyEmailOtp({ otp });

      if (res.data?.status === "success") {
        setSuccess("Email verified successfully!");
        setShowOtpInput(false);
        setOtp("");
        setNewEmail("");
        // Refresh profile to show new email
        fetchProfileData();
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* OTP Verification for Email */}
          {showOtpInput && (
            <div className="mb-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">
                Verify Your New Email
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                We've sent a 6-digit OTP to <strong>{newEmail}</strong>. Please
                enter it below.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="flex-1 px-4 py-3 border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                />
                <button
                  onClick={handleVerifyEmailOtp}
                  disabled={otpVerifying || otp.length !== 6}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {otpVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp("");
                    setNewEmail("");
                  }}
                  disabled={otpVerifying}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Didn't receive the code? Check your spam folder or click the
                Change button again to resend.
              </p>
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-background border border-border rounded-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <img
                  src={profile?.profileImageUrl || "/placeholder.svg"}
                  alt={profile?.fullName || profile?.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                />
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fullName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      {isEditingEmail ? (
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder={profile?.email}
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={handleUpdateEmail}
                            disabled={emailUpdating}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                          >
                            {emailUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingEmail(false);
                              setNewEmail("");
                            }}
                            disabled={emailUpdating}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={profile?.email || ""}
                            disabled
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-gray-100 text-gray-500"
                          />
                          <button
                            onClick={() => setIsEditingEmail(true)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.contactPhone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            contactPhone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.address?.city || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            address: {
                              ...editForm.address,
                              city: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold mb-2">
                      {profile?.fullName || profile?.username}
                    </h1>
                    <p className="text-muted-foreground mb-2">
                      @{profile?.username}
                    </p>
                    <div className="flex flex-wrap gap-6 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{profile?.email}</span>
                      </div>
                      {profile?.address?.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{profile.address.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          Joined{" "}
                          {new Date(profile?.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "long", year: "numeric" }
                          )}
                        </span>
                      </div>
                    </div>
                    {profile?.contactPhone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {profile.contactPhone}
                      </p>
                    )}
                    {profile?.dateOfBirth && (
                      <p className="text-sm text-muted-foreground">
                        Birthday:{" "}
                        {new Date(profile.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Rating Card */}
              <div className="bg-muted rounded-lg p-4 text-center min-w-max">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor((profile?.ratingSummary?.score || 0) * 5)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg font-bold">
                  {((profile?.ratingSummary?.score || 0) * 5).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.ratingSummary?.countPositive || 0} positive,{" "}
                  {profile?.ratingSummary?.countNegative || 0} negative
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-primary mb-1">
                {profile?.ratingSummary?.totalCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Ratings</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-green-600 mb-1">
                {profile?.ratingSummary?.countPositive || 0}
              </p>
              <p className="text-sm text-muted-foreground">Positive</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-red-600 mb-1">
                {profile?.ratingSummary?.countNegative || 0}
              </p>
              <p className="text-sm text-muted-foreground">Negative</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-primary mb-1">
                {profile?.emailVerified ? "Verified" : "Unverified"}
              </p>
              <p className="text-sm text-muted-foreground">Email Status</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-6">
            <div className="flex gap-4">
              <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
                Recent Feedback
              </button>
            </div>
          </div>
          <UpgradeRequest currentUser={profile} />

          {/* Recent Reviews */}
          <div className="space-y-4">
            {ratings.length > 0 ? (
              ratings.map((rating) => (
                <div
                  key={rating._id}
                  className="bg-background border border-border rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">
                        {rating.raterId?.fullName || rating.raterId?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rating.context.replace(/_/g, " ")} -{" "}
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {rating.score === 1 ? (
                        <Star className="w-5 h-5 fill-green-500 text-green-500" />
                      ) : (
                        <Star className="w-5 h-5 fill-red-500 text-red-500" />
                      )}
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-muted-foreground">
                      {rating.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-background border border-border rounded-lg p-6 text-center text-muted-foreground">
                No ratings yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
