import { useState, useEffect, useRef } from "react";
import { Heart, Search, User, Menu, X, Bell, Zap, Settings, Star, LogOut, Gavel } from "lucide-react";
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
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass border-b border-white/5">
      <div className="py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all duration-300 border border-white/10">
              <Gavel className="w-5 h-5 fill-white/20" />
            </div>
            <span className="font-extrabold text-2xl hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 tracking-tight drop-shadow-sm">
              AuctionHub
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {["/", "/products", "/categories"].map((path) => (
              <Link
                key={path}
                to={path}
                className={`text-sm font-medium transition-all duration-200 relative py-1 ${
                  isActive(path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {path === "/" ? "Trang chủ" : path === "/products" ? "Đấu giá" : "Danh mục"}
                {isActive(path) && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-fade-in"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Search Bar - Full-text search */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center flex-1 max-w-sm ml-8 relative group"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full -m-1 blur-md opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
            <div className="relative flex items-center w-full bg-white/10 border border-white/10 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all backdrop-blur-sm">
              <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 px-3 py-2.5 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm w-full"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3">


            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/5 transition border border-transparent hover:border-white/10"
                >
                  {currentUser?.profileImageUrl ? (
                    <img
                      src={currentUser.profileImageUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-primary/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <User className="w-5 h-5" />
                    </div>
                  )}
                  <span className="text-sm font-semibold hidden sm:inline text-foreground">
                    {currentUser?.fullName || currentUser?.username || "User"}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xl shadow-black/50">
                    <div className="px-4 py-3 bg-white/5 rounded-xl mb-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tài khoản</p>
                      <p className="truncate font-medium text-foreground">{currentUser?.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      {[
                        { to: "/profile", icon: User, label: "Hồ sơ cá nhân" },
                        { to: "/dashboard", icon: Zap, label: "Bảng điều khiển" },
                        { to: "/profile/settings", icon: Settings, label: "Cài đặt" },
                        { to: `/profile/ratings/${currentUser?._id}`, icon: Star, label: "Đánh giá của tôi" },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white hover:bg-primary/20 rounded-xl transition-all"
                        >
                          <item.icon className="w-4 h-4" /> {item.label}
                        </Link>
                      ))}

                      {isAdmin && (
                        <>
                          <div className="h-px bg-white/10 my-2 mx-2"></div>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors"
                          >
                             🛡️ Trang quản trị
                          </Link>
                        </>
                      )}
                      
                      <div className="h-px bg-white/10 my-2 mx-2"></div>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
                <button
                  onClick={handleLogin}
                  className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                >
                  Đăng nhập
                </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass border-t border-white/10 absolute w-full animate-accordion-down">
          <div className="flex flex-col p-4 gap-2">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-white/5 rounded-lg mb-4 border border-white/10"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..."
                className="flex-1 px-4 py-3 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm"
              />
              <button className="px-4 text-primary">
                <Search className="w-5 h-5" />
              </button>
            </form>
            
            {["/", "/products", "/categories"].map((path) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-lg transition-colors font-medium ${
                  isActive(path) 
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                {path === "/" ? "Trang chủ" : path === "/products" ? "Đấu giá" : "Danh mục"}
              </Link>
            ))}

            <div className="h-px bg-white/10 my-2"></div>

            {isLoggedIn ? (
              <>
                <Link
                  to="/watchlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 px-4 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition font-medium flex items-center gap-3"
                >
                  <Heart className="w-5 h-5" /> Danh sách theo dõi
                </Link>
               
                <button
                  onClick={handleLogout}
                  className="mt-2 w-full py-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition font-bold text-sm"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
                 <button
                  onClick={handleLogin}
                  className="w-full py-3 mt-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/25 transition-all"
                >
                  Đăng nhập
                </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
