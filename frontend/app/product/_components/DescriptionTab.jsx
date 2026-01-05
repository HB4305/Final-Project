import { formatDateTime } from './utils';

export default function DescriptionTab({ description, descriptionHistory = [] }) {
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
    </div>
  );
}
