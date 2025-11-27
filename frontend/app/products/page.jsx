import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ChevronDown, Heart, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../../components/navigation';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Bids', value: 'bids' },
  { label: 'Ending Soon', value: 'ending' },
];

export default function ProductsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [showFilters, setShowFilters] = useState(false);
  const [watchlist, setWatchlist] = useState(new Set());
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching products from API...");
      const response = await fetch('http://localhost:3000/api/products', {
        cache: 'no-cache', // Disable cache
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        console.log("✅ Products fetched:", result.count, "products");
        // Transform API data to match UI format
        const transformedProducts = result.data.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.startingBid,
          bids: 0, // TODO: implement bid tracking
          timeLeft: 'Active',
          image: product.images?.[0] || '/placeholder.svg',
          rating: 4.5,
          images: product.images,
          description: product.description,
          createdAt: product.createdAt
        }));
        setAllProducts(transformedProducts);
      }
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = ['All', 'Electronics', 'Fashion', 'Collectibles', 'Home & Garden'];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = allProducts;

    // Filter by search query
    if (searchQuery) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      products = products.filter(p => p.category === selectedCategory);
    }

    // Filter by price range
    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort products
    switch (sortBy) {
      case 'price_asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'bids':
        products.sort((a, b) => b.bids - a.bids);
        break;
      case 'ending':
        // Simple ending sort (in real app would parse time)
        products.sort((a, b) => parseFloat(a.timeLeft) - parseFloat(b.timeLeft));
        break;
      default:
        break;
    }

    return products;
  }, [searchQuery, selectedCategory, sortBy, priceRange]);

  const toggleWatchlist = (productId) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(productId)) {
      newWatchlist.delete(productId);
    } else {
      newWatchlist.add(productId);
    }
    setWatchlist(newWatchlist);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} currentUser={currentUser} setCurrentUser={setCurrentUser} />
      {/* Header */}
      <div className="pt-24 pb-8 bg-muted border-b border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-4 mt-4">
            <h1 className="text-4xl font-bold">Browse Auctions</h1>
            <div className="flex gap-2">
              <button 
                onClick={fetchProducts}
                className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 font-medium"
                title="Refresh products"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <Link to="/products/create">
                <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium">
                  <Plus className="w-5 h-5" /> Create Auction
                </button>
              </Link>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium"
            >
              <Filter className="w-5 h-5" /> Filters
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-background border border-border rounded-lg p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-6">Filters</h2>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-sm">Category</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                        selectedCategory === cat
                          ? 'bg-primary text-white'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-border my-6" />

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-sm">Price Range</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      placeholder="Min"
                      className="flex-1 w-4 px-3 py-2 border border-border rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      placeholder="Max"
                      className="flex-1 w-4 px-3 py-2 border border-border rounded-lg bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border my-6" />

              {/* Sort */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSortBy('newest');
                  setPriceRange([0, 3000]);
                }}
                className="w-full mt-6 px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-muted-foreground text-sm">
                Showing <span className="font-semibold">{filteredProducts.length}</span> results
              </p>
            </div>

            {/* Products */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-muted-foreground text-lg mt-4">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.id}`}>
                    <div className="bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-40 bg-muted overflow-hidden">
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWatchlist(product.id);
                          }}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full hover:bg-gray-100 transition"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              watchlist.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{product.category}</p>

                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{product.rating}</span>
                        </div>

                        <div className="mt-auto space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Current Bid</p>
                            <p className="text-xl font-bold text-primary">${product.price.toLocaleString()}</p>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{product.bids} bids</span>
                            <span className="text-red-500 font-semibold">{product.timeLeft}</span>
                          </div>
                        </div>

                        <button className="w-full mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium">
                          Bid Now
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
