import { useState, useEffect, useRef } from "react";
import {
  Heart,
  Search,
  User,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/context/AuthContext";

export default function Navigation() {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  // Check if user is admin or superadmin
  const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('superadmin');
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
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-primary text-lg">
              ⚡
            </div>
            <span className="font-bold text-lg hidden sm:inline">
              Online Auction
            </span>
          </Link>

          {/* Search Bar - Full-text search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 max-w-xl bg-white rounded-sm ml-4"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm... (ít nhất 2 ký tự)"
              className="flex-1 px-4 py-2 text-foreground placeholder-muted-foreground outline-none text-sm"
            />
            <button 
              type="submit"
              className="px-4 py-2 text-primary hover:bg-muted transition"
              title="Tìm kiếm nâng cao"
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
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">
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
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-muted transition"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-muted transition"
                    >
                      Settings
                    </Link>
                    {isAdmin && (
                      <>
                        <hr className="border-border" />
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition font-semibold"
                        >
                          🛡️ Admin Dashboard
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
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="px-3 py-2 text-sm font-medium hover:bg-white/20 rounded transition"
              >
                Sign in
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

      {/* Secondary Nav */}
      <div className="hidden md:block bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <Link
              to="/products"
              className="text-foreground hover:text-primary transition font-medium"
            >
              Auctions
            </Link>
            <Link
              to="/categories"
              className="text-foreground hover:text-primary transition font-medium"
            >
              Categories
            </Link>
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-orange-600 hover:text-orange-700 transition font-semibold flex items-center gap-1"
              >
                🛡️ Admin Panel
              </Link>
            )}
            {isLoggedIn && (
              <>
                <Link
                  to="/watchlist"
                  className="text-foreground hover:text-primary transition font-medium flex items-center gap-1"
                >
                  <Heart className="w-4 h-4" /> Wishlist
                </Link>
                <Link
                  to="/dashboard"
                  className="text-foreground hover:text-primary transition font-medium"
                >
                  My Purchases
                </Link>
              </>
            )}
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
                placeholder="Search..."
                className="flex-1 px-3 py-2 bg-muted text-foreground placeholder-muted-foreground outline-none text-sm"
              />
              <button className="px-3 text-primary">
                <Search className="w-4 h-4" />
              </button>
            </form>
            <Link
              to="/products"
              className="text-foreground hover:text-primary transition font-medium"
            >
              Auctions
            </Link>
            <Link
              to="/categories"
              className="text-foreground hover:text-primary transition font-medium"
            >
              Categories
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  to="/watchlist"
                  className="text-foreground hover:text-primary transition font-medium flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" /> Wishlist
                </Link>
                <Link
                  to="/dashboard"
                  className="text-foreground hover:text-primary transition font-medium"
                >
                  My Purchases
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-2 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 transition font-medium text-sm"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
