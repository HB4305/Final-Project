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
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Admin menu items
  const adminMenuItems = [
    { path: "/admin/dashboard", label: "Trang chủ", icon: BarChart3 },
    { path: "/admin/products", label: "Sản phẩm", icon: Package },
    { path: "/admin/categories", label: "Danh mục", icon: Tag },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-orange-700 z-50 shadow-lg">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo & Admin Badge */}
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg block leading-tight">
                  Admin Panel
                </span>
                <span className="text-xs text-orange-100">
                  Online Auction
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar
          <form
            onSubmit={handleSearch}
            className="hidden xl:flex items-center flex-1 max-w-xl bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, products, categories..."
              className="flex-1 px-4 py-2 bg-transparent text-white placeholder-orange-200 outline-none text-sm"
            />
            <button 
              type="submit"
              className="px-4 py-2 text-white hover:bg-white/10 transition rounded-r-lg"
            >
              <Search className="w-5 h-5" />
            </button>
          </form> */}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Back to Site */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              <span className="hidden lg:inline">Quay lại trang chính</span>
            </Link>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/20 rounded-lg transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full"></span>
            </button>

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
                  <div className="text-xs text-orange-100">
                    {currentUser?.roles?.includes('superadmin') ? 'Siêu Quản trị viên' : 'Quản trị viên'}
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {currentUser?.username}
                    </p>
                    <p className="text-xs text-gray-600">
                      {currentUser?.email}
                    </p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/profile/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Cài đặt
                  </Link>
                  
                  <hr className="border-gray-200" />
                  
                  <Link
                    to="/"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition"
                  >
                    <Home className="w-4 h-4 inline mr-2" />
                    Quay lại trang chính
                  </Link>
                  
                  <hr className="border-gray-200" />
                  
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

      {/* Admin Menu Bar */}
      <div className="hidden md:block bg-white/10 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-1">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${
                    active
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="flex flex-col p-4 gap-2">
            {/* Mobile Search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-gray-100 rounded-lg mb-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 bg-transparent text-gray-900 placeholder-gray-500 outline-none text-sm"
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
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-50'
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
