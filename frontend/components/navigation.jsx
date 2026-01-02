import { useState, useEffect, useRef } from "react";
import { Heart, Search, User, Menu, X, Bell } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/context/AuthContext";

export default function Navigation() {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Check if user is admin or superadmin
  const isAdmin =
    currentUser?.roles?.includes("admin") ||
    currentUser?.roles?.includes("superadmin");
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/auth/login");
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-border">
      <div className="bg-primary text-white py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-primary text-xl">
              ⚡
            </div>
            <span className="font-extrabold text-xl hidden sm:inline">
              Online Auction
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-base font-bold transition ${
                isActive("/") ? "text-white" : "text-white hover:text-white/90"
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className={`text-base font-bold transition ${
                isActive("/products")
                  ? "text-white"
                  : "text-white hover:text-white/90"
              }`}
            >
              Đấu giá
            </Link>
            <Link
              to="/categories"
              className={`text-base font-bold transition ${
                isActive("/categories")
                  ? "text-white"
                  : "text-white hover:text-white/90"
              }`}
            >
              Danh mục
            </Link>
          </div>

          {/* Search Bar - Full-text search */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center flex-1 max-w-sm bg-white rounded-sm ml-4"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="flex-1 px-4 py-2 text-foreground placeholder-muted-foreground outline-none text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 text-primary hover:bg-muted transition"
              title="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button className="relative p-2 hover:bg-white/20 rounded transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full"></span>
              </button>
            )}

            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/20 transition cursor-pointer"
                >
                  <User className="w-5 h-5" />
                  <span className="text-base font-bold hidden sm:inline">
                    {currentUser?.fullName || currentUser?.username || "User"}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border overflow-hidden z-50">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-muted transition"
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-muted transition"
                    >
                      Bảng điều khiển
                    </Link>
                    <Link
                      to="/profile/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-muted transition"
                    >
                      Cài đặt
                    </Link>
                    <Link
                      to={`/profile/ratings/${currentUser?._id}`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-muted transition"
                    >
                      Đánh giá của tôi
                    </Link>
                    {isAdmin && (
                      <>
                        <hr className="border-border" />
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition font-semibold"
                        >
                          🛡️ Bảng quản trị
                        </Link>
                      </>
                    )}
                    <hr className="border-border" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-3 py-2 text-sm font-medium hover:bg-white/20 rounded transition"
              >
                Đăng nhập
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-border">
          <div className="flex flex-col p-4 gap-3">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-muted rounded mb-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="flex-1 px-3 py-2 bg-muted text-foreground placeholder-muted-foreground outline-none text-sm"
              />
              <button className="px-3 text-primary">
                <Search className="w-4 h-4" />
              </button>
            </form>
            <Link
              to="/"
              className={`hover:text-primary transition font-medium ${
                isActive("/") ? "text-primary font-bold" : "text-foreground"
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/products"
              className={`hover:text-primary transition font-medium ${
                isActive("/products")
                  ? "text-primary font-bold"
                  : "text-foreground"
              }`}
            >
              Đấu giá
            </Link>
            <Link
              to="/categories"
              className={`hover:text-primary transition font-medium ${
                isActive("/categories")
                  ? "text-primary font-bold"
                  : "text-foreground"
              }`}
            >
              Danh mục
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  to="/watchlist"
                  className="text-foreground hover:text-primary transition font-medium flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" /> Danh sách theo dõi
                </Link>
                <Link
                  to="/dashboard"
                  className="text-foreground hover:text-primary transition font-medium"
                >
                  Đơn hàng của tôi
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-2 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition font-medium text-sm"
                >
                  Đăng xuất
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
