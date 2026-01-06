import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination Component
 * Minimal design with page numbers and navigation arrows
 * @param {number} currentPage - Current active page
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items per page (default: 10)
 * @param {function} onPageChange - Callback when page changes
 */
export default function Pagination({ currentPage, totalItems, itemsPerPage = 10, onPageChange }) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow + 2) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange(page);
        }
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-1 py-4 border-t border-border">
            {/* Previous Button */}
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
                title="Trang trước"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => (
                page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-muted-foreground">
                        ...
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[36px] px-3 py-1 rounded-lg text-sm font-medium transition ${currentPage === page
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        {page}
                    </button>
                )
            ))}

            {/* Next Button */}
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
                title="Trang sau"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
