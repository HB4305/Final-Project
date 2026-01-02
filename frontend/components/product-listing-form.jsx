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
  Loader
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from '../app/context/AuthContext';
import categoryService from '../app/services/categoryService';
import productService from '../app/services/productService';
import Navigation from './navigation';

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
        const response = await categoryService.getAllCategories();
        
        if (response.success) {
          setCategories(response.data);
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
    title: z.string().min(3, "Tiêu đề sản phẩm là bắt buộc"),
    categoryId: z.string().min(1, "Danh mục là bắt buộc"),
    startPrice: z.union([z.string(), z.number()]).refine(
      (val) => {
        const num = typeof val === 'string' ? Number(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: "Giá khởi điểm phải lớn hơn 0" }
    ),
    priceStep: z.union([z.string(), z.number()]).refine(
      (val) => {
        const num = typeof val === 'string' ? Number(val) : val;
        return !isNaN(num) && num > 0;
      },
      { message: "Bước giá phải lớn hơn 0" }
    ),
    buyNowPrice: z.union([z.string(), z.number()]).optional(),
    startTime: z.string().min(1, "Thời gian bắt đầu là bắt buộc"),
    endTime: z.string().min(1, "Thời gian kết thúc là bắt buộc"),
    autoExtendEnabled: z.boolean().optional(),
    description: z
      .string()
      .min(10, "Mô tả phải có ít nhất 10 ký tự"),
    images: z.array(z.any()).min(3, "Yêu cầu tối thiểu 3 ảnh"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
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
      for (const img of images) {
        formData.append("images", img.file); // 'images' matches multer field name
      }
      
      // Send request with FormData via productService
      const result = await productService.createProduct(formData);
      
      if (result.success) {
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
    <div className="min-h-screen bg-background text-foreground">
        <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-fade-in">
        <div className="glass-card bg-[#1e293b]/40 rounded-2xl p-8 md:p-10 border border-white/10 shadow-xl relative overflow-hidden">
             {/* Decorative background blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />


          <div className="mb-8 border-b border-white/10 pb-6">
            <h2 className="text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-400">
                Tạo sản phẩm đấu giá mới
            </h2>
            <p className="text-gray-400">Điền thông tin chi tiết để bắt đầu phiên đấu giá của bạn</p>
          </div>

          <form onSubmit={handleSubmit(submitForm)} className="space-y-8">
            
            {/* Product Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                Tiêu đề sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title")}
                placeholder="Ví dụ: MacBook Pro M2 Max 2024..."
                className={`w-full px-5 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none ${
                  errors.title ? 'border-red-500' : 'border-white/10'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Categories Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                 {/* Parent Category */}
                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Danh mục chính <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                     <select 
                        value={selectedParentCategory || ''}
                        onChange={(e) => {
                        setSelectedParentCategory(e.target.value);
                        setValue('categoryId', ''); // Reset subcategory when parent changes
                        }}
                        className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none appearance-none cursor-pointer"
                        disabled={loadingCategories}
                    >
                        <option value="" className="bg-slate-800">
                        {loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục'}
                        </option>
                        {parentCategories.map((cat) => {
                        const catId = cat._id || cat.id;
                        return (
                            <option key={catId} value={catId} className="bg-slate-800">
                            {cat.name}
                            </option>
                        );
                        })}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        ▼
                    </div>
                </div>
                </div>

                {/* Subcategory */}
                <div className="space-y-2">
                 <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Danh mục chi tiết <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <select 
                        {...register("categoryId")} 
                        className={`w-full px-5 py-3 rounded-xl bg-white/5 border text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none appearance-none cursor-pointer ${
                            errors.categoryId ? 'border-red-500' : 'border-white/10'
                        } ${!selectedParentCategory ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!selectedParentCategory}
                    >
                        <option value="" className="bg-slate-800">Chọn chi tiết</option>
                        {getSubCategories().map((child) => {
                            const childId = child._id || child.id;
                            return (
                            <option key={childId} value={childId} className="bg-slate-800">
                                {child.name}
                            </option>
                            );
                        })}
                    </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        ▼
                    </div>
                </div>
                 {errors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                )}
                </div>
            </div>

            {/* If parent has no children, use parent as categoryId */}
            {selectedParentCategory && getSubCategories().length === 0 && (
              <input type="hidden" {...register("categoryId")} value={selectedParentCategory} />
            )}

            {/* Price Fields */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
                    💰 Thiết lập giá
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Starting Price */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Giá khởi điểm <span className="text-red-500">*</span></label>
                        <div className="relative">
                        <input 
                            type="text"
                            value={startPriceDisplay}
                            onChange={(e) => handlePriceChange(e, "startPrice", setStartPriceDisplay)}
                            placeholder="0"
                            className={`w-full pl-4 pr-12 py-3 rounded-xl bg-white/5 border focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none font-bold text-white placeholder-gray-500 ${
                            errors.startPrice ? 'border-red-500' : 'border-white/10'
                            }`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₫</span>
                        </div>
                         {errors.startPrice && <p className="text-red-500 text-xs mt-1">{errors.startPrice.message}</p>}
                    </div>

                    {/* Step Price */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Bước giá <span className="text-red-500">*</span></label>
                        <div className="relative">
                        <input 
                            type="text"
                            value={priceStepDisplay}
                            onChange={(e) => handlePriceChange(e, "priceStep", setPriceStepDisplay)}
                            placeholder="0"
                             className={`w-full pl-4 pr-12 py-3 rounded-xl bg-white/5 border focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none font-bold text-white placeholder-gray-500 ${
                            errors.priceStep ? 'border-red-500' : 'border-white/10'
                            }`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₫</span>
                        </div>
                        {errors.priceStep && <p className="text-red-500 text-xs mt-1">{errors.priceStep.message}</p>}
                    </div>

                    {/* Buy Now Price */}
                    <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Giá mua ngay (Tùy chọn)</label>
                    <div className="relative">
                        <input 
                        type="text"
                        value={buyNowPriceDisplay}
                        onChange={(e) => handlePriceChange(e, "buyNowPrice", setBuyNowPriceDisplay)}
                        placeholder="0"
                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none font-bold text-white placeholder-gray-500"
                        />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₫</span>
                    </div>
                    </div>
                </div>
            </div>

             {/* Time Settings */}
             <div className="grid md:grid-cols-2 gap-6">
                 {/* Start Time */}
                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Bắt đầu <span className="text-red-500">*</span>
                </label>
                <input 
                    type="datetime-local"
                    {...register("startTime")}
                    className={`w-full px-5 py-3 rounded-xl bg-white/5 border text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none cursor-pointer ${
                    errors.startTime ? 'border-red-500' : 'border-white/10'
                    }`}
                />
                 {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                </div>

                {/* End Time */}
                <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-red-500" />
                     Kết thúc <span className="text-red-500">*</span>
                </label>
                <input 
                    type="datetime-local"
                    {...register("endTime")}
                     className={`w-full px-5 py-3 rounded-xl bg-white/5 border text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none cursor-pointer ${
                    errors.endTime ? 'border-red-500' : 'border-white/10'
                    }`}
                />
                 {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                </div>
            </div>

             {/* Auto Extend Toggle */}
             <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                 <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                     <input 
                        type="checkbox"
                        {...register("autoExtendEnabled")}
                        id="autoExtend"
                        className="peer sr-only"
                    />
                     <label htmlFor="autoExtend" className="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-primary transition-colors"></label>
                     <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                 </div>
                <label htmlFor="autoExtend" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
                    Kích hoạt tự động gia hạn (thêm 10 phút nếu có bid phút chót)
                </label>
            </div>

            {/* Description Editor */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300 mb-2 block">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <div className={`rounded-xl overflow-hidden border ${
                errors.description ? 'border-red-500' : 'border-white/10'
              }`}>
                <ReactQuill
                  value={description}
                  onChange={handleQuillChange}
                  className="bg-white min-h-[200px]"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'clean']
                    ]
                  }}
                />
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Ảnh sản phẩm <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-muted-foreground">(Tối thiểu 3 ảnh)</span>
              </label>
              
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative group cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
                errors.images ? 'border-red-500 bg-red-900/10' : 'border-white/10 bg-white/5'
              }`}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="image-upload"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-bold text-gray-200 mb-1">Tải ảnh lên</p>
                    <p className="text-sm text-gray-400">Kéo thả hoặc click để chọn ảnh (PNG, JPG, MAX 10MB)</p>
                </div>
              </div>
               {errors.images && (
                <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
              )}

              {/* Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                  {images.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-100">
                      <img 
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button
                            type="button"
                            onClick={() => {
                            const newImages = images.filter(i => i.id !== img.id);
                            setImages(newImages);
                            setValue("images", newImages);
                            }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition hover:scale-110"
                        >
                            <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-100">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 focus:ring-4 focus:ring-primary/20 transition transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                    <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                    </>
                ) : (
                    <>
                        <Plus className="w-5 h-5" />
                        Tạo phiên đấu giá ngay
                    </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {(showSuccessModal || showErrorModal) && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="glass-card bg-[#1e293b] rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100 animate-slide-up border border-white/10">
            <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                    showSuccessModal ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                {showSuccessModal ? <CheckCircle className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">
                    {showSuccessModal ? 'Thành công!' : 'Đã có lỗi xảy ra'}
                </h3>
                
                <p className="text-gray-300 mb-8 leading-relaxed">
                    {modalMessage}
                </p>
                
                <button
                onClick={() => {
                    if (showSuccessModal) {
                        window.location.href = "/products";
                    }
                    setShowSuccessModal(false);
                    setShowErrorModal(false);
                }}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all hover:shadow-lg ${
                    showSuccessModal 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-900/20' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-900/20'
                }`}
                >
                {showSuccessModal ? 'Hoàn tất' : 'Thử lại'}
                </button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
}
