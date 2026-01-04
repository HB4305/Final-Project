import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Laptop, Shirt, Home, Sparkles, Palette, Watch, Book, Grid, Image as ImageIcon, Car, Music, Camera } from 'lucide-react';
import Navigation from '../../components/navigation';
import categoryService from '../services/categoryService';
import { useAuth } from '../context/AuthContext';

// Mapping icons for known categories (fallback)
const iconMap = {
  'dien-tu': Laptop,
  'thoi-trang': Shirt,
  'nha-cua-doi-song': Home,
  'suu-tam': Sparkles,
  'nghe-thuat': Palette,
  'trang-suc': Watch,
  'sach': Book,
  'xe-co': Car,
  'bat-dong-san': Home,
  'the-thao': Zap,
  'default': Grid
};

export default function CategoriesPage() {
  const { isLoggedIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories();
        if (response.success) {
           // Get parent categories
           const parents = response.data.filter(c => c.level === 1);
           setCategories(parents);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (slug) => {
    navigate(`/products?category=${slug}`);
  };

  const getIcon = (slug) => {
     // Simple slug matching or fallback
     for (const key in iconMap) {
       if (slug.includes(key)) return iconMap[key];
     }
     return iconMap['default'];
  };

  // Minimalist optimization: Removed dynamic colors for a cleaner look
  
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navigation />
      
      {/* Header */}
      <div className="pt-24 pb-8 bg-muted/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 mt-10 text-white">Danh Mục Sản Phẩm</h1>
          <p className="text-gray-400">Khám phá hàng ngàn sản phẩm độc đáo đang được đấu giá</p>
        </div>
      </div>

      {/* Categories Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
                const IconComponent = getIcon(category.slug);
                
                return (
                <button
                    key={category._id}
                    onClick={() => handleCategoryClick(category.name)}
                    className="glass-card bg-[#1e293b]/40 border border-white/10 rounded-2xl p-6 hover:shadow-xl hover:bg-white/5 hover:border-primary/30 transition-all group relative overflow-hidden text-left"
                >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ring-1 ring-white/10 group-hover:ring-primary/20">
                       <IconComponent className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors">
                       {category.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                       {category.description || "Các sản phẩm hấp dẫn đang chờ bạn khám phá"}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-semibold text-gray-500 group-hover:text-primary/80 transition-colors">
                        {category.productCount || 0} sản phẩm
                    </span>
                    <span className="text-sm text-gray-500 group-hover:text-primary transition-colors flex items-center">
                        Xem ngay <Zap className="w-3 h-3 ml-1" />
                    </span>
                    </div>
                </button>
                );
            })}
            </div>
        )}

        {/* Popular Categories Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-white border-l-4 border-primary pl-3">Xu hướng tuần này</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6 text-white relative overflow-hidden group hover:border-blue-500/30 transition-all">
              <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2 text-blue-400">Đồ Điện Tử</h3>
                 <p className="text-gray-400 mb-6 text-sm">Săn deal công nghệ, điện thoại, laptop với giá cực hời mỗi ngày.</p>
                 <button 
                    onClick={() => handleCategoryClick('Điện tử')}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-blue-400 rounded-lg hover:bg-blue-500/10 transition font-bold text-sm"
                 >
                    Khám phá ngay
                 </button>
              </div>
              <Laptop className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-white/5 rotate-12 group-hover:rotate-0 group-hover:text-blue-500/10 transition-all" />
            </div>
            
            <div className="glass-card bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6 text-white relative overflow-hidden group hover:border-pink-500/30 transition-all">
               <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2 text-pink-400">Thời Trang</h3>
                 <p className="text-gray-400 mb-6 text-sm">Bộ sưu tập quần áo, phụ kiện hàng hiệu đang được đấu giá sôi nổi.</p>
                 <button 
                    onClick={() => handleCategoryClick('Thời trang')}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-pink-400 rounded-lg hover:bg-pink-500/10 transition font-bold text-sm"
                 >
                    Khám phá ngay
                 </button>
               </div>
               <Shirt className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-white/5 rotate-12 group-hover:rotate-0 group-hover:text-pink-500/10 transition-all" />
            </div>
            
            <div className="glass-card bg-[#1e293b]/60 border border-white/10 rounded-2xl p-6 text-white relative overflow-hidden group hover:border-orange-500/30 transition-all">
               <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2 text-orange-400">Sưu Tầm</h3>
                 <p className="text-gray-400 mb-6 text-sm">Những món đồ cổ, tem, tiền xu và vật phẩm hiếm có khó tìm.</p>
                 <button 
                    onClick={() => handleCategoryClick('Sưu tầm')}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-orange-400 rounded-lg hover:bg-orange-500/10 transition font-bold text-sm"
                 >
                    Khám phá ngay
                 </button>
               </div>
               <Sparkles className="absolute bottom-[-20px] right-[-20px] w-32 h-32 text-white/5 rotate-12 group-hover:rotate-0 group-hover:text-orange-500/10 transition-all" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

