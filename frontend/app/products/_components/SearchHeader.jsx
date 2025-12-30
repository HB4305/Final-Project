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
        
        {/* Search Bar (mobile-only) */}
        <div className="flex gap-2 lg:hidden">
          <form onSubmit={handleFullSearch} className="flex-1 relative flex items-center">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                onSearchChange(e.target.value); // Local filter
              }}
              placeholder="Tìm kiếm sản phẩm... (Enter xem kết quả nâng cao)"
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
              title="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
          <div className="flex gap-2">
            <Link
              to={localQuery.trim().length >= 2 ? `/search?q=${encodeURIComponent(localQuery.trim())}` : '/search'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium lg:hidden"
              title="Tìm nâng cao (mobile)"
            >
              <Search className="w-5 h-5" /> Tìm nâng cao
            </Link>

            <button
              onClick={onToggleFilters}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium lg:hidden"
              aria-label="Mở bộ lọc (mobile)"
            >
              <Filter className="w-5 h-5" /> Bộ lọc
            </button>
          </div>
        </div>

        {/* Quick tip */}
        <p className="text-xs text-muted-foreground mt-2">
          💡 Gợi ý: Gõ từ khóa để lọc nhanh; nhấn Enter để xem kết quả tìm nâng cao với bộ lọc
        </p>
      </div>
    </div>
  );
};

export default SearchHeader;
