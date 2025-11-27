import React, { useState } from 'react';
import { Upload, X, Plus, DollarSign, Clock, Tag, Image as ImageIcon, Type } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * ProductListingForm Component
 * Form for sellers to create auction listings (section 3.1)
 * - Product details with WYSIWYG editor
 * - Minimum 3 images
 * - Auto-renewal option
 */
export default function ProductListingForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    startingBid: initialData?.startingBid || '',
    bidIncrement: initialData?.bidIncrement || '',
    buyNowPrice: initialData?.buyNowPrice || '',
    auctionDuration: initialData?.auctionDuration || '7',
    autoRenew: initialData?.autoRenew || false,
    description: initialData?.description || '',
    images: initialData?.images || []
  });

  const [errors, setErrors] = useState({});

  const categories = {
    'Electronics': ['Mobile Phones', 'Laptops', 'Cameras', 'Audio Equipment'],
    'Fashion': ['Shoes', 'Watches', 'Clothing', 'Accessories'],
    'Collectibles': ['Art', 'Coins', 'Stamps', 'Trading Cards'],
    'Home & Garden': ['Furniture', 'Decor', 'Tools', 'Appliances']
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.images.length + files.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setFormData({
      ...formData,
      images: [...formData.images, ...newImages]
    });
  };

  const removeImage = (imageId) => {
    setFormData({
      ...formData,
      images: formData.images.filter(img => img.id !== imageId)
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.startingBid || formData.startingBid <= 0) newErrors.startingBid = 'Valid starting bid required';
    if (!formData.bidIncrement || formData.bidIncrement <= 0) newErrors.bidIncrement = 'Valid bid increment required';
    if (formData.images.length < 3) newErrors.images = 'Minimum 3 images required';
    if (!formData.description || formData.description.length < 100) newErrors.description = 'Description must be at least 100 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix all errors before submitting');
      return;
    }

    onSubmit && onSubmit(formData);
  };

  // Quill editor modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {initialData ? 'Edit Listing' : 'Create New Listing'}
        </h1>
        <p className="text-muted-foreground">Fill in the details to list your item for auction</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Basic Information
          </h2>

          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Vintage Rolex Submariner Watch"
                className={`w-full px-3 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.name ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value, subcategory: ''})}
                  className={`w-full px-3 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.category ? 'border-red-500' : 'border-border'
                  }`}
                >
                  <option value="">Select category...</option>
                  {Object.keys(categories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subcategory *
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                  disabled={!formData.category}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">Select subcategory...</option>
                  {formData.category && categories[formData.category]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Pricing & Duration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Starting Bid ($) *
              </label>
              <input
                type="number"
                value={formData.startingBid}
                onChange={(e) => setFormData({...formData, startingBid: e.target.value})}
                placeholder="100"
                min="1"
                step="1"
                className={`w-full px-3 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.startingBid ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.startingBid && <p className="text-xs text-red-500 mt-1">{errors.startingBid}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Bid Increment ($) *
              </label>
              <input
                type="number"
                value={formData.bidIncrement}
                onChange={(e) => setFormData({...formData, bidIncrement: e.target.value})}
                placeholder="10"
                min="1"
                step="1"
                className={`w-full px-3 py-2 border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.bidIncrement ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.bidIncrement && <p className="text-xs text-red-500 mt-1">{errors.bidIncrement}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Buy Now Price ($) <span className="text-muted-foreground">(Optional)</span>
              </label>
              <input
                type="number"
                value={formData.buyNowPrice}
                onChange={(e) => setFormData({...formData, buyNowPrice: e.target.value})}
                placeholder="Leave empty if not applicable"
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Auction Duration (days) *
              </label>
              <select
                value={formData.auctionDuration}
                onChange={(e) => setFormData({...formData, auctionDuration: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
                <option value="10">10 Days</option>
                <option value="14">14 Days</option>
              </select>
            </div>
          </div>

          {/* Auto Renewal */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({...formData, autoRenew: e.target.checked})}
                className="mt-1 w-4 h-4"
              />
              <div>
                <p className="font-medium">Enable Auto-Renewal</p>
                <p className="text-sm text-muted-foreground">
                  If a bid is placed in the last 5 minutes, automatically extend auction by 10 minutes
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Product Images * (Minimum 3)
          </h2>

          {/* Image Upload */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {formData.images.map((img, index) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-border"
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-xs rounded">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.images.length < 10 && (
              <label className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Upload Images</span>
              </label>
            )}
          </div>

          {errors.images && <p className="text-xs text-red-500">{errors.images}</p>}
          <p className="text-xs text-muted-foreground">
            First image will be the main display image. Max 10 images. Supported: JPG, PNG, GIF
          </p>
        </div>

        {/* Description Section */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Product Description * (Min 100 characters)
          </h2>

          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(value) => setFormData({...formData, description: value})}
            modules={modules}
            placeholder="Describe your product in detail..."
            className={`bg-white ${errors.description ? 'border-2 border-red-500 rounded-lg' : ''}`}
          />
          
          {errors.description && <p className="text-xs text-red-500 mt-2">{errors.description}</p>}
          <p className="text-xs text-muted-foreground mt-2">
            Include condition, features, specifications, and any relevant details
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
          >
            {initialData ? 'Update Listing' : 'Create Listing'}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
