// =============================================
// Search Components - Index
// Export tất cả components, hooks, utils từ _components
// =============================================

// ===== Constants =====
export * from './constants';

// ===== Utilities =====
export * from './utils';

// ===== Custom Hooks =====
export {
  useSearchParams_Custom,
  useCategories,
  useSearchProducts,
  useFilterVisibility,
  useDebounce,
} from './hooks';

// ===== UI Components =====
export { default as SearchInput } from './SearchInput';
export { default as SortDropdown } from './SortDropdown';
export { default as FilterPanel } from './FilterPanel';
export { default as SearchProductCard } from './SearchProductCard';
export { default as SearchPagination } from './SearchPagination';
export { default as ActiveFilters } from './ActiveFilters';

// ===== State Components =====
export { 
  LoadingState, 
  EmptyState, 
  ErrorState, 
  NoQueryState, 
  ResultsHeader 
} from './SearchStates';
