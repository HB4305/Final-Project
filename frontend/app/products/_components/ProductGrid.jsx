import ProductCard from './ProductCard';

const ProductGrid = ({ products, watchlist, onToggleWatchlist }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isWatchlisted={watchlist.has(product.id)}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
