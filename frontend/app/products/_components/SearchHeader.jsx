import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const SearchHeader = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  onToggleFilters
}) => {
  return (
    <div className="pt-24 pb-8 bg-muted border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4 mt-4">
          <h1 className="text-4xl font-bold">Browse Auctions</h1>
          <div className="flex gap-2">
            <button 
              onClick={onRefresh}
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
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button 
            onClick={onToggleFilters}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium"
          >
            <Filter className="w-5 h-5" /> Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;
