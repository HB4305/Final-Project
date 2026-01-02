import { useState } from 'react';
import { Search, Filter, Plus, RefreshCw, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SearchHeader = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  onToggleFilters
}) => {
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(searchQuery || '');

  // Handle full-text search - redirect to search page
  const handleFullSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  return (
    <div className="pt-28 pb-4 bg-transparent border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4 animate-fade-in">
          <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-blue-400 mb-2">
                Khám phá
            </h1>
            <p className="text-gray-400 text-lg">Tìm kiếm và đấu giá những sản phẩm độc đáo</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onRefresh}
              className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-xl transition shadow-sm hover:shadow-md"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Link to="/products/create">
              <button className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold transform">
                <Plus className="w-5 h-5" /> 
                <span className="hidden sm:inline">Tạo đấu giá</span>
                <span className="sm:hidden">Tạo</span>
              </button>
            </Link>
          </div>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:hidden gap-4 animate-slide-up">
          <form onSubmit={handleFullSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                onSearchChange(e.target.value);
              }}
              className="block w-full pl-11 pr-4 py-3.5 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm placeholder-gray-500"
              placeholder="Tìm kiếm sản phẩm, danh mục..."
            />
            {localQuery && (
                <button 
                    type="button" 
                    onClick={() => { setLocalQuery(''); onSearchChange(''); }}
                    className="absolute inset-y-0 right-14 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
            <button
              type="submit"
              className="absolute inset-y-1 right-1 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex gap-2">
             <Link
                to={localQuery.trim().length >= 2 ? `/search?q=${encodeURIComponent(localQuery.trim())}` : '/search'}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-gray-200 rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2 font-medium shadow-sm"
            >
                <Search className="w-4 h-4" /> Tìm nâng cao
            </Link>
            <button
              onClick={onToggleFilters}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-gray-200 rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              <Filter className="w-4 h-4" /> Bộ lọc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;
