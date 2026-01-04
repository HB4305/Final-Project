import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * ============================================
 * MULTER MIDDLEWARE - Upload ảnh sản phẩm
 * ============================================
 */

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 1. Cấu hình Storage - Lưu file vào memory (base64)
const storage = multer.memoryStorage();
// Sử dụng memoryStorage để convert ảnh thành base64 và lưu URL trực tiếp vào MongoDB

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
      new Error(
        `File "${file.originalname}" không phải ảnh. Chỉ chấp nhận: jpg, jpeg, png, webp, gif`
      ),
      false
    ); // Từ chối file
  }
};

// 3. Cấu hình Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB mỗi file
    files: 10, // Tối đa 10 files cùng lúc
  },
  fileFilter: fileFilter,
});

/**
 * ============================================
 * MIDDLEWARE: Upload ảnh sản phẩm (1 primary + nhiều additional)
 * ============================================
 * Sử dụng: uploadProductImages (đặt trước controller)
 * Field names: 
 * - 'primaryImage' (1 file - ảnh chính)
 * - 'images' (array - ảnh phụ)
 */
export const uploadProductImages = upload.fields([
  { name: 'primaryImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

/**
 * ============================================
 * MIDDLEWARE: Upload avatar (1 ảnh)
 * ============================================
 */
export const uploadAvatarMiddleware = upload.single("avatar");

/**
 * ============================================
 * MIDDLEWARE: Validate số lượng ảnh
 * ============================================
 * Kiểm tra:
 * - Có primaryImage không?
 * - Có images không?
 * - images ít nhất 3 ảnh
 * - images tối đa 10 ảnh
 */
export const validateProductImages = (req, res, next) => {
  console.log("[UPLOAD MIDDLEWARE] Validating uploaded images...");

  // Kiểm tra có files không
  if (!req.files) {
    console.log("[UPLOAD MIDDLEWARE] ✗ Không có file nào được upload");
    return res.status(400).json({
      success: false,
      message: "Vui lòng tải lên ảnh chính và ít nhất 3 ảnh phụ",
    });
  }

  // Kiểm tra primaryImage
  const primaryImage = req.files['primaryImage'];
  if (!primaryImage || primaryImage.length === 0) {
    console.log("[UPLOAD MIDDLEWARE] ✗ Thiếu ảnh chính");
    return res.status(400).json({
      success: false,
      message: "Vui lòng tải lên ảnh chính cho sản phẩm",
    });
  }

  console.log(`[UPLOAD MIDDLEWARE] ✓ Ảnh chính: ${primaryImage[0].originalname}`);

  // Kiểm tra additional images
  const additionalImages = req.files['images'];
  if (!additionalImages || additionalImages.length === 0) {
    console.log("[UPLOAD MIDDLEWARE] ✗ Không có ảnh phụ");
    return res.status(400).json({
      success: false,
      message: "Vui lòng tải lên ít nhất 3 ảnh phụ",
    });
  }

  console.log(`[UPLOAD MIDDLEWARE] Số ảnh phụ: ${additionalImages.length}`);

  // Kiểm tra số lượng tối thiểu
  if (additionalImages.length < 3) {
    console.log("[UPLOAD MIDDLEWARE] ✗ Không đủ số lượng ảnh phụ tối thiểu");
    return res.status(400).json({
      success: false,
      message: `Cần ít nhất 3 ảnh phụ (bạn đã tải ${additionalImages.length} ảnh)`,
    });
  }

  // Kiểm tra số lượng tối đa
  if (additionalImages.length > 10) {
    console.log("[UPLOAD MIDDLEWARE] ✗ Vượt quá số lượng ảnh phụ tối đa");
    return res.status(400).json({
      success: false,
      message: `Tối đa 10 ảnh phụ (bạn đã tải ${additionalImages.length} ảnh)`,
    });
  }

  console.log(
    `[UPLOAD MIDDLEWARE] ✓ Validation passed: 1 ảnh chính + ${additionalImages.length} ảnh phụ`
  );

  // Log thông tin files
  console.log(`  [Primary] ${primaryImage[0].originalname} - ${(primaryImage[0].size / 1024).toFixed(2)} KB`);
  additionalImages.forEach((file, index) => {
    console.log(
      `  [${index + 1}] ${file.originalname} - ${(file.size / 1024).toFixed(
        2
      )} KB`
    );
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
  console.error("[UPLOAD MIDDLEWARE] Multer error:", err.message);

  if (err instanceof multer.MulterError) {
    // Lỗi từ Multer
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File quá lớn. Kích thước tối đa: 5MB",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Quá nhiều file. Tối đa: 10 ảnh",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: 'Field name không đúng. Vui lòng sử dụng field "images"',
      });
    }

    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`,
    });
  }

  // Lỗi từ fileFilter
  if (err.message.includes("không phải ảnh")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Lỗi khác
  next(err);
};
