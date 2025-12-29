import { Link } from 'react-router-dom';

function CategoryBreadcrumb({ selectedCategory, selectedSubcategory }) {
  if (selectedCategory === 'All' && !selectedSubcategory) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <Link to="/products" className="hover:text-primary">
        Tất cả sản phẩm
      </Link>
      {selectedCategory !== 'All' && (
        <>
          <span>/</span>
          <Link 
            to={`/products?category=${encodeURIComponent(selectedCategory)}`}
            className="hover:text-primary"
          >
            {selectedCategory}
          </Link>
        </>
      )}
      {selectedSubcategory && (
        <>
          <span>/</span>
          <span className="text-foreground font-medium">
            {selectedSubcategory}
          </span>
        </>
      )}
    </div>
  );
}

export default CategoryBreadcrumb;