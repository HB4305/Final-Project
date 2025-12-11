import { useState } from 'react';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
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
    <div className="pt-24 pb-8 bg-muted border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4 mt-4">
          <h1 className="text-4xl font-bold">Duyệt sản phẩm</h1>
          <div className="flex gap-2">
            <button 
              onClick={onRefresh}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 font-medium"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-5 h-5" />
              Làm mới
            </button>
            <Link to="/products/create">
              <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium">
                <Plus className="w-5 h-5" /> Tạo đấu giá
              </button>
            </Link>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="flex gap-2">
          <form onSubmit={handleFullSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                onSearchChange(e.target.value); // Local filter
              }}
              placeholder="Tìm kiếm sản phẩm... (Enter để tìm kiếm nâng cao)"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
          <Link 
            to={localQuery.trim().length >= 2 ? `/search?q=${encodeURIComponent(localQuery.trim())}` : '/search'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
            title="Tìm kiếm nâng cao"
          >
            <Search className="w-5 h-5" /> Tìm nâng cao
          </Link>
          <button 
            onClick={onToggleFilters}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium"
          >
            <Filter className="w-5 h-5" /> Bộ lọc
          </button>
        </div>

        {/* Quick tip */}
        <p className="text-xs text-muted-foreground mt-2">
          💡 Gợi ý: Nhấn "Tìm nâng cao" để sử dụng full-text search với nhiều bộ lọc và sắp xếp
        </p>
      </div>
    </div>
  );
};

export default SearchHeader;
