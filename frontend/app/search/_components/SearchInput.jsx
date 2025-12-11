import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { MIN_SEARCH_LENGTH } from './constants.js';

/**
 * Search Input Component
 * Input field với submit handler và clear button
 */
const SearchInput = ({ value, onChange, onSubmit, isLoading }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync với external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (localValue.trim().length >= MIN_SEARCH_LENGTH) {
      onSubmit(localValue.trim());
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex-1">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={`Nhập từ khóa tìm kiếm (ít nhất ${MIN_SEARCH_LENGTH} ký tự)...`}
        className="w-full pl-12 pr-12 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-lg"
        disabled={isLoading}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          aria-label="Xóa tìm kiếm"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  );
};

export default SearchInput;
