import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  X,
  Plus,
  DollarSign,
  Clock,
  Tag,
  Image as ImageIcon,
  Type,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * ProductListingForm Component
 * Form for sellers to create auction listings (section 3.1)
 * - Product details with WYSIWYG editor
 * - Minimum 3 images
 * - Auto-renewal option
 * 
 * Form fields aligned with Product MongoDB schema:
 * - name, category (ObjectId), seller (ObjectId)
 * - startPrice, currentPrice, stepPrice, buyNowPrice
 * - endDate (calculated from auctionDays), isAutoRenew
 * - images (array of URLs), description (HTML)
 * 
 * TODO: Replace hardcoded seller ID with authenticated user's ID from auth context
 */
export default function ProductListingForm({ onSubmit, initialData = null }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('📥 Fetching categories from API...');
        const response = await fetch('http://localhost:3000/api/categories');
        const result = await response.json();
        console.log('📊 Categories response:', result);
        
        if (result.success) {
          setCategories(result.data);
          console.log(`✅ Loaded ${result.data.length} categories:`, result.data.map(c => c.name));
        } else {
          console.error('❌ Failed to fetch categories:', result.message);
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const schema = z.object({
    title: z.string().min(3, "Product title is required"),
    categoryId: z.string().min(1, "Category is required"),
    startPrice: z.number().positive("Starting price must be > 0"),
    priceStep: z.number().positive("Step price must be > 0"),
    buyNowPrice: z.number().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    autoExtendEnabled: z.boolean().optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    images: z.array(z.any()).min(3, "Minimum 3 images required"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      categoryId: "",
      startPrice: 0,
      priceStep: 0,
      buyNowPrice: 0,
      startTime: "",
      endTime: "",
      autoExtendEnabled: false,
      description: "",
      images: [],
    },
  });

  const [images, setImages] = useState([]);
  const navigate = useNavigate();
  
  const submitForm = async (data) => {
    console.log("🚀 Starting form submission...");
    console.log("Form data:", data);
    console.log("Images to upload:", images.length);
    console.log("Validation errors:", errors);
    
    try {
      const uploadImageUrls = [];
      
      // Upload images first
      if (images.length > 0) {
        console.log("📤 Uploading images...");
        for(const img of images){
          const fd = new FormData();
          fd.append("file", img.file);

          const res = await fetch("http://localhost:3000/api/upload", {
            method: "POST",
            body: fd,
          });

          const json = await res.json();
          console.log("✅ Image uploaded:", json);
          uploadImageUrls.push(json.location);
        }
        console.log("✅ All images uploaded:", uploadImageUrls);
      }

      // Create product with properly formatted data
      const payload = {
        title: data.title,
        categoryId: data.categoryId,
        startPrice: data.startPrice,
        priceStep: data.priceStep,
        buyNowPrice: data.buyNowPrice || undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        imageUrls: uploadImageUrls,
        metadata: {} // Optional metadata
      };

      console.log("📦 Creating product with payload:", payload);
      
      const res = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);
      const result = await res.json();
      console.log("Response data:", result);
      
      if (res.ok && result.success) {
        // Success logging
        console.log("✅ AUCTION CREATED SUCCESSFULLY!");
        console.log("=".repeat(50));
        console.log("Product ID:", result.data.id);
        console.log("Product Details:", {
          name: result.data.name,
          category: result.data.category,
          startPrice: `$${result.data.startPrice}`,
          stepPrice: `$${result.data.stepPrice}`,
          endDate: result.data.endDate,
          description: result.data.description?.substring(0, 100) + "...",
          imageCount: result.data.images?.length || 0,
          timestamp: result.data.createdAt
        });
        console.log("=".repeat(50));
        
        alert("✅ " + result.message);
        // Navigate to products page after successful creation
        navigate("/products");
      } else {
        console.error("❌ Failed to create product:", result);
        alert("❌ " + (result.message || "Failed to create product"));
      }
    } catch (error) {
      console.error("❌ Error creating product:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const description = watch("description");

  const handleQuillChange = (value) => {
    setValue("description", value);
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const mapped = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...mapped]);
    setValue("images", [...images, ...mapped]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Auction Listing</h2>
            <p className="text-gray-600">Fill in the details to list your product for auction</p>
          </div>

          <form onSubmit={(e) => {
            console.log("📝 Form submit event triggered");
            handleSubmit(submitForm)(e);
          }} className="space-y-6">
            {/* Display all validation errors at top */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">⚠️ Please fix the following errors:</h3>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{field}: {error.message}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Type className="inline w-4 h-4 mr-1" />
                Product Title *
              </label>
              <input
                {...register("title")}
                placeholder="Enter product title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Category *
              </label>
              <select 
                {...register("categoryId")} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : 'Select a category'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {loadingCategories && (
                <p className="text-blue-500 text-sm mt-1">Loading categories from database...</p>
              )}
              {!loadingCategories && categories.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">⚠️ No categories available. Please contact admin.</p>
              )}
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Starting Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Starting Price *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input 
                  type="number"
                  step="0.01"
                  {...register("startPrice", { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              {errors.startPrice && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.startPrice.message}
                </p>
              )}
            </div>

            {/* Step Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Step Price * (Minimum bid increment)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input 
                  type="number"
                  step="0.01"
                  {...register("priceStep", { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              {errors.priceStep && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.priceStep.message}
                </p>
              )}
            </div>

            {/* Buy Now Price (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Buy Now Price (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input 
                  type="number"
                  step="0.01"
                  {...register("buyNowPrice", { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Leave empty if not applicable</p>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Auction Start Time *
              </label>
              <input 
                type="datetime-local"
                {...register("startTime")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.startTime.message}
                </p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Auction End Time *
              </label>
              <input 
                type="datetime-local"
                {...register("endTime")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.endTime.message}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">Must be after start time</p>
            </div>

            {/* Auto Extend */}
            <div className="flex items-center">
              <input 
                type="checkbox"
                {...register("autoExtendEnabled")}
                id="autoExtend"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoExtend" className="ml-2 text-sm font-medium text-gray-700">
                Enable auto-extend (adds 10 minutes if bid placed in last 5 minutes)
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description * (minimum 10 characters)
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <ReactQuill
                  value={description}
                  onChange={handleQuillChange}
                  className="bg-white"
                  placeholder="Describe your product in detail..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['clean']
                    ]
                  }}
                />
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <ImageIcon className="inline w-4 h-4 mr-1" />
                Product Images * (minimum 3 images)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </label>
              </div>
              {errors.images && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.images.message}
                </p>
              )}

              {/* Preview UI */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img 
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = images.filter(i => i.id !== img.id);
                          setImages(newImages);
                          setValue("images", newImages);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Auction Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
