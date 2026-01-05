import React, { useEffect } from "react";
import { Zap, TrendingUp, ShieldCheck, Clock, Gavel, Facebook, Twitter, Instagram, Github, Mail, Phone, MapPin, Home as HomeIcon } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navigation from "../components/navigation";
import TopProductsSection from "../components/top-products-section";
import CategoryNav from "../components/category-nav";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginWithToken, isLoggedIn } = useAuth();
  const [isProcessingToken, setIsProcessingToken] = React.useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token && !isProcessingToken) {
      setIsProcessingToken(true);
      loginWithToken(token)
        .then(() => {
          // Remove token from URL
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("token");
          setSearchParams(newSearchParams, { replace: true });
        })
        .catch((error) => {
          console.error("OAuth login failed:", error);
          navigate("/auth/login?error=oauth_failed");
        })
        .finally(() => {
          setIsProcessingToken(false);
        });
    }
  }, [searchParams, loginWithToken, navigate, setSearchParams, isProcessingToken]);

  const [heroAuction, setHeroAuction] = React.useState(null);
  // Debug log removed as per fix plan
  // const [debugLog, setDebugLog] = React.useState({}); 

  useEffect(() => {
    const fetchHeroAuction = async () => {
      try {
        const auctionService = await import("./services/auctionService");
        
        // Helper to check validity
        const hasValidAuction = (response) => {
            const auctions = response?.data?.auctions || response?.data?.data?.auctions; 
            if (!Array.isArray(auctions)) return false;
            return auctions.some(a => a.productId);
        };

        const getValidAuction = (response) => {
            const auctions = response?.data?.auctions || response?.data?.data?.auctions;
            return auctions.find(a => a.productId);
        }

        // 1. Try Most Viewed (Trending)
        let res = await auctionService.getMostViewedAuctions({ limit: 5 });
        let finalAuction = getValidAuction(res);
        
        // 2. Fallback: Highest Price
        if (!finalAuction) {
            console.log("Hero: No valid trending auction, trying highest price...");
            res = await auctionService.getHighestPriceAuctions({ limit: 5 });
            finalAuction = getValidAuction(res);
        }

        // 3. Fallback: Generic Active (Newest)
        if (!finalAuction) {
             console.log("Hero: No valid highest price auction, trying generic active...");
             // getAuctions returns full axios response, others return response.data
             const genericRes = await auctionService.getAuctions({ limit: 1, status: 'active', sort: '-createdAt' });
             // genericRes.data is the payload { status, data: { auctions: [] } }
             if (genericRes.data?.data?.auctions) {
                 finalAuction = genericRes.data.data.auctions.find(a => a.productId);
             }
        }

        if (finalAuction) {
             console.log("Hero: Selected auction:", finalAuction);
             setHeroAuction(finalAuction);
        } else {
             console.log("Hero: No valid auction found in any category.");
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
        <section className="py-2 mb-2 transition-colors duration-300">
           <div className="max-w-7xl mx-auto px-4">
             <CategoryNav />
           </div>
        </section>

        {/* Hero Section */}
        <section className="relative px-4 py-8 md:py-12 lg:py-20 overflow-hidden">
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

            {heroAuction && (
              <div className="relative hidden lg:block animate-fade-in cursor-pointer group" onClick={() => navigate(`/product/${heroAuction.productId?._id || heroAuction.productId}`)}>
                {/* Main Image Card */}
                <div className="relative z-10 glass rounded-3xl p-6 rotate-3 group-hover:rotate-0 transition-transform duration-500 bg-gradient-to-br from-white/10 to-transparent border border-white/20">
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                    
                    {/* Image */}
                    <img 
                      src={heroAuction?.productId?.primaryImageUrl || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"} 
                      alt="Premium Auction" 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                    />

                    {/* Top Right "Trending" Badge */}
                    <div className="absolute top-4 right-4 z-30">
                       <div className="glass px-4 py-2 rounded-full border border-yellow-500/30 bg-black/40 backdrop-blur-md flex items-center gap-2 shadow-lg shadow-yellow-500/10 animate-pulse">
                          <span className="text-xl">🔥</span>
                          <span className="font-bold text-yellow-400 uppercase tracking-wider text-sm">Trending</span>
                       </div>
                    </div>

                    {/* Bottom Info Card */}
                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <div className="glass rounded-xl p-4 flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/10">
                        <div className="max-w-[60%]">
                          <p className="font-bold text-white truncate text-lg">{heroAuction?.productId?.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-300 mb-0.5">Giá hiện tại</p>
                          <p className="font-bold text-green-400 text-lg">{(heroAuction?.currentPrice).toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      <footer className="bg-[#1a1a1a] text-gray-300 border-t border-white/10 mt-12 font-sans">
        {/* Social Media Bar */}


        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: Company Name */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6 group">
                <img 
                  src="/images/logo-kab-v3.png" 
                  alt="KKABB" 
                  className="h-10 w-auto object-contain rounded-xl" 
                />
                <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-blue-400">
                  KKABB
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-400">
                Nền tảng đấu giá trực tuyến uy tín và hiện đại nhất Việt Nam. 
                Chúng tôi mang đến trải nghiệm mua sắm đẳng cấp và cơ hội sở hữu những món hàng hiệu giá trị.
              </p>
            </div>

            {/* Column 2: Products */}


            {/* Column 4: Contact */}
            <div>
              <h6 className="uppercase font-bold mb-6 text-white tracking-wider">Liên hệ</h6>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 text-primary"><HomeIcon className="w-5 h-5" /></div>
                  <span>Ho Chi Minh City, Vietnam</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 text-primary"><Mail className="w-5 h-5" /></div>
                  <a href="mailto:daokinghacker05@gmail.com" className="hover:text-white">daokinghacker05@gmail.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 text-primary"><Phone className="w-5 h-5" /></div>
                  <span>+ 01 234 567 88</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 text-primary"><Phone className="w-5 h-5" /></div>
                  <span>+ 01 234 567 89</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="bg-black/20 py-6 text-center text-sm text-gray-500 border-t border-white/5">
          <p>&copy; 2025 Copyright: <span className="font-bold text-white">KKABB.com</span></p>
        </div>
      </footer>
    </div>
  );
}
