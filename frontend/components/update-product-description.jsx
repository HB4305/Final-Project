import { useState } from 'react';
import { Edit3, Save, X, Tag, Package } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import * as productService from '../app/services/productService';

/**
 * UpdateProductDescription Component
 * Allows seller to update product description after posting
 * API 3.2: PUT /api/products/:productId/description
 */
export default function UpdateProductDescription({ productId, currentDescription, currentMetadata = {}, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(currentDescription || '');
  const [metadata, setMetadata] = useState({
    condition: currentMetadata.condition || '',
    warranty: currentMetadata.warranty || '',
    tags: currentMetadata.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (description.trim().length < 50) {
      setError('Mô tả phải có ít nhất 50 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare metadata
      const metadataToSend = {
        ...currentMetadata,
        condition: metadata.condition,
        warranty: metadata.warranty,
        tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : []
      };

      const result = await productService.updateProductDescription(productId, {
        description,
        metadata: metadataToSend
      });

      if (result.success) {
        setSuccess('✅ Cập nhật mô tả thành công!');
        setTimeout(() => {
          setIsEditing(false);
          setSuccess('');
          if (onUpdate) {
            onUpdate(result.data.product);
          }
        }, 1500);
      } else {
        setError(result.message || 'Không thể cập nhật mô tả');
      }
    } catch (err) {
      console.error('Error updating description:', err);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật mô tả');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Description</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Edit3 className="w-4 h-4" />
            Edit Description
          </button>
        </div>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: currentDescription }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Product Description</h3>
        <button
          onClick={() => {
            setIsEditing(false);
            setDescription(currentDescription);
            setError('');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Description Editor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mô tả sản phẩm *
          </label>
          <ReactQuill
            value={description}
            onChange={setDescription}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            className="bg-white"
            placeholder="Nhập mô tả chi tiết về sản phẩm..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Tối thiểu 50 ký tự. Hiện tại: {description.replace(/<[^>]*>/g, '').length} ký tự
          </p>
        </div>

        {/* Metadata Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Thông tin bổ sung
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tình trạng
              </label>
              <select
                value={metadata.condition}
                onChange={(e) => setMetadata({ ...metadata, condition: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Chọn tình trạng</option>
                <option value="new">Mới 100%</option>
                <option value="like-new">Như mới</option>
                <option value="used-good">Đã sử dụng - Tốt</option>
                <option value="used-fair">Đã sử dụng - Khá</option>
              </select>
            </div>

            {/* Warranty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bảo hành
              </label>
              <input
                type="text"
                value={metadata.warranty}
                onChange={(e) => setMetadata({ ...metadata, warranty: e.target.value })}
                placeholder="Ví dụ: 12 tháng"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4" />
              Tags (phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={metadata.tags}
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
              placeholder="Ví dụ: iphone, apple, flagship, 2024"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition font-medium"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setDescription(currentDescription);
              setError('');
              setSuccess('');
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
