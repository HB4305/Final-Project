import React, { useEffect } from "react";
import { Zap, TrendingUp, ShieldCheck, Clock, Gavel } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navigation from "../components/navigation";
import TopProductsSection from "../components/top-products-section";
import CategoryNav from "../components/category-nav";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginWithToken, isLoggedIn } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      loginWithToken(token)
        .then(() => {
          searchParams.delete("token");
          setSearchParams(searchParams);
        })
        .catch((error) => {
          console.error("OAuth login failed:", error);
          navigate("/auth/login?error=oauth_failed");
        });
    }
  }, [searchParams]);

  const [heroAuction, setHeroAuction] = React.useState(null);

  useEffect(() => {
    const fetchHeroAuction = async () => {
      try {
        const res = await import("./services/auctionService").then(m => m.default.getAuctions({ page: 1, limit: 10, status: 'active', sort: 'bidCount:desc' }));
        if (res.data?.data?.auctions?.length > 0) {
           // Try to find the Sony set first, otherwise take the first one (most popular)
           const sonyAuction = res.data.data.auctions.find(a => a.productId?.title?.toLowerCase().includes("sony"));
           setHeroAuction(sonyAuction || res.data.data.auctions[0]);
        }
      } catch (error) {
        console.error("Failed to fetch hero auction", error);
      }
    };
    fetchHeroAuction();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden animate-fade-in">
      <Navigation />

      <main className="pt-20">
        {/* Category Nav - Static Top */}
        <section className="py-2 mb-8 transition-colors duration-300">
           <div className="max-w-7xl mx-auto px-4">
             <CategoryNav />
           </div>
        </section>

        {/* Hero Section */}
        <section className="relative px-4 py-12 md:py-20 lg:py-28 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-float" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: "-2s" }} />
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Sàn đấu giá trực tuyến số 1 Việt Nam
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Săn Hàng Hiệu <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                  Giá Cực Sốc
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Tham gia đấu giá các sản phẩm công nghệ, thời trang và sưu tầm chất lượng cao. 
                Cơ hội sở hữu món đồ mơ ước với mức giá không tưởng.
              </p>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate("/products")}
                  className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:scale-105 active:scale-95"
                >
                  Khám Phá Ngay
                </button>
                {!isLoggedIn && (
                  <button 
                    onClick={() => navigate("/auth/signup")}
                    className="px-8 py-4 bg-white/5 text-foreground border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    Đăng Ký Miễn Phí
                  </button>
                )}
              </div>

              <div className="flex items-center gap-8 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span>Uy tín 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Hỗ trợ 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span>Giá tốt nhất</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block animate-fade-in cursor-pointer" onClick={() => heroAuction && navigate(`/product/${heroAuction.productId?._id || heroAuction.productId}`)}>
              <div className="relative z-10 glass rounded-3xl p-6 rotate-3 hover:rotate-0 transition-transform duration-500 bg-gradient-to-br from-white/10 to-transparent border border-white/20">
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                  <img 
                    src={heroAuction?.productId?.primaryImageUrl || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"} 
                    alt="Premium Auction" 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="glass rounded-xl p-4 flex justify-between items-center">
                      <div className="max-w-[60%]">
                        <p className="text-xs text-gray-300">Đang đấu giá</p>
                        <p className="font-bold text-white truncate">{heroAuction?.productId?.title || "Sony Electronics Set"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-300">Giá hiện tại</p>
                        <p className="font-bold text-green-400">{(heroAuction?.currentPrice || 12500000).toLocaleString()} ₫</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative floating cards */}
              <div className="absolute -top-6 -right-6 glass p-4 rounded-2xl animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Vừa bán xong</p>
                    <p className="font-bold text-sm">+ 2.5 Triệu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Featured / Top Products */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-gray-400">
                Sản Phẩm Hot
              </h2>
              <p className="text-gray-600 dark:text-muted-foreground mt-2">Các phiên đấu giá được quan tâm nhiều nhất</p>
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              Xem tất cả &rarr;
            </button>
          </div>
          <TopProductsSection />
        </section>

        {/* Stats Section with Glass Effect */}



      </main>

      <footer className="bg-black/40 border-t border-white/10 py-12 px-4 mt-12 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg border border-white/10">
                  <Gavel className="w-4 h-4 text-white/90" />
               </div>
               <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AuctionHub</span>
            </div>
            <p className="text-muted-foreground max-w-xs">
              Nền tảng đấu giá trực tuyến uy tín và hiện đại nhất.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold mb-4 text-white">Khám phá</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition">Đấu giá đang diễn ra</a></li>
                <li><a href="#" className="hover:text-primary transition">Sắp diễn ra</a></li>
                <li><a href="#" className="hover:text-primary transition">Đã kết thúc</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Hỗ trợ</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-primary transition">Quy chế hoạt động</a></li>
                <li><a href="#" className="hover:text-primary transition">Bảo mật thông tin</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Kết nối</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary transition">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition">Twitter</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 border-t border-gray-800 pt-8">
          <p>&copy; 2025 AuctionHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
