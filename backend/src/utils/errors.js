// CUSTOM ERROR CLASS

/**
 * AppError class cho xử lý lỗi custom
 * Extends Error class chuẩn của JavaScript
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
    console.error(`[APP ERROR] Code: ${code}, Status: ${statusCode}, Message: ${message}`);
  }
}

