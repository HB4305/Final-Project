import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronDown, Loader, Grid3X3, Tag } from "lucide-react";
import categoryService from "../app/services/categoryService";

export default function CategoryNav() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);

  // Drag to scroll logic state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sliderRef = useRef(null);

  // Fetch categories từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories();
        if (response.success) {
          // Chỉ lấy parent categories (level 1)
          const parentCats = response.data.filter((cat) => cat.level === 1);
          setCategories(parentCats);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Đóng dropdown khi click ngoài hoặc scroll
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest(".category-dropdown")
      ) {
        setOpenDropdown(null);
      }
    };

    const handleScroll = () => {
      setOpenDropdown(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleToggleDropdown = (e, catId) => {
    e.preventDefault();
    e.stopPropagation();

    if (openDropdown === catId) {
      setOpenDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5, // Add a small gap
        left: rect.left,
      });
      setOpenDropdown(catId);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-center">
          <Loader className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const activeCategory = categories.find((c) => c._id === openDropdown);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-2" ref={dropdownRef}>
        <div 
          ref={sliderRef}
          className="flex gap-2 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {/* Link tất cả sản phẩm */}
          <Link
            to="/products"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-100/50 dark:bg-white/5 border border-blue-200 dark:border-white/10 hover:bg-blue-200 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 whitespace-nowrap shrink-0 group hover:shadow-lg"
          >
            <Grid3X3 className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-white transition-colors">Tất cả</span>
          </Link>

          {/* Categories với dropdown */}
          {categories.map((cat) => (
            <div key={cat._id} className="relative">
              <button
                onClick={(e) => handleToggleDropdown(e, cat._id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap shrink-0 border group ${
                  openDropdown === cat._id
                    ? "bg-blue-600 border-blue-400 text-white shadow-lg scale-105"
                    : "bg-blue-50/50 dark:bg-white/5 border-blue-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 hover:text-blue-700 dark:hover:text-white"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.name}</span>
                {cat.children && cat.children.length > 0 && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === cat._id ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Render Dropdown via Portal */}
      {openDropdown &&
        activeCategory &&
        activeCategory.children &&
        activeCategory.children.length > 0 &&
        createPortal(
          <div
            className="category-dropdown fixed bg-[#0f172a]/90 border border-blue-500/20 rounded-2xl shadow-2xl z-[9999] min-w-[200px] py-2 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {/* Link đến tất cả sản phẩm của category parent */}
            <Link
              to={`/products?category=${encodeURIComponent(
                activeCategory.name
              )}`}
              onClick={() => setOpenDropdown(null)}
              className="block px-4 py-3 text-sm font-bold text-blue-400 hover:bg-blue-500/10 transition border-b border-white/5"
            >
              Tất cả {activeCategory.name}
            </Link>

            {/* Danh sách subcategories */}
            {activeCategory.children.map((subCat) => (
              <Link
                key={subCat._id || subCat.name}
                to={`/products?subcategory=${encodeURIComponent(subCat.name)}`}
                onClick={() => setOpenDropdown(null)}
                className="block px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-blue-300 transition font-medium"
              >
                {subCat.name}
              </Link>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
