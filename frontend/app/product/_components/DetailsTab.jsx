import { Package, Tag, Calendar, Eye, Clock } from 'lucide-react';
import { formatDateTime } from './utils';

export default function DetailsTab({ product }) {
  // Get condition from metadata
  const condition = product.metadata?.condition || product.condition;
  
  const details = [
    {
      icon: Package,
      label: 'Tình trạng',
      value: condition === 'new' ? 'Mới 100%' : 
             condition === 'used' ? 'Đã qua sử dụng' : 
             condition || 'Không xác định'
    },
    {
      icon: Tag,
      label: 'Danh mục',
      value: product.categoryId?.name || 'Chưa phân loại'
    },
    {
      icon: Calendar,
      label: 'Ngày đăng',
      value: formatDateTime(product.createdAt)
    },
    {
      icon: Eye,
      label: 'Lượt xem',
      value: `${product.views || 0} lượt`
    },
    {
      icon: Clock,
      label: 'Thời gian đấu giá',
      value: product.auction 
        ? `${formatDateTime(product.auction.startAt)} - ${formatDateTime(product.auction.endAt)}`
        : 'Không xác định'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((detail, index) => {
          const Icon = detail.icon;
          return (
            <div 
              key={index}
              className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-1">
                    {detail.label}
                  </p>
                  <p className="font-semibold break-words">
                    {detail.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-bold mb-3 text-blue-900">Thông tin bổ sung</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">ID sản phẩm</span>
            <span className="font-mono font-semibold text-blue-900">
              #{product._id?.slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Trạng thái sản phẩm</span>
            <span className={`font-semibold ${
              product.isActive ? 'text-green-600' : 'text-gray-600'
            }`}>
              {product.isActive ? '✅ Đang hoạt động' : '🔒 Không hoạt động'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Trạng thái đấu giá</span>
            <span className={`font-semibold ${
              product.auction?.status === 'active' ? 'text-green-600' :
              product.auction?.status === 'ended' ? 'text-gray-600' :
              product.auction?.status === 'scheduled' ? 'text-blue-600' :
              'text-orange-600'
            }`}>
              {product.auction?.status === 'active' ? '🔥 Đang diễn ra' :
               product.auction?.status === 'ended' ? '⏹️ Đã kết thúc' :
               product.auction?.status === 'scheduled' ? '📅 Sắp diễn ra' :
               product.auction?.status || 'Không xác định'}
            </span>
          </div>
          {product.auction?.autoExtendEnabled && (
            <div className="flex justify-between">
              <span className="text-blue-700">Tự động gia hạn</span>
              <span className="font-semibold text-blue-900">
                ✅ Đã bật
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product Metadata (if any) */}
      {product.metadata && Object.keys(product.metadata).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="font-bold mb-3 text-gray-900">Thông số kỹ thuật</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.metadata.brand && (
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-gray-600">Thương hiệu</span>
                <span className="font-semibold">{product.metadata.brand}</span>
              </div>
            )}
            {product.metadata.model && (
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-gray-600">Model</span>
                <span className="font-semibold">{product.metadata.model}</span>
              </div>
            )}
            {product.metadata.specs && typeof product.metadata.specs === 'object' && (
              Object.entries(product.metadata.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between p-2 bg-white rounded">
                  <span className="text-gray-600 capitalize">{key}</span>
                  <span className="font-semibold">{String(value)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Seller Notes (if any) */}
      {product.sellerNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            📝 Ghi chú từ người bán
          </p>
          <p className="text-sm text-yellow-700 whitespace-pre-wrap">
            {product.sellerNotes}
          </p>
        </div>
      )}
    </div>
  );
}
