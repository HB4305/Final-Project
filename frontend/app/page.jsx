import React, { useEffect } from "react";
import { Zap } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navigation from "../components/navigation";
import TopProductsSection from "../components/top-products-section";
import CategoryNav from "../components/category-nav";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginWithToken } = useAuth();

  // Handle OAuth callback token
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Login with token from OAuth
      loginWithToken(token)
        .then(() => {
          // Remove token from URL
          searchParams.delete("token");
          setSearchParams(searchParams);
        })
        .catch((error) => {
          console.error("OAuth login failed:", error);
          navigate("/auth/login?error=oauth_failed");
        });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-16">
        {/* Category Navigation */}
        <CategoryNav />
        <section className="bg-gradient-to-r from-primary via-red-500 to-orange-500 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Promo */}
              <div className="md:col-span-2 bg-black/20 rounded-lg p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-bold">DEAL HOT HÔM NAY</span>
                </div>
                <h2 className="text-4xl font-bold mb-2">Săn Hàng Hot</h2>
                <p className="text-white/90 mb-6 text-lg">
                  Ưu đãi có hạn cho các phiên đấu giá cao cấp
                </p>
                <button className="w-fit px-6 py-2 bg-white text-primary rounded hover:bg-gray-100 transition font-bold">
                  Mua Ngay →
                </button>
              </div>

              {/* Side Promos */}
              <div className="flex flex-col gap-4">
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-white/80 mb-1">Lên đến</div>
                  <div className="text-3xl font-bold mb-1">70%</div>
                  <div className="text-xs text-white/80">
                    Cho các sản phẩm đã chọn
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-white/80 mb-1">
                    Miễn Phí Vận Chuyển
                  </div>
                  <div className="text-2xl font-bold mb-1">Hôm nay</div>
                  <div className="text-xs text-white/80">Tất cả đơn hàng</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top 5 Products Sections */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <TopProductsSection />
        </section>

        {/* Stats Section */}
        <section className="bg-white py-12 px-4 border-t border-border">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">5,234</div>
              <p className="text-sm text-muted-foreground">Phiên đấu giá</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">48.2K</div>
              <p className="text-sm text-muted-foreground">
                Người mua hài lòng
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$2.3M</div>
              <p className="text-sm text-muted-foreground">Tổng giá trị</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.8%</div>
              <p className="text-sm text-muted-foreground">Đánh giá tích cực</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary to-red-500 text-white py-12 px-4 mt-8">
          <div className="max-w-7xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-4">
              Sẵn sàng để bắt đầu đấu giá?
            </h3>
            <p className="text-white/90 mb-6 text-lg">
              Tham gia cùng hàng ngàn người mua sắm thông minh tìm kiếm những ưu
              đãi tuyệt vời
            </p>
            <button
              onClick={() => navigate("/auth/signup")}
              className="px-8 py-3 bg-white text-primary rounded font-bold hover:bg-gray-100 transition"
            >
              Tạo tài khoản
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-white py-12 px-4 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center gap-16 md:gap-32 mb-8">
          <div>
            <h4 className="font-bold mb-4">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition">
                  Về AuctionHub
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Tuyển dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Tin tức
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Theo dõi chúng tôi</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400 border-t border-gray-700 pt-8">
          <p>&copy; 2025 AuctionHub. Bảo lưu mọi quyền.</p>
        </div>
      </footer>
    </div>
  );
}
