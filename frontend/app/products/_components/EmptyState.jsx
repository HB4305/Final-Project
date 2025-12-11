const EmptyState = ({ message = 'No products found matching your criteria.' }) => {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;
