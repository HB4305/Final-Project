import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Zap, Laptop, Shirt, Home, Sparkles } from "lucide-react";

const categories = [
  { name: "Home", icon: Home, slug: "home" },
  { name: "Flash Deals", icon: Zap, slug: "flash-deals" },
  { name: "Electronics", icon: Laptop, slug: "electronics" },
  { name: "Fashion", icon: Shirt, slug: "fashion" },
  { name: "Collectibles", icon: Sparkles, slug: "collectibles" },
];

export default function CategoryNav() {
  return (
    <div className="bg-white border-b border-border sticky top-20 z-40 pt-6">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-muted transition whitespace-nowrap shrink-0 group"
              >
                <IconComponent className="w-6 h-6 text-primary group-hover:scale-110 transition" />
                <span className="text-xs font-medium text-foreground">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
