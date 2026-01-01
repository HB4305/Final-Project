import React, { useState, useEffect } from "react";
import { Form, useNavigate } from "react-router-dom";
import {
  Upload,
  X,
  Plus,
  Clock,
  Tag,
  Image as ImageIcon,
  Type,
  CheckCircle,
  AlertCircle,
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
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
    title: z.string().min(3, "Tieu de san pham la bat buoc"),
    categoryId: z.string().min(1, "Danh muc la bat buoc"),
    startPrice: z.union([z.string(), z.number()]).refine(
      (val) => {
        const num = typeof val === 'string' ? Number(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: "Gia khoi diem phai lon hon 0" }
    ),
    priceStep: z.union([z.string(), z.number()]).refine(
      (val) => {
        const num = typeof val === 'string' ? Number(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: "Buoc gia phai lon hon 0" }
    ),
    buyNowPrice: z.union([z.string(), z.number()]).optional(),
    startTime: z.string().min(1, "Thoi gian bat dau la bat buoc"),
    endTime: z.string().min(1, "Thoi gian ket thuc la bat buoc"),
    autoExtendEnabled: z.boolean().optional(),
    description: z
      .string()
      .min(10, "Mo ta phai co it nhat 10 ky tu"),
    images: z.array(z.any()).min(3, "Yeu cau toi thieu 3 anh"),
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
      startPrice: "",
      priceStep: "",
      buyNowPrice: "",
      startTime: "",
      endTime: "",
      autoExtendEnabled: false,
      description: "",
      images: [],
    },
  });

  const [images, setImages] = useState([]);
  const [startPriceDisplay, setStartPriceDisplay] = useState("");
  const [priceStepDisplay, setPriceStepDisplay] = useState("");
  const [buyNowPriceDisplay, setBuyNowPriceDisplay] = useState("");
  const navigate = useNavigate();

  // Format number to Vietnamese currency format
  const formatCurrency = (value) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Parse formatted currency back to number
  const parseCurrency = (value) => {
    return value.replace(/\./g, "");
  };

  const handlePriceChange = (e, field, setDisplay) => {
    const value = e.target.value.replace(/\./g, ""); // Remove existing dots
    if (value === "" || /^\d+$/.test(value)) {
      setDisplay(formatCurrency(value));
      setValue(field, value === "" ? "" : Number(value));
    }
  };

  // Get parent categories (top-level only)
  const parentCategories = categories.filter(cat => !cat.parent && (!cat.children || cat.children.length > 0));

  // Get selected category's children
  const getSubCategories = () => {
    if (!selectedParentCategory) return [];
    const parent = categories.find(cat => (cat._id || cat.id) === selectedParentCategory);
    return parent?.children || [];
  };
  
  
  const submitForm = async (data) => {
    console.log("Starting form submission...");
    console.log("Form data:", data);
    console.log("Images to upload:", images.length);
    console.log("Current user:", currentUser);
    
    // Validate minimum images
    if (images.length < 3) {
      setModalMessage("Vui lòng tải lên ít nhất 3 ảnh");
      setShowErrorModal(true);
      return;
    }
    
    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Append text fields
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("categoryId", data.categoryId);
      
      // Convert string prices to number
      const startPrice = typeof data.startPrice === 'string' ? Number(data.startPrice) : data.startPrice;
      const priceStep = typeof data.priceStep === 'string' ? Number(data.priceStep) : data.priceStep;
      const buyNowPrice = data.buyNowPrice ? (typeof data.buyNowPrice === 'string' ? Number(data.buyNowPrice) : data.buyNowPrice) : 0;
      
      formData.append("startPrice", startPrice.toString());
      formData.append("priceStep", priceStep.toString());
      formData.append("startTime", data.startTime);
      formData.append("endTime", data.endTime);
      
      // Optional fields
      if (buyNowPrice && buyNowPrice > 0) {
        formData.append("buyNowPrice", buyNowPrice.toString());
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
          ? ' Cuộc đấu giá đã được lên lịch và sẽ bắt đầu vào thời gian đã chỉ định.'
          : ' Cuộc đấu giá hiện đang hoạt động!';
        
        setModalMessage(result.message + statusMsg);
        setShowSuccessModal(true);
        
        // Redirect after modal closes
        setTimeout(() => {
          window.location.href = "/products";
        }, 2000);
      } else {
        console.error("Failed to create product:", result);
        setModalMessage(result.message || "Không thể tạo sản phẩm");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setModalMessage(error.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      setShowErrorModal(true);
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
            
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Type className="inline w-4 h-4 mr-1" />
                Tiêu đề sản phẩm *
              </label>
              <input
                {...register("title")}
                placeholder="Nhập tiêu đề sản phẩm"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Danh mục cha *
              </label>
              <select 
                value={selectedParentCategory || ''}
                onChange={(e) => {
                  setSelectedParentCategory(e.target.value);
                  setValue('categoryId', ''); // Reset subcategory when parent changes
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục cha'}
                </option>
                {parentCategories.map((cat) => {
                  const catId = cat._id || cat.id;
                  return (
                    <option key={catId} value={catId}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
              {loadingCategories && (
                <p className="text-blue-500 text-sm mt-1">Đang tải danh mục từ cơ sở dữ liệu...</p>
              )}
            </div>

            {/* Subcategory - Only show when parent is selected */}
            {selectedParentCategory && getSubCategories().length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Tag className="inline w-4 h-4 mr-1" />
                  Danh mục con *
                </label>
                <select 
                  {...register("categoryId")} 
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn danh mục con</option>
                  {getSubCategories().map((child) => {
                    const childId = child._id || child.id;
                    return (
                      <option key={childId} value={childId}>
                        {child.name}
                      </option>
                    );
                  })}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                )}
              </div>
            )}

            {/* If parent has no children, use parent as categoryId */}
            {selectedParentCategory && getSubCategories().length === 0 && (
              <input type="hidden" {...register("categoryId")} value={selectedParentCategory} />
            )}

            {/* Price Fields - Inline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starting Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giá khởi điểm *
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-gray-500">VND</span>
                  <input 
                    type="text"
                    value={startPriceDisplay}
                    onChange={(e) => handlePriceChange(e, "startPrice", setStartPriceDisplay)}
                    placeholder="0"
                    onWheel={(e) => e.target.blur()}
                    className={`w-full pl-3 pr-14 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.startPrice ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.startPrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.startPrice.message}</p>
                )}
              </div>

              {/* Step Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bước giá *
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-gray-500">VND</span>
                  <input 
                    type="text"
                    value={priceStepDisplay}
                    onChange={(e) => handlePriceChange(e, "priceStep", setPriceStepDisplay)}
                    placeholder="0"
                    onWheel={(e) => e.target.blur()}
                    className={`w-full pl-3 pr-14 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.priceStep ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.priceStep && (
                  <p className="text-red-500 text-sm mt-1">{errors.priceStep.message}</p>
                )}
              </div>

              {/* Buy Now Price (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giá mua ngay
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-3 text-gray-500">VND</span>
                  <input 
                    type="text"
                    value={buyNowPriceDisplay}
                    onChange={(e) => handlePriceChange(e, "buyNowPrice", setBuyNowPriceDisplay)}
                    placeholder="0"
                    onWheel={(e) => e.target.blur()}
                    className="w-full pl-3 pr-14 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tùy chọn</p>
              </div>
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
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
              <div className={`border rounded-lg overflow-hidden ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}>
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
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <ImageIcon className="inline w-4 h-4 mr-1" />
                Ảnh sản phẩm * (Tối thiểu 3 ảnh)
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer ${
                errors.images ? 'border-red-500' : 'border-gray-300'
              }`}>
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
                <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thành công!</h3>
              <p className="text-gray-600 mb-6">{modalMessage}</p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.href = "/products";
                }}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h3>
              <p className="text-gray-600 mb-6">{modalMessage}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
