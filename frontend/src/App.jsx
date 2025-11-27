import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from '../app/page';
import LoginPage from '../app/auth/login/page';
import SignupPage from '../app/auth/signup/page';
import ForgotPasswordPage from '../app/auth/forgot-password/page';
import ProductsPage from '../app/products/page';
import CreateProductPage from '../app/products/create/page';
import CategoriesPage from '../app/categories/page';
import ProductDetailPage from '../app/product/[id]/page';
import DashboardPage from '../app/dashboard/page';
import ProfilePage from '../app/profile/page';
import AdminCategoriesPage from '../app/admin/categories/page';
import AdminProductsPage from '../app/admin/products/page';
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              isLoggedIn={isLoggedIn} 
              setIsLoggedIn={setIsLoggedIn} 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser} 
            />
          } 
        />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/watchlist" element={<DashboardPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
