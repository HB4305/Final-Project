import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "../app/context/AuthContext";
import ProtectedRoute from "../components/protected-route";

// Pages
import Home from "../app/page";
import LoginPage from "../app/auth/login/page";
import SignupPage from "../app/auth/signup/page";
import ForgotPasswordPage from "../app/auth/forgot-password/page";
import ProductsPage from "../app/products/page";
import CreateProductPage from "../app/products/create/page";
import CategoriesPage from "../app/categories/page";
import ProductDetailPage from "../app/product/[id]/page";
import DashboardPage from "../app/dashboard/page";
import ProfilePage from "../app/profile/page";
import SettingsPage from "../app/profile/settings/page";
import RatingsPage from "../app/profile/ratings/page";
import AdminDashboardPage from "../app/admin/dashboard/page";
import AdminCategoriesPage from "../app/admin/categories/page";
import AdminProductsPage from "../app/admin/products/page";
import SearchPage from "../app/search/page";

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route
            path="/login"
            element={<Navigate to="/auth/login" replace />}
          />
          <Route
            path="/auth/signin"
            element={<Navigate to="/auth/login" replace />}
          />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route
            path="/auth/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/create" element={<CreateProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/watchlist" element={<DashboardPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
          <Route path="/profile/ratings" element={<RatingsPage />} />
          <Route path="/profile/ratings/:userId" element={<RatingsPage />} />

          {/* Admin Routes - Protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminProductsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
