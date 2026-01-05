import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Laptop, Shirt, Home, Sparkles, Palette, Watch, Book, Grid, Image as ImageIcon, Car, Music, Camera, Building2, Armchair, Dumbbell } from 'lucide-react';
import Navigation from '../../components/navigation';
import categoryService from '../services/categoryService';
import { useAuth } from '../context/AuthContext';

// Mapping icons for known categories (fallback)
const iconMap = {
  'dien-tu': Laptop,
  'thoi-trang': Shirt,
  'nha-cua': Armchair,
  'nha-cua-doi-song': Armchair,
  'suu-tam': Sparkles,
  'nghe-thuat': Palette,
  'trang-suc': Watch,
  'sach': Book,
  'xe-co': Car,
  'bat-dong-san': Building2,
  'the-thao': Dumbbell,
  'mac-dinh': Grid,
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Popular Categories Section Removed by User Request */}

        {/* Categories Grid */}
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
                    className="glass-card bg-slate-800 border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all group relative overflow-hidden text-left shadow-lg"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-1 ring-white/10 group-hover:ring-primary/50 shadow-inner">
                       <IconComponent className="w-10 h-10 text-cyan-400 group-hover:text-primary transition-colors drop-shadow-md" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors">
                       {category.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                       {category.description || "Các sản phẩm hấp dẫn đang chờ bạn khám phá"}
                    </p>
                    <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
                     <span className="text-sm font-semibold text-gray-400 group-hover:text-primary/80 transition-colors">
                         {category.productCount || 0} sản phẩm
                     </span>
                     <span className="text-sm text-blue-400 group-hover:text-primary transition-colors flex items-center font-medium">
                         Xem ngay
                     </span>
                    </div>
                </button>
                );
            })}
            </div>
        )}


      </main>
    </div>
  );
}

