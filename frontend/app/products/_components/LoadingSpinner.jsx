import { Loader } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="text-center py-12 flex flex-col items-center justify-center">
      <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <p className="text-muted-foreground text-lg font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
