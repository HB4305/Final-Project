const EmptyState = ({ message = 'Không tìm thấy sản phẩm nào phù hợp với điều kiện tìm kiếm của bạn.' }) => {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;
