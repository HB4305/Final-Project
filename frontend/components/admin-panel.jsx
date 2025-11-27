import React, { useState } from 'react';
import { Users, Package, Tag, Shield, Search, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

/**
 * AdminPanel Component
 * Admin management interface (section 4)
 * - Manage categories
 * - Manage products (remove)
 * - Manage users
 * - Approve seller upgrades
 */
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform content and users</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-5 h-5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-5 h-5" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'categories'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tag className="w-5 h-5" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'upgrades'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-5 h-5" />
            Upgrade Requests
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'users' && <UserManagement searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
          {activeTab === 'products' && <ProductManagement searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'upgrades' && <UpgradeRequests />}
        </div>
      </div>
    </div>
  );
}

// User Management Sub-component
function UserManagement({ searchQuery, setSearchQuery }) {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'bidder', rating: 4.8, status: 'active', joinDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'seller', rating: 4.9, status: 'active', joinDate: '2024-02-20' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'bidder', rating: 3.2, status: 'suspended', joinDate: '2024-03-10' }
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* User List */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockUsers.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{user.rating} ★</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit className="w-4 h-4 text-primary" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Product Management Sub-component
function ProductManagement({ searchQuery, setSearchQuery }) {
  const mockProducts = [
    { id: 1, name: 'Vintage Watch', seller: 'John Doe', category: 'Collectibles', status: 'active', reports: 0 },
    { id: 2, name: 'Laptop Pro', seller: 'Jane Smith', category: 'Electronics', status: 'active', reports: 2 },
    { id: 3, name: 'Designer Bag', seller: 'Bob Wilson', category: 'Fashion', status: 'flagged', reports: 5 }
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Seller</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Reports</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockProducts.map((product) => (
              <tr key={product.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-semibold">{product.name}</td>
                <td className="px-4 py-3 text-sm">{product.seller}</td>
                <td className="px-4 py-3 text-sm">{product.category}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={product.reports > 0 ? 'text-red-600 font-semibold' : ''}>
                    {product.reports}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Category Management Sub-component
function CategoryManagement() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Electronics', parent: null, productCount: 45 },
    { id: 2, name: 'Mobile Phones', parent: 'Electronics', productCount: 23 },
    { id: 3, name: 'Laptops', parent: 'Electronics', productCount: 22 },
    { id: 4, name: 'Fashion', parent: null, productCount: 38 },
    { id: 5, name: 'Shoes', parent: 'Fashion', productCount: 18 },
    { id: 6, name: 'Watches', parent: 'Fashion', productCount: 20 }
  ]);

  return (
    <div className="space-y-4">
      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
        <Tag className="w-4 h-4" />
        Add Category
      </button>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Parent</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Products</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <span className={cat.parent ? 'ml-8' : 'font-semibold'}>{cat.name}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {cat.parent || '-'}
                </td>
                <td className="px-4 py-3">{cat.productCount}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit className="w-4 h-4 text-primary" />
                    </button>
                    <button 
                      disabled={cat.productCount > 0}
                      className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        Note: Categories with products cannot be deleted
      </p>
    </div>
  );
}

// Upgrade Requests Sub-component
function UpgradeRequests() {
  const mockRequests = [
    { id: 1, userName: 'Alice Brown', email: 'alice@example.com', requestDate: '2024-11-15', currentRating: 4.7, totalBids: 45, status: 'pending' },
    { id: 2, userName: 'Charlie Davis', email: 'charlie@example.com', requestDate: '2024-11-12', currentRating: 4.9, totalBids: 67, status: 'pending' },
    { id: 3, userName: 'David Lee', email: 'david@example.com', requestDate: '2024-11-10', currentRating: 4.5, totalBids: 32, status: 'pending' }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Request Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Total Bids</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockRequests.map((request) => (
              <tr key={request.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold">{request.userName}</div>
                    <div className="text-sm text-muted-foreground">{request.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{request.requestDate}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{request.currentRating} ★</span>
                </td>
                <td className="px-4 py-3">{request.totalBids}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
