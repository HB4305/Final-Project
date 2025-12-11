/**
 * Related Products Section Component
 * Danh sách 5 sản phẩm cùng danh mục
 */

import RelatedProductCard from './RelatedProductCard';

export default function RelatedProductsSection({ products = [] }) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Sản phẩm liên quan</h3>
        <span className="text-sm text-muted-foreground">
          {products.length} sản phẩm
        </span>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <RelatedProductCard 
            key={product._id} 
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
