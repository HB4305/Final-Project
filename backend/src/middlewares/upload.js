import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * ============================================
 * MULTER MIDDLEWARE - Upload ảnh sản phẩm
 * ============================================
 */

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 1. Cấu hình Storage - Lưu file vào thư mục uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
// Lưu ý: Đã chuyển từ memoryStorage sang diskStorage để lưu file và lấy URL

// 2. File Filter - Chỉ chấp nhận ảnh
const fileFilter = (req, file, cb) => {
  console.log(`[UPLOAD MIDDLEWARE] Checking file: ${file.originalname}`);
  
  // Danh sách extension hợp lệ
  const allowedExtensions = /jpeg|jpg|png|webp|gif/;
  
  // Kiểm tra extension
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  // Kiểm tra mimetype
  const mimetype = allowedExtensions.test(file.mimetype);
  
  if (extname && mimetype) {
    console.log(`[UPLOAD MIDDLEWARE] File hợp lệ: ${file.originalname}`);
    cb(null, true); // Chấp nhận file
  } else {
    console.log(`[UPLOAD MIDDLEWARE] File không hợp lệ: ${file.originalname}`);
    cb(
      new Error(`File "${file.originalname}" không phải ảnh. Chỉ chấp nhận: jpg, jpeg, png, webp, gif`),
      false
    ); // Từ chối file
  }
};

// 3. Cấu hình Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB mỗi file
    files: 10 // Tối đa 10 files cùng lúc
  },
  fileFilter: fileFilter
});

/**
 * ============================================
 * MIDDLEWARE: Upload nhiều ảnh
 * ============================================
 * Sử dụng: uploadProductImages (đặt trước controller)
 * Field name: 'images' (phải match với form-data key)
 */
export const uploadProductImages = upload.array('images', 10);

/**
 * ============================================
 * MIDDLEWARE: Upload avatar (1 ảnh)
 * ============================================
 */
export const uploadAvatarMiddleware = upload.single('avatar');


/**
 * ============================================
 * MIDDLEWARE: Validate số lượng ảnh
 * ============================================
 * Kiểm tra:
 * - Có files không?
 * - Ít nhất 3 ảnh
 * - Tối đa 10 ảnh
 */
export const validateProductImages = (req, res, next) => {
  console.log('[UPLOAD MIDDLEWARE] Validating uploaded images...');
  
  if (!req.files || req.files.length === 0) {
    console.log('[UPLOAD MIDDLEWARE] ✗ Không có file nào được upload');
    return res.status(400).json({
      success: false,
      message: 'Vui lòng tải lên ít nhất 3 ảnh sản phẩm'
    });
  }
  
  console.log(`[UPLOAD MIDDLEWARE] Số ảnh đã upload: ${req.files.length}`);
  
  // Kiểm tra số lượng tối thiểu
  if (req.files.length < 3) {
    console.log('[UPLOAD MIDDLEWARE] ✗ Không đủ số lượng ảnh tối thiểu');
    return res.status(400).json({
      success: false,
      message: `Cần ít nhất 3 ảnh sản phẩm (bạn đã tải ${req.files.length} ảnh)`
    });
  }
  
  // Kiểm tra số lượng tối đa
  if (req.files.length > 10) {
    console.log('[UPLOAD MIDDLEWARE] ✗ Vượt quá số lượng ảnh tối đa');
    return res.status(400).json({
      success: false,
      message: `Tối đa 10 ảnh sản phẩm (bạn đã tải ${req.files.length} ảnh)`
    });
  }
  
  console.log(`[UPLOAD MIDDLEWARE] ✓ Validation passed: ${req.files.length} ảnh hợp lệ`);
  
  // Log thông tin files
  req.files.forEach((file, index) => {
    console.log(`  [${index + 1}] ${file.originalname} - ${(file.size / 1024).toFixed(2)} KB`);
  });
  
  next(); // Chuyển sang controller
};

/**
 * ============================================
 * ERROR HANDLER: Xử lý lỗi Multer
 * ============================================
 * Bắt các lỗi từ Multer (file quá lớn, sai định dạng...)
 */
export const handleMulterError = (err, req, res, next) => {
  console.error('[UPLOAD MIDDLEWARE] Multer error:', err.message);
  
  if (err instanceof multer.MulterError) {
    // Lỗi từ Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa: 5MB'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Quá nhiều file. Tối đa: 10 ảnh'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Field name không đúng. Vui lòng sử dụng field "images"'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`
    });
  }
  
  // Lỗi từ fileFilter
  if (err.message.includes('không phải ảnh')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Lỗi khác
  next(err);
};