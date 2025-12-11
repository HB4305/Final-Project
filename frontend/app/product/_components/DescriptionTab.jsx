import { History } from 'lucide-react';
import { formatDateTime } from './utils';

export default function DescriptionTab({ description, descriptionHistory = [], bidHistory = [] }) {
  // Get current description - either from description prop or latest from history
  const currentDescription = description || 
    (descriptionHistory.length > 0 ? descriptionHistory[descriptionHistory.length - 1]?.text : null);
  
  return (
    <div className="space-y-8">
      {/* Description Section */}
      <div>
        <h4 className="text-lg font-bold mb-4">Mô tả sản phẩm</h4>
        <div className="prose prose-sm max-w-none text-foreground">
          {currentDescription ? (
            <div 
              className="whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentDescription.replace(/\n/g, '<br/>') }}
            />
          ) : (
            <p className="text-muted-foreground italic">
              Người bán chưa cung cấp mô tả chi tiết cho sản phẩm này.
            </p>
          )}
        </div>
      </div>

      {/* Description History (if multiple updates) */}
      {descriptionHistory && descriptionHistory.length > 1 && (
        <div className="pt-6 border-t border-border">
          <h4 className="text-lg font-bold mb-4">Lịch sử cập nhật mô tả</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {descriptionHistory.slice().reverse().map((entry, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg ${index === 0 ? 'bg-green-50 border border-green-200' : 'bg-muted/30'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-semibold ${index === 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {index === 0 ? '📝 Mới nhất' : `Cập nhật ${descriptionHistory.length - index}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap line-clamp-3">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bid History Section */}
      {bidHistory && bidHistory.length > 0 && (
        <div className="pt-8 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-bold">Lịch sử đấu giá</h4>
            <span className="text-sm text-muted-foreground">
              ({bidHistory.length} lượt)
            </span>
          </div>

          {/* Timeline */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bidHistory.map((bid, index) => (
              <div 
                key={bid._id || index}
                className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition"
              >
                {/* Timeline Dot */}
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 
                      ? 'bg-primary ring-4 ring-primary/20' 
                      : 'bg-muted-foreground'
                  }`} />
                  {index < bidHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-1" />
                  )}
                </div>

                {/* Bid Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {bid.username || `Người dùng ${bid.userId}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(bid.createdAt)}
                      </p>
                    </div>
                    <p className={`font-bold text-lg shrink-0 ${
                      index === 0 ? 'text-primary' : 'text-foreground'
                    }`}>
                      {(bid.amount || 0).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
