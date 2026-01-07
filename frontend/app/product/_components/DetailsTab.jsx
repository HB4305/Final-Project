import { Package, Tag, Calendar, Eye, ShieldCheck, Layers } from 'lucide-react';
import { formatDateTime } from './utils';

export default function DetailsTab({ product }) {
  // Get condition from metadata
  const condition = product.metadata?.condition || product.condition;

  const details = [
    {
      icon: Package,
      label: 'Tình trạng',
      value: (function () {
        const map = {
          'new': 'Mới 100%',
          'like-new': 'Như mới',
          'like new': 'Như mới',
          'used-good': 'Đã sử dụng - Tốt',
          'used-fair': 'Đã sử dụng - Khá',
          'used': 'Đã qua sử dụng'
        };
        return map[condition] || condition || 'Không xác định';
      })()
    },
    {
      icon: Layers,
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

    ...(product.metadata?.warranty ? [{
      icon: ShieldCheck,
      label: 'Bảo hành',
      value: product.metadata.warranty
    }] : []),
    ...(product.metadata?.tags && product.metadata.tags.length > 0 ? [{
      icon: Tag,
      label: 'Tags',
      value: Array.isArray(product.metadata.tags) ? product.metadata.tags.join(', ') : product.metadata.tags
    }] : [])
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
