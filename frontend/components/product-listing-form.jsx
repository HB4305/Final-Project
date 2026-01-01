import React, { useState, useEffect } from "react";
import { Form, useNavigate } from "react-router-dom";
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
import { useAuth } from '../app/context/AuthContext';
import categoryService from '../app/services/categoryService';
import productService from '../app/services/productService';

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
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('Fetching categories from API...');
        const response = await categoryService.getAllCategories();
        console.log('Categories response:', response);
        
        if (response.success) {
          setCategories(response.data);
          console.log(`Loaded ${response.data.length} categories`);
          
          // Debug: Check category structure
          if (response.data.length > 0) {
            const firstCat = response.data[0];
            console.log('First category full object:', firstCat);
            console.log('Has _id?', firstCat._id);
            console.log('Has id?', firstCat.id);
            console.log('Has name?', firstCat.name);
            
            // Check all categories
            response.data.forEach((cat, index) => {
              const idValue = cat._id || cat.id;
              if (!idValue) {
                console.error(`Category ${index} has no _id or id:`, cat);
              }
            });
          }
        } else {
          console.error('Failed to fetch categories:', response.message);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
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
    console.log("Starting form submission...");
    console.log("Form data:", data);
    console.log("Images to upload:", images.length);
    console.log("Current user:", currentUser);
    
    // Validate minimum images
    if (images.length < 3) {
      alert("Please upload at least 3 images");
      return;
    }
    
    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Append text fields
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("categoryId", data.categoryId);
      formData.append("startPrice", data.startPrice.toString());
      formData.append("priceStep", data.priceStep.toString());
      formData.append("startTime", data.startTime);
      formData.append("endTime", data.endTime);
      
      // Optional fields
      if (data.buyNowPrice && data.buyNowPrice > 0) {
        formData.append("buyNowPrice", data.buyNowPrice.toString());
      }
      
      // Append metadata as JSON string
      formData.append("metadata", JSON.stringify({
        autoExtendEnabled: data.autoExtendEnabled || false
      }));
      
      // Append image files
      console.log("Appending images to FormData...");
      for (const img of images) {
        formData.append("images", img.file); // 'images' matches multer field name
      }
      
      console.log("FormData prepared with:");
      console.log("- Title:", data.title);
      console.log("- Category:", data.categoryId);
      console.log("- Start Price:", data.startPrice);
      console.log("- Price Step:", data.priceStep);
      console.log("- Images:", images.length);
      
      // Send request with FormData via productService
      const result = await productService.createProduct(formData);
      console.log("Response data:", result);
      
      if (result.success) {
        // Success logging
        console.log("AUCTION CREATED SUCCESSFULLY!");
        console.log("=".repeat(50));
        console.log("Product ID:", result.data.product._id);
        console.log("Auction ID:", result.data.auction._id);
        console.log("Auction Status:", result.data.auction.status);
        console.log("Product Details:", {
          title: result.data.product.title,
          category: result.data.product.category,
          startPrice: result.data.auction.startPrice,
          priceStep: result.data.auction.priceStep,
          startTime: result.data.auction.startTime,
          endTime: result.data.auction.endTime,
          status: result.data.auction.status,
          imageCount: result.data.product.imageUrls?.length || 0,
          timestamp: result.data.product.createdAt
        });
        console.log("=".repeat(50));
        
        const statusMsg = result.data.auction.status === 'scheduled' 
          ? '\n\nCuộc đấu giá đã được lên lịch và sẽ bắt đầu vào thời gian đã chỉ định.'
          : '\n\nCuộc đấu giá hiện đang hoạt động!';
        
        alert(result.message + statusMsg);
        
        // Force reload to fetch fresh data
        window.location.href = "/products";
      } else {
        console.error("Failed to create product:", result);
        alert((result.message || "Failed to create product"));
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert((error.response?.data?.message || "An error occurred. Please try again."));
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tạo sản phẩm đấu giá mới</h2>
            <p className="text-gray-600">Điền thông tin để đăng sản phẩm đấu giá</p>
          </div>

          <form onSubmit={(e) => {
            console.log("📝 Sự kiện gửi form đã được kích hoạt");
            handleSubmit(submitForm)(e);
          }} className="space-y-6">
            {/* Display all validation errors at top */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">⚠️ Vui lòng sửa các lỗi sau:</h3>
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
                Tiêu đề sản phẩm *
              </label>
              <input
                {...register("title")}
                placeholder="Nhập tiêu đề sản phẩm"
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
                Danh mục *
              </label>
              <select 
                {...register("categoryId")} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Đang tải danh mục...' : 'Chọn một danh mục'}
                </option>
                {categories.flatMap((cat) => {
                  const items = [];
                  const catId = cat._id || cat.id;
                  
                  // Add parent category
                  if (catId) {
                    items.push(
                      <option key={catId} value={catId}>
                        {cat.name}
                      </option>
                    );
                  }
                  
                  // Add child categories if exist
                  if (cat.children && cat.children.length > 0) {
                    cat.children.forEach(child => {
                      const childId = child._id || child.id;
                      if (childId) {
                        items.push(
                          <option key={childId} value={childId}>
                            &nbsp;&nbsp; {child.name}
                          </option>
                        );
                      }
                    });
                  }
                  
                  return items;
                })}
              </select>
              {loadingCategories && (
                <p className="text-blue-500 text-sm mt-1">Đang tải danh mục từ cơ sở dữ liệu...</p>
              )}
              {!loadingCategories && categories.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">⚠️ Không có danh mục nào. Vui lòng liên hệ quản trị viên.</p>
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
                Giá khởi điểm *
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
                Bước giá * (Bước tăng giá tối thiểu)
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
                Giá mua ngay (Tùy chọn)
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
              <p className="text-sm text-gray-500 mt-1">Để trống nếu không áp dụng</p>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Thời gian bắt đầu đấu giá *
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
                Thời gian kết thúc đấu giá *
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
              <p className="text-sm text-gray-500 mt-1">Phải sau thời gian bắt đầu</p>
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
                Bật tự động gia hạn (thêm 10 phút nếu có đặt giá trong 5 phút cuối)
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mô tả * (tối thiểu 10 ký tự)
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
                Ảnh sản phẩm * (Tối thiểu 3 ảnh)
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
                  <p className="text-gray-600">Nhấp để tải lên hoặc kéo và thả</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF tối đa 10MB</p>
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
                Tạo sản phẩm đấu giá
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
