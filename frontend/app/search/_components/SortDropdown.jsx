import { ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from './constants.js';

/**
 * Sort Dropdown Component
 * Dropdown để chọn cách sắp xếp kết quả
 */
const SortDropdown = ({ value, onChange }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-4 pr-10 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium cursor-pointer min-w-[180px]"
        aria-label="Sắp xếp theo"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
};

export default SortDropdown;
