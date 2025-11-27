import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Laptop, Shirt, Home, Sparkles, Palette, Watch, Book } from 'lucide-react';
import Navigation from '../../components/navigation';

const categories = [
  { 
    name: 'Flash Deals', 
    slug: 'flash-deals', 
    icon: Zap, 
    count: 234,
    color: 'bg-orange-500',
    description: 'Limited time offers'
  },
  { 
    name: 'Electronics', 
    slug: 'electronics', 
    icon: Laptop, 
    count: 1567,
    color: 'bg-blue-500',
    description: 'Tech & gadgets'
  },
  { 
    name: 'Fashion', 
    slug: 'fashion', 
    icon: Shirt, 
    count: 892,
    color: 'bg-pink-500',
    description: 'Clothing & accessories'
  },
  { 
    name: 'Home & Garden', 
    slug: 'home', 
    icon: Home, 
    count: 456,
    color: 'bg-green-500',
    description: 'Home decor & furniture'
  },
  { 
    name: 'Collectibles', 
    slug: 'collectibles', 
    icon: Sparkles, 
    count: 678,
    color: 'bg-purple-500',
    description: 'Rare & vintage items'
  },
  { 
    name: 'Art & Crafts', 
    slug: 'art', 
    icon: Palette, 
    count: 345,
    color: 'bg-yellow-500',
    description: 'Handmade & artwork'
  },
  { 
    name: 'Watches & Jewelry', 
    slug: 'jewelry', 
    icon: Watch, 
    count: 523,
    color: 'bg-red-500',
    description: 'Luxury timepieces'
  },
  { 
    name: 'Books & Media', 
    slug: 'books', 
    icon: Book, 
    count: 789,
    color: 'bg-indigo-500',
    description: 'Books & collectibles'
  },
];

export default function CategoriesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleCategoryClick = (slug) => {
    navigate(`/products?category=${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} currentUser={currentUser} setCurrentUser={setCurrentUser} />
      
      {/* Header */}
      <div className="pt-24 pb-8 bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 mt-10">Browse Categories</h1>
          <p className="text-muted-foreground">Explore our wide range of auction categories</p>
        </div>
      </div>

      {/* Categories Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                className="bg-background border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary transition-all group"
              >
                <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">
                    {category.count.toLocaleString()} items
                  </span>
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Browse →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Popular Categories Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Popular This Week</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-primary to-orange-500 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Electronics</h3>
              <p className="text-white/90 mb-4">Trending tech deals up to 70% off</p>
              <button 
                onClick={() => handleCategoryClick('electronics')}
                className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Shop Now
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Fashion</h3>
              <p className="text-white/90 mb-4">Designer brands at auction prices</p>
              <button 
                onClick={() => handleCategoryClick('fashion')}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Shop Now
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Collectibles</h3>
              <p className="text-white/90 mb-4">Rare finds & vintage treasures</p>
              <button 
                onClick={() => handleCategoryClick('collectibles')}
                className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
