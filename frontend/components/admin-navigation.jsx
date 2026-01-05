import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Search,
  User,
  Menu,
  X,
  Bell,
  Home,
  Package,
  Tag,
  Users,
  Settings,
  BarChart3,
  FileText,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/context/AuthContext";

/**
 * AdminNavigation Component
 * Dedicated navigation bar for admin panel
 * Based on the main navigation but optimized for admin features
 */
export default function AdminNavigation() {
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Check if current path is active
  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Admin menu items
  const adminMenuItems = [
    { path: "/admin/dashboard", label: "Người dùng", icon: Users },
    { path: "/admin/products", label: "Sản phẩm", icon: Package },
    { path: "/admin/categories", label: "Danh mục", icon: Tag },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 shadow-lg flex flex-col">
      {/* Main Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 text-white transition-all duration-300">
        <div className="py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo & Admin Badge */}
          <Link to="/admin/dashboard" className="flex items-center gap-3 shrink-0 group">
            <img 
              src="/images/logo-kab.png" 
              alt="Admin Panel" 
              className="h-10 md:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300 rounded-xl" 
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 tracking-tight drop-shadow-sm leading-none">
                KKABB
              </span>
              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                Admin Panel
              </span>
            </div>
          </Link>
          
          {/* Main Navigation Items - Moved from secondary bar */}
          <div className="hidden md:flex items-center gap-1 mx-4 flex-1">
            {adminMenuItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-all duration-200 relative py-1 mx-3 ${
                    active
                      ? "text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-full animate-fade-in"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Back to Site */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition text-sm font-medium text-slate-300 hover:text-white"
            >
              <Home className="w-4 h-4" />
              <span className="hidden lg:inline">Quay lại trang chính</span>
            </Link>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition cursor-pointer"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">
                    {currentUser?.username || "Admin"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentUser?.roles?.includes("superadmin")
                      ? "Siêu Quản trị viên"
                      : "Quản trị viên"}
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
                    <p className="text-sm font-semibold text-white">
                      {currentUser?.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {currentUser?.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-300 hover:bg-slate-800 transition"
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/profile/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-300 hover:bg-slate-800 transition"
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Cài đặt
                  </Link>



                  <hr className="border-gray-700" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-slate-800 transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/20 rounded-lg transition"
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
      </div>



      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0f172a] border-t border-white/10 text-gray-300">
          <div className="flex flex-col p-4 gap-2">
            {/* Mobile Search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-white/5 border border-white/10 rounded-lg mb-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="flex-1 px-3 py-2 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
              />
              <button type="submit" className="px-3 text-orange-600">
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Mobile Menu Items */}
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
                    active
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            <hr className="border-gray-200 my-2" />

            {/* Mobile Actions */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-600 hover:bg-blue-50 transition font-medium"
            >
              <Home className="w-5 h-5" />
              Quay lại trang chính
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
