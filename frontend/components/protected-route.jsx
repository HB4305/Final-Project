import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../app/context/AuthContext';

/**
 * ProtectedRoute Component
 * Protects routes that require authentication and specific roles
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route (e.g., ['admin', 'superadmin'])
 * @param {string} props.redirectTo - Path to redirect if not authorized (default: '/auth/login')
 */
export default function ProtectedRoute({ children, allowedRoles = [], redirectTo = '/auth/login' }) {
  const { isLoggedIn, currentUser, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0) {
    const userRoles = currentUser?.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      // User is logged in but doesn't have required role - redirect to home
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. This area is restricted to {allowedRoles.join(' or ')} only.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Home
            </a>
          </div>
        </div>
      );
    }
  }

  // User is authorized - render the protected component
  return children;
}
