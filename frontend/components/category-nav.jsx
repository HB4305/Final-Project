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
      <div className="bg-white border-b border-border sticky top-20 z-40 pt-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-center">
          <Loader className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const activeCategory = categories.find((c) => c._id === openDropdown);

  return (
    <div className="bg-white border-b border-border sticky top-20 z-40 pt-6">
      <div className="max-w-7xl mx-auto px-4 py-4" ref={dropdownRef}>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Link tất cả sản phẩm */}
          <Link
            to="/products"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition whitespace-nowrap shrink-0 group border border-border"
          >
            <Grid3X3 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Tất cả
            </span>
          </Link>

          {/* Categories với dropdown */}
          {categories.map((cat) => (
            <div key={cat._id} className="relative">
              <button
                onClick={(e) => handleToggleDropdown(e, cat._id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap shrink-0 border ${openDropdown === cat._id
                    ? "bg-primary text-white border-primary"
                    : "hover:bg-muted border-border"
                  }`}
              >
                <Tag className="w-5 h-5" />
                <span className="text-sm font-medium">{cat.name}</span>
                {cat.children && cat.children.length > 0 && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openDropdown === cat._id ? "rotate-180" : ""
                      }`}
                  />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Render Dropdown via Portal */}
      {openDropdown && activeCategory && activeCategory.children && activeCategory.children.length > 0 &&
        createPortal(
          <div
            className="category-dropdown fixed bg-white border border-border rounded-lg shadow-lg z-[9999] min-w-[200px] py-2 animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {/* Link đến tất cả sản phẩm của category parent */}
            <Link
              to={`/products?category=${encodeURIComponent(activeCategory.name)}`}
              onClick={() => setOpenDropdown(null)}
              className="block px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition border-b border-border"
            >
              Tất cả {activeCategory.name}
            </Link>

            {/* Danh sách subcategories */}
            {activeCategory.children.map((subCat) => (
              <Link
                key={subCat._id || subCat.name}
                to={`/products?subcategory=${encodeURIComponent(subCat.name)}`}
                onClick={() => setOpenDropdown(null)}
                className="block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition"
              >
                {subCat.name}
              </Link>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
