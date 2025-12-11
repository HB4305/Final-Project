const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  );
};

export default ErrorMessage;
