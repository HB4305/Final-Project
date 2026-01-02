import React from 'react';

const PageWrapper = ({ children, className = "" }) => {
  return (
    <div className={`animate-fade-in min-h-screen w-full ${className}`}>
      {children}
    </div>
  );
};

export default PageWrapper;
