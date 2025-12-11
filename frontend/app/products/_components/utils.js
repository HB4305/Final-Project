// ============================================
// UTILITY FUNCTIONS & CONSTANTS
// ============================================

export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop";

// Sort options - sync với backend API
export const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá: Thấp → Cao', value: 'price_asc' },
  { label: 'Giá: Cao → Thấp', value: 'price_desc' },
  { label: 'Nhiều lượt đấu giá', value: 'bids' },
  { label: 'Sắp kết thúc', value: 'ending' },
];

export const formatPrice = (price) => {
  if (!price) return 'N/A';
  return `${price.toLocaleString('vi-VN')} VNĐ`;
};

export const calculateTimeLeft = (endDate) => {
  if (!endDate) return 'N/A';
  const end = new Date(endDate);
  const now = new Date();
  if (end <= now) return 'Ended';
  
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return days === 1 ? '1 day' : `${days} days`;
};

export const transformProductData = (product) => ({
  id: product._id,
  name: product.title,
  category: product.category?.name || product.categoryId?.name || 'Uncategorized',
  price: product.auction?.currentPrice || product.auction?.startPrice || 0,
  bids: product.auction?.bidCount || 0,
  timeLeft: calculateTimeLeft(product.auction?.endAt),
  image: product.primaryImageUrl || product.imageUrls?.[0] || '/placeholder.svg',
  rating: 4.5,
  images: product.imageUrls,
  description: product.descriptionHistory?.[0]?.text,
  auction: product.auction,
  sellerId: product.sellerId
});

export const buildCategoryMap = (categories) => {
  const mapping = {};
  const parentCats = categories.filter(cat => cat.level === 1);
  
  parentCats.forEach(parent => {
    mapping[parent.name] = parent.name;
    
    if (parent.children && parent.children.length > 0) {
      parent.children.forEach(child => {
        mapping[child.name] = parent.name;
      });
    }
  });
  
  return mapping;
};

export const filterProducts = (products, { searchQuery, selectedCategory, priceRange, categoryMap }) => {
  let filtered = [...products];

  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (selectedCategory !== 'All') {
    filtered = filtered.filter(p => {
      const parentCategory = categoryMap[p.category];
      return parentCategory === selectedCategory;
    });
  }

  filtered = filtered.filter(p => 
    p.price >= priceRange[0] && p.price <= priceRange[1]
  );

  return filtered;
};

export const sortProducts = (products, sortBy) => {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'bids':
      sorted.sort((a, b) => b.bids - a.bids);
      break;
    case 'ending':
      sorted.sort((a, b) => {
        const aTime = a.auction?.endAt ? new Date(a.auction.endAt).getTime() : Infinity;
        const bTime = b.auction?.endAt ? new Date(b.auction.endAt).getTime() : Infinity;
        return aTime - bTime;
      });
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => {
        const aTime = a.auction?.createdAt ? new Date(a.auction.createdAt).getTime() : 0;
        const bTime = b.auction?.createdAt ? new Date(b.auction.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      break;
  }

  return sorted;
};
