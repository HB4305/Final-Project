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
  const navigate = useNavigate();
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
    autoExtendEnabled: z.boolean().optional(),
    description: z
      .string()
      .min(10, "Mô tả phải có ít nhất 10 ký tự"),
    mainImage: z.any().refine((val) => val !== null, "Ảnh chính là bắt buộc"),
    additionalImages: z.array(z.any()).min(3, "Yêu cầu tối thiểu 3 ảnh phụ"),
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
      autoExtendEnabled: false,
      description: "",
      mainImage: null,
      additionalImages: [],
    },
  });

  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [startPriceDisplay, setStartPriceDisplay] = useState("");
  const [priceStepDisplay, setPriceStepDisplay] = useState("");
  const [buyNowPriceDisplay, setBuyNowPriceDisplay] = useState("");
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [auctionType, setAuctionType] = useState(null); // 'now' or 'scheduled'
  const [endTime, setEndTime] = useState("");
  const [startTimeScheduled, setStartTimeScheduled] = useState("");

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
  
  
  const submitForm = async (data, submissionEndTime, submissionStartTime) => {
    // Validate images
    if (!mainImage) {
      setModalMessage("Vui lòng tải lên ảnh chính");
      setShowErrorModal(true);
      return;
    }
    
    if (additionalImages.length < 3) {
      setModalMessage("Vui lòng tải lên ít nhất 3 ảnh phụ");
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
      formData.append("startTime", submissionStartTime);
      formData.append("endTime", submissionEndTime);
      
      // Optional fields
      if (buyNowPrice && buyNowPrice > 0) {
        formData.append("buyNowPrice", buyNowPrice.toString());
      }
      
      // Append metadata as JSON string
      formData.append("metadata", JSON.stringify({
        autoExtendEnabled: data.autoExtendEnabled || false
      }));
      
      // Append main image
      formData.append("primaryImage", mainImage.file);
      
      // Append additional images
      for (const img of additionalImages) {
        formData.append("images", img.file);
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

  const handleMainImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageData = {
        id: Date.now(),
        file,
        preview: URL.createObjectURL(file),
      };
      setMainImage(imageData);
      setValue("mainImage", imageData);
    }
  };

  const handleAdditionalImagesUpload = (event) => {
    const files = Array.from(event.target.files);
    const mapped = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));

    const newImages = [...additionalImages, ...mapped];
    setAdditionalImages(newImages);
    setValue("additionalImages", newImages);
  };

  const removeMainImage = () => {
    if (mainImage) {
      URL.revokeObjectURL(mainImage.preview);
    }
    setMainImage(null);
    setValue("mainImage", null);
  };

  const removeAdditionalImage = (id) => {
    const newImages = additionalImages.filter(img => img.id !== id);
    setAdditionalImages(newImages);
    setValue("additionalImages", newImages);
  };

  const handleAuctionTypeClick = async (type) => {
    // Validate form first
    const isValid = await handleSubmit(() => {}, (errors) => {
      console.log('Validation errors:', errors);
    })();
    
    setAuctionType(type);
    setShowTimeModal(true);
  };

  // Auto-submit when all required times are selected
  useEffect(() => {
    if (!showTimeModal) return;
    
    const checkAndSubmit = async () => {
      if (auctionType === 'now' && endTime) {
        // For immediate auction, only need end time
        await handleTimeSubmit();
      } else if (auctionType === 'scheduled' && startTimeScheduled && endTime) {
        // For scheduled auction, need both times
        await handleTimeSubmit();
      }
    };

    checkAndSubmit();
  }, [endTime, startTimeScheduled, auctionType, showTimeModal]);

  const handleTimeSubmit = async () => {
    if (!endTime) {
      setModalMessage("Vui lòng chọn thời gian kết thúc");
      setShowErrorModal(true);
      return;
    }

    if (auctionType === 'scheduled' && !startTimeScheduled) {
      setModalMessage("Vui lòng chọn thời gian bắt đầu");
      setShowErrorModal(true);
      return;
    }

    // Get current form data
    const formData = watch();
    
    // Set start time based on auction type
    // Đấu giá ngay: thời điểm hiện tại + 30 giây (tính tại thời điểm submit)
    const startTime = auctionType === 'now' 
      ? new Date(Date.now() + 30000).toISOString() // +30 seconds
      : new Date(startTimeScheduled).toISOString();
    
    const endTimeISO = new Date(endTime).toISOString();

    // Validate times
    if (new Date(endTimeISO) <= new Date(startTime)) {
      setModalMessage("Thời gian kết thúc phải sau thời gian bắt đầu");
      setShowErrorModal(true);
      return;
    }

    setShowTimeModal(false);
    await submitForm(formData, endTimeISO, startTime);
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

          <form className="space-y-8">
            
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
                  className={`w-full px-5 py-3 rounded-xl bg-white/5 border text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none appearance-none cursor-pointer ${
                    loadingCategories ? 'opacity-50 cursor-not-allowed' : ''
                  } border-white/10`}
                  disabled={loadingCategories}
                >
                  <option value="" className="bg-slate-800 text-gray-300">
                    {loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục chính'}
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
              {loadingCategories && (
                <p className="text-blue-500 text-sm mt-1">Đang tải danh mục...</p>
              )}
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

            {/* If parent has no children, use parent as categoryId */}
            {selectedParentCategory && getSubCategories().length === 0 && (
              <input type="hidden" {...register("categoryId")} value={selectedParentCategory} />
            )}

            {/* Price Fields */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
                    Thiết lập giá
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Starting Price */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-white">Giá khởi điểm <span className="text-red-500">*</span></label>
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
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-sm font-bold">VND</span>
                        </div>
                         {errors.startPrice && <p className="text-red-500 text-xs mt-1">{errors.startPrice.message}</p>}
                    </div>

                    {/* Step Price */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-white">Bước giá <span className="text-red-500">*</span></label>
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
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-sm font-bold">VND</span>
                        </div>
                        {errors.priceStep && <p className="text-red-500 text-xs mt-1">{errors.priceStep.message}</p>}
                    </div>

                    {/* Buy Now Price */}
                    <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Giá mua ngay (Tùy chọn)</label>
                    <div className="relative">
                        <input 
                        type="text"
                        value={buyNowPriceDisplay}
                        onChange={(e) => handlePriceChange(e, "buyNowPrice", setBuyNowPriceDisplay)}
                        placeholder="0"
                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary/50 focus:border-primary transition outline-none font-bold text-white placeholder-gray-500"
                        />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-sm font-bold">VND</span>
                    </div>
                    </div>
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
              <div className={`rounded-2xl overflow-hidden border-2 ${
                errors.description ? 'border-red-500' : 'border-white/20'
              }`}>
                <ReactQuill
                  value={description}
                  onChange={handleQuillChange}
                  className="quill-dark-theme"
                  theme="snow"
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
            <div className="space-y-6">
              {/* Main Image Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Ảnh chính <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-400">(Ảnh đại diện cho sản phẩm)</span>
                </label>
                
                {!mainImage ? (
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 ${
                    errors.mainImage ? 'border-red-500 bg-red-900/10' : 'border-blue-500/30 bg-blue-500/5'
                  }`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id="main-image-upload"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 text-blue-400" />
                      </div>
                      <p className="font-semibold text-gray-200 mb-1">Tải ảnh chính lên</p>
                      <p className="text-xs text-gray-400">Click để chọn ảnh (PNG, JPG, MAX 10MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-lg">
                    <div className="aspect-video w-full">
                      <img 
                        src={mainImage.preview}
                        alt="Main preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={removeMainImage}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition hover:scale-110 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-sm font-semibold">Ảnh chính</p>
                    </div>
                  </div>
                )}
                
                {errors.mainImage && (
                  <p className="text-red-500 text-sm">{errors.mainImage.message}</p>
                )}
              </div>

              {/* Additional Images Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Ảnh phụ <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-400">
                    (Tối thiểu 3 ảnh - Hiện có: {additionalImages.length}/3)
                  </span>
                </label>
                
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative group cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
                  errors.additionalImages ? 'border-red-500 bg-red-900/10' : 'border-white/10 bg-white/5'
                }`}>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleAdditionalImagesUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="additional-images-upload"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-semibold text-gray-200 mb-1">Thêm ảnh phụ</p>
                    <p className="text-xs text-gray-400">Kéo thả hoặc click để chọn nhiều ảnh</p>
                  </div>
                </div>
                
                {errors.additionalImages && (
                  <p className="text-red-500 text-sm">{errors.additionalImages.message}</p>
                )}

                {/* Additional Images Preview Grid */}
                {additionalImages.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 animate-fade-in">
                    {additionalImages.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-white/20">
                        <img 
                          src={img.preview}
                          alt="Additional preview"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(img.id)}
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
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-white/10">
              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => handleAuctionTypeClick('now')}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/25 focus:ring-4 focus:ring-green-500/20 transition transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Đấu giá ngay
                </button>
                
                <button 
                  type="button"
                  onClick={() => handleAuctionTypeClick('scheduled')}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/25 focus:ring-4 focus:ring-primary/20 transition transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Lên lịch đấu giá
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Time Selection Modal */}
        {showTimeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="glass-card bg-[#1e293b] rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100 animate-slide-up border border-white/10">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                {auctionType === 'now' ? 'Đấu giá ngay' : 'Lên lịch đấu giá'}
              </h3>
              <p className="text-gray-400">
                {auctionType === 'now' 
                  ? 'Chọn thời gian kết thúc đấu giá' 
                  : 'Chọn thời gian bắt đầu và kết thúc đấu giá'}
              </p>
            </div>

            <div className="space-y-4">
              {auctionType === 'scheduled' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Thời gian bắt đầu
                  </label>
                  <input 
                    type="datetime-local"
                    value={startTimeScheduled}
                    onChange={(e) => setStartTimeScheduled(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-blue-500/30 text-white font-medium focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 hover:border-blue-400/50 transition-all outline-none cursor-pointer [color-scheme:dark] shadow-lg shadow-blue-900/10 backdrop-blur-sm"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)'
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400" />
                  Thời gian kết thúc
                </label>
                <input 
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-purple-500/30 text-white font-medium focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 hover:border-purple-400/50 transition-all outline-none cursor-pointer [color-scheme:dark] shadow-lg shadow-purple-900/10 backdrop-blur-sm"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowTimeModal(false);
                  setEndTime("");
                  setStartTimeScheduled("");
                }}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleTimeSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
            </div>
          </div>
        )}

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
    </div>
  );
}
