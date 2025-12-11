const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-muted-foreground text-lg mt-4">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
