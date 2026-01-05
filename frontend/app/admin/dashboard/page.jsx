import React from 'react';
import AdminNavigation from '../../../components/admin-navigation';
import AdminPanel from '../../../components/admin-panel';
import { useAuth } from '../../context/AuthContext';

/**
 * Admin Dashboard Page
 * Main admin panel with full management capabilities
 * Only accessible to users with 'admin' or 'superadmin' role
 */
export default function AdminDashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-12">
        {/* Admin Panel Component */}
        <AdminPanel />
      </div>
    </div>
  );
}
